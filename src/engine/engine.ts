import type { ChapterCode, OptionKey, Question } from './types'

export const CHAPTERS: readonly { code: ChapterCode; title: string }[] = [
  { code: 'I', title: 'Quy định chung và quy tắc giao thông đường bộ' },
  { code: 'II', title: 'Văn hóa giao thông, đạo đức người lái xe, kỹ năng phòng cháy, chữa cháy và cứu hộ, cứu nạn' },
  { code: 'III', title: 'Kỹ thuật lái xe' },
  { code: 'IV', title: 'Cấu tạo và sửa chữa' },
  { code: 'V', title: 'Báo hiệu đường bộ' },
  { code: 'VI', title: 'Giải thế sa hình và kỹ năng xử lý tình huống giao thông' },
]

export interface QuestionFilter {
  chapter: ChapterCode
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

export interface StudyEngine {
  listChapters(): ChapterSummary[]
  listQuestions(filter: QuestionFilter): Question[]
  /** Vị trí (0-based) của câu số `questionId` trong danh sách của bộ lọc, hoặc -1 nếu câu không thuộc bộ lọc. */
  locateQuestion(filter: QuestionFilter, questionId: number): number
  checkAnswer(questionId: number, chosen: OptionKey): AnswerCheck
}

export interface StudyEngineDeps {
  questions: readonly Question[]
}

export function createStudyEngine({ questions }: StudyEngineDeps): StudyEngine {
  const sorted = [...questions].sort((a, b) => a.id - b.id)
  const byId = new Map(sorted.map((q) => [q.id, q]))

  function requireQuestion(id: number): Question {
    const q = byId.get(id)
    if (!q) throw new Error(`Không có câu số ${id}`)
    return q
  }

  function listQuestions(filter: QuestionFilter): Question[] {
    return sorted.filter((q) => q.chapter === filter.chapter)
  }

  return {
    listChapters: () =>
      CHAPTERS.map((c) => ({ ...c, questionCount: sorted.filter((q) => q.chapter === c.code).length })),
    listQuestions,
    locateQuestion: (filter, questionId) => listQuestions(filter).findIndex((q) => q.id === questionId),
    checkAnswer: (questionId, chosen) => {
      const { correctAnswer } = requireQuestion(questionId)
      return { correct: chosen === correctAnswer, correctAnswer }
    },
  }
}
