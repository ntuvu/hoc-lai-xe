import { useEffect, useRef } from 'react'

interface Handlers {
  /** Phím 1–4 (cả bàn phím số): optIndex bắt đầu từ 0. Bỏ qua nếu không truyền. */
  onChoose?: (optIndex: number) => void
  onPrev?: () => void
  onNext?: () => void
}

/** Phím tắt cho màn có câu hỏi: số chọn đáp án, ← → chuyển câu. Không bắt phím khi đang gõ hoặc đang mở hình phóng to. */
export function useQuestionKeys(handlers: Handlers) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (document.querySelector('.lightbox, .modal')) return
      const h = ref.current
      const digit = e.code.startsWith('Numpad') ? e.code.slice(6) : e.key
      if (h.onChoose && /^[1-4]$/.test(digit)) {
        e.preventDefault()
        h.onChoose(Number(digit) - 1)
      } else if (e.key === 'ArrowLeft' && h.onPrev) {
        e.preventDefault()
        h.onPrev()
      } else if (e.key === 'ArrowRight' && h.onNext) {
        e.preventDefault()
        h.onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
