import { useState } from 'react'
import type { ExamResult, StudyEngine } from '../engine/engine'
import { hrefFor, navigate } from './route'
import { candidateName, readSbd, reviewData, SatHachView } from './ExamScreen'
import { useQuestionKeys } from './useQuestionKeys'
import { AnswerFeedback, GuideBox, QuestionCard, TipList } from './QuestionCard'

type View = 'dialog' | 'review' | 'details'

/**
 * Sau khi nộp bài: như phần mềm tự luyện, hộp "Kết quả thi thí sinh" hiện đè lên màn hình thi
 * (đã khoá, câu sai tô đỏ). "Xem bài thi và đáp án" mở chế độ xem lại; "Kết thúc" về trang chủ.
 */
export function ExamResultScreen({ engine, id }: { engine: StudyEngine; id: string }) {
  const result = engine.examResult(id)
  const [view, setView] = useState<View>('dialog')
  const [index, setIndex] = useState(0)

  if (!result) {
    return (
      <main className="page">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <p className="muted">Không tìm thấy kết quả thi này.</p>
      </main>
    )
  }

  if (view === 'details') return <ExamDetails engine={engine} result={result} onBack={() => setView('dialog')} />

  const data = reviewData(result)
  return (
    <>
      <SatHachView
        questions={data.questions}
        ticks={data.ticks}
        index={index}
        setIndex={setIndex}
        sbd={readSbd()}
        remainingMs={Math.max(0, result.startedAt + engine.examConfig.durationMinutes * 60_000 - result.submittedAt)}
        durationMs={engine.examConfig.durationMinutes * 60_000}
        onEnd={() => setView('dialog')}
        review={{ correct: data.correct }}
        keysDisabled={view === 'dialog'}
      />
      {view === 'dialog' && (
        <ResultDialog engine={engine} result={result} onReview={() => setView('review')} onDetails={() => setView('details')} />
      )}
    </>
  )
}

function ResultDialog({
  engine,
  result,
  onReview,
  onDetails,
}: {
  engine: StudyEngine
  result: ExamResult
  onReview: () => void
  onDetails: () => void
}) {
  const sbd = readSbd()
  const unanswered = result.items.filter((it) => it.chosenKeys.length === 0).length
  const wrongCount = result.total - result.correctCount - unanswered
  const failedPointNo = result.items.findIndex((it) => it.question.isPointDeduction && !it.correct) + 1

  return (
    <div className="modal sh-modal" role="dialog" aria-modal="true" aria-label="Kết quả thi thí sinh">
      <section className="kq">
        <div className="kq-title">
          <span>Kết quả thi thí sinh</span>
          <button type="button" className="kq-close" aria-label="Kết thúc" onClick={() => navigate({ name: 'home' })}>
            ×
          </button>
        </div>
        <div className="kq-body">
          <fieldset className="kq-info">
            <legend>Thông tin thí sinh</legend>
            <div className="kq-avatar" aria-hidden="true" />
            <dl>
              <dt>Số báo danh:</dt>
              <dd>{sbd}</dd>
              <dt>Họ tên:</dt>
              <dd>{candidateName(sbd)}</dd>
              <dt>Ngày sinh:</dt>
              <dd>-</dd>
              <dt>Địa chỉ:</dt>
              <dd>-</dd>
              <dt>Số CMT:</dt>
              <dd>-</dd>
            </dl>
            <p className="kq-hang">
              Hạng GPLX: <b>B</b>
            </p>
          </fieldset>
          <fieldset className="kq-score">
            <legend>Kết quả thi</legend>
            <dl>
              <dt>SỐ CÂU TRẢ LỜI ĐÚNG:</dt>
              <dd>{result.correctCount}</dd>
              <dt>SỐ CÂU TRẢ LỜI SAI:</dt>
              <dd>{wrongCount}</dd>
              <dt>SỐ CÂU CHƯA TRẢ LỜI:</dt>
              <dd>{unanswered}</dd>
            </dl>
            <p className="kq-verdict">
              KẾT QUẢ: <b className={result.passed ? 'is-pass' : 'is-fail'}>{result.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b>
            </p>
            {!result.passed && (
              <p className="kq-reason">
                Lý do trượt:{' '}
                {result.failedByPointDeduction
                  ? `Trả lời sai Câu mất an toàn giao thông nghiêm trọng, câu số: ${failedPointNo}`
                  : `Không đủ ${engine.examConfig.passScore}/${result.total} câu đúng.`}
              </p>
            )}
          </fieldset>
        </div>
        <div className="kq-actions">
          <button type="button" onClick={onDetails}>Giải thích từng câu</button>
          <button type="button" className="kq-review" onClick={onReview} autoFocus>
            Xem bài thi và đáp án
          </button>
          <a href={hrefFor({ name: 'exam' })}>Thi đề khác</a>
          <a href={hrefFor({ name: 'home' })}>Kết thúc</a>
        </div>
        <p className="kq-note">Bài thi đã được lưu; các câu sai đã đưa vào danh sách ôn câu sai.</p>
      </section>
    </div>
  )
}

/** Xem lại từng câu kèm giải thích, mẹo (phần thêm của web app, phần mềm gốc không có). */
function ExamDetails({ engine, result, onBack }: { engine: StudyEngine; result: ExamResult; onBack: () => void }) {
  const [index, setIndex] = useState<number | null>(null)
  const count = result.items.length
  useQuestionKeys({
    onPrev: () => setIndex((i) => (i === null ? 0 : Math.max(0, i - 1))),
    onNext: () => setIndex((i) => (i === null ? 0 : Math.min(count - 1, i + 1))),
  })
  const item = index === null ? null : result.items[index]!

  return (
    <main className="page">
      <nav className="topbar">
        <button type="button" className="link-button" onClick={onBack}>← Kết quả thi</button>
        <a href={hrefFor({ name: 'exam' })}>Thi đề khác →</a>
      </nav>

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
          {item.chosenKeys.length > 1 && (
            <p className="kq-multi">Câu này bạn đánh dấu {item.chosenKeys.length} ô nên bị tính sai.</p>
          )}
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
