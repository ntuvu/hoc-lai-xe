import { describe, expect, it } from 'vitest'
import { createQuestionSearch, highlightRanges, normalize, tokenize } from './search'
import type { Question } from './types'
import { buildQuestions, loadRawQuestions } from '../../scripts/build-data'

function q(id: number, text: string, extra: Partial<Question> = {}): Question {
  return {
    id,
    chapter: 'I',
    isPointDeduction: false,
    text,
    options: [
      { key: 'a', text: 'Đáp án một' },
      { key: 'b', text: 'Đáp án hai' },
    ],
    correctAnswer: 'a',
    explanation: '',
    image: null,
    ...extra,
  }
}

describe('normalize', () => {
  it('strips Vietnamese diacritics, đ and case while keeping length', () => {
    expect(normalize('Đường Bộ, Tốc độ')).toBe('duong bo, toc do')
    expect(normalize('Ưu tiên').length).toBe('Ưu tiên'.length)
  })

  it('tokenizes on non-alphanumerics', () => {
    expect(tokenize('  Tốc-độ   tối đa! ')).toEqual(['toc', 'do', 'toi', 'da'])
  })
})

describe('question search', () => {
  const search = createQuestionSearch([
    q(1, 'Tốc độ tối đa cho phép trong khu dân cư'),
    q(2, 'Người lái xe phải giảm tốc độ khi nào?'),
    q(3, 'Khái niệm đường ưu tiên', { explanation: 'Xe ưu tiên được đi trước, tốc độ không hạn chế' }),
    q(4, 'Biển báo cấm', { options: [{ key: 'a', text: 'Cấm ô tô' }, { key: 'b', text: 'Cấm đỗ xe' }] }),
  ])

  it('matches without diacritics and ignores case', () => {
    expect(search.search('TOC DO').map((h) => h.question.id)).toEqual([1, 2, 3])
  })

  it('requires every word to match somewhere', () => {
    expect(search.search('tốc độ dân cư').map((h) => h.question.id)).toEqual([1])
  })

  it('matches at word starts only', () => {
    expect(search.search('oc').map((h) => h.question.id)).toEqual([])
    expect(search.search('dan').map((h) => h.question.id)).toEqual([1])
  })

  it('ranks matches in the question text above matches in the explanation', () => {
    const hits = search.search('uu tien')
    expect(hits[0]!.question.id).toBe(3)
    expect(hits[0]!.fields).toEqual(['text', 'explanation'])
  })

  it('searches answer options', () => {
    expect(search.search('cấm đỗ').map((h) => h.question.id)).toEqual([4])
  })

  it('a bare number also finds the question with that number first', () => {
    expect(search.search('2')[0]!.question.id).toBe(2)
  })

  it('returns nothing for an empty query', () => {
    expect(search.search('  ,. ')).toEqual([])
  })

  it('finds questions in the real data', () => {
    const real = createQuestionSearch(buildQuestions(loadRawQuestions()))
    const hits = real.search('nong do con')
    expect(hits.length).toBeGreaterThan(0)
    expect(normalize(hits[0]!.question.text)).toContain('nong do con')
  })
})

describe('highlightRanges', () => {
  it('returns ranges in the original text, merged and sorted', () => {
    const text = 'Tốc độ tối đa'
    const ranges = highlightRanges(text, 'toi toc')
    expect(ranges.map(([s, e]) => text.slice(s, e))).toEqual(['Tốc', 'tối'])
  })

  it('only highlights at word starts', () => {
    expect(highlightRanges('toàn an', 'an').map(([s, e]) => 'toàn an'.slice(s, e))).toEqual(['an'])
  })
})
