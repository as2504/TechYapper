import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, Copy, Share2, Swords, Timer, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useLibrary } from '../lib/content'
import { answerDuel, createDuel, duelResults, getDuel, type DuelInfo, type DuelResult } from '../lib/community'
import { Explanation, Options, QuizPrompt } from '../components/Quiz'
import { LevelChip } from './Battle'

const LIMIT = 20
const linkFor = (code: string) => `${location.origin}/app/duel/${code}`

/** /app/duel: start a new duel and share the link. */
export function DuelStart() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const start = async () => {
    setBusy(true); setErr('')
    const r = await createDuel()
    setBusy(false)
    if (r.code) nav(`/app/duel/${r.code}?new=1`); else setErr(r.error ?? 'Could not start a duel.')
  }
  return (
    <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-16 max-w-[760px]">
      <div className="rounded-[6px] bg-spot text-on-spot p-8 sm:p-14 relative overflow-hidden">
        <Swords size={140} strokeWidth={1} className="absolute -right-6 -bottom-6 text-accent/25" />
        <p className="kicker text-accent">Yap Duel</p>
        <h1 className="display text-[40px] sm:text-[60px] font-semibold mt-3 max-w-md">Challenge a friend.</h1>
        <p className="mt-4 text-on-spot/70 max-w-sm">Same 5 questions, 20 seconds each, one try. Most correct wins; time breaks ties.</p>
        {user ? (
          <button onClick={start} disabled={busy} className="btn btn-accent mt-9">{busy ? 'Setting up…' : 'Start a duel'} <ArrowRight size={16} /></button>
        ) : (
          <Link to="/signup?next=/app/duel" className="btn btn-accent mt-9">Create a free account to duel</Link>
        )}
        {err && <p className="mt-3 text-sm text-accent">{err}</p>}
      </div>
    </div>
  )
}

type Phase = 'loading' | 'missing' | 'intro' | 'play' | 'done'

