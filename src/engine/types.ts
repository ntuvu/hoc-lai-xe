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
  /** Giải thích dễ hiểu + minh họa để dễ nhớ (viết thêm, ngoài giải thích gốc của bộ đề). */
  guide?: QuestionGuide
}

export interface QuestionGuide {
  /** Giải thích bằng lời đơn giản: vì sao đáp án đúng. */
  easy: string
  /** Minh họa bằng hình ảnh emoji / tình huống đời thường. */
  picture: string
  /** Câu nhớ nhanh. */
  remember: string
}

export type TipConfidence = 'normal' | 'low'

/** Câu mẹo áp dụng và cho đúng đáp án. */
export interface TipApplication {
  id: number
  /** Đáp án mẹo chỉ ra (= đáp án đúng). */
  answer: OptionKey
}

/** Câu mẹo khớp nhưng cho sai đáp án. */
export interface TipException {
  id: number
  tipAnswer: OptionKey
  correctAnswer: OptionKey
  reason: string
}

/** Câu mẹo khớp nhiều đáp án, không phân biệt được. */
export interface TipAmbiguity {
  id: number
  candidates: OptionKey[]
  note: string
}

interface TipBase {
  id: string
  title: string
  rule: string
  source: string
  confidence: TipConfidence
}

export interface QuestionTip extends TipBase {
  scope: 'question'
  /** Khi các mẹo mâu thuẫn ở cùng một câu, mẹo có priority cao hơn là mẹo nên theo. Mặc định 1. */
  priority?: number
  appliesTo: TipApplication[]
  exceptions: TipException[]
  ambiguous: TipAmbiguity[]
}

export interface ChapterTip extends TipBase {
  scope: 'chapter'
  chapter: ChapterCode
}

export type Tip = QuestionTip | ChapterTip
