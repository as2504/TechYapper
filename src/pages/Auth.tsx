import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, MailCheck } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useAuth } from '../lib/auth'
import { useLibrary } from '../lib/content'
import { conceptsForDay } from '../lib/daily'
import { dateKey, issueNumber } from '../lib/dates'
import { TOPICS } from '../content/types'

function Shell({ children }: { children: React.ReactNode }) {
  const { concepts } = useLibrary()
  const c = conceptsForDay(concepts, dateKey())[0]
  return (
    <div className="min-h-dvh grid lg:grid-cols-[1fr_1.1fr]">
      <div className="px-5 sm:px-10 py-8 flex flex-col">
        <Logo />
        <div className="flex-1 grid place-items-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
      <aside className="hidden lg:flex flex-col justify-between bg-ink text-paper p-12">
        <p className="kicker text-paper/60">Issue No. {issueNumber(dateKey())} · Today's lead</p>
        <div>
          <p className="kicker text-accent">{c ? TOPICS[c.topic].label : ""}</p>
          <p className="display text-[64px] font-semibold mt-4">{c?.title}</p>
          <p className="mt-6 text-[22px] font-[family-name:var(--font-serif)] text-paper/75 leading-snug max-w-lg">{c?.dek}</p>
        </div>
        <p className="font-[family-name:var(--font-display)] italic text-[22px] text-paper/80">Know tech. Talk tech. Yap tech.</p>
      </aside>
    </div>
  )
}

function useAfterAuth() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from
  return () => nav(params.get('next') === 'upgrade' ? '/app/upgrade' : from || '/app', { replace: true })
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input {...props} className="input mt-1.5" />
    </label>
  )
}

function GuestLink() {
  const { enterGuest } = useAuth()
  const nav = useNavigate()
  return (
    <button type="button" onClick={() => { enterGuest(); nav('/app') }} className="text-sm font-medium underline underline-offset-4 text-ink-2 hover:text-ink">
      Just looking? Try it without an account
    </button>
  )
}

export function Login() {
  const { signIn, user, configured } = useAuth()
  const done = useAfterAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (user) done() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await signIn(email.trim(), password)
    setBusy(false)
    if (r.error) setErr(r.error === 'Invalid login credentials' ? 'That email and password don\'t match an account.' : r.error)
  }

  return (
    <Shell>
      <p className="kicker text-accent-ink">Welcome back</p>
      <h1 className="display text-[48px] font-semibold mt-3">Log in.</h1>
      <p className="mt-3 text-ink-2">Your streak missed you.</p>
      {!configured && <p className="mt-4 text-sm bg-paper-2 p-3">Accounts aren't configured on this build — use guest mode below.</p>}
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-sm text-bad" role="alert">{err}</p>}
        <button className="btn btn-primary w-full mt-2" disabled={busy || !configured}>{busy ? 'Logging in…' : 'Log in'} <ArrowRight size={16} /></button>
      </form>
      <p className="mt-6 text-sm text-muted">New here? <Link to="/signup" className="text-ink font-semibold underline underline-offset-4">Create a free account</Link></p>
      <div className="mt-8 pt-6 border-t border-line"><GuestLink /></div>
    </Shell>
  )
}

export function Signup() {
  const { signUp, user, configured } = useAuth()
  const done = useAfterAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  useEffect(() => { if (user) done() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setErr('Use at least 8 characters for your password.'); return }
    setBusy(true); setErr('')
    const r = await signUp(email.trim(), password, name.trim())
    setBusy(false)
    if (r.error) setErr(r.error)
    else if (r.needsConfirm) setSent(true)
  }

  if (sent) {
    return (
      <Shell>
        <MailCheck size={36} className="text-accent" />
        <h1 className="display text-[44px] font-semibold mt-4">Check your inbox.</h1>
        <p className="mt-4 text-ink-2 leading-relaxed">We sent a confirmation link to <strong>{email}</strong>. Click it and you'll land straight on today's yap.</p>
        <p className="mt-6 text-sm text-muted">Wrong address? <button className="underline underline-offset-4 text-ink" onClick={() => setSent(false)}>Go back</button></p>
      </Shell>
    )
  }

  return (
    <Shell>
      <p className="kicker text-accent-ink">Free forever · no card</p>
      <h1 className="display text-[48px] font-semibold mt-3">Start yapping.</h1>
      <p className="mt-3 text-ink-2">10 minutes a day. Something worth saying tomorrow.</p>
      {!configured && <p className="mt-4 text-sm bg-paper-2 p-3">Accounts aren't configured on this build — use guest mode below.</p>}
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <Field label="What should we call you?" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-sm text-bad" role="alert">{err}</p>}
        <button className="btn btn-primary w-full mt-2" disabled={busy || !configured}>{busy ? 'Creating account…' : 'Create free account'} <ArrowRight size={16} /></button>
      </form>
      <p className="mt-6 text-sm text-muted">Already yapping? <Link to="/login" className="text-ink font-semibold underline underline-offset-4">Log in</Link></p>
      <div className="mt-8 pt-6 border-t border-line"><GuestLink /></div>
    </Shell>
  )
}
