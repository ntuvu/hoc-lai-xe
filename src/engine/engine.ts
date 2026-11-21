import { EXAM_CONFIG_B, type ExamConfig } from './exam-config'
import {
  emptyProgress,
  validateProgress,
  PROGRESS_VERSION,
  type ActiveExam,
  type AnswerRecord,
  type AnswerSource,
  type ExamRecord,
  type ProgressState,
} from './progress'
import { CHAPTER_CODES, type ChapterCode, type ChapterTip, type OptionKey, type Question, type QuestionTip, type Tip } from './types'

export const CHAPTERS: readonly { code: ChapterCode; title: string }[] = [
  { code: 'I', title: 'Quy định chung và quy tắc giao thông đường bộ' },
  { code: 'II', title: 'Văn hóa giao thông, đạo đức người lái xe, kỹ năng phòng cháy, chữa cháy và cứu hộ, cứu nạn' },
  { code: 'III', title: 'Kỹ thuật lái xe' },
  { code: 'IV', title: 'Cấu tạo và sửa chữa' },
  { code: 'V', title: 'Báo hiệu đường bộ' },
  { code: 'VI', title: 'Giải thế sa hình và kỹ năng xử lý tình huống giao thông' },
]

/** Một câu trả lời đúng liên tiếp bao nhiêu lần thì ra khỏi danh sách câu sai. */
export const WRONG_STREAK_TO_CLEAR = 2

export type QuestionFilter =
  | { kind: 'chapter'; chapter: ChapterCode }
  | { kind: 'pointDeduction' }
  | { kind: 'wrong' }
  | { kind: 'tip'; tipId: string }

export function filterKey(filter: QuestionFilter): string {
  switch (filter.kind) {
    case 'chapter':
      return `chuong-${filter.chapter}`
    case 'pointDeduction':
      return 'diem-liet'
    case 'wrong':
      return 'cau-sai'
    case 'tip':
      return `meo-${filter.tipId}`
  }
}

export interface ChapterSummary {
  code: ChapterCode
  title: string
  questionCount: number
}

export interface AnswerCheck {
  correct: boolean
  correctAnswer: OptionKey
}

export type TipStatus = 'applies' | 'exception' | 'ambiguous'

export interface TipForQuestion {
  tip: QuestionTip
  status: TipStatus
  /** Đáp án mẹo chỉ ra (không có khi mơ hồ). */
  tipAnswer: OptionKey | null
  /** Lý do ngoại lệ hoặc ghi chú câu mơ hồ. */
  note: string | null
  /** Các mẹo ở câu này mâu thuẫn nhau và đây là mẹo nên theo. */
  recommended: boolean
}

export interface TipQuestionEntry {
  question: Question
  status: TipStatus
}

export interface ChapterStats {
  code: ChapterCode
  title: string
  total: number
  answered: number
  correct: number
  wrong: number
}

export interface ExamItemResult {
  question: Question
  chosen: OptionKey | null
  correct: boolean
}

export interface ExamResult {
  id: string
  startedAt: number
  submittedAt: number
  correctCount: number
  total: number
  passed: boolean
  failedByPointDeduction: boolean
  items: ExamItemResult[]
}

export interface ActiveExamView {
  id: string
  questions: Question[]
  answers: Record<number, OptionKey>
  startedAt: number
  endsAt: number
  remainingMs: number
}

export type ProgressExport = ProgressState & { exportedAt: number }

export type ImportResult = { ok: true } | { ok: false; error: string }

/** Lưu trữ tiến độ (app: localStorage, test: in-memory). */
export interface StorageAdapter {
  get(key: string): string | null
  set(key: string, value: string): void
}

export const STORAGE_KEY = 'gplx-b-progress'

export interface StudyEngineDeps {
  questions: readonly Question[]
  tips?: readonly Tip[]
  storage?: StorageAdapter
  /** Trả về số trong [0, 1). Mặc định Math.random. */
  rng?: () => number
  /** Trả về thời điểm hiện tại (ms). Mặc định Date.now. */
  now?: () => number
  examConfig?: ExamConfig
}

export interface StudyEngine {
  readonly examConfig: ExamConfig
  listChapters(): ChapterSummary[]
  getQuestion(id: number): Question | undefined
  /** Danh sách câu của bộ lọc, theo số câu (hoặc theo thứ tự xáo nếu bộ lọc đang bật ngẫu nhiên). */
  listQuestions(filter: QuestionFilter): Question[]
  /** Vị trí (0-based) của câu trong danh sách của bộ lọc, hoặc -1. */
  locateQuestion(filter: QuestionFilter, questionId: number): number
  checkAnswer(questionId: number, chosen: OptionKey): AnswerCheck
  /** Ghi nhận câu trả lời (cập nhật thống kê + danh sách câu sai) và tự lưu. */
  recordAnswer(questionId: number, chosen: OptionKey | null, source?: AnswerSource): AnswerCheck
  lastAnswer(questionId: number): AnswerRecord | undefined

