import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { listenForInstallPrompt } from './lib/installApp'

listenForInstallPrompt()

// The service worker (public/sw.js) makes the site installable and shows an offline page. Only
// in production builds: in development it would get in the way of hot reloading.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}

// An installed app can stay open across a deploy; opening a page then asks for a file the deploy
// replaced. Reload once to pick up the new version, but never loop if that doesn't help.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('dreamapp:reloaded-at') ?? 0)
    if (Date.now() - last < 10_000) return
    sessionStorage.setItem('dreamapp:reloaded-at', String(Date.now()))
  } catch {
    // Storage blocked: reload anyway, the browser's own error page is the worst case.
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
