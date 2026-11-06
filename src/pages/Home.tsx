import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, FileText, Mic, Swords, Code2, Trophy } from 'lucide-react'
import { useLibrary } from '../lib/content'
import { useAuth } from '../lib/auth'
import { readRecent, useProgress, useStats } from '../lib/progress'
import { useDaily } from '../lib/useDaily'
import { useLeaderboard, useTrending } from '../lib/community'
import { dateKey, dayNumber } from '../lib/dates'
import { CATEGORIES } from '../content/types'
import { SearchBox } from '../components/SearchBox'
import { ProTag } from '../components/ProLock'

export default function Home() {
  const lib = useLibrary()
  const { displayName, guest } = useAuth()
  const { find, isPro } = useProgress()
  const stats = useStats()
  const d = useDaily()
  const week = useLeaderboard('week')
  const trending = useTrending()
  const today = lib.techs.length ? lib.techs[((dayNumber(dateKey()) % lib.techs.length) + lib.techs.length) % lib.techs.length] : null
  const recent = useMemo(() => readRecent().map((r) => lib.techBySlug.get(r.slug)).filter(Boolean).slice(0, 4), [lib])
  const me = week.rows?.find((r) => r.is_me)
  const trend = trending?.length ? trending.map((r) => ({ t: lib.techBySlug.get(r.slug), n: r.learners })).filter((x) => x.t).slice(0, 5) : null
  const picks = trend ?? lib.techs.filter((t) => t.popular).slice(0, 5).map((t) => ({ t, n: 0 }))

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-14 max-w-[1120px]">
      {/* Discover */}
      <section>
        <p className="kicker text-muted">{guest ? 'Welcome' : `Hi ${displayName.split(' ')[0]}`}{stats.streak > 0 && ` · ${stats.streak}-day streak`}</p>
        <h1 className="display text-[40px] sm:text-[64px] font-semibold mt-3 max-w-3xl">What do you want to yap about today?</h1>
        <p className="mt-3 text-[17px] sm:text-[19px] text-ink-2 max-w-2xl">Discover technology, understand the concepts, and learn how to talk about them.</p>
        <div className="mt-7 max-w-3xl"><SearchBox /></div>
      </section>

      {/* Continue */}
      {recent.length > 0 && (
        <section className="mt-14">
          <SectionHead title="Continue yapping" />
          <ul className="grid grid-cols-2 lg:grid-cols-4 border-l border-line">
            {recent.map((t) => {
              const done = !!find('topic', t!.slug)
              const iqs = t!.interview.filter((q) => find('iq', q.id)).length
              return (
                <li key={t!.slug} className="border-r border-b border-line">
                  <Link to={`/app/yap/${t!.slug}`} className="group block p-4 sm:p-5 hover:bg-card h-full">
                    <p className="font-[family-name:var(--font-display)] text-[20px] sm:text-[22px] font-semibold leading-tight group-hover:text-accent-ink">{t!.title}</p>
                    <p className="mt-2 font-mono text-[11px] text-muted uppercase tracking-wider">{done ? <span className="text-good inline-flex items-center gap-1"><Check size={11} /> Can yap</span> : 'In progress'} · {iqs}/{t!.interview.length} Qs</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Today's yap + daily challenges */}
      <section className="mt-14 grid lg:grid-cols-[1.5fr_1fr] gap-px bg-ink border border-ink">
        {today && (
          <Link to={`/app/yap/${today.slug}`} className="group bg-paper hover:bg-card p-6 sm:p-9 flex flex-col">
            <p className="kicker text-accent-ink">Today's yap</p>
            <h2 className="display text-[40px] sm:text-[52px] font-semibold mt-3 group-hover:text-accent-ink">{today.title}</h2>
            <p className="mt-3 font-[family-name:var(--font-serif)] text-[18px] text-ink-2 leading-snug">{today.tagline}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold">{find('topic', today.slug) ? 'Review it' : 'Learn to talk about it'} <ArrowRight size={16} /></span>
          </Link>
        )}
        <div className="bg-paper p-6 sm:p-8">
          <p className="kicker text-muted">Daily challenges</p>
          <ul className="mt-4 divide-y divide-line">
            <Challenge to="/app/battle" icon={Swords} label="Yap Battle" detail={`${d.progress.battle}/${d.questions.length} answered`} done={d.progress.battle >= d.questions.length} />
            <Challenge to="/app/code" icon={Code2} label="Code or Explain" detail={`${d.progress.code}/${d.challenges.length} solved`} done={d.progress.code >= d.challenges.length} />
            {d.concepts[0] && <Challenge to={`/app/concept/${d.concepts[0].slug}`} icon={BookOpen} label="Today's deep read" detail={d.concepts[0].title} done={!!find('read', d.concepts[0].slug)} />}
            <Challenge to="/app/leaderboard" icon={Trophy} label="This week's ranking" detail={me ? `You're #${me.rank} · ${me.xp} XP` : guest ? 'Create an account to rank' : 'Earn XP to get ranked'} done={false} />
          </ul>
        </div>
      </section>

      {/* Explore */}
      <section className="mt-14">
        <SectionHead title="Explore topics" to="/app/explore" more="All topics" />
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
          {CATEGORIES.map((c) => {
            const items = lib.techs.filter((t) => t.category === c.id)
            if (!items.length) return null
            return (
              <li key={c.id} className="py-4 border-b border-line">
                <Link to={`/app/explore#${c.id}`} className="font-semibold hover:text-accent-ink">{c.label}</Link>
                <p className="mt-1.5 text-[15px] text-muted leading-relaxed">
                  {items.map((t, i) => <span key={t.slug}>{i > 0 && ' · '}<Link to={`/app/yap/${t.slug}`} className="hover:text-ink hover:underline underline-offset-4">{t.title}</Link></span>)}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Trending + career tools */}
      <section className="mt-14 grid lg:grid-cols-2 gap-12">
        <div>
          <SectionHead title={trend ? 'Trending this week' : 'Popular picks'} />
          <ol className="divide-y divide-line">
            {picks.map(({ t, n }, i) => (
              <li key={t!.slug}>
                <Link to={`/app/yap/${t!.slug}`} className="group grid grid-cols-[28px_1fr_auto] items-baseline gap-3 py-3">
                  <span className="font-mono text-sm text-accent">{i + 1}</span>
                  <span className="font-semibold group-hover:text-accent-ink">{t!.title}</span>
                  <span className="font-mono text-[11px] text-muted">{n ? `${n} yapper${n > 1 ? 's' : ''}` : t!.level.toUpperCase()}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <SectionHead title="Talk about your own work" />
          <ul className="divide-y divide-line">
            <Tool to="/app/project-yap" icon={Mic} title="Project Yapping" body="Turn your project into a clear, honest explanation for interviews." pro={!isPro} />
            <Tool to="/app/resume-yap" icon={FileText} title="Resume Yapping" body="Turn what you did into ATS-friendly resume bullets, without inventing anything." pro={!isPro} />
          </ul>
        </div>
      </section>
    </div>
  )
}

function SectionHead({ title, to, more }: { title: string; to?: string; more?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-1">
      <h2 className="font-[family-name:var(--font-display)] text-[24px] sm:text-[26px] font-semibold tracking-[-0.02em]">{title}</h2>
      {to && <Link to={to} className="text-sm font-medium underline underline-offset-4">{more}</Link>}
    </div>
  )
}

function Challenge({ to, icon: Icon, label, detail, done }: { to: string; icon: typeof Swords; label: string; detail: string; done: boolean }) {
  return (
    <li>
      <Link to={to} className="group flex items-center gap-4 py-3.5">
        <span className={`w-9 h-9 grid place-items-center border ${done ? 'bg-ink border-ink text-paper' : 'border-line-2 text-ink-2'}`}>{done ? <Check size={16} /> : <Icon size={16} />}</span>
        <span className="flex-1"><span className="block font-semibold group-hover:text-accent-ink">{label}</span><span className="block text-sm text-muted font-mono">{detail}</span></span>
        <ArrowRight size={15} className="text-faint" />
      </Link>
    </li>
  )
}

function Tool({ to, icon: Icon, title, body, pro }: { to: string; icon: typeof Mic; title: string; body: string; pro: boolean }) {
  return (
    <li>
      <Link to={to} className="group flex items-start gap-4 py-4">
        <Icon size={20} className="text-accent mt-0.5 shrink-0" />
        <span className="flex-1"><span className="flex items-center gap-2 font-semibold group-hover:text-accent-ink">{title}{pro && <ProTag />}</span><span className="block text-[15px] text-muted mt-0.5">{body}</span></span>
        <ArrowRight size={15} className="text-faint mt-1" />
      </Link>
    </li>
  )
}
