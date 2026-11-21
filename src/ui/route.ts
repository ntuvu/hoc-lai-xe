import { useEffect, useState } from 'react'
import { isChapterCode } from '../engine/types'
import type { QuestionFilter } from '../engine/engine'

export type Route =
  | { name: 'home' }
  | { name: 'practice'; filter: QuestionFilter; questionId?: number }
  | { name: 'exam' }
  | { name: 'examResult'; id: string }
  | { name: 'tips' }
  | { name: 'tip'; tipId: string }
  | { name: 'progress' }
  | { name: 'settings' }

function parseFilter(key: string): QuestionFilter | null {
  const ch = /^chuong-([IVX]+)$/.exec(key)
  if (ch && isChapterCode(ch[1]!)) return { kind: 'chapter', chapter: ch[1] }
  if (key === 'diem-liet') return { kind: 'pointDeduction' }
  if (key === 'cau-sai') return { kind: 'wrong' }
  const tip = /^meo-(.+)$/.exec(key)
  if (tip) return { kind: 'tip', tipId: tip[1]! }
  return null
}

function filterSegment(f: QuestionFilter): string {
  switch (f.kind) {
    case 'chapter':
      return `chuong-${f.chapter}`
    case 'pointDeduction':
      return 'diem-liet'
    case 'wrong':
      return 'cau-sai'
    case 'tip':
      return `meo-${f.tipId}`
  }
}

export function parseRoute(hash: string): Route {
  const path = decodeURIComponent(hash.replace(/^#/, ''))
  let m: RegExpExecArray | null
  if ((m = /^\/on\/([^/]+)(?:\/(\d+))?$/.exec(path))) {
    const filter = parseFilter(m[1]!)
    if (filter) return { name: 'practice', filter, questionId: m[2] ? Number(m[2]) : undefined }
  }
  if (path === '/thi') return { name: 'exam' }
  if ((m = /^\/ket-qua\/([^/]+)$/.exec(path))) return { name: 'examResult', id: m[1]! }
  if (path === '/meo') return { name: 'tips' }
  if ((m = /^\/meo\/([^/]+)$/.exec(path))) return { name: 'tip', tipId: m[1]! }
  if (path === '/tien-do') return { name: 'progress' }
  if (path === '/cai-dat') return { name: 'settings' }
  return { name: 'home' }
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'practice':
      return `#/on/${filterSegment(route.filter)}${route.questionId ? `/${route.questionId}` : ''}`
    case 'exam':
      return '#/thi'
    case 'examResult':
      return `#/ket-qua/${route.id}`
    case 'tips':
      return '#/meo'
    case 'tip':
      return `#/meo/${route.tipId}`
    case 'progress':
      return '#/tien-do'
    case 'settings':
      return '#/cai-dat'
  }
}

export function navigate(route: Route, { replace = false } = {}) {
  const href = hrefFor(route)
  if (replace) {
    history.replaceState(null, '', href)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else location.hash = href
}

export function routeKey(route: Route): string {
  return route.name === 'practice' ? `practice:${filterSegment(route.filter)}` : hrefFor(route)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
