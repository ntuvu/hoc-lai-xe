import { useState } from 'react'
import type { OptionKey, Question } from '../engine/types'
import type { TipForQuestion } from '../engine/engine'
import { imageUrl } from './data'
import { Lightbox } from './Lightbox'
import { hrefFor } from './route'

export function optionNumber(q: Question, key: OptionKey): number {
  return q.options.findIndex((o) => o.key === key) + 1
}

interface QuestionCardProps {
  question: Question
  /** Hiện nhãn "Điểm liệt" (không hiện khi đang thi). */
  showPointDeduction: boolean
  chosen: OptionKey | null
  /** Đã chấm (hiện đúng/sai). */
  revealed: boolean
  disabled?: boolean
  onChoose?: (key: OptionKey) => void
  children?: React.ReactNode
}

export function QuestionCard({ question, showPointDeduction, chosen, revealed, disabled, onChoose, children }: QuestionCardProps) {
  const [zoomed, setZoomed] = useState(false)
  const image = question.image ? { src: imageUrl(question.image), alt: `Hình câu ${question.id}` } : null

  return (
    <article className="question">
      <div className="question-head">
        <h2 className="question-number">Câu {question.id}</h2>
        {showPointDeduction && question.isPointDeduction && <span className="badge badge-danger">Điểm liệt</span>}
      </div>
      <p className="question-text">{question.text}</p>
      {image && (
        <button type="button" className="question-image" onClick={() => setZoomed(true)} aria-label="Phóng to hình">
          <img src={image.src} alt={image.alt} />
        </button>
      )}
      <ol className="options">
        {question.options.map((o, i) => {
          const state = revealed
            ? o.key === question.correctAnswer
              ? 'is-correct'
              : o.key === chosen
                ? 'is-wrong'
                : 'is-dim'
            : o.key === chosen
              ? 'is-chosen'
              : ''
          return (
            <li key={o.key}>
              <button
                type="button"
                className={`option ${state}`}
                disabled={disabled || revealed}
                aria-pressed={o.key === chosen}
                onClick={() => onChoose?.(o.key)}
              >
                <span className="option-index">{i + 1}</span>
                <span>{o.text}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {children}
      {zoomed && image && <Lightbox src={image.src} alt={image.alt} onClose={() => setZoomed(false)} />}
    </article>
  )
}

export function AnswerFeedback({ question, chosen }: { question: Question; chosen: OptionKey | null }) {
  const correct = chosen === question.correctAnswer
  return (
    <section className={`feedback ${correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
      <strong>
        {correct
          ? 'Đúng!'
          : `${chosen ? 'Sai' : 'Chưa trả lời'}. Đáp án đúng là ý ${optionNumber(question, question.correctAnswer)}.`}
      </strong>
      {question.explanation && <p>{question.explanation}</p>}
    </section>
  )
}

export function GuideBox({ question }: { question: Question }) {
  const g = question.guide
  if (!g) return null
  return (
    <section className="guide" aria-label="Giải thích dễ hiểu">
      <h3>💡 Hiểu nhanh</h3>
      <p>{g.easy}</p>
      <div className="guide-picture" aria-label="Minh họa">{g.picture}</div>
      <p className="guide-remember">
        <strong>Nhớ:</strong> {g.remember}
      </p>
    </section>
  )
}

const STATUS_LABEL = { applies: 'Áp dụng', exception: 'Ngoại lệ', ambiguous: 'Mơ hồ' } as const

/** Danh sách mẹo của một câu. `revealed=false` (trước khi trả lời) thì ẩn đáp án trong lý do ngoại lệ. */
export function TipList({ question, tips, revealed }: { question: Question; tips: TipForQuestion[]; revealed: boolean }) {
  if (!tips.length) return <p className="muted tips-empty">Câu này chưa có mẹo.</p>
  const conflicting = tips.some((t) => t.recommended)
  return (
    <section className="tips" aria-label="Mẹo">
      <h3>Mẹo</h3>
      {conflicting && <p className="muted">Các mẹo ở câu này cho kết quả khác nhau — theo mẹo được đánh dấu ★.</p>}
      <ul>
        {tips.map((t) => (
          <li key={`${t.tip.id}-${t.status}`} className={`tip tip-${t.status}`}>
            <div className="tip-head">
              {t.recommended && <span className="badge badge-accent" title="Mẹo nên theo">★ Nên theo</span>}
              <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
              {t.tip.confidence === 'low' && <span className="badge badge-warn">Độ tin cậy thấp</span>}
              <a className="tip-title" href={hrefFor({ name: 'tip', tipId: t.tip.id })}>
                {t.tip.title}
              </a>
            </div>
            <p className="tip-rule">{t.tip.rule}</p>
            {t.status === 'applies' && t.tipAnswer && revealed && (
              <p className="tip-note">Mẹo chỉ ra ý {optionNumber(question, t.tipAnswer)} — đúng.</p>
            )}
            {t.status === 'exception' && (
              <p className="tip-note warn">
                ⚠️ Câu này là <strong>ngoại lệ</strong>: mẹo cho sai đáp án.
                {revealed && t.note ? ` ${t.note}` : ' Đừng áp dụng mẹo này máy móc.'}
              </p>
            )}
            {t.status === 'ambiguous' && (
              <p className="tip-note warn">
                ⚠️ Mẹo không phân biệt được đáp án, đọc kỹ đáp án.{revealed && t.note ? ` ${t.note}` : ''}
              </p>
            )}
            {t.tip.confidence === 'low' && (
              <p className="tip-note muted">Độ tin cậy thấp, chỉ dùng khi không còn mẹo nào khác.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
