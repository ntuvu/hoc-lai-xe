import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/**
 * Sinh `sw.js` sau khi build: precache toàn bộ file trong thư mục build (app shell, questions.json,
 * tips.json, hình). Tên cache = hash nội dung, nên mỗi bản build mới có cache mới và xóa cache cũ.
 */
export function serviceWorkerPlugin(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'gplx-service-worker',
    apply: 'build',
    configResolved(c) {
      config = c
    },
    closeBundle() {
      const outDir = config.build.outDir
      const files = walk(outDir)
        .map((f) => relative(outDir, f).split(sep).join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.DS_Store'))
        .sort()
      const hash = createHash('sha256')
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)))
      const version = `gplx-${hash.digest('hex').slice(0, 12)}`
      writeFileSync(join(outDir, 'sw.js'), swSource(version, files))
      config.logger.info(`sw.js: precache ${files.length} file (${version})`)
    },
  }
}

function swSource(version: string, files: string[]): string {
  return `/* Sinh tự động bởi scripts/sw-plugin.ts — không sửa tay. */
const VERSION = ${JSON.stringify(version)}
const FILES = ${JSON.stringify(files)}
const url = (f) => new URL(f, self.registration.scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(FILES.map(url))).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gplx-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      if (req.mode === 'navigate') {
        return (await cache.match(url('index.html'))) || fetch(req)
      }
      return (await cache.match(req, { ignoreSearch: true })) || fetch(req)
    }),
  )
})
`
}
