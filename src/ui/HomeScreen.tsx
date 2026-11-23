import type { StudyEngine } from '../engine/engine'
import { hrefFor, navigate } from './route'
import { ProgressSummary } from './ProgressScreen'

export function HomeScreen({ engine }: { engine: StudyEngine }) {
  const active = engine.getActiveExam()
  return (
    <main className="page">
      <header className="page-header">
        <h1>Ôn thi GPLX hạng B</h1>
        <p className="muted">600 câu · mẹo đã kiểm chứng · thi thử đúng cấu trúc đề thật</p>
      </header>

      <ProgressSummary engine={engine} />

      <form
        className="search-box"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          const q = new FormData(e.currentTarget).get('q')?.toString().trim() ?? ''
          navigate({ name: 'search', query: q })
        }}
      >
        <input name="q" type="search" placeholder="🔍 Tìm câu hỏi: tốc độ, nồng độ cồn, số câu…" aria-label="Tìm câu hỏi" />
      </form>

      <ul className="mode-list">
        <li>
          <a className="mode-card is-primary" href={hrefFor({ name: 'exam' })}>
            <span className="mode-icon">📝</span>
            <span>
              <strong>{active ? 'Tiếp tục bài thi' : 'Thi thử'}</strong>
              <span className="muted">
                {engine.examConfig.questionCount} câu · {engine.examConfig.durationMinutes} phút
              </span>
            </span>
          </a>
        </li>
        <li>
          <a className="mode-card" href={hrefFor({ name: 'practice', filter: { kind: 'pointDeduction' } })}>
            <span className="mode-icon">⛔</span>
            <span>
              <strong>60 câu điểm liệt</strong>
              <span className="muted">Sai là trượt</span>
            </span>
          </a>
        </li>
        <li>
          <a className="mode-card" href={hrefFor({ name: 'practice', filter: { kind: 'wrong' } })}>
            <span className="mode-icon">🔁</span>
            <span>
              <strong>Ôn câu sai</strong>
              <span className="muted">Còn {engine.wrongCount()} câu</span>
            </span>
          </a>
        </li>
        <li>
          <a className="mode-card" href={hrefFor({ name: 'tips' })}>
            <span className="mode-icon">💡</span>
            <span>
              <strong>Học theo mẹo</strong>
              <span className="muted">{engine.listTips().length} mẹo</span>
            </span>
          </a>
        </li>
      </ul>

      <h2>Ôn theo chương</h2>
      <ul className="chapter-list">
        {engine.listChapters().map((c) => (
          <li key={c.code}>
            <a className="chapter-card" href={hrefFor({ name: 'practice', filter: { kind: 'chapter', chapter: c.code } })}>
              <span className="chapter-code">Chương {c.code}</span>
              <span className="chapter-title">{c.title}</span>
              <span className="chapter-count">{c.questionCount} câu</span>
            </a>
          </li>
        ))}
      </ul>

      <footer className="home-footer">
        <a href={hrefFor({ name: 'progress' })}>Tiến độ</a>
        <a href={hrefFor({ name: 'settings' })}>Cài đặt</a>
      </footer>
    </main>
  )
}
