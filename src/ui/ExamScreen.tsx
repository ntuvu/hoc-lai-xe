import { useEffect, useState } from 'react'
import type { ActiveExamView, StudyEngine } from '../engine/engine'
import { hrefFor, navigate } from './route'
import { imageUrl } from './data'
import { Lightbox } from './Lightbox'

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function ExamScreen({ engine }: { engine: StudyEngine }) {
  const [exam, setExam] = useState<ActiveExamView | null>(() => engine.getActiveExam())
  const [index, setIndex] = useState(0)

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

  return <SatHachView engine={engine} exam={exam} index={index} setIndex={setIndex} onExamChange={setExam} />
}

const OPTION_KEYS: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }

/** Giao diện mô phỏng phần mềm sát hạch: câu hỏi bên trái, bảng trả lời câu × đáp án bên phải, thao tác bằng bàn phím. */
function SatHachView({
  engine,
  exam,
  index,
  setIndex,
  onExamChange,
}: {
  engine: StudyEngine
  exam: ActiveExamView
  index: number
  setIndex: (i: number) => void
  onExamChange: (e: ActiveExamView | null) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const total = exam.questions.length
  const question = exam.questions[index]!
  const answeredCount = Object.keys(exam.answers).length
  const chosen = exam.answers[question.id] ?? null

  const choose = (qIndex: number, optIndex: number) => {
    const q = exam.questions[qIndex]!
    const opt = q.options[optIndex]
    if (!opt) return
    engine.answerExamQuestion(q.id, opt.key)
    onExamChange(engine.getActiveExam())
    setIndex(qIndex)
  }
  const submit = () => {
    const result = engine.submitExam()
    navigate({ name: 'examResult', id: result.id }, { replace: true })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (confirming) {
        if (e.key === 'Enter') { e.preventDefault(); submit() }
        else if (e.key === 'Escape') { e.preventDefault(); setConfirming(false) }
        return
      }
      if (zoomed) {
        if (e.key === 'Escape') setZoomed(false)
        return
      }
      const digit = e.code.startsWith('Numpad') ? e.code.slice(6) : e.key
      if (digit in OPTION_KEYS) { e.preventDefault(); choose(index, OPTION_KEYS[digit]!) }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); setIndex(Math.min(total - 1, index + 1)) }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setIndex(Math.max(0, index - 1)) }
      else if (e.key === 'Home') { e.preventDefault(); setIndex(0) }
      else if (e.key === 'End') { e.preventDefault(); setIndex(total - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Giữ hàng đang chọn của bảng trả lời luôn trong tầm nhìn.
  useEffect(() => {
    // Chỉ cuộn khung bảng, không cuộn cả trang (trên mobile bảng nằm dưới câu hỏi).
    const row = document.getElementById(`sh-row-${index}`)
    const box = row?.closest('.sh-sheet-scroll') as HTMLElement | null
    if (!row || !box) return
    const head = box.querySelector('thead')?.getBoundingClientRect().height ?? 0
    const top = row.offsetTop - head
    if (top < box.scrollTop) box.scrollTop = top
    else if (row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = row.offsetTop + row.offsetHeight - box.clientHeight
  }, [index])

  const maxOptions = Math.max(...exam.questions.map((q) => q.options.length))
  const urgent = exam.remainingMs < 60_000

  return (
    <div className="sathach">
      <header className="sh-head">
        <div className="sh-title">
          <strong>SÁT HẠCH LÝ THUYẾT (THI THỬ)</strong>
          <span>Hạng B · {total} câu · {engine.examConfig.durationMinutes} phút</span>
        </div>
        <dl className="sh-info">
          <div><dt>Thí sinh</dt><dd>Thi thử</dd></div>
          <div><dt>Hạng</dt><dd>B</dd></div>
          <div><dt>Đã trả lời</dt><dd>{answeredCount}/{total}</dd></div>
        </dl>
        <div className={`sh-timer${urgent ? ' is-urgent' : ''}`} aria-label="Thời gian còn lại" role="timer">
          <span>Thời gian còn lại</span>
          <strong>{formatTime(exam.remainingMs)}</strong>
        </div>
      </header>

      <div className="sh-body">
        <section className="sh-question" aria-live="polite">
          <h2>Câu {index + 1}:</h2>
          <p className="sh-text">{question.text}</p>
          <ol className="sh-options">
            {question.options.map((o, i) => (
              <li key={o.key}>
                <button
                  type="button"
                  className={chosen === o.key ? 'is-chosen' : ''}
                  aria-pressed={chosen === o.key}
                  onClick={() => choose(index, i)}
                >
                  <b>{i + 1}-</b> {o.text}
                </button>
              </li>
            ))}
          </ol>
          {question.image && (
            <button type="button" className="sh-image" onClick={() => setZoomed(true)} aria-label="Phóng to hình">
              <img src={imageUrl(question.image)} alt={`Hình câu ${index + 1}`} />
            </button>
          )}
        </section>

        <aside className="sh-sheet" aria-label="Bảng trả lời">
          <div className="sh-sheet-title">BẢNG TRẢ LỜI</div>
          <div className="sh-sheet-scroll">
            <table>
              <thead>
                <tr>
                  <th>Câu</th>
                  {Array.from({ length: maxOptions }, (_, i) => <th key={i}>{i + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {exam.questions.map((q, qi) => {
                  const ans = exam.answers[q.id]
                  return (
                    <tr id={`sh-row-${qi}`} key={q.id} className={qi === index ? 'is-current' : ''}>
                      <th>
                        <button type="button" onClick={() => setIndex(qi)} aria-label={`Đến câu ${qi + 1}`}>{qi + 1}</button>
                      </th>
                      {Array.from({ length: maxOptions }, (_, oi) => {
                        const opt = q.options[oi]
                        const on = !!opt && ans === opt.key
                        return (
                          <td key={oi}>
                            {opt ? (
                              <button
                                type="button"
                                className={on ? 'is-on' : ''}
                                aria-label={`Câu ${qi + 1} chọn đáp án ${oi + 1}`}
                                aria-pressed={on}
                                onClick={() => choose(qi, oi)}
                              >
                                {on ? '✕' : ''}
                              </button>
                            ) : (
                              <span className="sh-na" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </aside>
      </div>

      <footer className="sh-foot">
        <div className="sh-nav">
          <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>▲ Câu trước</button>
          <button type="button" disabled={index === total - 1} onClick={() => setIndex(index + 1)}>Câu sau ▼</button>
        </div>
        <p className="sh-keys">Phím <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án · <kbd>↑</kbd> <kbd>↓</kbd> chuyển câu</p>
        <button type="button" className="sh-end" onClick={() => setConfirming(true)}>KẾT THÚC</button>
      </footer>

      {confirming && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Xác nhận kết thúc bài thi">
          <div className="modal-box sh-dialog">
            <div className="sh-dialog-title">Thông báo</div>
            <p>
              Bạn có chắc chắn muốn kết thúc bài thi?
              {answeredCount < total && <><br />Còn {total - answeredCount} câu chưa trả lời (tính là sai).</>}
            </p>
            <div className="modal-actions">
              <button type="button" className="primary" onClick={submit} autoFocus>Đồng ý (Enter)</button>
              <button type="button" onClick={() => setConfirming(false)}>Hủy (Esc)</button>
            </div>
          </div>
        </div>
      )}

      {zoomed && question.image && (
        <Lightbox src={imageUrl(question.image)} alt={`Hình câu ${index + 1}`} onClose={() => setZoomed(false)} />
      )}
    </div>
  )
}
