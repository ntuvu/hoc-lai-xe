import type { StudyEngine } from '../engine/engine'
import { hrefFor } from './route'

export function HomeScreen({ engine }: { engine: StudyEngine }) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Ôn thi GPLX hạng B</h1>
        <p className="muted">Chọn một chương để ôn.</p>
      </header>
      <ul className="chapter-list">
        {engine.listChapters().map((c) => (
          <li key={c.code}>
            <a className="chapter-card" href={hrefFor({ name: 'chapter', chapter: c.code })}>
              <span className="chapter-code">Chương {c.code}</span>
              <span className="chapter-title">{c.title}</span>
              <span className="chapter-count">{c.questionCount} câu</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
