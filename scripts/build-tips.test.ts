import { describe, expect, it } from 'vitest'
import { buildQuestions, loadRawQuestions } from './build-data'
import { buildTips, loadTipsSource, validateTips } from './build-tips'
import type { QuestionTip, Tip } from '../src/engine/types'

const questions = buildQuestions(loadRawQuestions())
const source = loadTipsSource()

function tip(extra: Partial<QuestionTip>): QuestionTip {
  return {
    id: 't',
    title: 'Mẹo thử',
    rule: 'Quy tắc',
    source: 'mẹo.txt',
    scope: 'question',
    confidence: 'normal',
    appliesTo: [],
    exceptions: [],
    ambiguous: [],
    ...extra,
  }
}

// Câu #1: đáp án đúng là "b".
describe('tip validation', () => {
  it('accepts every tip in data/meo.json (build would fail otherwise)', () => {
    expect(validateTips(source.tips, questions)).toEqual([])
    expect(() => buildTips(source, questions)).not.toThrow()
  })

  it('fails when a tip references a question id that does not exist', () => {
    const errors = validateTips([tip({ appliesTo: [{ id: 9999, answer: 'a' }] })], questions)
    expect(errors).toEqual([expect.stringContaining('#9999 không tồn tại')])
  })

  it('fails when appliesTo points to an answer that is not the correct one', () => {
    const errors = validateTips([tip({ appliesTo: [{ id: 1, answer: 'a' }] })], questions)
    expect(errors).toEqual([expect.stringContaining('câu #1 mẹo chỉ "a"')])
  })

  it('fails when an exception is declared but the tip actually gives the correct answer', () => {
    const errors = validateTips(
      [tip({ exceptions: [{ id: 1, tipAnswer: 'b', correctAnswer: 'b', reason: 'x' }] })],
      questions,
    )
    expect(errors).toEqual([expect.stringContaining('mẹo vẫn chỉ đúng')])
  })

  it('fails when an id is in both appliesTo and exceptions', () => {
    const errors = validateTips(
      [
        tip({
          appliesTo: [{ id: 1, answer: 'b' }],
          exceptions: [{ id: 1, tipAnswer: 'a', correctAnswer: 'b', reason: 'x' }],
        }),
      ],
      questions,
    )
    expect(errors).toEqual([expect.stringContaining('vừa ở appliesTo vừa ở exceptions')])
  })

  it('makes the build throw when any tip is wrong', () => {
    expect(() => buildTips({ tips: [tip({ appliesTo: [{ id: 1, answer: 'a' }] })] }, questions)).toThrow(/Mẹo không hợp lệ/)
  })
})

describe('agreed tip corrections are in the data', () => {
  const byId = new Map(source.tips.map((t) => [t.id, t]))
  const q = (id: string) => byId.get(id) as QuestionTip
  const exc = (id: string) => q(id).exceptions.map((e) => e.id)

  it('"quan sát" has exceptions #216 #217 #247 #253 #259', () => {
    expect(exc('quan-sat-y-dai')).toEqual([216, 217, 247, 253, 259])
  })
  it('"không được" has exceptions #261 #270 #484 and ambiguous #81 #110 #273, with lower priority than "cả 3 ý"', () => {
    expect(exc('khong-duoc')).toEqual(expect.arrayContaining([261, 270, 484]))
    expect(q('khong-duoc').ambiguous.map((a) => a.id)).toEqual([81, 110, 273])
    expect(q('ca-ba-y').priority!).toBeGreaterThan(q('khong-duoc').priority!)
  })
  it('"ý x và ý y" has exceptions #229 #232', () => {
    expect(exc('y-x-va-y-y')).toEqual([229, 232])
  })
  it('"ưu tiên giảm tốc" is low confidence with the 10 known exceptions', () => {
    expect(q('uu-tien-giam-toc').confidence).toBe('low')
    expect(exc('uu-tien-giam-toc')).toEqual([56, 220, 235, 247, 248, 257, 280, 285, 419, 578])
  })
  it('"công an đi thẳng" has exception #489', () => {
    expect(exc('cong-an-di-thang')).toEqual([489])
  })
  it('điểm liệt #66 points to answer d (Ý 1 và ý 2)', () => {
    expect(q('dl-nguoi-duoc-cho').appliesTo).toEqual([{ id: 66, answer: 'd' }])
  })
  it('known ambiguous questions are marked', () => {
    const amb = (id: string) => q(id).ambiguous.map((a) => a.id)
    expect(amb('bi-nghiem-cam')).toEqual([31])
    expect(amb('giam-toc-ben-phai')).toEqual([216])
    expect(amb('ve-so-thap')).toEqual([212, 226])
    expect(amb('sa-hinh-vi-pham-xe-con')).toEqual([532])
  })
  it('picture-based tips are chapter-scoped to V or VI', () => {
    const chapterTips = source.tips.filter((t): t is Extract<Tip, { scope: 'chapter' }> => t.scope === 'chapter')
    expect(chapterTips.length).toBeGreaterThan(0)
    for (const t of chapterTips) expect(['V', 'VI']).toContain(t.chapter)
  })
  it('every point-deduction question is covered by at least one tip', () => {
    const covered = new Set(
      source.tips.flatMap((t) =>
        t.scope === 'question' ? [...t.appliesTo, ...t.exceptions, ...t.ambiguous].map((x) => x.id) : [],
      ),
    )
    const uncovered = questions.filter((x) => x.isPointDeduction && !covered.has(x.id)).map((x) => x.id)
    expect(uncovered).toEqual([])
  })
})
