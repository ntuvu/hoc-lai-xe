import { useEffect, useState } from 'react'
import { isChapterCode, type ChapterCode } from '../engine/types'

export type Route = { name: 'home' } | { name: 'chapter'; chapter: ChapterCode; questionId?: number }

export function parseRoute(hash: string): Route {
  const m = /^#\/chuong\/([IVX]+)(?:\/(\d+))?$/.exec(hash)
  if (m && isChapterCode(m[1]!)) {
    return { name: 'chapter', chapter: m[1], questionId: m[2] ? Number(m[2]) : undefined }
  }
  return { name: 'home' }
}

export function hrefFor(route: Route): string {
  if (route.name === 'home') return '#/'
  return `#/chuong/${route.chapter}${route.questionId ? `/${route.questionId}` : ''}`
}

export function navigate(route: Route) {
  location.hash = hrefFor(route)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
