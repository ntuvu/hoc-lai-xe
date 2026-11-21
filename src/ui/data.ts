import type { Question, Tip } from '../engine/types'
import type { StorageAdapter } from '../engine/engine'

const BASE = `${import.meta.env.BASE_URL}generated/`

async function loadJson<T>(file: string, what: string): Promise<T> {
  const res = await fetch(`${BASE}${file}`)
  if (!res.ok) throw new Error(`Không tải được dữ liệu ${what} (${res.status})`)
  return (await res.json()) as T
}

export const loadQuestions = () => loadJson<Question[]>('questions.json', 'câu hỏi')
export const loadTips = () => loadJson<Tip[]>('tips.json', 'mẹo')

export function imageUrl(file: string): string {
  return `${BASE}images/${file}`
}

/** Storage adapter dùng localStorage; trình duyệt chặn storage thì vẫn chạy (không lưu). */
export const localStorageAdapter: StorageAdapter = {
  get(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* bỏ qua: không lưu được */
    }
  },
}
