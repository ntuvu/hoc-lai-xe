import { useEffect, useState } from 'react'
import type { ActiveExamView, StudyEngine } from '../engine/engine'
import { hrefFor, navigate } from './route'
import { imageUrl } from './data'
import { Lightbox } from './Lightbox'

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const SBD_KEY = 'gplx-sbd'

export function readSbd(): string {
  try {
    return localStorage.getItem(SBD_KEY) || '1'
  } catch {
    return '1'
  }
}

function saveSbd(v: string) {
  try {
    localStorage.setItem(SBD_KEY, v)
  } catch {
    /* bỏ qua: chỉ là tiện ích */
  }
}

export function ExamScreen({ engine }: { engine: StudyEngine }) {
  const [exam, setExam] = useState<ActiveExamView | null>(() => engine.getActiveExam())
  const [index, setIndex] = useState(0)
  const [sbd, setSbd] = useState(readSbd)

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
    const start = () => {
      const v = sbd.trim().replace(/\D/g, '') || '1'
      saveSbd(v)
      setExam(engine.startExam())
    }
    return (
      <div className="sathach-login">
        <a className="sl-back" href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <form
          className="sl-box"
          onSubmit={(e) => {
            e.preventDefault()
            start()
          }}
        >
          <div className="sl-title">PHẦN MỀM TỰ LUYỆN SÁT HẠCH LÝ THUYẾT</div>
          <div className="sl-body">
            <label>
              Hạng GPLX
              <select value="B" disabled>
                <option value="B">Hạng B</option>
              </select>
            </label>
            <label>
              Số báo danh
              <input inputMode="numeric" value={sbd} onChange={(e) => setSbd(e.target.value)} maxLength={4} />
            </label>
            <ul className="sl-rules">
              <li>{cfg.questionCount} câu, {cfg.durationMinutes} phút, đạt khi đúng từ {cfg.passScore} câu.</li>
              <li>Có {cfg.pointDeductionCount} câu điểm liệt: trả lời sai câu này là không đạt.</li>
              <li>Chọn đáp án bằng phím 1–4 hoặc bấm vào ô; ↑ ↓ ← → để chuyển câu.</li>
            </ul>
            <p className="sl-note">Đây là bản tự luyện mô phỏng, không phải phần mềm sát hạch chính thức.</p>
            <button type="submit" className="sl-start">Vào thi</button>
          </div>
        </form>
      </div>
    )
  }

  return <SatHachView engine={engine} exam={exam} index={index} setIndex={setIndex} onExamChange={setExam} sbd={sbd} />
}

const DIGIT_TO_OPTION: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
const ROWS_PER_COLUMN = 15

function Avatar() {
  return (
    <svg viewBox="0 0 100 110" aria-hidden="true">
      <rect width="100" height="110" fill="#e9e9e9" />
      <circle cx="50" cy="40" r="20" fill="#b9b9b9" />
      <path d="M12 110c2-26 18-40 38-40s36 14 38 40z" fill="#b9b9b9" />
    </svg>
  )
}

