import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './styles/index.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { ProgressProvider } from './lib/progress'
import { ContentProvider } from './lib/content'

// autoUpdate reloads the page once a new service worker takes over.
// Also check for a new deploy whenever the tab comes back into view, and hourly.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}) }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
    setInterval(check, 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <AuthProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </AuthProvider>
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
)
