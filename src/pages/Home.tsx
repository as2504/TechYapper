import { Link } from 'react-router-dom'
import { ArrowRight, Check, FileText, Mic, Swords, BookOpen, MessageSquare, Trophy, Flame } from 'lucide-react'
import { useLibrary } from '../lib/content'
import { useAuth } from '../lib/auth'
import { useProgress, useStats } from '../lib/progress'
import { useDaily } from '../lib/useDaily'
import { useLeaderboard, useTrending } from '../lib/community'
import { addDays, dateKey, dayNumber } from '../lib/dates'
import { symbolOf, useMastery } from '../lib/mastery'
import { SearchBox } from '../components/SearchBox'
import { PeriodicTable } from '../components/PeriodicTable'
import { ProTag } from '../components/ProLock'

export default function Home() {
  const lib = useLibrary()
  const { guest } = useAuth()
  const { activities, isPro } = useProgress()
  const stats = useStats()
  const d = useDaily()
  const { rusty, counts } = useMastery()
  const week = useLeaderboard('week')
  const trending = useTrending()
  const key = dateKey()
  const topic = lib.techs.length ? lib.techs[((dayNumber(key) % lib.techs.length) + lib.techs.length) % lib.techs.length] : null
  const me = week.rows?.find((r) => r.is_me)
  const todays = activities.filter((a) => a.activity_date === key)

  const steps = [
    { id: 'learn', icon: BookOpen, label: 'Learn', detail: topic ? topic.title : '', done: todays.some((a) => ['topic', 'tcheck', 'say'].includes(a.kind)), to: topic ? `/app/yap/${topic.slug}` : '/app/explore' },
    { id: 'say', icon: MessageSquare, label: 'Explain it', detail: 'In your head, typed or out loud', done: todays.some((a) => a.kind === 'say'), to: topic ? `/app/yap/${topic.slug}?card=turn` : '/app/explore' },
    { id: 'battle', icon: Swords, label: 'Battle', detail: `${d.progress.battle}/${d.questions.length} questions`, done: d.progress.battle >= d.questions.length, to: '/app/battle' },
  ]
  const doneN = steps.filter((s) => s.done).length
  const nextStep = steps.find((s) => !s.done)
  const days = Array.from({ length: 7 }, (_, i) => addDays(key, i - 6))
  const trend = trending?.length ? trending.map((r) => ({ t: lib.techBySlug.get(r.slug), n: r.learners })).filter((x) => x.t).slice(0, 5) : null
  const picks = trend ?? lib.techs.filter((t) => t.popular).slice(0, 5).map((t) => ({ t, n: 0 }))

  return (
    <div className="px-5 sm:px-10 lg:px-14 py-8 sm:py-14 max-w-[1080px]">
      {/* Today */}
      <section className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-14 items-center">
        <div className="hidden md:block"><Ring done={doneN} /></div>
        <div>
          <div className="flex items-center gap-4">
            <div className="md:hidden w-[76px] shrink-0"><Ring done={doneN} small /></div>
            <div>
              <p className="kicker text-faint">Today</p>
              <h1 className="display text-[32px] sm:text-[52px] font-semibold mt-2">
                {doneN === 3 ? 'Ring closed.' : doneN ? `${3 - doneN} to go.` : 'Two minutes. Three steps.'}
              </h1>
            </div>
          </div>
          <ol className="mt-6 grid gap-2">
            {steps.map((s) => (
              <li key={s.id}>
                <Link to={s.to} className={`group flex items-center gap-4 px-4 py-3 rounded-[4px] border transition-colors ${s.done ? 'border-line bg-paper' : s === nextStep ? 'border-ink bg-card' : 'border-line bg-card hover:border-ink-2'}`}>
                  <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${s.done ? 'bg-good text-paper' : s === nextStep ? 'bg-accent text-white' : 'bg-paper-2 text-ink-2'}`}>{s.done ? <Check size={16} strokeWidth={3} /> : <s.icon size={16} />}</span>
                  <span className="flex-1 min-w-0">
                    <span className={`block font-semibold ${s.done ? 'text-muted line-through decoration-1' : ''}`}>{s.label}</span>
                    <span className="block text-sm text-muted truncate">{s.detail}</span>
                  </span>
                  {!s.done && <ArrowRight size={16} className="text-muted group-hover:text-ink" />}
                </Link>
              </li>
            ))}
          </ol>
          {nextStep && <Link to={nextStep.to} className="btn btn-accent mt-5 w-full sm:w-auto">{doneN ? 'Continue' : "Start today's yap"} · 2 min <ArrowRight size={16} /></Link>}
        </div>
      </section>

      {/* Week + standing */}
      <section className="mt-12 grid sm:grid-cols-[1fr_auto] gap-6 items-center panel p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 w-full sm:w-auto sm:mr-2">
            <Flame size={22} className={stats.activeToday ? 'text-accent' : 'text-faint'} />
            <p className="text-sm whitespace-nowrap"><strong>{stats.streak}-day streak</strong><span className="text-muted"> · best {stats.longest}</span></p>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {days.map((day) => {
              const on = stats.byDay.has(day)
              return (
                <div key={day} className="text-center">
                  <span className={`block w-8 h-8 sm:w-9 sm:h-9 rounded-full ${on ? 'bg-accent' : day === key ? 'border-2 border-dashed border-line-2' : 'bg-paper-2'}`} />
                  <span className="block mt-1 text-[10px] text-faint font-mono">{new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
                </div>
              )
            })}
          </div>

        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link to="/app/duel" className="flex items-center gap-2 text-sm font-semibold hover:text-accent-ink"><Swords size={17} className="text-accent" /> Duel a friend</Link>
        <Link to="/app/leaderboard" className="flex items-center gap-3 text-sm hover:text-accent-ink">
          <Trophy size={18} className="text-accent" />
          {me ? <span><strong>#{me.rank}</strong> this week · {me.xp} XP</span> : <span className="text-muted">{guest ? 'Sign up to join a league' : 'See your league'}</span>}
        </Link>
        </div>
      </section>

      {/* Rusty */}
      {rusty.length > 0 && (
        <section className="mt-12">
          <Head title="Getting rusty" sub="Refresh before they fade. 30 seconds each." />
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rusty.slice(0, 4).map((t) => (
              <li key={t.slug}>
                <Link to={`/app/yap/${t.slug}?card=turn`} className="group flex items-center gap-3 p-3 rounded-[4px] bg-rust-wash border-2 border-dashed border-rust hover:border-solid">
                  <span className="font-[family-name:var(--font-display)] text-[24px] font-semibold w-10 text-center">{symbolOf(t)}</span>
                  <span className="min-w-0"><span className="block text-sm font-semibold truncate">{t.title}</span><span className="block text-xs text-muted">Refresh</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Your table */}
      <section className="mt-14">
        <Head title="Your table" sub={`${counts[2] + counts[3]} of ${lib.techs.length} lit`} to="/app/explore" more="Open" />
        <div className="mt-5"><PeriodicTable size="sm" /></div>
      </section>

      {/* Find + more */}
      <section className="mt-14">
        <Head title="Yap about something else" />
        <div className="mt-5 max-w-2xl"><SearchBox size="md" /></div>
      </section>

      <section className="mt-14 grid lg:grid-cols-2 gap-12">
        <div>
          <Head title={trend ? 'Trending' : 'Popular'} />
          <ol className="mt-2 divide-y divide-line">
            {picks.map(({ t, n }) => (
              <li key={t!.slug}>
                <Link to={`/app/yap/${t!.slug}`} className="group flex items-center gap-3 py-2.5">
                  <span className="w-9 text-center font-[family-name:var(--font-display)] text-[18px] font-semibold text-accent">{symbolOf(t!)}</span>
                  <span className="flex-1 font-medium group-hover:text-accent-ink">{t!.title}</span>
                  <span className="text-xs text-muted">{n ? `${n} learning` : ''}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <Head title="Your work" />
          <ul className="mt-2 divide-y divide-line">
            <Tool to="/app/project-yap" icon={Mic} title="Project Yapping" body="Rehearse explaining your project." pro={!isPro} />
            <Tool to="/app/resume-yap" icon={FileText} title="Resume Yapping" body="Turn your work into resume bullets." pro={!isPro} />
          </ul>
        </div>
      </section>
    </div>
  )
}

function Ring({ done, small }: { done: number; small?: boolean }) {
  const r = 70
  const c = 2 * Math.PI * r
  const seg = c / 3
  return (
    <div className={`relative ${small ? 'w-[76px] h-[76px]' : 'w-[200px] h-[200px]'}`} aria-label={`${done} of 3 steps done today`}>
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="90" cy="90" r={r} fill="none" strokeWidth="16" strokeLinecap="round"
            stroke={i < done ? 'var(--color-accent)' : 'var(--color-line)'}
            strokeDasharray={`${seg - 10} ${c - seg + 10}`} strokeDashoffset={-i * seg} style={{ transition: 'stroke .4s' }} />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className={`font-[family-name:var(--font-display)] font-semibold leading-none ${small ? 'text-[22px]' : 'text-[48px]'}`}>{done}<span className={`text-faint ${small ? 'text-[13px]' : 'text-[28px]'}`}>/3</span></p>
          {!small && <p className="text-xs text-muted mt-1">today</p>}
        </div>
      </div>
    </div>
  )
}

function Head({ title, sub, to, more }: { title: string; sub?: string; to?: string; more?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-2 pb-2.5">
      <h2 className="font-[family-name:var(--font-display)] text-[21px] sm:text-[23px] font-semibold tracking-[-0.015em]">{title}{sub && <span className="ml-3 font-sans text-sm font-normal text-muted">{sub}</span>}</h2>
      {to && <Link to={to} className="text-sm font-medium text-muted hover:text-ink shrink-0">{more} →</Link>}
    </div>
  )
}

function Tool({ to, icon: Icon, title, body, pro }: { to: string; icon: typeof Mic; title: string; body: string; pro: boolean }) {
  return (
    <li>
      <Link to={to} className="group flex items-center gap-4 py-3.5">
        <Icon size={19} className="text-accent shrink-0" />
        <span className="flex-1"><span className="flex items-center gap-2 font-semibold group-hover:text-accent-ink">{title}{pro && <ProTag />}</span><span className="block text-sm text-muted">{body}</span></span>
        <ArrowRight size={15} className="text-faint" />
      </Link>
    </li>
  )
}
