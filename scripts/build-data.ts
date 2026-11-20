import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isChapterCode, type ChapterCode, type OptionKey, type Question } from '../src/engine/types'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const RAW_QUESTIONS_PATH = join(ROOT, 'data', '600-cau-hoi-GPLX-hang-B.json')
export const IMAGE_SOURCE_DIR = join(ROOT, 'data', 'hinh')
export const OUTPUT_DIR = join(ROOT, 'public', 'generated')

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

/** Ghi `questions.json` và chép các hình được tham chiếu vào `outDir/images`. */
export function writeOutputs(questions: Question[], outDir = OUTPUT_DIR) {
  const imageOut = join(outDir, 'images')
  mkdirSync(imageOut, { recursive: true })
  for (const image of new Set(questions.flatMap((q) => (q.image ? [q.image] : [])))) {
    copyFileSync(join(IMAGE_SOURCE_DIR, image), join(imageOut, image))
  }
  writeFileSync(join(outDir, 'questions.json'), JSON.stringify(questions))
}

function main() {
  const questions = buildQuestions(loadRawQuestions())
  writeOutputs(questions)
  console.log(`Đã sinh ${questions.length} câu hỏi vào ${OUTPUT_DIR}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
