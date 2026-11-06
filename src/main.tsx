import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './styles/index.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { ProgressProvider } from './lib/progress'
import { ContentProvider } from './lib/content'

registerSW({ immediate: true })

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
