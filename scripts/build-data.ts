import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isChapterCode, type ChapterCode, type OptionKey, type Question, type QuestionGuide, type Tip } from '../src/engine/types'
import { buildTips, loadTipsSource } from './build-tips'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const RAW_QUESTIONS_PATH = join(ROOT, 'data', '600-cau-hoi-GPLX-hang-B.json')
export const IMAGE_SOURCE_DIR = join(ROOT, 'data', 'hinh')
export const OUTPUT_DIR = join(ROOT, 'public', 'generated')
export const GUIDE_DIR = join(ROOT, 'data', 'giai-thich')

export interface RawQuestion {
  id: number
  category: string
  isPointDeduction: boolean
  question: string
  hasImage: boolean
  options: Record<string, string>
  correctAnswer: string
  explanation: string
  image: string | null
}

const OPTION_KEYS: readonly OptionKey[] = ['a', 'b', 'c', 'd']

export function loadRawQuestions(path = RAW_QUESTIONS_PATH): RawQuestion[] {
  return JSON.parse(readFileSync(path, 'utf8')) as RawQuestion[]
}

function parseChapter(category: string): ChapterCode {
  const match = /^Chương\s+([IVX]+)\./.exec(category)
  const code = match?.[1]
  if (!code || !isChapterCode(code)) throw new Error(`Không nhận ra chương: "${category}"`)
  return code
}

export function buildQuestions(raw: RawQuestion[]): Question[] {
  return raw.map((r) => {
    const options = OPTION_KEYS.filter((k) => r.options[k] !== undefined).map((k) => ({
      key: k,
      text: r.options[k]!,
    }))
    const correct = r.correctAnswer as OptionKey
    if (!options.some((o) => o.key === correct)) {
      throw new Error(`Câu ${r.id}: đáp án đúng "${r.correctAnswer}" không có trong các phương án`)
    }
    return {
      id: r.id,
      chapter: parseChapter(r.category),
      isPointDeduction: r.isPointDeduction,
      text: r.question,
      options,
      correctAnswer: correct,
      explanation: r.explanation,
      image: r.hasImage && r.image ? basename(r.image) : null,
    }
  })
}

/** Đọc mọi file `data/giai-thich/*.json` (mỗi file: { "<id>": { easy, picture, remember } }). */
export function loadGuides(dir = GUIDE_DIR): Map<number, QuestionGuide> {
  const guides = new Map<number, QuestionGuide>()
  if (!existsSync(dir)) return guides
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, QuestionGuide>
    for (const [id, g] of Object.entries(data)) {
      if (!/^\d+$/.test(id)) throw new Error(`${file}: key "${id}" không phải số câu`)
      if (guides.has(Number(id))) throw new Error(`${file}: câu ${id} bị khai báo trùng`)
      for (const k of ['easy', 'picture', 'remember'] as const) {
        if (typeof g[k] !== 'string' || !g[k].trim()) throw new Error(`${file}: câu ${id} thiếu "${k}"`)
      }
      guides.set(Number(id), { easy: g.easy, picture: g.picture, remember: g.remember })
    }
  }
  return guides
}

/** Gắn giải thích dễ hiểu vào câu hỏi; lỗi nếu giải thích trỏ tới câu không tồn tại. */
export function attachGuides(questions: Question[], guides: Map<number, QuestionGuide>): Question[] {
  const ids = new Set(questions.map((q) => q.id))
  for (const id of guides.keys()) if (!ids.has(id)) throw new Error(`Giải thích cho câu ${id} không tồn tại`)
  return questions.map((q) => (guides.has(q.id) ? { ...q, guide: guides.get(q.id)! } : q))
}

/** Ghi `questions.json`, `tips.json` và chép các hình được tham chiếu vào `outDir/images`. */
export function writeOutputs(questions: Question[], tips: Tip[], outDir = OUTPUT_DIR) {
  const imageOut = join(outDir, 'images')
  mkdirSync(imageOut, { recursive: true })
  for (const image of new Set(questions.flatMap((q) => (q.image ? [q.image] : [])))) {
    copyFileSync(join(IMAGE_SOURCE_DIR, image), join(imageOut, image))
  }
  writeFileSync(join(outDir, 'questions.json'), JSON.stringify(questions))
  writeFileSync(join(outDir, 'tips.json'), JSON.stringify(tips))
}

function main() {
  const questions = attachGuides(buildQuestions(loadRawQuestions()), loadGuides())
  const tips = buildTips(loadTipsSource(), questions)
  writeOutputs(questions, tips)
  console.log(`Đã sinh ${questions.length} câu hỏi (${questions.filter((q) => q.guide).length} có giải thích dễ hiểu), ${tips.length} mẹo vào ${OUTPUT_DIR}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
