import { init, restoreInitData } from '@telegram-apps/sdk'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try {
  init({ acceptCustomStyles: true })
  restoreInitData()
} catch {
  // Running outside Telegram Mini App.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
