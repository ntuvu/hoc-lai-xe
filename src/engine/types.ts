export const CHAPTER_CODES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const
export type ChapterCode = (typeof CHAPTER_CODES)[number]

export function isChapterCode(value: string): value is ChapterCode {
  return (CHAPTER_CODES as readonly string[]).includes(value)
}
export type OptionKey = 'a' | 'b' | 'c' | 'd'

export interface QuestionOption {
  key: OptionKey
  text: string
}

export interface Question {
  id: number
  chapter: ChapterCode
  /** Câu điểm liệt */
  isPointDeduction: boolean
  text: string
  /** Giữ nguyên thứ tự A/B/C/D của bộ đề gốc — không bao giờ xáo trộn. */
  options: QuestionOption[]
  correctAnswer: OptionKey
  explanation: string
  /** Tên file hình (local), hoặc null nếu câu không có hình. */
  image: string | null
}