  isShuffled(filter: QuestionFilter): boolean
  setShuffled(filter: QuestionFilter, on: boolean): void
  getPosition(filter: QuestionFilter): number | undefined
  setPosition(filter: QuestionFilter, questionId: number): void

  isInWrongList(questionId: number): boolean
  wrongCount(): number

  listTips(): Tip[]
  getTip(id: string): Tip | undefined
  getTipsForQuestion(questionId: number): TipForQuestion[]
  getChapterTips(chapter: ChapterCode): ChapterTip[]
  listTipQuestions(tipId: string): TipQuestionEntry[]

  createExam(): Question[]
  gradeExam(questionIds: readonly number[], answers: Readonly<Record<number, OptionKey>>, startedAt?: number): ExamResult
  startExam(): ActiveExamView
  getActiveExam(): ActiveExamView | null
  answerExamQuestion(questionId: number, chosen: OptionKey): void
  submitExam(): ExamResult
  /** Nếu bài thi đang làm đã hết giờ thì tự nộp và trả kết quả; ngược lại null. */
  submitExamIfExpired(): ExamResult | null
  examHistory(): ExamRecord[]
  examResult(id: string): ExamResult | undefined

  chapterStats(): ChapterStats[]
  pointDeductionMastery(): { mastered: number; total: number }

  exportProgress(): ProgressExport
  importProgress(data: unknown): ImportResult
  resetProgress(): void
}

