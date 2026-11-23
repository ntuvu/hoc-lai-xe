import type { Question } from './types'

/**
 * Full-text search câu hỏi, không phân biệt dấu / hoa thường ("toc do" khớp "Tốc độ").
 * Mỗi từ trong truy vấn phải khớp đầu một từ trong câu (prefix match), tìm ở đề, các đáp án,
 * giải thích gốc và giải thích dễ hiểu. Điểm cao hơn khi khớp ở đề và khi khớp nguyên cụm.
 */

export type SearchField = 'text' | 'options' | 'explanation' | 'guide'

export interface SearchHit {
  question: Question
  score: number
  /** Các trường có khớp, theo thứ tự ưu tiên. */
  fields: SearchField[]
}

const FIELD_WEIGHT: Record<SearchField, number> = { text: 10, options: 4, explanation: 2, guide: 1 }
const FIELDS = Object.keys(FIELD_WEIGHT) as SearchField[]

/** Bỏ dấu, đ→d, chữ thường. Mỗi ký tự gốc cho đúng một ký tự kết quả, để map lại vị trí khi highlight. */
export function normalizeChar(c: string): string {
  const base = c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (base === 'đ') return 'd'
  return base.length === 1 ? base : c.toLowerCase().slice(0, 1) || ' '
}

export function normalize(text: string): string {
  let out = ''
  for (const c of text) out += normalizeChar(c)
  return out
}

export function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wordStart = (token: string) => new RegExp(`(?:^|[^a-z0-9])${escape(token)}`)

function fieldText(q: Question, field: SearchField): string {
  switch (field) {
    case 'text':
      return q.text
    case 'options':
      return q.options.map((o) => o.text).join('\n')
    case 'explanation':
      return q.explanation
    case 'guide':
      return q.guide ? `${q.guide.easy}\n${q.guide.picture}\n${q.guide.remember}` : ''
  }
}

export interface QuestionSearch {
  search(query: string, limit?: number): SearchHit[]
}

export function createQuestionSearch(questions: readonly Question[]): QuestionSearch {
  const index = questions.map((q) => ({
    question: q,
    fields: Object.fromEntries(FIELDS.map((f) => [f, normalize(fieldText(q, f))])) as Record<SearchField, string>,
  }))

  return {
    search(query, limit = 50) {
      const tokens = tokenize(query)
      if (tokens.length === 0) return []
      const patterns = tokens.map(wordStart)
      const phrase = tokens.length > 1 ? wordStart(tokens.join(' ')) : null
      // Truy vấn chỉ là số → coi như tìm theo số câu.
      const idQuery = /^\s*\d+\s*$/.test(query) ? Number(query) : null

      const hits: SearchHit[] = []
      for (const entry of index) {
        const isId = entry.question.id === idQuery
        let score = isId ? 1000 : 0
        const matched: SearchField[] = []
        // Mọi từ phải xuất hiện ở ít nhất một trường.
        const all = FIELDS.map((f) => entry.fields[f]).join('\n')
        if (!isId && !patterns.every((p) => p.test(all))) continue
        for (const f of FIELDS) {
          const text = entry.fields[f]
          const n = patterns.filter((p) => p.test(text)).length
          if (n === 0) continue
          matched.push(f)
          score += FIELD_WEIGHT[f] * n
          if (phrase?.test(text)) score += FIELD_WEIGHT[f] * tokens.length * 2
        }
        if (score > 0) hits.push({ question: entry.question, score, fields: matched })
      }
      hits.sort((a, b) => b.score - a.score || a.question.id - b.question.id)
      return hits.slice(0, limit)
    },
  }
}

/** Các đoạn [start, end) trong `text` gốc khớp với các từ của truy vấn (để tô sáng). */
export function highlightRanges(text: string, query: string): [number, number][] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []
  // Map vị trí theo code unit: normalizeChar trả 1 ký tự cho mỗi code point; ký tự ngoài BMP chiếm 2 unit.
  const chars = Array.from(text)
  const starts: number[] = []
  let pos = 0
  let norm = ''
  for (const c of chars) {
    starts.push(pos)
    pos += c.length
    norm += normalizeChar(c)
  }
  starts.push(pos)

  const ranges: [number, number][] = []
  for (const t of tokens) {
    const re = new RegExp(`(?:^|(?<=[^a-z0-9]))${escape(t)}`, 'g')
    for (const m of norm.matchAll(re)) ranges.push([starts[m.index]!, starts[m.index + t.length]!])
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }
  return merged
}
