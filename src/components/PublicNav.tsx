import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../lib/auth'

export function PublicNav() {
  const { user, guest } = useAuth()
  const inside = user || guest
  return (
    <header className="border-b border-ink">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Link to="/pricing" className="btn btn-quiet text-sm">Pricing</Link>
          {inside ? (
            <Link to="/app" className="btn btn-primary !h-10">Open the app</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-quiet text-sm hidden sm:inline-flex">Log in</Link>
              <Link to="/signup" className="btn btn-primary !h-10">Start free</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-ink mt-24">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-10 grid sm:grid-cols-[1fr_auto] gap-6 items-end">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted max-w-sm">Know tech. Talk tech. Yap tech. A daily knowledge habit for people who build software.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <Link to="/pricing" className="hover:text-ink">Pricing</Link>
          <Link to="/login" className="hover:text-ink">Log in</Link>
          <span>© {new Date().getFullYear()} TechYapper</span>
        </div>
      </div>
    </footer>
  )
}
