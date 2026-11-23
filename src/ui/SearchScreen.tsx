import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { StudyEngine } from '../engine/engine'
import { highlightRanges, type SearchField } from '../engine/search'
import { hrefFor, navigate } from './route'
import { optionNumber } from './QuestionCard'

const LIMIT = 50

const FIELD_LABEL: Record<SearchField, string> = {
  text: 'đề',
  options: 'đáp án',
  explanation: 'giải thích',
  guide: 'giải thích dễ hiểu',
}

function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = highlightRanges(text, query)
  if (ranges.length === 0) return <>{text}</>
  const parts: ReactNode[] = []
  let pos = 0
  for (const [s, e] of ranges) {
    if (s > pos) parts.push(text.slice(pos, s))
    parts.push(<mark key={s}>{text.slice(s, e)}</mark>)
    pos = e
  }
  parts.push(text.slice(pos))
  return <>{parts}</>
}

export function SearchScreen({ engine, query: initial }: { engine: StudyEngine; query: string }) {
  const [query, setQuery] = useState(initial)
  const deferred = useDeferredValue(query)
  const hits = useMemo(() => engine.searchQuestions(deferred, LIMIT + 1), [engine, deferred])
  const shown = hits.slice(0, LIMIT)

  // Ghi query lên URL (replace) để back/refresh giữ kết quả.
  useEffect(() => {
    const t = setTimeout(() => navigate({ name: 'search', query: query.trim() }, { replace: true }), 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
      </nav>
      <h1>Tìm câu hỏi</h1>
      <form className="search-box" role="search" onSubmit={(e) => e.preventDefault()}>
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Gõ có dấu hoặc không dấu: toc do, nồng độ cồn, 123…"
          aria-label="Tìm câu hỏi"
        />
      </form>

      {deferred.trim() === '' ? (
        <p className="muted">Tìm trong đề, đáp án và giải thích của 600 câu. Gõ số để nhảy tới câu đó.</p>
      ) : shown.length === 0 ? (
        <p className="muted">Không có câu nào khớp “{deferred.trim()}”.</p>
      ) : (
        <>
          <p className="muted">
            {hits.length > LIMIT ? `Hơn ${LIMIT}` : shown.length} câu khớp
            {hits.length > LIMIT && ` · hiện ${LIMIT} câu đầu, thêm từ để thu hẹp`}
          </p>
          <ul className="card-list">
            {shown.map(({ question: q, fields }) => {
              const correct = q.options.find((o) => o.key === q.correctAnswer)
              return (
                <li key={q.id}>
                  <a
                    className="card search-hit"
                    href={hrefFor({ name: 'practice', filter: { kind: 'chapter', chapter: q.chapter }, questionId: q.id })}
                  >
                    <span className="muted">
                      Câu {q.id} · Chương {q.chapter}
                      {q.image && ' · 🖼️'}
                      {q.isPointDeduction && <span className="badge badge-danger">Điểm liệt</span>}
                    </span>
                    <strong className="search-hit-text">
                      <Highlight text={q.text} query={deferred} />
                    </strong>
                    {correct && (
                      <span className="search-hit-answer">
                        ✓ Ý {optionNumber(q, correct.key)}: <Highlight text={correct.text} query={deferred} />
                      </span>
                    )}
                    {!fields.includes('text') && (
                      <span className="muted search-hit-where">Khớp ở {fields.map((f) => FIELD_LABEL[f]).join(', ')}</span>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
