import { describe, expect, it } from 'vitest'
import { createMemoryStorage, createSeededRng, createStudyEngine, STORAGE_KEY, type StudyEngineDeps } from './engine'
import type { Question } from './types'
import { buildQuestions, loadRawQuestions } from '../../scripts/build-data'
import { loadTipsSource } from '../../scripts/build-tips'

function q(id: number, chapter: Question['chapter'], extra: Partial<Question> = {}): Question {
  return {
    id,
    chapter,
    isPointDeduction: false,
    text: `Câu ${id}`,
    options: [
      { key: 'a', text: 'A' },
      { key: 'b', text: 'B' },
    ],
    correctAnswer: 'a',
    explanation: '',
    image: null,
    ...extra,
  }
}

const realQuestions = buildQuestions(loadRawQuestions())
const realTips = loadTipsSource().tips

function fakeClock(start = 1_700_000_000_000) {
  let t = start
  return { now: () => t, advance: (ms: number) => void (t += ms) }
}

function realEngine(extra: Partial<StudyEngineDeps> = {}) {
  return createStudyEngine({ questions: realQuestions, tips: realTips, rng: createSeededRng(42), ...extra })
}

describe('listing questions', () => {
  const engine = createStudyEngine({
    questions: [q(3, 'I'), q(200, 'II'), q(1, 'I', { isPointDeduction: true }), q(2, 'I')],
  })

  it('returns only the questions of the chosen chapter, ordered by question number', () => {
    expect(engine.listQuestions({ kind: 'chapter', chapter: 'I' }).map((x) => x.id)).toEqual([1, 2, 3])
  })

  it('returns an empty list for a chapter with no questions', () => {
    expect(engine.listQuestions({ kind: 'chapter', chapter: 'VI' })).toEqual([])
  })

  it('locates a question number inside the chosen chapter', () => {
    expect(engine.locateQuestion({ kind: 'chapter', chapter: 'I' }, 3)).toBe(2)
    expect(engine.locateQuestion({ kind: 'chapter', chapter: 'I' }, 200)).toBe(-1)
    expect(engine.locateQuestion({ kind: 'chapter', chapter: 'I' }, 999)).toBe(-1)
  })

  it('lists chapters with their question counts', () => {
    expect(engine.listChapters().map((c) => c.questionCount)).toEqual([3, 1, 0, 0, 0, 0])
  })

  it('the point-deduction filter returns exactly the 60 điểm liệt questions of the real data', () => {
    const list = realEngine().listQuestions({ kind: 'pointDeduction' })
    expect(list).toHaveLength(60)
    expect(list.every((x) => x.isPointDeduction)).toBe(true)
  })
})

describe('checking and recording answers', () => {
  it('says whether the chosen option is correct', () => {
    const engine = createStudyEngine({ questions: [q(1, 'I', { correctAnswer: 'b' })] })
    expect(engine.checkAnswer(1, 'b')).toEqual({ correct: true, correctAnswer: 'b' })
    expect(engine.checkAnswer(1, 'a')).toEqual({ correct: false, correctAnswer: 'b' })
  })

  it('records the answer with time and persists it through the storage adapter', () => {
    const storage = createMemoryStorage()
    const clock = fakeClock()
    const engine = createStudyEngine({ questions: [q(1, 'I')], storage, now: clock.now })
    engine.recordAnswer(1, 'b')
    const reopened = createStudyEngine({ questions: [q(1, 'I')], storage })
    expect(reopened.lastAnswer(1)).toEqual({ questionId: 1, chosen: 'b', correct: false, at: clock.now(), source: 'practice' })
  })

  it('ignores corrupted stored progress instead of crashing', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{not json' })
    const engine = createStudyEngine({ questions: [q(1, 'I')], storage })
    expect(engine.lastAnswer(1)).toBeUndefined()
  })
})

