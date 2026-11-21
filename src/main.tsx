import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { registerServiceWorker } from './ui/sw-register'
import './ui/styles.css'

registerServiceWorker(() => window.dispatchEvent(new Event('app-update-ready')))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
