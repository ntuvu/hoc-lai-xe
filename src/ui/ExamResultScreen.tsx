import { useState } from 'react'
import type { StudyEngine } from '../engine/engine'
import { hrefFor } from './route'
import { readSbd } from './ExamScreen'
import { useQuestionKeys } from './useQuestionKeys'
import { AnswerFeedback, GuideBox, QuestionCard, TipList } from './QuestionCard'

export function ExamResultScreen({ engine, id }: { engine: StudyEngine; id: string }) {
  const result = engine.examResult(id)
  const [index, setIndex] = useState<number | null>(null)
  const count = result?.items.length ?? 0
  useQuestionKeys({
    onPrev: () => setIndex((i) => (i === null ? 0 : Math.max(0, i - 1))),
    onNext: () => setIndex((i) => (i === null ? 0 : Math.min(count - 1, i + 1))),
  })

  if (!result) {
    return (
      <main className="page">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <p className="muted">Không tìm thấy kết quả thi này.</p>
      </main>
    )
  }

  const item = index === null ? null : result.items[index]!
  const unanswered = result.items.filter((it) => it.chosen === null).length
  const wrongCount = result.total - result.correctCount - unanswered
  const failedPointNo = result.items.findIndex((it) => it.question.isPointDeduction && !it.correct) + 1
  const sbd = readSbd()

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <a href={hrefFor({ name: 'exam' })}>Thi đề khác →</a>
      </nav>

      <section className="kq">
        <div className="kq-title">Kết quả thi thí sinh</div>
        <div className="kq-body">
          <fieldset>
            <legend>Thông tin thí sinh</legend>
            <p>Họ tên: <b>THÍ SINH SỐ {sbd}</b></p>
            <p>Số báo danh: <b>{sbd}</b></p>
            <p>Hạng GPLX: <b>B</b></p>
          </fieldset>
          <fieldset>
            <legend>Kết quả thi</legend>
            <p>SỐ CÂU TRẢ LỜI ĐÚNG: <b>{result.correctCount}/{result.total}</b></p>
            <p>SỐ CÂU TRẢ LỜI SAI: <b>{wrongCount}</b></p>
            <p>SỐ CÂU CHƯA TRẢ LỜI: <b>{unanswered}</b></p>
            <p className={`kq-verdict ${result.passed ? 'is-pass' : 'is-fail'}`}>
              KẾT QUẢ: <b>{result.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b>
            </p>
            {!result.passed && (
              <p className="kq-reason">
                Lý do trượt:{' '}
                {result.failedByPointDeduction
                  ? `Trả lời sai câu mất an toàn giao thông nghiêm trọng (điểm liệt), câu số: ${failedPointNo}.`
                  : `Không đủ ${engine.examConfig.passScore}/${result.total} câu đúng.`}
              </p>
            )}
          </fieldset>
        </div>
        <div className="kq-actions">
          <button type="button" onClick={() => setIndex(0)}>Xem bài thi và đáp án</button>
          <a href={hrefFor({ name: 'exam' })}>Thi đề khác</a>
          <a href={hrefFor({ name: 'home' })}>Kết thúc</a>
        </div>
        <p className="muted kq-note">Các câu sai đã được đưa vào danh sách ôn câu sai.</p>
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
