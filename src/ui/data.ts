import type { Question } from '../engine/types'

const BASE = `${import.meta.env.BASE_URL}generated/`

export async function loadQuestions(): Promise<Question[]> {
  const res = await fetch(`${BASE}questions.json`)
  if (!res.ok) throw new Error(`Không tải được dữ liệu câu hỏi (${res.status})`)
  return (await res.json()) as Question[]
}

export function imageUrl(file: string): string {
  return `${BASE}images/${file}`
}
