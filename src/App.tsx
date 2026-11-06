import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppShell } from './components/AppShell'
import { useAuth } from './lib/auth'
import Landing from './pages/Landing'
import PricingPage from './pages/PricingPage'
import { Login, Signup } from './pages/Auth'
import Today from './pages/Today'
import ConceptPage from './pages/ConceptPage'
import Battle from './pages/Battle'
import CodeOrExplain from './pages/CodeOrExplain'
import Score from './pages/Score'
import Library from './pages/Library'
import Tracks from './pages/Tracks'
import Upgrade from './pages/Upgrade'
import NotFound from './pages/NotFound'

function RequireAccess({ children }: { children: ReactNode }) {
  const { user, guest, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (!user && !guest) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}

export function Splash() {
  return (
    <div className="min-h-dvh grid place-items-center" role="status" aria-label="Loading">
      <p className="kicker text-muted">Brewing today's yap<span className="caret">_</span></p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/app" element={<RequireAccess><AppShell /></RequireAccess>}>
        <Route index element={<Today />} />
        <Route path="concept/:slug" element={<ConceptPage />} />
        <Route path="battle" element={<Battle />} />
        <Route path="code" element={<CodeOrExplain />} />
        <Route path="score" element={<Score />} />
        <Route path="library" element={<Library />} />
        <Route path="tracks" element={<Tracks />} />
        <Route path="upgrade" element={<Upgrade />} />
        <Route path="*" element={<NotFound inApp />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
