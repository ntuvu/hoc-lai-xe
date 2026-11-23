import { useEffect, useState } from 'react'
import type { ActiveExamView, ExamResult, StudyEngine } from '../engine/engine'
import type { OptionKey, Question } from '../engine/types'
import { hrefFor, navigate } from './route'
import { imageUrl } from './data'
import { Lightbox } from './Lightbox'

/*
 * Mô phỏng màn hình thi của phần mềm tự luyện sát hạch lý thuyết (bản Windows, form hạng B).
 * Bố cục, màu và phím tắt lấy từ phân tích tĩnh bản phần mềm đó:
 * - Câu hỏi hiện trong khung trắng bên trái; bên phải là cột xanh: đồng hồ, lưới 2 cột × 15 ô câu, nút KẾT THÚC.
 * - Mỗi ô câu là một nút chọn câu kèm 1–4 ô đánh dấu đáp án. Được đánh dấu nhiều ô; câu chỉ đúng khi
 *   đánh dấu đúng một ô là đáp án đúng.
 * - Phím 1–4 (cả bàn phím số) bật/tắt ô đáp án của câu đang chọn, Delete bỏ hết; ↑ ← câu trước, ↓ → câu sau
 *   (vòng tròn 30 → 1); Esc = KẾT THÚC.
 * - Ô đang chọn nền đỏ chữ trắng; ô đã đánh dấu nền xanh lá; khi xem lại, ô làm sai nền đỏ.
 */

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

export function candidateName(sbd: string) {
  return `THÍ SINH SỐ ${sbd}`
}

export function ExamScreen({ engine }: { engine: StudyEngine }) {
  const [exam, setExam] = useState<ActiveExamView | null>(() => engine.getActiveExam())

  useEffect(() => {
    if (!exam) return
    const timer = setInterval(() => {
      const result = engine.submitExamIfExpired()
      if (result) navigate({ name: 'examResult', id: result.id }, { replace: true })
      else setExam(engine.getActiveExam())
    }, 500)
    return () => clearInterval(timer)
  }, [engine, exam?.id])

  if (!exam) return <ExamLogin engine={engine} onStart={() => setExam(engine.startExam())} />

  return <ExamRunner engine={engine} exam={exam} onExamChange={setExam} />
}

