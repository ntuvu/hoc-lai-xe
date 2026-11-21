import type { StudyEngine } from '../engine/engine'
import { hrefFor } from './route'

const dateFmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

export function ProgressSummary({ engine }: { engine: StudyEngine }) {
  const stats = engine.chapterStats()
  const answered = stats.reduce((s, c) => s + c.answered, 0)
  const total = stats.reduce((s, c) => s + c.total, 0)
  const pd = engine.pointDeductionMastery()
  const history = engine.examHistory()
  const last = history[history.length - 1]
  return (
    <a className="card summary" href={hrefFor({ name: 'progress' })}>
      <span>
        <strong>{answered}</strong>/{total} câu đã làm
      </span>
      <span>
        Điểm liệt: <strong>{pd.mastered}</strong>/{pd.total} đã thuộc
      </span>
      <span>
        Câu sai: <strong>{engine.wrongCount()}</strong>
      </span>
      {last && (
        <span>
          Thi gần nhất: <strong>{last.correctCount}/{last.total}</strong> {last.passed ? '✅ Đạt' : '❌ Trượt'}
        </span>
      )}
      <span className="muted">Xem tiến độ →</span>
    </a>
  )
}

function Bar({ value, total, wrong = 0 }: { value: number; total: number; wrong?: number }) {
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%`
  return (
    <div className="bar" role="img" aria-label={`${value} đúng, ${wrong} sai trên ${total}`}>
      <span className="bar-ok" style={{ width: pct(value) }} />
      <span className="bar-bad" style={{ width: pct(wrong) }} />
    </div>
  )
}

export function ProgressScreen({ engine }: { engine: StudyEngine }) {
  const stats = engine.chapterStats()
  const pd = engine.pointDeductionMastery()
  const history = [...engine.examHistory()].reverse()

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <a href={hrefFor({ name: 'settings' })}>Sao lưu / reset</a>
      </nav>
      <h1>Tiến độ</h1>

      <section className="card">
        <h2>Theo chương</h2>
        <table className="stats">
          <thead>
            <tr>
              <th>Chương</th>
              <th>Đã làm</th>
              <th>Đúng</th>
              <th>Sai</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((c) => (
              <tr key={c.code}>
                <td>
                  <a href={hrefFor({ name: 'practice', filter: { kind: 'chapter', chapter: c.code } })}>{c.code}</a>
                  <Bar value={c.correct} wrong={c.wrong} total={c.total} />
                </td>
                <td>
                  {c.answered}/{c.total}
                </td>
                <td className="ok">{c.correct}</td>
                <td className="bad">{c.wrong}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Đúng/sai tính theo lần trả lời gần nhất của mỗi câu.</p>
      </section>

      <section className="card">
        <h2>60 câu điểm liệt</h2>
        <p>
          Đã thuộc <strong>{pd.mastered}</strong>/{pd.total} ({Math.round((pd.mastered / pd.total) * 100)}%)
        </p>
        <Bar value={pd.mastered} total={pd.total} />
        <p className="muted">"Đã thuộc" = đã làm, lần gần nhất đúng và không nằm trong danh sách câu sai.</p>
      </section>

      <section className="card">
        <h2>Câu sai</h2>
        <p>
          Còn <strong>{engine.wrongCount()}</strong> câu trong danh sách.{' '}
          <a href={hrefFor({ name: 'practice', filter: { kind: 'wrong' } })}>Ôn câu sai →</a>
        </p>
      </section>

      <section className="card">
        <h2>Lịch sử thi thử</h2>
        {history.length === 0 ? (
          <p className="muted">Chưa thi lần nào.</p>
        ) : (
          <table className="stats">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Điểm</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>
                    <a href={hrefFor({ name: 'examResult', id: h.id })}>{dateFmt.format(h.submittedAt)}</a>
                  </td>
                  <td>
                    {h.correctCount}/{h.total}
                  </td>
                  <td className={h.passed ? 'ok' : 'bad'}>
                    {h.passed ? 'Đạt' : h.failedByPointDeduction ? 'Trượt (sai điểm liệt)' : 'Trượt'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