describe('position and shuffle', () => {
  const qs = Array.from({ length: 20 }, (_, i) => q(i + 1, 'I'))
  const filter = { kind: 'chapter', chapter: 'I' } as const

  it('remembers the current position per filter across reloads', () => {
    const storage = createMemoryStorage()
    createStudyEngine({ questions: qs, storage }).setPosition(filter, 7)
    const engine = createStudyEngine({ questions: qs, storage })
    expect(engine.getPosition(filter)).toBe(7)
    expect(engine.getPosition({ kind: 'pointDeduction' })).toBeUndefined()
  })

  it('orders by question number by default, and shuffles with the RNG when turned on', () => {
    const engine = createStudyEngine({ questions: qs, rng: createSeededRng(1) })
    expect(engine.listQuestions(filter).map((x) => x.id)).toEqual(qs.map((x) => x.id))
    engine.setShuffled(filter, true)
    const shuffled = engine.listQuestions(filter).map((x) => x.id)
    expect(shuffled).not.toEqual(qs.map((x) => x.id))
    expect([...shuffled].sort((a, b) => a - b)).toEqual(qs.map((x) => x.id))
    engine.setShuffled(filter, false)
    expect(engine.listQuestions(filter).map((x) => x.id)).toEqual(qs.map((x) => x.id))
  })

  it('gives the same order for the same seed', () => {
    const order = (seed: number) => {
      const e = createStudyEngine({ questions: qs, rng: createSeededRng(seed) })
      e.setShuffled(filter, true)
      return e.listQuestions(filter).map((x) => x.id)
    }
    expect(order(5)).toEqual(order(5))
    expect(order(5)).not.toEqual(order(6))
  })

  it('never shuffles the answer options', () => {
    const engine = createStudyEngine({ questions: realQuestions, rng: createSeededRng(3) })
    engine.setShuffled(filter, true)
    for (const x of engine.listQuestions(filter)) expect(x.options.map((o) => o.key)).toEqual(['a', 'b', 'c', 'd'].slice(0, x.options.length))
  })
})

describe('wrong-answer list', () => {
  const make = () => createStudyEngine({ questions: [q(1, 'I'), q(2, 'I')] })

  it('wrong → in the list', () => {
    const e = make()
    e.recordAnswer(1, 'b')
    expect(e.isInWrongList(1)).toBe(true)
    expect(e.wrongCount()).toBe(1)
    expect(e.listQuestions({ kind: 'wrong' }).map((x) => x.id)).toEqual([1])
  })
  it('wrong then correct once → still in the list', () => {
    const e = make()
    e.recordAnswer(1, 'b')
    e.recordAnswer(1, 'a')
    expect(e.isInWrongList(1)).toBe(true)
  })
  it('wrongStreak đếm số lần đúng liên tiếp, null khi ra khỏi danh sách', () => {
    const e = make()
    expect(e.wrongStreak(1)).toBeNull()
    e.recordAnswer(1, 'b')
    expect(e.wrongStreak(1)).toBe(0)
    e.recordAnswer(1, 'a')
    expect(e.wrongStreak(1)).toBe(1)
    e.recordAnswer(1, 'a')
    expect(e.wrongStreak(1)).toBeNull()
  })
  it('wrong then correct twice in a row → out of the list', () => {
    const e = make()
    e.recordAnswer(1, 'b')
    e.recordAnswer(1, 'a')
    e.recordAnswer(1, 'a')
    expect(e.isInWrongList(1)).toBe(false)
    expect(e.wrongCount()).toBe(0)
  })
  it('correct–wrong–correct → still in the list (streak resets)', () => {
    const e = make()
    e.recordAnswer(1, 'b')
    e.recordAnswer(1, 'a')
    e.recordAnswer(1, 'b')
    e.recordAnswer(1, 'a')
    expect(e.isInWrongList(1)).toBe(true)
  })
  it('a correct answer to a question not in the list does not add it', () => {
    const e = make()
    e.recordAnswer(2, 'a')
    expect(e.isInWrongList(2)).toBe(false)
  })
})

describe('tips for a question (real data)', () => {
  const engine = realEngine()
  const tipsOf = (id: number) => engine.getTipsForQuestion(id)

  it('#261: "cả 3 ý" is recommended over "không được" (which is an exception here)', () => {
    const tips = tipsOf(261)
    const ca3 = tips.find((t) => t.tip.id === 'ca-ba-y')!
    const kd = tips.find((t) => t.tip.id === 'khong-duoc')!
    expect(ca3).toMatchObject({ status: 'applies', recommended: true, tipAnswer: 'd' })
    expect(kd).toMatchObject({ status: 'exception', recommended: false })
    expect(kd.note).toBeTruthy()
    expect(tips[0]!.tip.id).toBe('ca-ba-y')
  })
  it('#31 is ambiguous for "bị nghiêm cấm"', () => {
    expect(tipsOf(31).find((t) => t.tip.id === 'bi-nghiem-cam')).toMatchObject({ status: 'ambiguous', tipAnswer: null })
  })
  it('low-confidence tips are reported as such', () => {
    const low = tipsOf(56).find((t) => t.tip.id === 'uu-tien-giam-toc')!
    expect(low.tip.confidence).toBe('low')
    expect(low.status).toBe('exception')
  })
  it('tips that agree on the answer get no recommendation flag', () => {
    const tips = tipsOf(66)
    expect(tips.length).toBeGreaterThan(1)
    expect(tips.every((t) => t.status === 'applies' && t.tipAnswer === 'd' && !t.recommended)).toBe(true)
  })
  it('returns no tips for a question without tips', () => {
    expect(tipsOf(301)).toEqual([])
  })
})

