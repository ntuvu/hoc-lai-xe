import { useEffect, useMemo, useState } from 'react'
import { createStudyEngine, type StudyEngine } from '../engine/engine'
import { loadQuestions } from './data'
import { useRoute } from './route'
import { HomeScreen } from './HomeScreen'
import { PracticeScreen } from './PracticeScreen'
import type { Question } from '../engine/types'

export function App() {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const route = useRoute()

  useEffect(() => {
    loadQuestions().then(setQuestions, (e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const engine: StudyEngine | null = useMemo(
    () => (questions ? createStudyEngine({ questions }) : null),
    [questions],
  )

  if (error) return <main className="page"><p className="error">{error}</p></main>
  if (!engine) return <main className="page"><p className="muted">Đang tải câu hỏi…</p></main>

  return route.name === 'chapter' ? (
    <PracticeScreen
      key={route.chapter}
      engine={engine}
      chapter={route.chapter}
      questionId={route.questionId}
    />
  ) : (
    <HomeScreen engine={engine} />
  )
}