/** Màn đăng nhập: chọn hạng, nhập số báo danh, kiểm tra thông tin thí sinh rồi vào tập luyện. */
function ExamLogin({ engine, onStart }: { engine: StudyEngine; onStart: () => void }) {
  const [sbd, setSbd] = useState(readSbd)
  const [checked, setChecked] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const cfg = engine.examConfig
  const clean = sbd.trim().replace(/\D/g, '')

  const check = () => {
    if (!clean) {
      setWarning('Xin mời nhập số báo danh!')
      return false
    }
    saveSbd(clean)
    setChecked(true)
    setWarning(null)
    return true
  }
  const start = () => {
    if (check()) onStart()
  }

  return (
    <div className="sathach-login">
      <a className="sl-back" href={hrefFor({ name: 'home' })}>← Trang chủ</a>
      <div className="sl-window">
        <div className="sl-caption">PHẦN MỀM TỰ LUYỆN SÁT HẠCH LÝ THUYẾT</div>
        <div className="sl-banner">BỘ 600 CÂU HỎI SÁT HẠCH LÁI XE</div>
        <div className="sl-band" />
        <form
          className="sl-panel"
          onSubmit={(e) => {
            e.preventDefault()
            start()
          }}
        >
          <div className="sl-fields">
            <label className="sl-field">
              <span>Hạng GPLX:</span>
              <select value="B" disabled>
                <option value="B">Hạng B</option>
              </select>
            </label>
            <label className="sl-field">
              <span>Số báo danh:</span>
              <input
                className="sl-sbd"
                inputMode="numeric"
                value={sbd}
                maxLength={4}
                onChange={(e) => {
                  setSbd(e.target.value)
                  setChecked(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    check()
                  }
                }}
              />
            </label>
            <button type="button" className="sl-btn sl-check" onClick={check}>
              Kiểm tra thông tin thí sinh
            </button>
          </div>

          <div className="sl-info">
            <div className="sl-avatar" aria-hidden="true" />
            <dl>
              <dt>Họ tên:</dt>
              <dd>{checked ? candidateName(clean) : '-'}</dd>
              <dt>Ngày sinh:</dt>
              <dd>-</dd>
              <dt>Số CMT:</dt>
              <dd>-</dd>
              <dt>Địa chỉ:</dt>
              <dd>-</dd>
              <dt>Loại GPLX:</dt>
              <dd>{checked ? 'HẠNG B' : '-'}</dd>
            </dl>
            <p className="sl-note">
              CHÚ Ý: ĐÂY LÀ TỰ LUYỆN NÊN CHỌN SỐ BÁO DANH ĐỂ LUYỆN. KHI VÀO THI SÁT HẠCH NHẬP ĐÚNG SỐ BÁO DANH ĐƯỢC CẤP
              <br />
              ***TRÁNH NHẦM LẪN VỚI THI SÁT HẠCH***
            </p>
          </div>

          {warning && <p className="sl-warning" role="alert">{warning}</p>}

          <ul className="sl-rules">
            <li>{cfg.questionCount} câu, {cfg.durationMinutes} phút, đạt khi đúng từ {cfg.passScore} câu; sai câu điểm liệt là không đạt.</li>
            <li>Phím <kbd>1</kbd>–<kbd>4</kbd> bật/tắt ô đáp án, <kbd>Delete</kbd> bỏ đánh dấu, <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> chuyển câu, <kbd>Esc</kbd> kết thúc.</li>
            <li>Đánh dấu từ 2 ô trở lên ở một câu thì câu đó tính sai — giống phần mềm thật.</li>
          </ul>

          <div className="sl-actions">
            <button type="submit" className="sl-btn sl-start">Vào tập luyện</button>
            <a className="sl-btn" href={hrefFor({ name: 'progress' })}>Xem lại bài thi</a>
            <a className="sl-btn" href={hrefFor({ name: 'home' })}>Hủy bỏ</a>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExamRunner({
  engine,
  exam,
  onExamChange,
}: {
  engine: StudyEngine
  exam: ActiveExamView
  onExamChange: (e: ActiveExamView | null) => void
}) {
  const [index, setIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const sbd = readSbd()

  const toggle = (qIndex: number, key: OptionKey) => {
    engine.toggleExamOption(exam.questions[qIndex]!.id, key)
    onExamChange(engine.getActiveExam())
    setIndex(qIndex)
  }
  const clear = (qIndex: number) => {
    engine.clearExamAnswer(exam.questions[qIndex]!.id)
    onExamChange(engine.getActiveExam())
  }
  const submit = () => {
    const result = engine.submitExam()
    navigate({ name: 'examResult', id: result.id }, { replace: true })
  }

  return (
    <>
      <SatHachView
        questions={exam.questions}
        ticks={exam.answers}
        index={index}
        setIndex={setIndex}
        sbd={sbd}
        remainingMs={exam.remainingMs}
        durationMs={exam.endsAt - exam.startedAt}
        onToggle={toggle}
        onClear={clear}
        onEnd={() => setConfirming(true)}
        keysDisabled={confirming}
      />
      {confirming && (
        <ConfirmEnd
          onYes={submit}
          onNo={() => setConfirming(false)}
        />
      )}
    </>
  )
}

function ConfirmEnd({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onYes()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onNo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className="modal sh-modal" role="dialog" aria-modal="true" aria-label="Kết thúc thi">
      <div className="sh-dialog">
        <div className="sh-dialog-title">Kết thúc thi</div>
        <div className="sh-dialog-body">
          <span className="sh-dialog-icon" aria-hidden="true">?</span>
          <p>Bạn có muốn kết thúc phần thi?</p>
        </div>
        <div className="sh-dialog-actions">
          <button type="button" onClick={onYes} autoFocus>
            Có
          </button>
          <button type="button" onClick={onNo}>
            Không
          </button>
        </div>
      </div>
    </div>
  )
}

const DIGIT_TO_OPTION: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
const ROWS_PER_COLUMN = 15

export interface SatHachViewProps {
  questions: Question[]
  ticks: Readonly<Record<number, readonly OptionKey[]>>
  index: number
  setIndex: (i: number) => void
  sbd: string
  remainingMs: number
  durationMs: number
  onToggle?: (qIndex: number, key: OptionKey) => void
  onClear?: (qIndex: number) => void
  /** Nút KẾT THÚC (khi thi) hoặc Thoát (khi xem lại). */
  onEnd: () => void
  /** Có thì là chế độ xem lại bài: khoá ô đánh dấu, tô đỏ câu sai, hiện bảng đáp án. */
  review?: { correct: Readonly<Record<number, boolean>> }
  keysDisabled?: boolean
}

/** Màn hình thi (và xem lại bài) theo bố cục phần mềm tự luyện sát hạch. */
export function SatHachView({
  questions,
  ticks,
  index,
  setIndex,
  sbd,
  remainingMs,
  durationMs,
  onToggle,
  onClear,
  onEnd,
  review,
  keysDisabled,
}: SatHachViewProps) {
  const [zoomed, setZoomed] = useState(false)
  const total = questions.length
  const question = questions[index]!
  const totalSec = Math.max(1, Math.round(durationMs / 1000))
  const remainSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const pct = Math.floor((remainSec * 100) / totalSec)

  useEffect(() => {
    if (keysDisabled || zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'checkbox')) return
      const digit = e.code.startsWith('Numpad') ? e.code.slice(6) : e.key
      if (digit in DIGIT_TO_OPTION) {
        e.preventDefault()
        const opt = question.options[DIGIT_TO_OPTION[digit]!]
        if (opt && !review) onToggle?.(index, opt.key)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (!review) onClear?.(index)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        setIndex((index + 1) % total)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setIndex((index - 1 + total) % total)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onEnd()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="sathach">
      <div className="sh-frame">
        <div className="sh-left">
          <div className="sh-a1 sh-question-panel">
            <QuestionSheet question={question} onZoom={() => setZoomed(true)} />
          </div>

          <div className="sh-lower">
            <div className="sh-progress" role="progressbar" aria-label="Thời gian còn lại" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="sh-progress-fill" style={{ width: `${(remainSec * 100) / totalSec}%` }} />
              <span>{pct}%</span>
            </div>

            {review ? (
              <fieldset className="sh-review">
                <legend>Xem lại bài thi</legend>
                <div className="sh-review-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Câu hỏi</th>
                        <th>Câu 1</th>
                        <th>Câu 2</th>
                        <th>Câu 3</th>
                        <th>Câu 4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q, qi) => (
                        <tr key={q.id} className={qi === index ? 'is-current' : ''} onClick={() => setIndex(qi)}>
                          <td>Câu {qi + 1}</td>
                          {[0, 1, 2, 3].map((oi) => (
                            <td key={oi}>
                              {q.options[oi] && (
                                <input type="checkbox" readOnly tabIndex={-1} checked={q.options[oi]!.key === q.correctAnswer} aria-label={`Đáp án ${oi + 1}`} />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>
            ) : (
              <div className="sh-bottom">
                <fieldset className="sh-candidate">
                  <legend>Thông tin thí sinh</legend>
                  <div className="sh-candidate-row">
                    <span>SBD: {sbd}</span>
                    <span>Hạng: B</span>
                  </div>
                  <div>Họ và tên: {candidateName(sbd)}</div>
                  <div>Số CMT: </div>
                </fieldset>
                <div className="sh-a1 sh-brand">
                  <div>PHẦN MỀM TỰ LUYỆN BỘ 600 CÂU HỎI</div>
                  <div>600 CÂU HỎI · HẠNG B</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="sh-right">
          <div className="sh-a1 sh-timer">
            <span>THỜI GIAN CÒN LẠI:</span>
            <strong>{formatTime(remainingMs)}</strong>
          </div>
          <div className="sh-a1 sh-grid-panel">
            <ol
              className="sh-grid"
              role="radiogroup"
              aria-label="Chọn câu hỏi"
              style={{ gridTemplateRows: `repeat(${Math.min(ROWS_PER_COLUMN, total)}, minmax(0, 1fr))` }}
            >
              {questions.map((q, qi) => {
                const t = ticks[q.id] ?? []
                const state =
                  review && !review.correct[q.id] ? ' is-wrong' : t.length ? ' is-done' : ''
                return (
                  <li
                    key={q.id}
                    className={`sh-cell${state}${qi === index ? ' is-current' : ''}${review ? ' is-review' : ''}`}
                    onClick={() => setIndex(qi)}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={qi === index}
                      className="sh-cell-no"
                      tabIndex={qi === index ? 0 : -1}
                      aria-label={`Câu ${qi + 1}`}
                    >
                      {qi + 1}
                    </button>
                    <span className="sh-cell-opts">
                      {q.options.map((o, oi) => (
                        <label key={o.key} onClick={(e) => e.stopPropagation()}>
                          <span>{oi + 1}</span>
                          <input
                            type="checkbox"
                            tabIndex={-1}
                            disabled={!!review}
                            checked={t.includes(o.key)}
                            onChange={() => onToggle?.(qi, o.key)}
                            aria-label={`Câu ${qi + 1}, đáp án ${oi + 1}`}
                          />
                        </label>
                      ))}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
          <div className="sh-a1 sh-end-panel">
            <button type="button" className="sh-end" onClick={onEnd}>
              {review ? 'Thoát' : 'KẾT THÚC'}
            </button>
          </div>
        </aside>
      </div>
      <p className="sh-status">Phần thi kết thúc khi hết thời gian hoặc khi thí sinh nhấn "Kết thúc".</p>

      {zoomed && question.image && (
        <Lightbox src={imageUrl(question.image)} alt={`Hình câu ${index + 1}`} onClose={() => setZoomed(false)} />
      )}
    </div>
  )
}

/** Tờ câu hỏi: nền trắng, câu hỏi đỏ đậm, hình ở giữa, đáp án "1. …" xếp dọc — như ảnh câu hỏi của phần mềm. */
function QuestionSheet({ question, onZoom }: { question: Question; onZoom: () => void }) {
  return (
    <div className="sh-sheet">
      <div className="sh-sheet-inner">
        <p className="sh-q">{question.text}</p>
        {question.image && (
          <button type="button" className="sh-image" onClick={onZoom} aria-label="Phóng to hình">
            <img src={imageUrl(question.image)} alt="" />
          </button>
        )}
        <ol className="sh-options">
          {question.options.map((o, i) => (
            <li key={o.key}>
              {i + 1}. {o.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/** Dữ liệu cho chế độ xem lại bài từ kết quả đã chấm. */
export function reviewData(result: ExamResult) {
  const ticks: Record<number, OptionKey[]> = {}
  const correct: Record<number, boolean> = {}
  for (const it of result.items) {
    if (it.chosenKeys.length) ticks[it.question.id] = it.chosenKeys
    correct[it.question.id] = it.correct
  }
  return { questions: result.items.map((it) => it.question), ticks, correct }
}