describe('learning by tip', () => {
  const engine = realEngine()

  it('lists every question of a tip with its status, ordered by number', () => {
    const entries = engine.listTipQuestions('khong-duoc')
    expect(entries.map((e) => e.question.id)).toEqual([...entries.map((e) => e.question.id)].sort((a, b) => a - b))
    expect(entries.find((e) => e.question.id === 261)!.status).toBe('exception')
    expect(entries.find((e) => e.question.id === 81)!.status).toBe('ambiguous')
    expect(entries.filter((e) => e.status === 'applies').length).toBe(22)
  })
  it('the tip filter lists the same questions', () => {
    expect(engine.listQuestions({ kind: 'tip', tipId: 'ca-ba-y' })).toHaveLength(29)
  })
  it('returns chapter-level tips for chapters V and VI only', () => {
    expect(engine.getChapterTips('V').length).toBeGreaterThan(0)
    expect(engine.getChapterTips('VI').length).toBeGreaterThan(0)
    expect(engine.getChapterTips('I')).toEqual([])
    expect(engine.getChapterTips('V').every((t) => t.scope === 'chapter' && t.chapter === 'V')).toBe(true)
  })
})

describe('mock exam generation (real data)', () => {
  it('has 30 questions with the official distribution and exactly 1 point-deduction question', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const exam = realEngine({ rng: createSeededRng(seed) }).createExam()
      expect(exam).toHaveLength(30)
      expect(new Set(exam.map((x) => x.id)).size).toBe(30)
      expect(exam.filter((x) => x.isPointDeduction)).toHaveLength(1)
      const nonPd: Record<string, number> = {}
      for (const x of exam) if (!x.isPointDeduction) nonPd[x.chapter] = (nonPd[x.chapter] ?? 0) + 1
      expect(nonPd).toEqual({ I: 8, II: 1, III: 1, IV: 1, V: 9, VI: 9 })
    }
  })
  it('orders questions by chapter', () => {
    const exam = realEngine().createExam()
    const ranks = exam.map((x) => ['I', 'II', 'III', 'IV', 'V', 'VI'].indexOf(x.chapter))
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })
  it('the same seed gives the same exam', () => {
    const ids = (seed: number) => realEngine({ rng: createSeededRng(seed) }).createExam().map((x) => x.id)
    expect(ids(9)).toEqual(ids(9))
    expect(ids(9)).not.toEqual(ids(10))
  })
})

describe('grading a mock exam', () => {
  const engine = realEngine()
  const exam = engine.createExam()
  const ids = exam.map((x) => x.id)
  const pd = exam.find((x) => x.isPointDeduction)!
  const others = exam.filter((x) => !x.isPointDeduction)
  const wrongKey = (x: Question) => x.options.find((o) => o.key !== x.correctAnswer)!.key
  const answersWith = (wrongIds: number[]) =>
    Object.fromEntries(exam.map((x) => [x.id, wrongIds.includes(x.id) ? wrongKey(x) : x.correctAnswer]))

  it('27/30 passes', () => {
    const r = engine.gradeExam(ids, answersWith(others.slice(0, 3).map((x) => x.id)))
    expect(r).toMatchObject({ correctCount: 27, total: 30, passed: true, failedByPointDeduction: false })
  })
  it('26/30 fails', () => {
    const r = engine.gradeExam(ids, answersWith(others.slice(0, 4).map((x) => x.id)))
    expect(r).toMatchObject({ correctCount: 26, passed: false, failedByPointDeduction: false })
  })
  it('29/30 but the point-deduction question wrong fails with the flag', () => {
    const r = engine.gradeExam(ids, answersWith([pd.id]))
    expect(r).toMatchObject({ correctCount: 29, passed: false, failedByPointDeduction: true })
  })
  it('a blank answer counts as wrong', () => {
    const answers = answersWith([])
    delete answers[others[0]!.id]
    const r = engine.gradeExam(ids, answers)
    expect(r.correctCount).toBe(29)
    expect(r.items.find((i) => i.question.id === others[0]!.id)).toMatchObject({ chosen: null, correct: false })
  })
})

