import { Link } from 'react-router-dom'

export default function NotFound({ inApp = false }: { inApp?: boolean }) {
  return (
    <div className="min-h-[70dvh] grid place-items-center px-6">
      <div className="max-w-md">
        <p className="kicker text-accent-ink">404 · Not found</p>
        <h1 className="display text-[56px] font-semibold mt-3">This page didn't make the issue.</h1>
        <p className="mt-4 text-ink-2 font-[family-name:var(--font-serif)] text-[19px]">It may have moved, or it never existed. Either way, there's a fresh yap waiting.</p>
        <Link to={inApp ? '/app' : '/'} className="btn btn-primary mt-8">{inApp ? "Back to today's yap" : 'Go home'}</Link>
      </div>
    </div>
  )
}
