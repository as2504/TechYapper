import { Route, Routes } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { AppShell } from './components/AppShell'
import { useAuth } from './lib/auth'
import Landing from './pages/Landing'
import PricingPage from './pages/PricingPage'
import { Login, Signup } from './pages/Auth'
import Today from './pages/Today'
import Home from './pages/Home'
import Explore from './pages/Explore'
import TechPage from './pages/TechPage'
import Leaderboard from './pages/Leaderboard'
import ProjectYap from './pages/ProjectYap'
import ResumeYap from './pages/ResumeYap'
import ConceptPage from './pages/ConceptPage'
import Battle from './pages/Battle'
import CodeOrExplain from './pages/CodeOrExplain'
import Score from './pages/Score'
import Library from './pages/Library'
import Tracks from './pages/Tracks'
import Upgrade from './pages/Upgrade'
import { ProjectDetail, ProjectsIndex } from './pages/Projects'
import NotFound from './pages/NotFound'

function RequireAccess({ children }: { children: ReactNode }) {
  const { user, guest, loading, enterGuest } = useAuth()
  // Discovery shouldn't need an account: first-time visitors browse as a guest and can sign up any time.
  useEffect(() => { if (!loading && !user && !guest) enterGuest() }, [loading, user, guest, enterGuest])
  if (loading || (!user && !guest)) return <Splash />
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
        <Route index element={<Home />} />
        <Route path="today" element={<Today />} />
        <Route path="explore" element={<Explore />} />
        <Route path="yap/:slug" element={<TechPage />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="project-yap" element={<ProjectYap />} />
        <Route path="resume-yap" element={<ResumeYap />} />
        <Route path="concept/:slug" element={<ConceptPage />} />
        <Route path="battle" element={<Battle />} />
        <Route path="code" element={<CodeOrExplain />} />
        <Route path="score" element={<Score />} />
        <Route path="library" element={<Library />} />
        <Route path="tracks" element={<Tracks />} />
        <Route path="upgrade" element={<Upgrade />} />
        <Route path="projects" element={<ProjectsIndex />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="*" element={<NotFound inApp />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
