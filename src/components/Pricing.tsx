import { Check, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'

export const PLANS = {
  monthly: { id: 'pro_monthly', price: 99, period: 'month', note: 'Billed monthly. Cancel anytime.' },
  yearly: { id: 'pro_yearly', price: 799, period: 'year', note: '₹66.6/month · save 33% vs monthly' },
} as const

export const FEATURES: { label: string; free: boolean | string; pro: boolean | string }[] = [
  { label: 'Every topic: what it is, how it works, how to talk about it', free: true, pro: true },
  { label: 'Go deeper: internals, code, trade-offs and sources', free: true, pro: true },
  { label: 'Interview questions inside each topic', free: 'Core questions', pro: 'All, incl. advanced' },
  { label: 'Daily Yap Battle and Code or Explain', free: true, pro: true },
  { label: 'XP, streaks, badges and the leaderboard', free: true, pro: true },
  { label: 'Concept deep reads (Basics and Under the Hood)', free: true, pro: true },
  { label: 'Project Yapping: structured scripts for your own projects', free: false, pro: true },
  { label: 'Resume Yapping: ATS-conscious bullets + job description check', free: false, pro: true },
  { label: 'Level 3 Deep Dives on advanced concepts', free: false, pro: true },
  { label: 'Advanced code challenges and premium question sets', free: false, pro: true },
  { label: 'Project ideas with build plans and talking points', free: 'Preview', pro: true },
]

const Cell = ({ v }: { v: boolean | string }) =>
  typeof v === 'string' ? <span className="text-sm font-medium">{v}</span> : v ? <Check size={17} className="text-ink" aria-label="Included" /> : <Minus size={17} className="text-faint" aria-label="Not included" />

export function PricingTable({ cta = 'signup' }: { cta?: 'signup' | 'upgrade' }) {
  const proHref = cta === 'upgrade' ? '/app/upgrade' : '/signup?next=upgrade'
  return (
    <div>
      <div className="grid md:grid-cols-2 border border-ink">
        <div className="p-7 sm:p-10">
          <p className="kicker text-muted">Free</p>
          <p className="display text-[64px] font-semibold mt-3">₹0</p>
          <p className="text-muted mt-1">Forever. Explore every topic, battle and rank.</p>
          <Link to={cta === 'upgrade' ? '/app' : '/signup'} className="btn btn-ghost mt-7 w-full">{cta === 'upgrade' ? 'Keep yapping free' : 'Start free'}</Link>
        </div>
        <div className="p-7 sm:p-10 bg-ink text-paper relative">
          <span className="absolute top-0 right-0 bg-accent text-white font-mono text-[11px] tracking-widest px-3 py-1.5">BEST VALUE · YEARLY</span>
          <p className="kicker text-accent">TechYapper Pro</p>
          <p className="display text-[64px] font-semibold mt-3">₹799<span className="text-[20px] font-normal text-paper/60 tracking-normal"> /year</span></p>
          <p className="text-paper/70 mt-1">or ₹99/month. Less than one coffee a month on yearly.</p>
          <Link to={proHref} className="btn btn-accent mt-7 w-full">Go Pro</Link>
        </div>
      </div>
      <table className="w-full mt-8 text-left">
        <thead>
          <tr className="border-b border-ink"><th className="kicker text-muted py-3 font-medium">What you get</th><th className="kicker text-muted py-3 w-24 sm:w-40 font-medium">Free</th><th className="kicker text-muted py-3 w-24 sm:w-40 font-medium">Pro</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {FEATURES.map((f) => (
            <tr key={f.label}><td className="py-3 pr-4 text-[15px]">{f.label}</td><td className="py-3"><Cell v={f.free} /></td><td className="py-3"><Cell v={f.pro} /></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