/** /app/duel/:code: play the duel, then see the scoreboard. */
export function DuelPlay() {
  const { code = '' } = useParams()
  const { user } = useAuth()
  const lib = useLibrary()
  const [info, setInfo] = useState<DuelInfo | null>(null)
  const [results, setResults] = useState<DuelResult[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [verdict, setVerdict] = useState<boolean | null>(null)
  const [left, setLeft] = useState(LIMIT)
  const [copied, setCopied] = useState(false)
  const started = useRef(0)
  const isNew = new URLSearchParams(location.search).has('new')

  const refresh = useCallback(async () => setResults(await duelResults(code)), [code])
  useEffect(() => {
    let off = false
    ;(async () => {
      const d = await getDuel(code)
      if (off) return
      if (!d) { setPhase('missing'); return }
      setInfo(d)
      const r = await duelResults(code)
      if (off) return
      setResults(r)
      const mine = r.find((x) => x.is_me)
      if (mine && mine.answered >= d.question_ids.length) setPhase('done')
      else { setI(mine?.answered ?? 0); setPhase('intro') }
    })()
    return () => { off = true }
  }, [code])
  // Live-ish scoreboard while friends play.
  useEffect(() => { if (phase !== 'done') return; const id = setInterval(refresh, 8000); return () => clearInterval(id) }, [phase, refresh])

  const qs = info?.question_ids.map((id) => lib.questions.find((q) => q.id === id)).filter(Boolean) ?? []
  const q = qs[i]

  const submit = useCallback(async (choice: number | null) => {
    if (!q || chosen !== null || verdict !== null) return
    setChosen(choice ?? -1)
    const r = await answerDuel(code, i, choice, Date.now() - started.current)
    setVerdict(r.correct ?? false)
  }, [q, chosen, verdict, code, i])

  useEffect(() => { if (phase === 'play') { setLeft(LIMIT); setChosen(null); setVerdict(null); started.current = Date.now() } }, [i, phase])
  useEffect(() => {
    if (phase !== 'play' || chosen !== null) return
    if (left <= 0) { submit(null); return }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [left, phase, chosen, submit])

  const next = async () => {
    if (i + 1 >= qs.length) { await refresh(); setPhase('done') } else setI(i + 1)
  }
  const share = async () => {
    const url = linkFor(code)
    const text = `I challenge you to a Yap Duel: 5 tech questions, 20 seconds each.`
    const n = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (n.share) { try { await n.share({ title: 'Yap Duel', text, url }); return } catch { /* fall through */ } }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }

  const wrap = (children: React.ReactNode) => <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-14 max-w-[820px]">{children}</div>

  if (phase === 'loading') return wrap(<p className="kicker text-muted">Loading duel<span className="caret">_</span></p>)
  if (phase === 'missing') return wrap(<div><h1 className="display text-[40px] font-semibold">Duel not found.</h1><Link to="/app/duel" className="btn btn-primary mt-6">Start a new one</Link></div>)

  if (phase === 'intro') return wrap(
    <div className="rounded-[6px] bg-spot text-on-spot p-8 sm:p-12">
      <p className="kicker text-accent">Yap Duel · {code}</p>
      <h1 className="display text-[36px] sm:text-[54px] font-semibold mt-3">{isNew ? 'Your duel is ready.' : `${info!.creator_name} challenged you.`}</h1>
      <p className="mt-4 text-on-spot/70">5 questions · 20 seconds each · one try. {results.length > 0 && `${results.length} played so far.`}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {info!.expired ? <p className="text-accent">This duel has ended.</p> : user ? (
          <button onClick={() => setPhase('play')} className="btn btn-accent">{i > 0 ? 'Continue' : 'Play now'} <ArrowRight size={16} /></button>
        ) : (
          <Link to={`/signup?next=/app/duel/${code}`} className="btn btn-accent">Sign up free to play</Link>
        )}
        <button onClick={share} className="btn border border-on-spot/40 hover:bg-on-spot hover:text-spot">{copied ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> Send to a friend</>}</button>
      </div>
      {!user && <p className="mt-4 text-sm text-on-spot/60">Already have an account? <Link to={`/login?next=/app/duel/${code}`} className="underline underline-offset-4">Log in</Link></p>}
    </div>)

  if (phase === 'play' && q) return wrap(
    <div>
      <div className="flex items-center gap-1.5 mb-5">{qs.map((_, n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n < i ? 'bg-ink-2' : n === i ? 'bg-accent' : 'bg-line'}`} />)}</div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-muted">Question {i + 1} of {qs.length}</span>
        <LevelChip level={q.difficulty} />
        <span className={`ml-auto flex items-center gap-1.5 font-mono text-sm ${left <= 5 ? 'text-accent' : 'text-muted'}`}><Timer size={14} /> {chosen === null ? `${left}s` : ''}</span>
      </div>
      {chosen === null && <div className="h-1 rounded-full bg-paper-2 mb-6 overflow-hidden"><div className={`h-full transition-[width] duration-1000 ease-linear ${left <= 5 ? 'bg-accent' : 'bg-ink-2'}`} style={{ width: `${(left / LIMIT) * 100}%` }} /></div>}
      <QuizPrompt quiz={q} />
      <Options quiz={q} chosen={chosen === null ? null : chosen} onChoose={(n) => submit(n)} disabled={chosen !== null} />
      {verdict !== null && (
        <>
          {chosen === -1 && <p className="mt-4 text-sm font-semibold text-accent-ink">Time is up.</p>}
          <Explanation quiz={q} chosen={chosen ?? -1} />
          <div className="mt-6 flex justify-end"><button onClick={next} className="btn btn-primary">{i + 1 >= qs.length ? 'See results' : 'Next'} <ArrowRight size={16} /></button></div>
        </>
      )}
      {chosen !== null && verdict === null && <p className="mt-4 text-sm text-muted">Checking<span className="caret">_</span></p>}
    </div>)

  const me = results.find((r) => r.is_me)
  const lead = results[0]
  return wrap(
    <div>
      <div className="rounded-[6px] bg-spot text-on-spot p-8 sm:p-12">
        <p className="kicker text-accent">Yap Duel · results</p>
        <h1 className="display text-[38px] sm:text-[56px] font-semibold mt-3">
          {results.length < 2 ? 'Waiting for a challenger.' : lead?.is_me ? 'You’re winning.' : `${lead?.name} leads.`}
        </h1>
        {me && <p className="mt-3 text-on-spot/70">You got {me.correct} of {qs.length} in {(me.total_ms / 1000).toFixed(1)}s.</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={share} className="btn btn-accent">{copied ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> Challenge someone</>}</button>
          <button onClick={async () => { try { await navigator.clipboard.writeText(linkFor(code)); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ } }} className="btn border border-on-spot/40 hover:bg-on-spot hover:text-spot"><Copy size={15} /> Copy link</button>
        </div>
      </div>
      <ol className="mt-8 grid gap-2">
        {results.map((r, n) => (
          <li key={r.name + n} className={`flex items-center gap-4 px-4 py-3.5 rounded-[4px] border ${r.is_me ? 'border-accent bg-accent-wash' : 'border-line bg-card'}`}>
            <span className={`font-[family-name:var(--font-display)] text-[22px] font-semibold w-7 ${n === 0 ? 'text-accent' : 'text-muted'}`}>{n + 1}</span>
            <span className="flex-1 min-w-0 font-semibold truncate">{r.name}{r.is_me && <span className="kicker text-accent-ink ml-2">You</span>}{r.is_creator && <span className="kicker text-faint ml-2">Host</span>}</span>
            <span className="hidden sm:flex gap-1">{r.marks.map((m, k) => <span key={k} className={`w-5 h-5 rounded-[3px] grid place-items-center ${m ? 'bg-good text-paper' : 'bg-bad-wash text-bad'}`}>{m ? <Check size={12} /> : <X size={12} />}</span>)}</span>
            <span className="font-mono text-sm w-16 text-right">{r.correct}/{qs.length}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-faint">Updates automatically while friends play. Duel link works for 7 days.</p>
      <Link to="/app/duel" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold hover:text-accent-ink">Start a new duel <ArrowRight size={15} /></Link>
    </div>)
}
