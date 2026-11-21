import { useRef, useState } from 'react'
import type { StudyEngine } from '../engine/engine'
import { hrefFor } from './route'

type Message = { kind: 'ok' | 'error'; text: string } | null

export function SettingsScreen({ engine }: { engine: StudyEngine }) {
  const [message, setMessage] = useState<Message>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onExport = () => {
    const data = engine.exportProgress()
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tien-do-gplx-b-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'ok', text: 'Đã xuất file tiến độ.' })
  }

  const onImport = async (file: File) => {
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      setMessage({ kind: 'error', text: 'File không phải JSON hợp lệ. Tiến độ hiện tại không thay đổi.' })
      return
    }
    const r = engine.importProgress(data)
    setMessage(
      r.ok
        ? { kind: 'ok', text: 'Đã nhập tiến độ từ file.' }
        : { kind: 'error', text: `Không nhập được: ${r.error} Tiến độ hiện tại không thay đổi.` },
    )
  }

  return (
    <main className="page">
      <nav className="topbar">
        <a href={hrefFor({ name: 'home' })}>← Trang chủ</a>
      </nav>
      <h1>Cài đặt</h1>
      <section className="card stack">
        <h2>Sao lưu tiến độ</h2>
        <p className="muted">Gồm câu trả lời, câu sai, vị trí đang làm và lịch sử thi thử.</p>
        <button type="button" onClick={onExport}>
          ⬇️ Xuất ra file JSON
        </button>
        <button type="button" onClick={() => fileRef.current?.click()}>
          ⬆️ Nhập từ file JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onImport(f)
            e.target.value = ''
          }}
        />
        {message && (
          <p className={message.kind === 'ok' ? 'ok' : 'error'} role="status">
            {message.text}
          </p>
        )}
      </section>
      <section className="card stack">
        <h2>Xóa tiến độ</h2>
        {confirmReset ? (
          <>
            <p className="error">Xóa toàn bộ tiến độ? Không hoàn tác được (nên xuất file trước).</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setConfirmReset(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  engine.resetProgress()
                  setConfirmReset(false)
                  setMessage({ kind: 'ok', text: 'Đã xóa toàn bộ tiến độ.' })
                }}
              >
                Xóa hết
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="danger" onClick={() => setConfirmReset(true)}>
            Reset tiến độ
          </button>
        )}
      </section>
    </main>
  )
}