/** Mô phỏng màn hình phần mềm tự luyện sát hạch lý thuyết. */
function SatHachView({
  engine,
  exam,
  index,
  setIndex,
  onExamChange,
  sbd,
}: {
  engine: StudyEngine
  exam: ActiveExamView
  index: number
  setIndex: (i: number) => void
  onExamChange: (e: ActiveExamView | null) => void
  sbd: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const total = exam.questions.length
  const question = exam.questions[index]!
  const chosen = exam.answers[question.id] ?? null
  const durationMs = exam.endsAt - exam.startedAt
  const pct = Math.max(0, Math.min(100, Math.round((exam.remainingMs / durationMs) * 100)))

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
        if (e.key === 'Enter') {
          e.preventDefault()
          submit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setConfirming(false)
        }
        return
      }
      if (zoomed) return
      const digit = e.code.startsWith('Numpad') ? e.code.slice(6) : e.key
      if (digit in DIGIT_TO_OPTION) {
        e.preventDefault()
        choose(index, DIGIT_TO_OPTION[digit]!)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIndex(Math.min(total - 1, index + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIndex(Math.max(0, index - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setIndex(Math.min(total - 1, index + ROWS_PER_COLUMN))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setIndex(Math.max(0, index - ROWS_PER_COLUMN))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="sathach">
      <div className="sh-frame">
        <div className="sh-left">
          <section className="sh-question">
            <p className="sh-text">
              <span className="sh-qno">Câu {index + 1}: </span>
              {question.text}
            </p>
            <div className={`sh-content${question.image ? ' has-image' : ''}`}>
              <ol className="sh-options">
                {question.options.map((o, i) => (
                  <li key={o.key}>
                    <button
                      type="button"
                      className={chosen === o.key ? 'is-chosen' : ''}
                      aria-pressed={chosen === o.key}
                      onClick={() => choose(index, i)}
                    >
                      {i + 1}- {o.text}
                    </button>
                  </li>
                ))}
              </ol>
              {question.image && (
                <button type="button" className="sh-image" onClick={() => setZoomed(true)} aria-label="Phóng to hình">
                  <img src={imageUrl(question.image)} alt={`Hình câu ${index + 1}`} />
                </button>
              )}
            </div>
          </section>

          <div className="sh-progress" role="progressbar" aria-label="Thời gian còn lại" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="sh-progress-fill" style={{ width: `${pct}%` }} />
            <span>{pct}%</span>
          </div>

          <div className="sh-bottom">
            <div className="sh-avatar">
              <Avatar />
            </div>
            <div className="sh-candidate">
              <div className="sh-candidate-title">Thông tin thí sinh</div>
              <div className="sh-candidate-row">
                <span>SBD: {sbd}</span>
                <span>Hạng: B</span>
              </div>
              <div>Họ Và Tên: THÍ SINH SỐ {sbd}</div>
            </div>
            <div className="sh-brand">
              <div className="sh-brand-title">BỘ 600 CÂU HỎI</div>
              <div className="sh-brand-band">TỰ LUYỆN SÁT HẠCH LÝ THUYẾT · HẠNG B</div>
            </div>
          </div>
        </div>

        <aside className="sh-right">
          <div className="sh-timer">
            <span>THỜI GIAN CÒN LẠI:</span>
            <strong>{formatTime(exam.remainingMs)}</strong>
          </div>
          <ol className="sh-grid" style={{
              gridTemplateRows: `repeat(${Math.min(ROWS_PER_COLUMN, total)}, minmax(30px, 1fr))`,
              gridTemplateColumns: `repeat(${Math.ceil(total / ROWS_PER_COLUMN)}, minmax(0, 1fr))`,
            }}>
            {exam.questions.map((q, qi) => {
              const ans = exam.answers[q.id]
              const state = qi === index ? ' is-current' : ans ? ' is-done' : ''
              return (
                <li key={q.id} className={`sh-cell${state}`}>
                  <button type="button" className="sh-cell-no" onClick={() => setIndex(qi)} aria-label={`Đến câu ${qi + 1}`}>
                    {qi + 1}
                  </button>
                  <div className="sh-cell-opts">
                    {q.options.map((o, oi) => (
                      <label key={o.key}>
                        <span>{oi + 1}</span>
                        <input
                          type="checkbox"
                          checked={ans === o.key}
                          onChange={() => choose(qi, oi)}
                          aria-label={`Câu ${qi + 1}, đáp án ${oi + 1}`}
                        />
                      </label>
                    ))}
                  </div>
                </li>
              )
            })}
          </ol>
          <button type="button" className="sh-end" onClick={() => setConfirming(true)}>
            KẾT THÚC
          </button>
        </aside>
      </div>
      <p className="sh-status">Phần thi kết thúc khi hết thời gian hoặc khi thí sinh nhấn "Kết thúc".</p>

      {confirming && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Thông báo">
          <div className="modal-box sh-dialog">
            <div className="sh-dialog-title">Thông báo</div>
            <p>Bạn có muốn kết thúc phần thi?</p>
            <div className="modal-actions">
              <button type="button" onClick={submit} autoFocus>
                Có
              </button>
              <button type="button" onClick={() => setConfirming(false)}>
                Không
              </button>
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
