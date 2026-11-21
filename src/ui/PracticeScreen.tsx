import { useEffect, useState, type FormEvent } from 'react'
import type { QuestionFilter, StudyEngine } from '../engine/engine'
import type { OptionKey, Question } from '../engine/types'
import { hrefFor, navigate } from './route'
import { AnswerFeedback, GuideBox, QuestionCard, TipList } from './QuestionCard'

interface Props {
  engine: StudyEngine
  filter: QuestionFilter
  questionId?: number
}

export function filterTitle(engine: StudyEngine, filter: QuestionFilter): string {
  switch (filter.kind) {
    case 'chapter':
      return `Chương ${filter.chapter}`
    case 'pointDeduction':
      return '60 câu điểm liệt'
    case 'wrong':
      return 'Ôn câu sai'
    case 'tip':
      return `Mẹo: ${engine.getTip(filter.tipId)?.title ?? filter.tipId}`
  }
}

export function PracticeScreen({ engine, filter, questionId }: Props) {
  // Danh sách câu sai thay đổi khi trả lời; giữ cố định trong một lượt ôn để không bị nhảy câu.
  const [frozen] = useState<Question[] | null>(() => (filter.kind === 'wrong' ? engine.listQuestions(filter) : null))
  const [, setVersion] = useState(0)
  const rerender = () => setVersion((v) => v + 1)
  const questions = frozen ?? engine.listQuestions(filter)

  const [answers, setAnswers] = useState<Record<number, OptionKey>>({})
  const [tipsOpen, setTipsOpen] = useState(false)
  const [tab, setTab] = useState<'questions' | 'chapterTips'>('questions')
  const [jumpValue, setJumpValue] = useState('')
  const [jumpError, setJumpError] = useState<string | null>(null)

  const found = questionId === undefined ? -1 : questions.findIndex((q) => q.id === questionId)
  const saved = engine.getPosition(filter)
  const restored = found < 0 && saved !== undefined ? questions.findIndex((q) => q.id === saved) : -1
  const index = found >= 0 ? found : restored >= 0 ? restored : 0
  const question = questions[index]

  useEffect(() => {
    if (question) engine.setPosition(filter, question.id)
    setTipsOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id])

  const title = filterTitle(engine, filter)
  const chapterTips = filter.kind === 'chapter' ? engine.getChapterTips(filter.chapter) : []

  if (!question) {
    return (
      <main className="page">
        <nav className="topbar">
          <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
          <span className="muted">{title}</span>
        </nav>
        <p className="empty">
          {filter.kind === 'wrong'
            ? '🎉 Danh sách câu sai đang trống. Câu nào bạn trả lời sai sẽ xuất hiện ở đây.'
            : 'Không có câu hỏi nào.'}
        </p>
      </main>
    )
  }

  const chosen = answers[question.id] ?? null
  const revealed = chosen !== null
  const tips = engine.getTipsForQuestion(question.id)
  const tipStatus = filter.kind === 'tip' ? tips.find((t) => t.tip.id === filter.tipId)?.status : undefined

  const goTo = (i: number) => navigate({ name: 'practice', filter, questionId: questions[i]!.id })

  const choose = (key: OptionKey) => {
    engine.recordAnswer(question.id, key)
    setAnswers((a) => ({ ...a, [question.id]: key }))
  }

  const onJump = (e: FormEvent) => {
    e.preventDefault()
    const value = jumpValue.trim()
    if (!value) return
    const target = /^\d+$/.test(value) ? questions.findIndex((q) => q.id === Number(value)) : -1
    if (target < 0) {
      setJumpError(`${title} không có câu số ${value}`)
      return
    }
    setJumpError(null)
    setJumpValue('')
    goTo(target)
  }

  return (
    <main className="page">
      <nav className="topbar">
        <a href={filter.kind === 'tip' ? hrefFor({ name: 'tip', tipId: filter.tipId }) : hrefFor({ name: 'home' })}>
          ← {filter.kind === 'tip' ? 'Mẹo' : 'Trang chủ'}
        </a>
        <span className="muted">
          {title} · {index + 1}/{questions.length}
          {filter.kind === 'wrong' && ` · còn ${engine.wrongCount()} câu sai`}
        </span>
      </nav>

      <div className="toolbar">
        {filter.kind !== 'wrong' && (
          <label className="switch">
            <input
              type="checkbox"
              checked={engine.isShuffled(filter)}
              onChange={(e) => {
                engine.setShuffled(filter, e.target.checked)
                rerender()
              }}
            />
            Ngẫu nhiên
          </label>
        )}
        {chapterTips.length > 0 && (
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'questions'} onClick={() => setTab('questions')}>
              Câu hỏi
            </button>
            <button type="button" role="tab" aria-selected={tab === 'chapterTips'} onClick={() => setTab('chapterTips')}>
              Mẹo chương này
            </button>
          </div>
        )}
      </div>

      {tab === 'chapterTips' ? (
        <section className="chapter-tips">
          <p className="muted">Các mẹo phải nhìn hình (biển báo, vạch kẻ, sa hình). Chưa gắn vào từng câu.</p>
          <ul className="card-list">
            {chapterTips.map((t) => (
              <li key={t.id} className="card">
                <strong>{t.title}</strong>
                <p>{t.rule}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {tipStatus === 'exception' && (
            <p className="banner warn">⚠️ Câu này là ngoại lệ của mẹo đang học — mẹo cho sai đáp án.</p>
          )}
          {tipStatus === 'ambiguous' && (
            <p className="banner warn">⚠️ Mẹo đang học không phân biệt được đáp án ở câu này.</p>
          )}
          <QuestionCard question={question} showPointDeduction chosen={chosen} revealed={revealed} onChoose={choose}>
            {!revealed && tips.length > 0 && (
              <button type="button" className="link-button" onClick={() => setTipsOpen((o) => !o)}>
                {tipsOpen ? 'Ẩn mẹo' : `Xem mẹo (${tips.length})`}
              </button>
            )}
            {!revealed && tipsOpen && <TipList question={question} tips={tips} revealed={false} />}
            {revealed && (
              <>
                <AnswerFeedback question={question} chosen={chosen} />
                <GuideBox question={question} />
                <TipList question={question} tips={tips} revealed />
              </>
            )}
          </QuestionCard>

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
        </>
      )}
    </main>
  )
}
