import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isChapterCode, type OptionKey, type Question, type Tip } from '../src/engine/types'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const TIPS_SOURCE_PATH = join(ROOT, 'data', 'meo.json')

export interface TipsSource {
  tips: Tip[]
}

export function loadTipsSource(path = TIPS_SOURCE_PATH): TipsSource {
  return JSON.parse(readFileSync(path, 'utf8')) as TipsSource
}

/**
 * Kiểm chứng mẹo với đáp án. Trả về danh sách lỗi (rỗng = hợp lệ).
 * - id câu phải tồn tại;
 * - appliesTo: đáp án mẹo chỉ ra = đáp án đúng;
 * - exceptions: đáp án mẹo chỉ ra ≠ đáp án đúng, và đáp án đúng khai báo khớp dữ liệu;
 * - không id nào vừa ở appliesTo vừa ở exceptions;
 * - đáp án tham chiếu phải có trong câu.
 */
export function validateTips(tips: readonly Tip[], questions: readonly Question[]): string[] {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const errors: string[] = []
  const seenTipIds = new Set<string>()

  for (const tip of tips) {
    const at = `Mẹo "${tip.id}"`
    if (seenTipIds.has(tip.id)) errors.push(`${at}: id mẹo bị trùng`)
    seenTipIds.add(tip.id)
    if (!tip.title || !tip.rule) errors.push(`${at}: thiếu title hoặc rule`)
    if (tip.confidence !== 'normal' && tip.confidence !== 'low') errors.push(`${at}: confidence không hợp lệ`)

    if (tip.scope === 'chapter') {
      if (!isChapterCode(tip.chapter)) errors.push(`${at}: mã chương "${tip.chapter}" không hợp lệ`)
      continue
    }
    if (tip.scope !== 'question') {
      errors.push(`${at}: scope không hợp lệ`)
      continue
    }

    const hasOption = (qid: number, key: OptionKey) => byId.get(qid)!.options.some((o) => o.key === key)
    const lookup = (qid: number, where: string) => {
      const q = byId.get(qid)
      if (!q) errors.push(`${at}: ${where} tham chiếu câu #${qid} không tồn tại`)
      return q
    }

    const applied = new Set<number>()
    for (const a of tip.appliesTo) {
      const q = lookup(a.id, 'appliesTo')
      if (!q) continue
      applied.add(a.id)
      if (!hasOption(a.id, a.answer)) errors.push(`${at}: câu #${a.id} không có đáp án "${a.answer}"`)
      else if (a.answer !== q.correctAnswer)
        errors.push(`${at}: câu #${a.id} mẹo chỉ "${a.answer}" nhưng đáp án đúng là "${q.correctAnswer}" (khai báo ngoại lệ nếu đúng là vậy)`)
    }
    for (const e of tip.exceptions) {
      const q = lookup(e.id, 'exceptions')
      if (!q) continue
      if (applied.has(e.id)) errors.push(`${at}: câu #${e.id} vừa ở appliesTo vừa ở exceptions`)
      if (!hasOption(e.id, e.tipAnswer)) errors.push(`${at}: câu #${e.id} không có đáp án "${e.tipAnswer}"`)
      if (e.correctAnswer !== q.correctAnswer)
        errors.push(`${at}: ngoại lệ #${e.id} ghi đáp án đúng "${e.correctAnswer}" nhưng dữ liệu là "${q.correctAnswer}"`)
      if (e.tipAnswer === q.correctAnswer)
        errors.push(`${at}: ngoại lệ #${e.id} nhưng mẹo vẫn chỉ đúng đáp án "${e.tipAnswer}"`)
      if (!e.reason) errors.push(`${at}: ngoại lệ #${e.id} thiếu lý do`)
    }
    for (const m of tip.ambiguous) {
      if (!lookup(m.id, 'ambiguous')) continue
      for (const c of m.candidates) if (!hasOption(m.id, c)) errors.push(`${at}: câu mơ hồ #${m.id} không có đáp án "${c}"`)
    }
  }
  return errors
}

/** Kiểm chứng và trả về tips cho `tips.json`; ném lỗi (fail build) nếu có mẹo sai. */
export function buildTips(source: TipsSource, questions: readonly Question[]): Tip[] {
  const errors = validateTips(source.tips, questions)
  if (errors.length) throw new Error(`Mẹo không hợp lệ (${errors.length} lỗi):\n- ${errors.join('\n- ')}`)
  return source.tips
}
