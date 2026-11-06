import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Lock } from 'lucide-react'
import { PageHead } from '../components/AppShell'
import { useProgress, useStats, levelXp } from '../lib/progress'
import { useLibrary } from '../lib/content'
import { addDays, dateKey, prettyDate } from '../lib/dates'
import { TOPICS, type TopicId, type Difficulty } from '../content/types'
import { useAuth } from '../lib/auth'

export default function Score() {
  const s = useStats()
  const { isPro, subscription } = useProgress()
  const { guest, displayName, signOut, user } = useAuth()
  const next = levelXp(s.level + 1)
  const cur = levelXp(s.level)
  const pct = Math.min(100, Math.round(((s.xp - cur) / Math.max(1, next - cur)) * 100))

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1180px]">
      <PageHead kicker="Pillar 04 · Your record" title={<>Yap <em className="font-normal">Score</em></>}
        dek="Not points for the sake of points. A log of what you actually know now that you didn't before." />

      {/* Hero numbers */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border-b border-ink">
        <Big label="Total XP" value={s.xp.toLocaleString('en-IN')} sub={`Level ${s.level} · ${next - s.xp} XP to ${s.level + 1}`}>
          <div className="mt-3 h-1 bg-line"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
        </Big>
        <Big label="Current streak" value={<span className="flex items-center gap-2"><Flame className={s.activeToday ? 'text-accent' : 'text-faint'} size={36} />{s.streak}</span>} sub={`Longest: ${s.longest} days`} border />
        <Big label="Accuracy" value={`${s.accuracy}%`} sub={`${s.questionsAnswered} questions answered`} border lgBorder />
        <Big label="Concepts explored" value={s.conceptsRead} sub={`${s.savedCount} saved to library`} border />
      </section>

      <Heatmap />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 mt-14">
        <KnowledgeMap />
        <div className="grid gap-12 content-start">
          <ByDifficulty />
          <section>
            <h2 className="kicker text-accent-ink border-b border-ink pb-2">Code or Explain</h2>
            <p className="mt-4 display text-[44px] font-semibold">{s.challengesSolved}<span className="text-muted text-[24px] font-normal"> / {s.challengesDone} solved</span></p>
          </section>
          {!isPro && (
            <Link to="/app/upgrade" className="border border-ink p-6 group hover:bg-ink hover:text-paper transition-colors block">
              <p className="kicker text-accent-ink group-hover:text-accent flex items-center gap-1.5"><Lock size={11} /> Pro analytics</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-[22px] leading-tight font-semibold">Weak-spot radar & a personal learning path</p>
              <p className="mt-2 text-sm opacity-80">See which topics drag your accuracy down and get next week's reading planned around them.</p>
            </Link>
          )}
        </div>
      </div>

      <section className="mt-16 border-t border-ink pt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{displayName}</p>
          <p className="text-sm text-muted">{guest ? 'Guest — progress is stored on this device only.' : user?.email}{' · '}
            {isPro ? `Pro${subscription?.plan === 'pro_preview' ? ' preview' : ''}${subscription?.current_period_end ? ' until ' + new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}` : 'Free plan'}
          </p>
        </div>
        <div className="flex gap-3">
          {guest ? <Link to="/signup" className="btn btn-primary">Create account to keep progress</Link> : <button onClick={signOut} className="btn btn-ghost">Log out</button>}
        </div>
      </section>
    </div>
  )
}

function Big({ label, value, sub, border, lgBorder, children }: { label: string; value: React.ReactNode; sub: string; border?: boolean; lgBorder?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`py-6 ${border ? 'pl-4 sm:pl-6 border-l border-line' : 'pr-4'} ${lgBorder ? 'max-lg:border-l-0 max-lg:pl-0 max-lg:border-t' : ''} max-lg:[&:nth-child(n+3)]:border-t max-lg:[&:nth-child(n+3)]:border-line`}>
      <p className="kicker text-muted">{label}</p>
      <div className="display text-[44px] sm:text-[60px] font-semibold mt-2">{value}</div>
      <p className="text-sm text-muted mt-2">{sub}</p>
      {children}
    </div>
  )
}

