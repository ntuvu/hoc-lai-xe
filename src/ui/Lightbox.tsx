import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  alt: string
  onClose: () => void
}

/** Hình phóng to toàn màn hình. Chạm vào hình để phóng to gấp đôi và kéo/cuộn để xem chi tiết. */
export function Lightbox({ src, alt, onClose }: Props) {
  const [magnified, setMagnified] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className={`lightbox${magnified ? ' is-magnified' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Hình phóng to"
      onClick={onClose}
    >
      <img
        src={src}
        alt={alt}
        title={magnified ? 'Chạm để thu nhỏ' : 'Chạm để phóng to thêm'}
        onClick={(e) => {
          e.stopPropagation()
          setMagnified((m) => !m)
        }}
      />
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Đóng">
        ✕
      </button>
    </div>
  )
}
