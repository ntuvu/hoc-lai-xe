import type { StudyEngine } from '../engine/engine'
import type { QuestionTip } from '../engine/types'
import { hrefFor } from './route'
import { optionNumber } from './QuestionCard'

export function TipsScreen({ engine }: { engine: StudyEngine }) {
  const tips = engine.listTips()
  const questionTips = tips.filter((t): t is QuestionTip => t.scope === 'question')
  const groups = [
    { title: 'Mẹo chung (mẹo.txt)', items: questionTips.filter((t) => !t.id.startsWith('dl-')) },
    { title: 'Mẹo điểm liệt (điểm-liệt.txt)', items: questionTips.filter((t) => t.id.startsWith('dl-')) },
  ]
  const chapterTips = tips.filter((t) => t.scope === 'chapter')

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
        <span className="muted">{tips.length} mẹo</span>
      </nav>
      <h1>Học theo mẹo</h1>
      {groups.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          <ul className="card-list">
            {g.items.map((t) => (
              <li key={t.id}>
                <a className="card tip-card" href={hrefFor({ name: 'tip', tipId: t.id })}>
                  <strong>{t.title}</strong>
                  <span className="muted">
                    {t.appliesTo.length} câu áp dụng
                    {t.exceptions.length > 0 && ` · ${t.exceptions.length} ngoại lệ`}
                    {t.ambiguous.length > 0 && ` · ${t.ambiguous.length} mơ hồ`}
                  </span>
                  {t.confidence === 'low' && <span className="badge badge-warn">Độ tin cậy thấp</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section>
        <h2>Mẹo phải nhìn hình (chương V, VI)</h2>
        <ul className="card-list">
          {chapterTips.map((t) => (
            <li key={t.id} className="card">
              <strong>
                {t.title} <span className="muted">· Chương {t.scope === 'chapter' && t.chapter}</span>
              </strong>
              <p>{t.rule}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export function TipDetailScreen({ engine, tipId }: { engine: StudyEngine; tipId: string }) {
  const tip = engine.getTip(tipId)
  if (!tip) {
    return (
      <main className="page">
        <a href={hrefFor({ name: 'tips' })}>← Mẹo</a>
        <p className="muted">Không tìm thấy mẹo.</p>
      </main>
    )
  }
  const entries = engine.listTipQuestions(tipId)
  const question = (id: number) => engine.getQuestion(id)!

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'tips' })}>← Danh sách mẹo</a>
      </nav>
      <article className="card">
        <h1>{tip.title}</h1>
        {tip.confidence === 'low' && (
          <p className="banner warn">Độ tin cậy thấp, chỉ dùng khi không còn mẹo nào khác.</p>
        )}
        <p>{tip.rule}</p>
        <p className="muted">Nguồn: {tip.source}</p>
        {tip.scope === 'question' && entries.length > 0 && (
          <a className="button primary" href={hrefFor({ name: 'practice', filter: { kind: 'tip', tipId } })}>
            Ôn {entries.length} câu của mẹo này
          </a>
        )}
      </article>

      {tip.scope === 'question' && (
        <>
          {tip.exceptions.length > 0 && (
            <section>
              <h2>Ngoại lệ ({tip.exceptions.length})</h2>
              <ul className="card-list">
                {tip.exceptions.map((e) => (
                  <li key={e.id} className="card tip-exception">
                    <a href={hrefFor({ name: 'practice', filter: { kind: 'tip', tipId }, questionId: e.id })}>
                      Câu {e.id}
                    </a>
                    : mẹo chỉ ý {optionNumber(question(e.id), e.tipAnswer)}, đúng là ý{' '}
                    {optionNumber(question(e.id), e.correctAnswer)}. {e.reason}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {tip.ambiguous.length > 0 && (
            <section>
              <h2>Câu mơ hồ ({tip.ambiguous.length})</h2>
              <ul className="card-list">
                {tip.ambiguous.map((m) => (
                  <li key={m.id} className="card">
                    <a href={hrefFor({ name: 'practice', filter: { kind: 'tip', tipId }, questionId: m.id })}>
                      Câu {m.id}
                    </a>
                    : {m.note}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h2>Câu áp dụng ({tip.appliesTo.length})</h2>
            <p className="chips">
              {tip.appliesTo.map((a) => (
                <a key={a.id} className="chip" href={hrefFor({ name: 'practice', filter: { kind: 'tip', tipId }, questionId: a.id })}>
                  {a.id}
                </a>
              ))}
            </p>
          </section>
        </>
      )}
    </main>
  )
}
