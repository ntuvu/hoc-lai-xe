import { describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildQuestions, loadRawQuestions, IMAGE_SOURCE_DIR, writeOutputs } from './build-data'

const questions = buildQuestions(loadRawQuestions())

describe('questions.json build output', () => {
  it('contains all 600 questions', () => {
    expect(questions).toHaveLength(600)
  })

  it('has the official per-chapter counts', () => {
    const counts: Record<string, number> = {}
    for (const q of questions) counts[q.chapter] = (counts[q.chapter] ?? 0) + 1
    expect(counts).toEqual({ I: 180, II: 25, III: 58, IV: 37, V: 185, VI: 115 })
  })

  it('marks exactly 60 point-deduction (điểm liệt) questions', () => {
    expect(questions.filter((q) => q.isPointDeduction)).toHaveLength(60)
  })

  it('has a local image file for every question with an image', () => {
    const withImage = questions.filter((q) => q.image !== null)
    expect(withImage).toHaveLength(318)
    for (const q of withImage) expect(existsSync(join(IMAGE_SOURCE_DIR, q.image!)), `câu ${q.id}`).toBe(true)
  })

  it('lets #426 and #427 share one image file', () => {
    const byId = new Map(questions.map((q) => [q.id, q]))
    expect(byId.get(426)!.image).toBe('c426.webp')
    expect(byId.get(427)!.image).toBe('c426.webp')
  })

  it('keeps answer options in original A/B/C/D order', () => {
    const q1 = questions.find((q) => q.id === 1)!
    expect(q1.options.map((o) => o.key)).toEqual(['a', 'b', 'c'])
    expect(q1.correctAnswer).toBe('b')
    expect(q1.options[1]!.text).toBe('Phần đường xe chạy.')
  })
})

describe('written build output', () => {
  it('writes questions.json and copies every referenced image into the output folder', () => {
    const out = mkdtempSync(join(tmpdir(), 'gplx-build-'))
    try {
      writeOutputs(questions, [], out)
      const written = JSON.parse(readFileSync(join(out, 'questions.json'), 'utf8'))
      expect(written).toHaveLength(600)
      for (const q of questions.filter((x) => x.image)) {
        expect(existsSync(join(out, 'images', q.image!)), `câu ${q.id}`).toBe(true)
      }
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  })
})
