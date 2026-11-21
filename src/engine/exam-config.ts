import type { ChapterCode } from './types'

export interface ExamConfig {
  questionCount: number
  durationMinutes: number
  /** Số câu đúng tối thiểu để đạt (và không được sai câu điểm liệt). */
  passScore: number
  /** Số câu điểm liệt trong đề (bốc từ nhóm điểm liệt). */
  pointDeductionCount: number
  /** Số câu KHÔNG phải điểm liệt lấy từ mỗi chương. */
  chapterDistribution: Record<ChapterCode, number>
}

/**
 * Cấu trúc đề thi lý thuyết hạng B — Thông tư 12/2025/TT-BCA, Công văn 2262/CSGT-P5
 * (áp dụng đến 28/02/2027). Đổi quy định thì chỉ sửa object này.
 */
export const EXAM_CONFIG_B: ExamConfig = {
  questionCount: 30,
  durationMinutes: 20,
  passScore: 27,
  pointDeductionCount: 1,
  chapterDistribution: { I: 8, II: 1, III: 1, IV: 1, V: 9, VI: 9 },
}
