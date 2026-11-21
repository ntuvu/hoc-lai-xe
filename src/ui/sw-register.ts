/** Đăng ký service worker (chỉ bản production). Gọi `onUpdate` khi bản build mới đã sẵn sàng. */
export function registerServiceWorker(onUpdate: () => void) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) onUpdate()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void reg.update()
      })
    }, () => {})
  })
}