describe('taking a mock exam', () => {
  it('auto-submits when time runs out, counting blanks as wrong, and records history + wrong list', () => {
    const clock = fakeClock()
    const storage = createMemoryStorage()
    const engine = realEngine({ now: clock.now, storage })
    const exam = engine.startExam()
    expect(exam.remainingMs).toBe(20 * 60_000)
    const first = exam.questions[0]!
    engine.answerExamQuestion(first.id, first.correctAnswer)
    clock.advance(10 * 60_000)
    expect(engine.submitExamIfExpired()).toBeNull()
    expect(engine.getActiveExam()!.remainingMs).toBe(10 * 60_000)
    clock.advance(10 * 60_000)
    const result = engine.submitExamIfExpired()!
    expect(result.correctCount).toBe(1)
    expect(result.passed).toBe(false)
    expect(engine.getActiveExam()).toBeNull()
    expect(engine.examHistory()).toHaveLength(1)
    expect(engine.wrongCount()).toBe(29)
    expect(engine.lastAnswer(first.id)).toMatchObject({ correct: true, source: 'exam' })
    expect(engine.examResult(result.id)!.correctCount).toBe(1)
  })
  it('keeps an exam in progress across reloads', () => {
    const clock = fakeClock()
    const storage = createMemoryStorage()
    const exam = realEngine({ now: clock.now, storage }).startExam()
    const reopened = realEngine({ now: clock.now, storage })
    expect(reopened.getActiveExam()!.questions.map((x) => x.id)).toEqual(exam.questions.map((x) => x.id))
  })
  it('ignores answers after time is up', () => {
    const clock = fakeClock()
    const engine = realEngine({ now: clock.now })
    const exam = engine.startExam()
    clock.advance(21 * 60_000)
    engine.answerExamQuestion(exam.questions[0]!.id, 'a')
    expect(engine.getActiveExam()!.answers).toEqual({})
  })
})

describe('progress statistics', () => {
  it('per-chapter answered / correct / wrong use the latest answer of each question', () => {
    const engine = createStudyEngine({ questions: [q(1, 'I'), q(2, 'I'), q(3, 'I'), q(4, 'II')] })
    engine.recordAnswer(1, 'a')
    engine.recordAnswer(2, 'b')
    engine.recordAnswer(2, 'a')
    engine.recordAnswer(4, 'b')
    const [ch1, ch2] = engine.chapterStats()
    expect(ch1).toMatchObject({ code: 'I', total: 3, answered: 2, correct: 2, wrong: 0 })
    expect(ch2).toMatchObject({ code: 'II', total: 1, answered: 1, correct: 0, wrong: 1 })
  })
  it('point-deduction mastery = answered, latest correct, and not in the wrong list', () => {
    const engine = createStudyEngine({
      questions: [1, 2, 3].map((id) => q(id, 'I', { isPointDeduction: true })).concat(q(4, 'I')),
    })
    engine.recordAnswer(1, 'a') // thuộc
    engine.recordAnswer(2, 'b')
    engine.recordAnswer(2, 'a') // đúng gần nhất nhưng còn trong danh sách câu sai
    engine.recordAnswer(4, 'a')
    expect(engine.pointDeductionMastery()).toEqual({ mastered: 1, total: 3 })
  })
  it('exam history has date, score, pass/fail and fail reason', () => {
    const clock = fakeClock()
    const engine = realEngine({ now: clock.now })
    engine.startExam()
    engine.submitExam()
    expect(engine.examHistory()[0]).toMatchObject({
      submittedAt: clock.now(),
      correctCount: 0,
      total: 30,
      passed: false,
      failedByPointDeduction: true,
    })
  })
})

describe('export / import / reset', () => {
  const qs = [q(1, 'I'), q(2, 'I')]
  const filter = { kind: 'chapter', chapter: 'I' } as const

  function engineWithProgress() {
    const e = createStudyEngine({ questions: qs, storage: createMemoryStorage() })
    e.recordAnswer(1, 'b')
    e.setPosition(filter, 2)
    return e
  }

  it('export → import into a fresh engine restores the same state', () => {
    const exported = JSON.parse(JSON.stringify(engineWithProgress().exportProgress()))
    expect(exported.version).toBe(1)
    const fresh = createStudyEngine({ questions: qs })
    expect(fresh.importProgress(exported)).toEqual({ ok: true })
    expect(fresh.isInWrongList(1)).toBe(true)
    expect(fresh.getPosition(filter)).toBe(2)
    expect(fresh.lastAnswer(1)).toMatchObject({ chosen: 'b', correct: false })
  })

  it.each([
    ['not an object', 'xin chào'],
    ['wrong version', { version: 99 }],
    ['bad schema', { version: 1, answers: [{ questionId: 1 }], wrong: {}, positions: {}, shuffled: {}, examHistory: [], activeExam: null }],
    ['unknown question id', { version: 1, answers: [], wrong: { 999: { streak: 0 } }, positions: {}, shuffled: {}, examHistory: [], activeExam: null }],
  ])('rejects %s and keeps the current state', (_label, data) => {
    const e = engineWithProgress()
    const before = e.exportProgress()
    const r = e.importProgress(data)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBeTruthy()
    expect({ ...e.exportProgress(), exportedAt: 0 }).toEqual({ ...before, exportedAt: 0 })
  })

  it('reset clears everything', () => {
    const e = engineWithProgress()
    e.resetProgress()
    expect(e.wrongCount()).toBe(0)
    expect(e.getPosition(filter)).toBeUndefined()
    expect(e.lastAnswer(1)).toBeUndefined()
  })
})
