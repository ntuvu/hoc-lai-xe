import { useState } from 'react'
import type { StudyEngine } from '../engine/engine'
import { hrefFor } from './route'
import { AnswerFeedback, GuideBox, QuestionCard, TipList } from './QuestionCard'

export function ExamResultScreen({ engine, id }: { engine: StudyEngine; id: string }) {
  const result = engine.examResult(id)
  const [index, setIndex] = useState<number | null>(null)

  if (!result) {
    return (
      <main className="page">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <p className="muted">Không tìm thấy kết quả thi này.</p>
      </main>
    )
  }

  const item = index === null ? null : result.items[index]!

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <a href={hrefFor({ name: 'exam' })}>Thi đề khác →</a>
      </nav>

      <section className={`result ${result.passed ? 'is-pass' : 'is-fail'}`}>
        <h1>{result.passed ? 'ĐẠT' : 'TRƯỢT'}</h1>
        <p className="result-score">
          {result.correctCount}/{result.total} câu đúng
        </p>
        {result.failedByPointDeduction && (
          <p>
            <strong>Trượt vì sai câu điểm liệt</strong>
            {result.correctCount >= engine.examConfig.passScore && ' — dù đã đủ điểm.'}
          </p>
        )}
        {!result.passed && !result.failedByPointDeduction && (
          <p>Cần đúng ít nhất {engine.examConfig.passScore} câu.</p>
        )}
        <p className="muted">Các câu sai đã được đưa vào danh sách ôn câu sai.</p>
      </section>

      <ol className="exam-grid" aria-label="Xem lại từng câu">
        {result.items.map((it, i) => (
          <li key={it.question.id}>
            <button
              type="button"
              className={`${it.correct ? 'is-right' : 'is-miss'}${i === index ? ' is-current' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Câu ${i + 1}: ${it.correct ? 'đúng' : 'sai'}`}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      {item ? (
        <>
          <QuestionCard question={item.question} showPointDeduction chosen={item.chosen} revealed>
            <AnswerFeedback question={item.question} chosen={item.chosen} />
            <GuideBox question={item.question} />
            <TipList question={item.question} tips={engine.getTipsForQuestion(item.question.id)} revealed />
          </QuestionCard>
          <footer className="pager">
            <button type="button" disabled={index === 0} onClick={() => setIndex(index! - 1)}>
              ← Câu trước
            </button>
            <button type="button" disabled={index === result.items.length - 1} onClick={() => setIndex(index! + 1)}>
              Câu sau →
            </button>
          </footer>
        </>
      ) : (
        <p className="muted">Chọn một câu ở trên để xem lại (xanh: đúng, đỏ: sai).</p>
      )}
    </main>
  )
}