/** RNG có seed (mulberry32). */
export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter & { data: Record<string, string> } {
  const data = { ...initial }
  return { data, get: (k) => data[k] ?? null, set: (k, v) => void (data[k] = v) }
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const chapterRank = (c: ChapterCode) => CHAPTER_CODES.indexOf(c)

export function createStudyEngine(deps: StudyEngineDeps): StudyEngine {
  const { tips = [], storage = createMemoryStorage(), rng = Math.random, now = Date.now, examConfig = EXAM_CONFIG_B } = deps
  const sorted = [...deps.questions].sort((a, b) => a.id - b.id)
  const byId = new Map(sorted.map((q) => [q.id, q]))
  const questionIds = new Set(byId.keys())
  const tipsById = new Map(tips.map((t) => [t.id, t]))
  const questionTips = tips.filter((t): t is QuestionTip => t.scope === 'question')

  let state = loadState()

  function loadState(): ProgressState {
    const raw = storage.get(STORAGE_KEY)
    if (!raw) return emptyProgress()
    try {
      const data: unknown = JSON.parse(raw)
      return validateProgress(data, questionIds) === null ? (data as ProgressState) : emptyProgress()
    } catch {
      return emptyProgress()
    }
  }
  const save = () => storage.set(STORAGE_KEY, JSON.stringify(state))

  function requireQuestion(id: number): Question {
    const q = byId.get(id)
    if (!q) throw new Error(`Không có câu số ${id}`)
    return q
  }

  function baseList(filter: QuestionFilter): Question[] {
    switch (filter.kind) {
      case 'chapter':
        return sorted.filter((q) => q.chapter === filter.chapter)
      case 'pointDeduction':
        return sorted.filter((q) => q.isPointDeduction)
      case 'wrong':
        return sorted.filter((q) => state.wrong[q.id])
      case 'tip':
        return listTipQuestions(filter.tipId).map((e) => e.question)
    }
  }

  function listQuestions(filter: QuestionFilter): Question[] {
    const base = baseList(filter)
    const order = state.shuffled[filterKey(filter)]
    if (!order) return base
    const members = new Set(base.map((q) => q.id))
    const ordered = order.filter((id) => members.has(id))
    const inOrder = new Set(ordered)
    return [...ordered, ...base.filter((q) => !inOrder.has(q.id)).map((q) => q.id)].map(requireQuestion)
  }

  function checkAnswer(questionId: number, chosen: OptionKey | null): AnswerCheck {
    const { correctAnswer } = requireQuestion(questionId)
    return { correct: chosen === correctAnswer, correctAnswer }
  }

  function applyAnswer(questionId: number, chosen: OptionKey | null, source: AnswerSource, at: number): AnswerCheck {
    const check = checkAnswer(questionId, chosen)
    state.answers.push({ questionId, chosen, correct: check.correct, at, source })
    if (!check.correct) state.wrong[questionId] = { streak: 0 }
    else if (state.wrong[questionId]) {
      const streak = state.wrong[questionId].streak + 1
      if (streak >= WRONG_STREAK_TO_CLEAR) delete state.wrong[questionId]
      else state.wrong[questionId] = { streak }
    }
    return check
  }

  function lastAnswer(questionId: number): AnswerRecord | undefined {
    for (let i = state.answers.length - 1; i >= 0; i--) if (state.answers[i]!.questionId === questionId) return state.answers[i]
    return undefined
  }

  // ---------- mẹo ----------
  function getTipsForQuestion(questionId: number): TipForQuestion[] {
    const found: TipForQuestion[] = []
    for (const tip of questionTips) {
      const a = tip.appliesTo.find((x) => x.id === questionId)
      if (a) found.push({ tip, status: 'applies', tipAnswer: a.answer, note: null, recommended: false })
      const e = tip.exceptions.find((x) => x.id === questionId)
      if (e) found.push({ tip, status: 'exception', tipAnswer: e.tipAnswer, note: e.reason, recommended: false })
      const m = tip.ambiguous.find((x) => x.id === questionId)
      if (m) found.push({ tip, status: 'ambiguous', tipAnswer: null, note: m.note, recommended: false })
    }
    const pointing = found.filter((f) => f.tipAnswer !== null)
    if (new Set(pointing.map((f) => f.tipAnswer)).size > 1) {
      const prio = (f: TipForQuestion) => f.tip.priority ?? 1
      const top = Math.max(...pointing.map(prio))
      const best = pointing.filter((f) => prio(f) === top)
      if (new Set(best.map((f) => f.tipAnswer)).size === 1) for (const f of best) f.recommended = true
    }
    const rank = { applies: 0, exception: 1, ambiguous: 2 }
    return found.sort((x, y) => Number(y.recommended) - Number(x.recommended) || rank[x.status] - rank[y.status])
  }

  function listTipQuestions(tipId: string): TipQuestionEntry[] {
    const tip = tipsById.get(tipId)
    if (!tip || tip.scope !== 'question') return []
    const entries: TipQuestionEntry[] = [
      ...tip.appliesTo.map((x) => ({ id: x.id, status: 'applies' as const })),
      ...tip.exceptions.map((x) => ({ id: x.id, status: 'exception' as const })),
      ...tip.ambiguous.map((x) => ({ id: x.id, status: 'ambiguous' as const })),
    ]
      .filter((x) => byId.has(x.id))
      .map((x) => ({ question: byId.get(x.id)!, status: x.status }))
    return entries.sort((a, b) => a.question.id - b.question.id)
  }

  // ---------- thi thử ----------
  function createExam(): Question[] {
    const picked: Question[] = []
    const take = (pool: Question[], n: number, what: string) => {
      if (pool.length < n) throw new Error(`Không đủ câu để tạo đề (${what}: cần ${n}, có ${pool.length})`)
      picked.push(...shuffle(pool, rng).slice(0, n))
    }
    take(sorted.filter((q) => q.isPointDeduction), examConfig.pointDeductionCount, 'điểm liệt')
    for (const code of CHAPTER_CODES) {
      take(sorted.filter((q) => q.chapter === code && !q.isPointDeduction), examConfig.chapterDistribution[code], `chương ${code}`)
    }
    return picked.sort((a, b) => chapterRank(a.chapter) - chapterRank(b.chapter) || a.id - b.id)
  }

  function gradeExam(
    ids: readonly number[],
    answers: Readonly<Record<number, OptionKey>>,
    startedAt = now(),
    submittedAt = now(),
    id = `thi-${submittedAt}`,
  ): ExamResult {
    const items = ids.map((qid) => {
      const question = requireQuestion(qid)
      const chosen = answers[qid] ?? null
      return { question, chosen, correct: chosen === question.correctAnswer }
    })
    const correctCount = items.filter((i) => i.correct).length
    const failedByPointDeduction = items.some((i) => i.question.isPointDeduction && !i.correct)
    return {
      id,
      startedAt,
      submittedAt,
      correctCount,
      total: items.length,
      passed: correctCount >= examConfig.passScore && !failedByPointDeduction,
      failedByPointDeduction,
      items,
    }
  }

  function viewExam(ax: ActiveExam): ActiveExamView {
    return {
      id: ax.id,
      questions: ax.questionIds.map(requireQuestion),
      answers: { ...ax.answers },
      startedAt: ax.startedAt,
      endsAt: ax.endsAt,
      remainingMs: Math.max(0, ax.endsAt - now()),
    }
  }

  function submitExam(): ExamResult {
    const ax = state.activeExam
    if (!ax) throw new Error('Không có bài thi đang làm')
    const submittedAt = Math.min(now(), ax.endsAt)
    const result = gradeExam(ax.questionIds, ax.answers, ax.startedAt, submittedAt, ax.id)
    for (const item of result.items) applyAnswer(item.question.id, item.chosen, 'exam', submittedAt)
    state.examHistory.push({
      id: result.id,
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
      correctCount: result.correctCount,
      total: result.total,
      passed: result.passed,
      failedByPointDeduction: result.failedByPointDeduction,
      items: result.items.map((i) => ({ questionId: i.question.id, chosen: i.chosen })),
    })
    state.activeExam = null
    save()
    return result
  }

  function examResult(id: string): ExamResult | undefined {
    const r = state.examHistory.find((e) => e.id === id)
    if (!r) return undefined
    const answers = Object.fromEntries(r.items.flatMap((i) => (i.chosen ? [[i.questionId, i.chosen]] : [])))
    return gradeExam(r.items.map((i) => i.questionId), answers, r.startedAt, r.submittedAt, r.id)
  }

  // ---------- thống kê ----------
  function latestByQuestion(): Map<number, AnswerRecord> {
    const m = new Map<number, AnswerRecord>()
    for (const a of state.answers) m.set(a.questionId, a)
    return m
  }

  return {
    examConfig,
    listChapters: () =>
      CHAPTERS.map((c) => ({ ...c, questionCount: sorted.filter((q) => q.chapter === c.code).length })),
    getQuestion: (id) => byId.get(id),
    listQuestions,
    locateQuestion: (filter, questionId) => listQuestions(filter).findIndex((q) => q.id === questionId),
    checkAnswer: (id, chosen) => checkAnswer(id, chosen),
    recordAnswer(questionId, chosen, source = 'practice') {
      const check = applyAnswer(questionId, chosen, source, now())
      save()
      return check
    },
    lastAnswer,

    isShuffled: (filter) => !!state.shuffled[filterKey(filter)],
    setShuffled(filter, on) {
      const key = filterKey(filter)
      if (on) state.shuffled[key] = shuffle(baseList(filter).map((q) => q.id), rng)
      else delete state.shuffled[key]
      save()
    },
    getPosition: (filter) => state.positions[filterKey(filter)],
    setPosition(filter, questionId) {
      requireQuestion(questionId)
      state.positions[filterKey(filter)] = questionId
      save()
    },

    isInWrongList: (id) => !!state.wrong[id],
    wrongCount: () => Object.keys(state.wrong).length,

    listTips: () => [...tips],
    getTip: (id) => tipsById.get(id),
    getTipsForQuestion,
    getChapterTips: (chapter) => tips.filter((t): t is ChapterTip => t.scope === 'chapter' && t.chapter === chapter),
    listTipQuestions,

    createExam,
    gradeExam: (ids, answers, startedAt) => gradeExam(ids, answers, startedAt),
    startExam() {
      const startedAt = now()
      state.activeExam = {
        id: `thi-${startedAt}`,
        questionIds: createExam().map((q) => q.id),
        startedAt,
        endsAt: startedAt + examConfig.durationMinutes * 60_000,
        answers: {},
      }
      save()
      return viewExam(state.activeExam)
    },
    getActiveExam: () => (state.activeExam ? viewExam(state.activeExam) : null),
    answerExamQuestion(questionId, chosen) {
      const ax = state.activeExam
      if (!ax) throw new Error('Không có bài thi đang làm')
      if (!ax.questionIds.includes(questionId)) throw new Error(`Câu ${questionId} không thuộc đề thi`)
      if (now() >= ax.endsAt) return
      ax.answers[questionId] = chosen
      save()
    },
    submitExam,
    submitExamIfExpired: () => (state.activeExam && now() >= state.activeExam.endsAt ? submitExam() : null),
    examHistory: () => [...state.examHistory],
    examResult,

    chapterStats() {
      const latest = latestByQuestion()
      return CHAPTERS.map((c) => {
        const qs = sorted.filter((q) => q.chapter === c.code)
        const answered = qs.filter((q) => latest.has(q.id))
        const correct = answered.filter((q) => latest.get(q.id)!.correct).length
        return { ...c, total: qs.length, answered: answered.length, correct, wrong: answered.length - correct }
      })
    },
    pointDeductionMastery() {
      const latest = latestByQuestion()
      const qs = sorted.filter((q) => q.isPointDeduction)
      return { mastered: qs.filter((q) => latest.get(q.id)?.correct && !state.wrong[q.id]).length, total: qs.length }
    },

    exportProgress: () => ({ ...structuredClone(state), exportedAt: now() }),
    importProgress(data) {
      const error = validateProgress(data, questionIds)
      if (error) return { ok: false, error }
      const { exportedAt: _ignored, ...rest } = data as ProgressExport
      state = { ...emptyProgress(), ...structuredClone(rest), version: PROGRESS_VERSION }
      save()
      return { ok: true }
    },
    resetProgress() {
      state = emptyProgress()
      save()
    },
  }
}
