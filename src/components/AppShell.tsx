import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Home as HomeIcon, Compass, Swords, Code2, Activity, Flame, LogOut, Sparkles, Trophy, Mic, FileText } from 'lucide-react'
import { useEffect } from 'react'
import { Logo } from './Logo'
import { useAuth } from '../lib/auth'
import { useProgress, useStats } from '../lib/progress'
import { dateKey, issueNumber, prettyDate } from '../lib/dates'

export const NAV = [
  { to: '/app', end: true, n: '01', label: 'Home', short: 'Home', icon: HomeIcon, mobile: true },
  { to: '/app/explore', n: '02', label: 'Explore topics', short: 'Explore', icon: Compass, mobile: true },
  { to: '/app/battle', n: '03', label: 'Yap Battle', short: 'Battle', icon: Swords, mobile: true },
  { to: '/app/code', n: '04', label: 'Code or Explain', short: 'Code', icon: Code2, mobile: false },
  { to: '/app/leaderboard', n: '05', label: 'Leaderboard', short: 'Ranks', icon: Trophy, mobile: true },
  { to: '/app/score', n: '06', label: 'Yap Score', short: 'You', icon: Activity, mobile: true },
]

const CAREER = [
  { to: '/app/project-yap', label: 'Project Yapping' },
  { to: '/app/resume-yap', label: 'Resume Yapping' },
  { to: '/app/projects', label: 'Project ideas' },
]

export function AppShell() {
  const { pathname } = useLocation()
  const { guest, displayName, signOut } = useAuth()
  const { isPro, error } = useProgress()
  const stats = useStats()
  const today = dateKey()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col sticky top-0 h-dvh border-r border-line px-6 py-7">
        <Logo to="/app" />
        <p className="kicker text-muted mt-6">No. {issueNumber(today)} · {prettyDate(today, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        <nav className="mt-6 grid gap-0.5" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `group flex items-baseline gap-3 py-2.5 border-b border-line transition-colors ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`}>
              {({ isActive }) => (
                <>
                  <span className={`font-mono text-[11px] ${isActive ? 'text-accent' : ''}`}>{n.n}</span>
                  <span className={`text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{n.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 bg-accent self-center" />}
                </>
              )}
            </NavLink>
          ))}
          <p className="kicker text-muted mt-6 mb-1">Talk about your work</p>
          {CAREER.map((c) => (
            <NavLink key={c.to} to={c.to} className={({ isActive }) => `flex items-baseline gap-3 py-2.5 border-b border-line ${isActive ? 'text-ink font-semibold' : 'text-muted hover:text-ink font-medium'}`}>
              <span className="text-[15px]">{c.label}</span>{!isPro && <span className="ml-auto pro-tag self-center">PRO</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 flex items-center gap-3">
          <Flame className={stats.activeToday ? 'text-accent' : 'text-faint'} size={22} />
          <div>
            <p className="font-[family-name:var(--font-display)] text-[28px] leading-none font-semibold">{stats.streak}<span className="text-[15px] font-normal text-muted"> day streak</span></p>
            <p className="text-xs text-muted mt-1">{stats.activeToday ? 'Today is in the bag.' : 'Do one thing today to keep it.'}</p>
          </div>
        </div>

        <div className="mt-auto grid gap-4">
          {!isPro && (
            <Link to="/app/upgrade" className="block border border-ink p-4 hover:bg-ink hover:text-paper transition-colors group">
              <p className="kicker text-accent-ink group-hover:text-accent">Go Pro</p>
              <p className="mt-1 text-sm leading-snug">Project and Resume Yapping, advanced interview answers and deep dives. ₹99/mo.</p>
            </Link>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="min-w-0">
              <p className="font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted">{guest ? 'Guest · progress on this device' : isPro ? 'Pro member' : 'Free plan'}</p>
            </div>
            {guest ? (
              <Link to="/signup" className="text-xs font-semibold underline underline-offset-4">Save progress</Link>
            ) : (
              <button onClick={signOut} className="text-muted hover:text-accent-ink p-2 -mr-2" aria-label="Log out" title="Log out"><LogOut size={16} /></button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between h-14 px-4">
          <Logo to="/app" size={24} />
          <div className="flex items-center gap-3">
            {!isPro && <Link to="/app/upgrade" className="pro-tag !py-1" aria-label="Upgrade to Pro"><Sparkles size={11} /> PRO</Link>}
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
          <div className="border-b border-line bg-paper-2 px-4 sm:px-8 py-2.5 text-[13px] flex items-center justify-between gap-3">
            <span className="text-ink-2">You're yapping as a guest. Progress lives on this device only.</span>
            <Link to="/signup" className="font-semibold underline underline-offset-4 shrink-0">Create free account</Link>
          </div>
        )}
        {error && <div className="bg-bad-wash text-bad text-sm px-4 sm:px-8 py-2" role="alert">{error}</div>}
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-ink pb-safe" aria-label="Main">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => n.mobile).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-faint'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 inset-x-4 h-[3px] bg-accent" />}
                  <n.icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
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

/** Page header used across the app — editorial masthead style. */
export function PageHead({ kicker, title, dek, right }: { kicker: string; title: React.ReactNode; dek?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="border-b border-ink pb-6 sm:pb-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="kicker text-accent-ink">{kicker}</p>
          <h1 className="display text-[44px] sm:text-[64px] font-semibold mt-3">{title}</h1>
          {dek && <p className="mt-4 text-[17px] sm:text-[19px] text-ink-2 max-w-2xl font-[family-name:var(--font-serif)] leading-snug">{dek}</p>}
        </div>
        {right && <div className="hidden sm:block shrink-0">{right}</div>}
      </div>
    </header>
  )
}
