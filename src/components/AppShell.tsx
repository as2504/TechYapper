import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Home as HomeIcon, Compass, Swords, Code2, Activity, Flame, LogOut, Sparkles, Trophy, Mic, FileText, Lightbulb, Search } from 'lucide-react'
import { useEffect } from 'react'
import { Logo } from './Logo'
import { useAuth } from '../lib/auth'
import { useProgress, useStats } from '../lib/progress'

export const NAV = [
  { to: '/app', end: true, label: 'Home', short: 'Home', icon: HomeIcon, mobile: true },
  { to: '/app/explore', label: 'Explore topics', short: 'Explore', icon: Compass, mobile: true },
  { to: '/app/battle', label: 'Yap Battle', short: 'Battle', icon: Swords, mobile: true },
  { to: '/app/code', label: 'Code or Explain', short: 'Code', icon: Code2, mobile: false },
  { to: '/app/leaderboard', label: 'Leaderboard', short: 'Ranks', icon: Trophy, mobile: true },
  { to: '/app/score', label: 'Yap Score', short: 'You', icon: Activity, mobile: true },
]

const CAREER = [
  { to: '/app/project-yap', label: 'Project Yapping', icon: Mic },
  { to: '/app/resume-yap', label: 'Resume Yapping', icon: FileText },
  { to: '/app/projects', label: 'Project ideas', icon: Lightbulb },
]

function Item({ to, end, label, icon: Icon }: { to: string; end?: boolean; label: string; icon: typeof HomeIcon }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => `relative flex items-center gap-3 h-10 px-3 rounded-[3px] text-[14.5px] transition-colors ${isActive ? 'bg-card text-ink font-semibold shadow-[0_1px_0_var(--color-line)]' : 'text-ink-2 hover:text-ink hover:bg-paper/60 font-medium'}`}>
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent rounded-r" />}
          <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent' : 'text-muted'} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const { guest, displayName, signOut } = useAuth()
  const { isPro, error } = useProgress()
  const stats = useStats()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar: the navigation plane */}
      <aside className="hidden lg:flex flex-col sticky top-0 h-dvh bg-shell border-r border-line px-4 py-6">
        <div className="px-2"><Logo to="/app" /></div>

        <Link to="/app/explore" className="mt-6 flex items-center gap-2.5 h-10 px-3 bg-card border border-line rounded-[3px] text-sm text-faint hover:border-ink-2 hover:text-muted">
          <Search size={15} /> Search topics <kbd className="ml-auto font-mono text-[10px] border border-line px-1 rounded-sm">/</kbd>
        </Link>

        <nav className="mt-5 grid gap-0.5" aria-label="Main">
          {NAV.map((n) => <Item key={n.to} {...n} />)}
        </nav>

        <div className="mt-7 px-3 flex items-center justify-between">
          <span className="kicker text-faint">Your work</span>
          {!isPro && <span className="pro-tag">PRO</span>}
        </div>
        <nav className="mt-2 grid gap-0.5" aria-label="Career tools">
          {CAREER.map((n) => <Item key={n.to} {...n} />)}
        </nav>

        <div className="mt-auto grid gap-3">
          <Link to="/app/score" className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] hover:bg-paper/60">
            <Flame size={18} className={stats.activeToday ? 'text-accent' : 'text-faint'} />
            <span className="text-sm"><strong className="font-semibold">{stats.streak}-day streak</strong><span className="text-muted"> · {stats.xp} XP</span></span>
          </Link>
          {!isPro && (
            <Link to="/app/upgrade" className="flex items-center gap-2 px-3 h-10 rounded-[3px] bg-ink text-paper text-sm font-semibold hover:bg-accent-ink">
              <Sparkles size={15} className="text-accent" /> Go Pro <span className="ml-auto font-normal text-paper/60">₹99/mo</span>
            </Link>
          )}
          <div className="flex items-center justify-between border-t border-line pt-3 px-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted">{guest ? 'Guest' : isPro ? 'Pro' : 'Free plan'}</p>
            </div>
            {guest ? (
              <Link to="/signup" className="text-xs font-semibold underline underline-offset-4">Sign up</Link>
            ) : (
              <button onClick={signOut} className="text-muted hover:text-accent-ink p-2 -mr-1" aria-label="Log out" title="Log out"><LogOut size={16} /></button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 bg-shell/95 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between h-14 px-4">
          <Logo to="/app" size={24} />
          <div className="flex items-center gap-4">
            <Link to="/app/explore" className="text-ink-2" aria-label="Search topics"><Search size={19} /></Link>
            <Link to="/app/project-yap" className="text-ink-2" aria-label="Project Yapping"><Mic size={19} /></Link>
            <Link to="/app/resume-yap" className="text-ink-2" aria-label="Resume Yapping"><FileText size={19} /></Link>
            <Link to="/app/score" className="flex items-center gap-1 font-mono text-sm font-semibold" aria-label={`${stats.streak} day streak`}>
              <Flame size={17} className={stats.activeToday ? 'text-accent' : 'text-faint'} />{stats.streak}
            </Link>
          </div>
        </div>
      </header>

      <main className="min-w-0 pb-24 lg:pb-0">
        {guest && (
          <div className="border-b border-line px-4 sm:px-8 lg:px-12 py-2 text-[13px] flex items-center justify-between gap-3 text-muted">
            <span>Browsing as a guest. Progress stays on this device.</span>
            <Link to="/signup" className="font-semibold text-ink underline underline-offset-4 shrink-0">Save progress</Link>
          </div>
        )}
        {error && <div className="bg-bad-wash text-bad text-sm px-4 sm:px-8 py-2" role="alert">{error}</div>}
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-shell border-t border-line pb-safe" aria-label="Main">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => n.mobile).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 inset-x-5 h-[3px] bg-accent" />}
                  <n.icon size={20} strokeWidth={isActive ? 2.2 : 1.7} className={isActive ? 'text-accent' : ''} />
                  {n.short}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

/** Page header used across the app. One title, one short line, optional stat on the right. */
export function PageHead({ title, dek, right }: { kicker?: string; title: React.ReactNode; dek?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="pb-6 sm:pb-8 border-b border-line">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="display text-[38px] sm:text-[54px] font-semibold">{title}</h1>
          {dek && <p className="mt-3 text-[16px] sm:text-[17px] text-muted max-w-xl leading-snug">{dek}</p>}
        </div>
        {right && <div className="hidden sm:block shrink-0">{right}</div>}
      </div>
    </header>
  )
}
