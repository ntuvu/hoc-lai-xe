import { useState, type FormEvent } from 'react'
import type { StudyEngine } from '../engine/engine'
import type { ChapterCode, OptionKey } from '../engine/types'
import { hrefFor, navigate } from './route'
import { imageUrl } from './data'
import { Lightbox } from './Lightbox'

interface Props {
  engine: StudyEngine
  chapter: ChapterCode
  questionId?: number
}

export function PracticeScreen({ engine, chapter, questionId }: Props) {
  const filter = { chapter }
  const questions = engine.listQuestions(filter)
  const found = questionId === undefined ? -1 : engine.locateQuestion(filter, questionId)
  const index = found >= 0 ? found : 0
  const question = questions[index]
  const [answers, setAnswers] = useState<Record<number, OptionKey>>({})
  const [zoomed, setZoomed] = useState(false)
  const [jumpValue, setJumpValue] = useState('')
  const [jumpError, setJumpError] = useState<string | null>(null)

  if (!question) {
    return (
      <main className="page">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <p className="muted">Chương này chưa có câu hỏi.</p>
      </main>
    )
  }

  const image = question.image ? { src: imageUrl(question.image), alt: `Hình câu ${question.id}` } : null
  const chosen = answers[question.id]
  const result = chosen ? engine.checkAnswer(question.id, chosen) : null

  const goTo = (i: number) => navigate({ name: 'chapter', chapter, questionId: questions[i]!.id })

  const onJump = (e: FormEvent) => {
    e.preventDefault()
    const value = jumpValue.trim()
    if (!value) return
    const target = /^\d+$/.test(value) ? engine.locateQuestion(filter, Number(value)) : -1
    if (target < 0) {
      setJumpError(`Chương ${chapter} không có câu số ${value}`)
      return
    }
    setJumpError(null)
    setJumpValue('')
    goTo(target)
  }

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <span className="muted">
          Chương {chapter} · {index + 1}/{questions.length}
        </span>
      </nav>

      <article className="question">
        <h2 className="question-number">Câu {question.id}</h2>
        <p className="question-text">{question.text}</p>
        {image && (
          <button type="button" className="question-image" onClick={() => setZoomed(true)} aria-label="Phóng to hình">
            <img src={image.src} alt={image.alt} />
          </button>
        )}

        <ol className="options">
          {question.options.map((o, i) => {
            const state = !result
              ? ''
              : o.key === result.correctAnswer
                ? 'is-correct'
                : o.key === chosen
                  ? 'is-wrong'
                  : 'is-dim'
            return (
              <li key={o.key}>
                <button
                  type="button"
                  className={`option ${state}`}
                  disabled={!!result}
                  onClick={() => setAnswers((a) => ({ ...a, [question.id]: o.key }))}
                >
                  <span className="option-index">{i + 1}</span>
                  <span>{o.text}</span>
                </button>
              </li>
            )
          })}
        </ol>

        {result && (
          <section className={`feedback ${result.correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
            <strong>{result.correct ? 'Đúng!' : `Sai. Đáp án đúng là ý ${optionNumber(question.options, result.correctAnswer)}.`}</strong>
            {question.explanation && <p>{question.explanation}</p>}
          </section>
        )}
      </article>

      <footer className="pager">
        <button type="button" disabled={index === 0} onClick={() => goTo(index - 1)}>
          ← Câu trước
        </button>
        <form className="jump" onSubmit={onJump}>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Số câu"
            aria-label="Nhảy đến số câu"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
          />
          <button type="submit">Đi</button>
        </form>
        <button type="button" disabled={index === questions.length - 1} onClick={() => goTo(index + 1)}>
          Câu sau →
        </button>
      </footer>
      {jumpError && <p className="error">{jumpError}</p>}

      {zoomed && image && (
        <Lightbox src={image.src} alt={image.alt} onClose={() => setZoomed(false)} />
      )}
    </main>
  )
}

function optionNumber(options: { key: OptionKey }[], key: OptionKey): number {
  return options.findIndex((o) => o.key === key) + 1
}
