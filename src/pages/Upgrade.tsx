import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, CreditCard, Info, Sparkles } from 'lucide-react'
import { PageHead } from '../components/AppShell'
import { PLANS, FEATURES } from '../components/Pricing'
import { useProgress } from '../lib/progress'
import { useAuth } from '../lib/auth'

export default function Upgrade() {
  const { isPro, subscription, startPreview } = useProgress()
  const { user, guest } = useAuth()
  const nav = useNavigate()
  const [plan, setPlan] = useState<keyof typeof PLANS>('yearly')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const p = PLANS[plan]

  const preview = async () => {
    setBusy(true); setErr('')
    const r = await startPreview()
    setBusy(false)
    if (r.error) setErr(r.error)
    else nav('/app?pro=1')
  }

  if (isPro) {
    return (
      <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[900px]">
        <PageHead kicker="Your plan" title={<>You're <em className="font-normal">Pro</em>.</>} dek={subscription?.plan === 'pro_preview'
          ? `Your free Pro preview runs until ${new Date(subscription.current_period_end!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}. No card on file, nothing will be charged.`
          : 'Thanks for backing TechYapper.'} />
        <ul className="mt-8 grid sm:grid-cols-2 gap-x-8">
          {FEATURES.filter((f) => f.free !== true).map((f) => <li key={f.label} className="py-3 border-b border-line flex gap-3"><Check size={17} className="text-accent shrink-0 mt-0.5" />{f.label}</li>)}
        </ul>
        <div className="mt-8 flex gap-3 flex-wrap">
          <Link to="/app/tracks" className="btn btn-primary">Open interview tracks</Link>
          <Link to="/app/project-yap" className="btn btn-ghost">Open Project Yapping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1100px]">
      <PageHead kicker="Upgrade" title={<>Go <em className="font-normal">Pro</em>.</>} dek="Project Yapping, Resume Yapping, advanced interview answers, every Deep Dive and the advanced challenges." />

      <div className="mt-10 grid lg:grid-cols-[1fr_400px] gap-10">
        <div>
          <p className="kicker text-muted mb-3">Choose a plan</p>
          <div className="grid gap-3" role="radiogroup">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((k) => (
              <button key={k} role="radio" aria-checked={plan === k} onClick={() => setPlan(k)}
                className={`text-left p-5 border flex items-center gap-4 ${plan === k ? 'border-ink bg-card shadow-[4px_4px_0_var(--color-ink)]' : 'border-line-2 hover:border-ink'}`}>
                <span className={`w-5 h-5 rounded-full border-2 grid place-items-center ${plan === k ? 'border-accent' : 'border-line-2'}`}>{plan === k && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}</span>
                <span className="flex-1">
                  <span className="block font-semibold capitalize">{k} {k === 'yearly' && <span className="ml-2 font-mono text-[11px] text-accent-ink">SAVE 33%</span>}</span>
                  <span className="block text-sm text-muted">{PLANS[k].note}</span>
                </span>
                <span className="display text-[34px] font-semibold">₹{PLANS[k].price}</span>
              </button>
            ))}
          </div>
          <ul className="mt-8 grid sm:grid-cols-2 gap-x-8">
            {FEATURES.filter((f) => f.free !== true).map((f) => <li key={f.label} className="py-3 border-b border-line flex gap-3 text-[15px]"><Check size={17} className="text-accent shrink-0 mt-0.5" />{f.label}{typeof f.pro === 'string' && f.pro !== 'Everything' ? <span className="text-muted text-xs">({f.pro})</span> : null}</li>)}
          </ul>
        </div>

        <aside className="border border-ink p-6 sm:p-8 bg-card self-start">
          <p className="kicker text-muted">Order summary</p>
          <div className="mt-4 flex justify-between items-baseline border-b border-line pb-4">
            <span className="font-semibold">TechYapper Pro · {plan}</span>
            <span className="font-mono">₹{p.price}.00</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-muted"><span>GST (inclusive)</span><span className="font-mono">incl.</span></div>
          <div className="mt-3 flex justify-between items-baseline"><span className="font-semibold">Due today</span><span className="display text-[32px] font-semibold">₹{p.price}</span></div>

          <button disabled className="btn btn-primary w-full mt-6" aria-describedby="pay-note"><CreditCard size={16} /> Pay with Razorpay</button>
          <p id="pay-note" className="mt-3 text-[13px] text-ink-2 flex gap-2 bg-paper-2 p-3"><Info size={15} className="shrink-0 mt-0.5 text-accent-ink" />
            <span><strong>Payments aren't live yet.</strong> Checkout is being connected to Razorpay. Nothing will be charged, and no payment is processed on this page.</span></p>

          <div className="mt-6 border-t border-line pt-6">
            <p className="font-semibold">Try Pro free for 7 days</p>
            <p className="text-sm text-muted mt-1">A preview while checkout is in progress. No card. It simply ends after 7 days.</p>
            {user ? (
              <button onClick={preview} disabled={busy || !!subscription} className="btn btn-accent w-full mt-4"><Sparkles size={16} /> {busy ? 'Starting…' : subscription ? 'Preview already used' : 'Start free Pro preview'}</button>
            ) : (
              <Link to="/signup?next=upgrade" className="btn btn-accent w-full mt-4">{guest ? 'Create a free account to start' : 'Sign up to start'}</Link>
            )}
            {err && <p className="text-sm text-bad mt-3" role="alert">{err}</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}
