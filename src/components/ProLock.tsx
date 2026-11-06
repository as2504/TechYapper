import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ProTag() {
  return <span className="pro-tag">PRO</span>
}

export function ProLock({ title, body, compact = false }: { title: string; body: string; compact?: boolean }) {
  return (
    <div className={`border border-ink bg-card ${compact ? 'p-5' : 'p-7 sm:p-9'} relative overflow-hidden`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 grid place-items-center bg-ink text-paper shrink-0"><Lock size={18} /></div>
        <div className="flex-1">
          <p className="kicker text-accent-ink mb-1.5">TechYapper Pro</p>
          <h3 className="font-[family-name:var(--font-display)] text-[24px] leading-tight font-medium tracking-[-0.02em]">{title}</h3>
          <p className="mt-2 text-ink-2 text-[15px] leading-relaxed max-w-prose">{body}</p>
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            <Link to="/app/upgrade" className="btn btn-accent">Unlock Pro · ₹799/yr</Link>
            <Link to="/pricing" className="btn-quiet text-sm font-medium underline underline-offset-4">Compare plans</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