function Heatmap() {
  const { byDay } = useStats()
  const weeks = 26
  const today = dateKey()
  const todayDow = (new Date().getDay() + 6) % 7 // Monday = 0
  const start = addDays(today, -(weeks - 1) * 7 - todayDow)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
  const activeDays = cells.filter((c) => byDay.has(c)).length
  const level = (xp: number) => (xp === 0 ? 0 : xp < 25 ? 1 : xp < 60 ? 2 : xp < 120 ? 3 : 4)
  const months = useMemo(() => {
    const out: { col: number; label: string }[] = []
    for (let w = 0; w < weeks; w++) {
      const d = addDays(start, w * 7)
      if (d.endsWith('-01') || Number(d.slice(8)) <= 7) {
        const label = prettyDate(d, { month: 'short' })
        if (!out.length || out[out.length - 1].label !== label) out.push({ col: w, label })
      }
    }
    return out
  }, [start])

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between border-b border-ink pb-2">
        <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold tracking-[-0.02em]">Consistency</h2>
        <span className="font-mono text-xs text-muted">{activeDays} ACTIVE DAYS · LAST 6 MONTHS</span>
      </div>
      <div className="mt-5 overflow-x-auto no-scrollbar">
        <div className="min-w-[560px]">
          <div className="grid gap-[3px] text-[10px] font-mono text-muted mb-1" style={{ gridTemplateColumns: `24px repeat(${weeks}, 1fr)` }}>
            <span />
            {Array.from({ length: weeks }, (_, w) => <span key={w}>{months.find((m) => m.col === w)?.label ?? ''}</span>)}
          </div>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `24px repeat(${weeks}, 1fr)`, gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column' }}>
            {['M', '', 'W', '', 'F', '', ''].map((d, i) => <span key={i} className="text-[10px] font-mono text-muted leading-none self-center">{d}</span>)}
            {cells.map((c) => {
              const xp = byDay.get(c) ?? 0
              const future = c > today
              return <span key={c} title={`${prettyDate(c, { day: 'numeric', month: 'short' })}: ${xp} XP`} className={`aspect-square ${future ? 'opacity-0' : `heat-${level(xp)}`} ${c === today ? 'outline outline-1 outline-ink' : ''}`} />
            })}
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-muted font-mono">
            Less {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`w-3 h-3 heat-${l}`} />)} More
          </div>
        </div>
      </div>
    </section>
  )
}

function KnowledgeMap() {
  const { concepts, questions, challenges } = useLibrary()
  const { activities } = useProgress()
  const rows = useMemo(() => {
    const topicOf = new Map<string, TopicId>()
    concepts.forEach((c) => topicOf.set('read:' + c.slug, c.topic))
    questions.forEach((q) => topicOf.set('battle:' + q.id, q.topic))
    challenges.forEach((c) => topicOf.set('challenge:' + c.id, c.topic))
    const totals = new Map<TopicId, number>()
    for (const [, t] of topicOf) totals.set(t, (totals.get(t) ?? 0) + 1)
    const done = new Map<TopicId, number>()
    for (const a of activities) {
      const t = topicOf.get(`${a.kind}:${a.item_id}`)
      if (t) done.set(t, (done.get(t) ?? 0) + 1)
    }
    return [...totals.entries()].map(([t, total]) => ({ t, total, done: done.get(t) ?? 0 })).sort((a, b) => b.done / b.total - a.done / a.total || b.total - a.total)
  }, [concepts, questions, challenges, activities])

  return (
    <section>
      <h2 className="kicker text-accent-ink border-b border-ink pb-2">Knowledge map · coverage by topic</h2>
      <ul className="divide-y divide-line">
        {rows.map((r) => {
          const pct = Math.round((r.done / r.total) * 100)
          return (
            <li key={r.t} className="py-3 grid grid-cols-[120px_1fr_44px] sm:grid-cols-[150px_1fr_52px] items-center gap-4">
              <span className="text-sm font-medium">{TOPICS[r.t].label}</span>
              <span className="h-2 bg-paper-2 relative"><span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${pct}%` }} /></span>
              <span className="font-mono text-xs text-right text-muted">{pct}%</span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted mt-3">Coverage = concepts read, battle questions and challenges attempted in each topic.</p>
    </section>
  )
}

function ByDifficulty() {
  const { questions } = useLibrary()
  const { activities } = useProgress()
  const rows = useMemo(() => {
    const lvl = new Map(questions.map((q) => [q.id, q.difficulty]))
    const agg: Record<Difficulty, { n: number; ok: number }> = { beginner: { n: 0, ok: 0 }, intermediate: { n: 0, ok: 0 }, advanced: { n: 0, ok: 0 } }
    activities.filter((a) => a.kind === 'battle').forEach((a) => { const d = lvl.get(a.item_id); if (d) { agg[d].n++; if (a.correct) agg[d].ok++ } })
    return agg
  }, [questions, activities])
  return (
    <section>
      <h2 className="kicker text-accent-ink border-b border-ink pb-2">Battle accuracy by level</h2>
      <ul className="divide-y divide-line">
        {(Object.keys(rows) as Difficulty[]).map((d) => (
          <li key={d} className="py-3 flex items-baseline justify-between">
            <span className="capitalize text-sm font-medium">{d}</span>
            <span className="font-mono text-sm">{rows[d].n ? Math.round((rows[d].ok / rows[d].n) * 100) + '%' : '—'} <span className="text-muted text-xs">({rows[d].ok}/{rows[d].n})</span></span>
          </li>
        ))}
      </ul>
    </section>
  )
}
