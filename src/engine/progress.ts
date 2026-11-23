import type { OptionKey } from './types'

export const PROGRESS_VERSION = 1

export type AnswerSource = 'practice' | 'exam'

export interface AnswerRecord {
  questionId: number
  chosen: OptionKey | null
  correct: boolean
  /** Thời điểm (ms epoch). */
  at: number
  source: AnswerSource
}

export interface WrongEntry {
  /** Số lần trả lời đúng liên tiếp kể từ lần sai gần nhất. */
  streak: number
}

export interface ExamItem {
  questionId: number
  chosen: OptionKey | null
  /** Chỉ có khi thí sinh đánh dấu từ 2 ô trở lên (bài làm tính sai). */
  chosenKeys?: OptionKey[]
}

export interface ExamRecord {
  id: string
  startedAt: number
  submittedAt: number
  correctCount: number
  total: number
  passed: boolean
  failedByPointDeduction: boolean
  items: ExamItem[]
}

export interface ActiveExam {
  id: string
  questionIds: number[]
  startedAt: number
  endsAt: number
  /**
   * Các ô đáp án đang đánh dấu của từng câu. Giống phần mềm sát hạch: được đánh dấu nhiều ô,
   * câu chỉ đúng khi đánh dấu đúng một ô là đáp án đúng. (Dữ liệu cũ lưu 1 chuỗi — vẫn đọc được.)
   */
  answers: Record<number, OptionKey[]>
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION
  answers: AnswerRecord[]
  wrong: Record<number, WrongEntry>
  /** Vị trí đang làm dở: key bộ lọc → id câu. */
  positions: Record<string, number>
  /** Thứ tự xáo của bộ lọc đang bật "ngẫu nhiên": key bộ lọc → danh sách id. */
  shuffled: Record<string, number[]>
  examHistory: ExamRecord[]
  activeExam: ActiveExam | null
}

export function emptyProgress(): ProgressState {
  return { version: PROGRESS_VERSION, answers: [], wrong: {}, positions: {}, shuffled: {}, examHistory: [], activeExam: null }
}

const OPTION_KEYS = new Set(['a', 'b', 'c', 'd'])
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown): v is number => Number.isInteger(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isKey = (v: unknown): v is OptionKey => typeof v === 'string' && OPTION_KEYS.has(v)
const isKeyList = (v: unknown) => Array.isArray(v) && v.every(isKey) && new Set(v).size === v.length
const isIntKeyed = (o: Record<string, unknown>) => Object.keys(o).every((k) => /^\d+$/.test(k))

/** Kiểm tra toàn bộ dữ liệu tiến độ; trả về thông báo lỗi tiếng Việt hoặc null nếu hợp lệ. */
export function validateProgress(data: unknown, questionIds: ReadonlySet<number>): string | null {
  if (!isObj(data)) return 'File không phải dữ liệu tiến độ (không phải object JSON).'
  if (data.version !== PROGRESS_VERSION)
    return `Phiên bản dữ liệu không được hỗ trợ: ${JSON.stringify(data.version)} (cần ${PROGRESS_VERSION}).`
  const qid = (v: unknown) => isInt(v) && questionIds.has(v)

  if (!Array.isArray(data.answers)) return 'Thiếu danh sách câu trả lời (answers).'
  for (const [i, a] of data.answers.entries()) {
    if (!isObj(a) || !qid(a.questionId) || !(a.chosen === null || isKey(a.chosen)) || typeof a.correct !== 'boolean' ||
      !isNum(a.at) || (a.source !== 'practice' && a.source !== 'exam'))
      return `Câu trả lời thứ ${i + 1} không hợp lệ.`
  }
  if (!isObj(data.wrong) || !isIntKeyed(data.wrong)) return 'Danh sách câu sai (wrong) không hợp lệ.'
  for (const [k, w] of Object.entries(data.wrong)) {
    if (!qid(Number(k)) || !isObj(w) || !isInt(w.streak) || w.streak < 0) return `Câu sai #${k} không hợp lệ.`
  }
  if (!isObj(data.positions)) return 'Vị trí đang làm (positions) không hợp lệ.'
  for (const [k, v] of Object.entries(data.positions)) if (!qid(v)) return `Vị trí "${k}" không hợp lệ.`
  if (!isObj(data.shuffled)) return 'Thứ tự ngẫu nhiên (shuffled) không hợp lệ.'
  for (const [k, v] of Object.entries(data.shuffled))
    if (!Array.isArray(v) || !v.every(qid)) return `Thứ tự ngẫu nhiên "${k}" không hợp lệ.`

  if (!Array.isArray(data.examHistory)) return 'Lịch sử thi thử (examHistory) không hợp lệ.'
  for (const [i, e] of data.examHistory.entries()) {
    if (!isObj(e) || typeof e.id !== 'string' || !isNum(e.startedAt) || !isNum(e.submittedAt) || !isInt(e.correctCount) ||
      !isInt(e.total) || typeof e.passed !== 'boolean' || typeof e.failedByPointDeduction !== 'boolean' ||
      !Array.isArray(e.items) || !e.items.every((it) => isObj(it) && qid(it.questionId) && (it.chosen === null || isKey(it.chosen)) &&
        (it.chosenKeys === undefined || isKeyList(it.chosenKeys))))
      return `Lần thi thử thứ ${i + 1} không hợp lệ.`
  }
  const ax = data.activeExam
  if (ax !== null) {
    if (!isObj(ax) || typeof ax.id !== 'string' || !Array.isArray(ax.questionIds) || !ax.questionIds.every(qid) ||
      !isNum(ax.startedAt) || !isNum(ax.endsAt) || !isObj(ax.answers) || !isIntKeyed(ax.answers) ||
      !Object.values(ax.answers).every((v) => isKey(v) || isKeyList(v)))
      return 'Bài thi đang làm dở (activeExam) không hợp lệ.'
  }
  return null
}

/** Đưa dữ liệu đã kiểm tra về dạng hiện tại (bài thi dở lưu bởi bản cũ: mỗi câu một chuỗi đáp án). */
export function normalizeProgress(state: ProgressState): ProgressState {
  const ax = state.activeExam
  if (ax) {
    const raw = ax.answers as Record<number, OptionKey | OptionKey[]>
    ax.answers = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? [v] : v]))
  }
  return state
}
