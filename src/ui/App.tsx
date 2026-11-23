import { useEffect, useMemo, useState } from 'react'
import { createStudyEngine, type StudyEngine } from '../engine/engine'
import type { Question, Tip } from '../engine/types'
import { loadQuestions, loadTips, localStorageAdapter } from './data'
import { routeKey, useRoute, type Route } from './route'
import { HomeScreen } from './HomeScreen'
import { PracticeScreen } from './PracticeScreen'
import { ExamScreen } from './ExamScreen'
import { ExamResultScreen } from './ExamResultScreen'
import { TipDetailScreen, TipsScreen } from './TipsScreen'
import { ProgressScreen } from './ProgressScreen'
import { SettingsScreen } from './SettingsScreen'
import { SearchScreen } from './SearchScreen'

function Screen({ engine, route }: { engine: StudyEngine; route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomeScreen engine={engine} />
    case 'practice':
      return <PracticeScreen engine={engine} filter={route.filter} questionId={route.questionId} />
    case 'exam':
      return <ExamScreen engine={engine} />
    case 'examResult':
      return <ExamResultScreen engine={engine} id={route.id} />
    case 'tips':
      return <TipsScreen engine={engine} />
    case 'tip':
      return <TipDetailScreen engine={engine} tipId={route.tipId} />
    case 'progress':
      return <ProgressScreen engine={engine} />
    case 'settings':
      return <SettingsScreen engine={engine} />
    case 'search':
      return <SearchScreen engine={engine} query={route.query} />
  }
}

export function App() {
  const [data, setData] = useState<{ questions: Question[]; tips: Tip[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const route = useRoute()
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    const on = () => setUpdateReady(true)
    window.addEventListener('app-update-ready', on)
    return () => window.removeEventListener('app-update-ready', on)
  }, [])

  useEffect(() => {
    Promise.all([loadQuestions(), loadTips()]).then(
      ([questions, tips]) => setData({ questions, tips }),
      (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    )
  }, [])

  const engine = useMemo(
    () => (data ? createStudyEngine({ questions: data.questions, tips: data.tips, storage: localStorageAdapter }) : null),
    [data],
  )

  if (error) return <main className="page"><p className="error">{error}</p></main>
  if (!engine) return <main className="page"><p className="muted">Đang tải câu hỏi…</p></main>

  return (
    <>
      {updateReady && (
        <div className="update-bar" role="status">
          Có bản mới của app.{' '}
          <button type="button" className="small" onClick={() => location.reload()}>
            Tải lại
          </button>
        </div>
      )}
      <Screen key={routeKey(route)} engine={engine} route={route} />
    </>
  )
}
