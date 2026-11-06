import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock, Lock, Quote } from 'lucide-react'
import { useDaily } from '../lib/useDaily'
import { useAuth } from '../lib/auth'
import { useProgress, useStats } from '../lib/progress'
import { issueNumber, prettyDate } from '../lib/dates'
import { TOPICS, type Concept } from '../content/types'
import { ProTag } from '../components/ProLock'

export default function Today() {
  const d = useDaily()
  const { displayName } = useAuth()
  const { find } = useProgress()
  const stats = useStats()
  const [lead, ...rest] = d.concepts
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1180px]">
      {/* Masthead */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-ink">
        <p className="kicker text-muted">No. {issueNumber(d.today)} · {prettyDate(d.today)}</p>
        <p className="kicker text-muted">{greet}, {displayName.split(' ')[0]}</p>
      </div>

      {/* Daily checklist */}
      <section aria-label="Today's progress" className="grid grid-cols-3 border-b border-line">
        {d.tasks.map((t, i) => (
          <Link key={t.key} to={t.key === 'read' ? `/app/concept/${lead.slug}` : t.key === 'battle' ? '/app/battle' : '/app/code'}
            className={`py-4 ${i ? 'pl-3 sm:pl-6 border-l border-line' : ''} pr-2 group`}>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 grid place-items-center border ${t.done ? 'bg-ink border-ink text-paper' : 'border-line-2'}`}>{t.done && <Check size={13} strokeWidth={3} />}</span>
              <span className="text-[13px] sm:text-[15px] font-semibold group-hover:text-accent-ink"><span className="sm:hidden">{t.short}</span><span className="hidden sm:inline">{t.label}</span></span>
            </div>
            <p className="text-xs text-muted mt-1 pl-7 font-mono">{t.detail}</p>
          </Link>
        ))}
      </section>
      {d.completed === 3 && (
        <p className="mt-4 text-sm bg-ink text-paper px-4 py-3 rise">
          <strong>Daily yap complete.</strong> {stats.streak}-day streak. Come back tomorrow for issue No. {issueNumber(d.today) + 1}.
        </p>
      )}

      {/* Lead story */}
      <article className="mt-8 sm:mt-12 grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12">
        <div>
          <div className="flex items-center gap-3">
            <span className="kicker text-accent-ink">Lead yap · {TOPICS[lead.topic].label}</span>
            {find('read', lead.slug) && <span className="chip !border-good !text-good"><Check size={11} /> Read</span>}
          </div>
          <Link to={`/app/concept/${lead.slug}`} className="block group">
            <h1 className="display text-[46px] sm:text-[72px] font-semibold mt-3 group-hover:text-accent-ink transition-colors">{lead.title}</h1>
          </Link>
          <p className="mt-5 text-[19px] sm:text-[22px] leading-snug font-[family-name:var(--font-serif)] text-ink-2 max-w-2xl">{lead.dek}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link to={`/app/concept/${lead.slug}`} className="btn btn-primary">Start reading <ArrowRight size={16} /></Link>
            <span className="flex items-center gap-1.5 text-sm text-muted"><Clock size={14} /> {lead.minutes} min · 3 levels · {lead.difficulty}</span>
          </div>
        </div>
        <aside className="lg:border-l lg:border-line lg:pl-10 self-end">
          <Quote className="text-accent" size={28} />
          <p className="mt-3 font-[family-name:var(--font-display)] italic text-[24px] sm:text-[28px] leading-[1.2] tracking-[-0.01em]">{lead.yap}</p>
          <p className="kicker text-muted mt-4">Say this tomorrow</p>
        </aside>
      </article>

      {/* Secondary stories */}
      <section className="mt-12 grid md:grid-cols-2 border-t border-ink">
        {rest.map((c, i) => <StoryCell key={c.slug} c={c} read={!!find('read', c.slug)} className={i ? 'md:border-l md:pl-8' : 'md:pr-8'} />)}
      </section>

      {/* Other pillars */}
      <section className="mt-12 grid md:grid-cols-2 gap-px bg-ink border border-ink">
        <PillarCard to="/app/battle" n="02" title="Yap Battle" body={`${d.questions.length} questions, beginner to advanced. Earn up to ${d.questions.length * 20} XP.`} done={d.progress.battle} total={d.questions.length} />
        <PillarCard to="/app/code" n="03" title="Code or Explain" body="Predict the output, find the bug, name the complexity." done={d.progress.code} total={d.challenges.length} />
      </section>

      {/* Back issues */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold tracking-[-0.02em]">Back issues</h2>
          <Link to="/app/library" className="text-sm font-medium underline underline-offset-4">Full archive</Link>
        </div>
        <ol className="divide-y divide-line">
          {d.past.flatMap((p) => p.concepts.slice(0, 1).map((c) => ({ ...p, c }))).map(({ date, c }) => {
            const open = d.canRead(c.slug)
            return (
              <li key={date}>
                <Link to={`/app/concept/${c.slug}`} className="grid grid-cols-[72px_1fr_auto] sm:grid-cols-[120px_1fr_auto] gap-4 py-4 items-baseline group">
                  <span className="font-mono text-xs text-muted">No. {issueNumber(date)}<br className="sm:hidden" /><span className="hidden sm:inline"> · </span>{prettyDate(date, { day: 'numeric', month: 'short' })}</span>
                  <span>
                    <span className="font-[family-name:var(--font-display)] text-[19px] sm:text-[21px] font-medium group-hover:text-accent-ink leading-tight">{c.title}</span>
                    <span className="block text-sm text-muted mt-0.5">{TOPICS[c.topic].label}</span>
                  </span>
                  {open ? <ArrowRight size={16} className="text-muted" /> : <span className="flex items-center gap-1.5 text-faint"><Lock size={13} /><ProTag /></span>}
                </Link>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}

function StoryCell({ c, read, className }: { c: Concept; read: boolean; className: string }) {
  return (
    <Link to={`/app/concept/${c.slug}`} className={`group block py-6 border-b border-line md:border-b-0 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="kicker text-accent-ink">{TOPICS[c.topic].label}</span>
        {read && <Check size={13} className="text-good" />}
        {c.pro && <span className="ml-auto"><ProTag /></span>}
      </div>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[28px] sm:text-[32px] leading-[1.05] font-semibold tracking-[-0.02em] group-hover:text-accent-ink transition-colors">{c.title}</h3>
      <p className="mt-3 text-[16px] font-[family-name:var(--font-serif)] text-ink-2 leading-snug">{c.dek}</p>
      <p className="mt-3 text-xs text-muted font-mono">{c.minutes} MIN · {c.difficulty.toUpperCase()}</p>
    </Link>
  )
}

function PillarCard({ to, n, title, body, done, total }: { to: string; n: string; title: string; body: string; done: number; total: number }) {
  return (
    <Link to={to} className="bg-paper hover:bg-card p-6 sm:p-8 group flex flex-col">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-accent">{n}</span>
        <span className="font-mono text-xs text-muted">{done}/{total}</span>
      </div>
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-ink-2">{body}</p>
      <div className="mt-5 flex gap-1">{Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 flex-1 ${i < done ? 'bg-accent' : 'bg-line'}`} />)}</div>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold group-hover:text-accent-ink">{done >= total ? 'Review' : done ? 'Continue' : 'Start'} <ArrowRight size={15} /></span>
    </Link>
  )
}
