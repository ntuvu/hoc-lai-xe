import { useEffect, useState } from 'react'
import type { ActiveExamView, StudyEngine } from '../engine/engine'
import { hrefFor, navigate } from './route'
import { QuestionCard } from './QuestionCard'

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function ExamScreen({ engine }: { engine: StudyEngine }) {
  const [exam, setExam] = useState<ActiveExamView | null>(() => engine.getActiveExam())
  const [index, setIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!exam) return
    const timer = setInterval(() => {
      const result = engine.submitExamIfExpired()
      if (result) navigate({ name: 'examResult', id: result.id }, { replace: true })
      else setExam(engine.getActiveExam())
    }, 500)
    return () => clearInterval(timer)
  }, [engine, exam?.id])

  const cfg = engine.examConfig

  if (!exam) {
    return (
      <main className="page">
        <nav className="topbar">
          <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        </nav>
        <section className="card intro">
          <h1>Thi thử hạng B</h1>
          <ul>
            <li>
              {cfg.questionCount} câu, {cfg.durationMinutes} phút, đạt khi đúng ≥ {cfg.passScore} câu.
            </li>
            <li>Có {cfg.pointDeductionCount} câu điểm liệt: sai câu này là trượt dù đủ điểm.</li>
            <li>Không hiện mẹo, đáp án hay nhãn điểm liệt trong lúc thi. Câu bỏ trống tính sai.</li>
          </ul>
          <button type="button" className="primary" onClick={() => setExam(engine.startExam())}>
            Bắt đầu thi
          </button>
        </section>
      </main>
    )
  }

  const question = exam.questions[index]!
  const answeredCount = Object.keys(exam.answers).length
  const submit = () => {
    const result = engine.submitExam()
    navigate({ name: 'examResult', id: result.id }, { replace: true })
  }

  return (
    <main className="page">
      <nav className="topbar exam-bar">
        <span className={`timer${exam.remainingMs < 60_000 ? ' is-urgent' : ''}`} aria-label="Thời gian còn lại">
          ⏱ {formatTime(exam.remainingMs)}
        </span>
        <span className="muted">
          Đã làm {answeredCount}/{exam.questions.length}
        </span>
        <button type="button" className="primary small" onClick={() => setConfirming(true)}>
          Nộp bài
        </button>
      </nav>

      <ol className="exam-grid" aria-label="Danh sách câu">
        {exam.questions.map((q, i) => (
          <li key={q.id}>
            <button
              type="button"
              className={`${exam.answers[q.id] ? 'is-done' : ''}${i === index ? ' is-current' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Câu ${i + 1}${exam.answers[q.id] ? ' (đã làm)' : ' (chưa làm)'}`}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      <p className="muted">Câu {index + 1}/{exam.questions.length}</p>
      <QuestionCard
        question={question}
        showPointDeduction={false}
        chosen={exam.answers[question.id] ?? null}
        revealed={false}
        onChoose={(key) => {
          engine.answerExamQuestion(question.id, key)
          setExam(engine.getActiveExam())
        }}
      />

      <footer className="pager">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Câu trước
        </button>
        <button type="button" disabled={index === exam.questions.length - 1} onClick={() => setIndex(index + 1)}>
          Câu sau →
        </button>
      </footer>

      {confirming && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Xác nhận nộp bài">
          <div className="modal-box">
            <p>
              Nộp bài ngay?
              {answeredCount < exam.questions.length &&
                ` Bạn còn ${exam.questions.length - answeredCount} câu chưa làm (tính là sai).`}
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setConfirming(false)}>
                Làm tiếp
              </button>
              <button type="button" className="primary" onClick={submit}>
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
