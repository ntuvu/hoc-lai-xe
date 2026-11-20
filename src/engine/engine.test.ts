import { describe, expect, it } from 'vitest'
import { createStudyEngine } from './engine'
import type { Question } from './types'

function q(id: number, chapter: Question['chapter'], extra: Partial<Question> = {}): Question {
  return {
    id,
    chapter,
    isPointDeduction: false,
    text: `Câu ${id}`,
    options: [
      { key: 'a', text: 'A' },
      { key: 'b', text: 'B' },
    ],
    correctAnswer: 'a',
    explanation: '',
    image: null,
    ...extra,
  }
}

describe('study engine: listing questions by chapter', () => {
  const engine = createStudyEngine({ questions: [q(3, 'I'), q(200, 'II'), q(1, 'I'), q(2, 'I')] })

  it('returns only the questions of the chosen chapter, ordered by question number', () => {
    expect(engine.listQuestions({ chapter: 'I' }).map((x) => x.id)).toEqual([1, 2, 3])
  })

  it('returns an empty list for a chapter with no questions', () => {
    expect(engine.listQuestions({ chapter: 'VI' })).toEqual([])
  })

  it('locates a question number inside the chosen chapter', () => {
    expect(engine.locateQuestion({ chapter: 'I' }, 3)).toBe(2)
  })

  it('does not locate a question that belongs to another chapter or does not exist', () => {
    expect(engine.locateQuestion({ chapter: 'I' }, 200)).toBe(-1)
    expect(engine.locateQuestion({ chapter: 'I' }, 999)).toBe(-1)
  })

  it('lists chapters with their question counts', () => {
    expect(engine.listChapters()).toEqual([
      { code: 'I', title: expect.any(String), questionCount: 3 },
      { code: 'II', title: expect.any(String), questionCount: 1 },
      { code: 'III', title: expect.any(String), questionCount: 0 },
      { code: 'IV', title: expect.any(String), questionCount: 0 },
      { code: 'V', title: expect.any(String), questionCount: 0 },
      { code: 'VI', title: expect.any(String), questionCount: 0 },
    ])
  })
})

describe('study engine: checking an answer', () => {
  const engine = createStudyEngine({ questions: [q(1, 'I', { correctAnswer: 'b' })] })

  it('says whether the chosen option is correct', () => {
    expect(engine.checkAnswer(1, 'b')).toEqual({ correct: true, correctAnswer: 'b' })
    expect(engine.checkAnswer(1, 'a')).toEqual({ correct: false, correctAnswer: 'b' })
  })
})
