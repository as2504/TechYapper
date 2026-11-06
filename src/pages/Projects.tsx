import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Lock, MessageSquareQuote } from 'lucide-react'
import { PageHead } from '../components/AppShell'
import { PROJECTS, PERSONAS, type Persona } from '../content/projects'
import { TOPICS } from '../content/types'
import { useLibrary } from '../lib/content'
import { useProgress } from '../lib/progress'
import { ProLock, ProTag } from '../components/ProLock'
import NotFound from './NotFound'

export function ProjectsIndex() {
  const { bySlug } = useLibrary()
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1180px]">
      <PageHead kicker="Pro · From theory to something you built" title={<>Yap <em className="font-normal">Projects</em></>}
        dek="You've learned the concepts. Now get a real project to build and talk about — tailored for a student portfolio, your day job, or an interview whiteboard." />
      <ul className="mt-2 divide-y divide-line">
        {PROJECTS.map((p, i) => (
          <li key={p.slug}>
            <Link to={`/app/projects/${p.slug}`} className="grid sm:grid-cols-[80px_1fr_auto] gap-3 sm:gap-6 py-8 group items-start">
              <span className="display text-[44px] font-semibold text-accent leading-none">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span className="kicker text-accent-ink">{TOPICS[p.topic].label}</span>
                <span className="block mt-2 font-[family-name:var(--font-display)] text-[28px] sm:text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] group-hover:text-accent-ink">{p.title}</span>
                <span className="block mt-3 text-[17px] font-[family-name:var(--font-serif)] text-ink-2 max-w-2xl">{p.dek}</span>
                <span className="mt-4 flex flex-wrap gap-2">
                  {p.concepts.map((s) => bySlug.get(s)).filter(Boolean).map((c) => <span key={c!.slug} className="chip">{c!.title}</span>)}
                </span>
              </span>
              <span className="hidden sm:flex items-center gap-2 self-center"><ProTag /><ArrowRight size={18} className="text-muted" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProjectDetail() {
  const { slug } = useParams()
  const { bySlug } = useLibrary()
  const { isPro } = useProgress()
  const [persona, setPersona] = useState<Persona>('student')
  const p = PROJECTS.find((x) => x.slug === slug)
  if (!p) return <NotFound inApp />
  const v = p.variants[persona]

  return (
    <article className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1180px]">
      <Link to="/app/projects" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All projects</Link>
      <header className="mt-6 max-w-[860px]">
        <div className="flex items-center gap-3"><span className="kicker text-accent-ink">Yap Project · {TOPICS[p.topic].label}</span><ProTag /></div>
        <h1 className="display text-[40px] sm:text-[64px] font-semibold mt-4">{p.title}</h1>
        <p className="mt-5 text-[19px] sm:text-[22px] leading-snug font-[family-name:var(--font-serif)] text-ink-2">{p.dek}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="kicker text-muted self-center mr-1">Built on</span>
          {p.concepts.map((s) => bySlug.get(s)).filter(Boolean).map((c) => <Link key={c!.slug} to={`/app/concept/${c!.slug}`} className="chip hover:border-ink">{c!.title}</Link>)}
        </div>
      </header>

      {/* Persona switcher */}
      <div className="mt-10 border-y border-ink grid grid-cols-3" role="tablist" aria-label="Who is this for">
        {(Object.keys(PERSONAS) as Persona[]).map((k, i) => (
          <button key={k} role="tab" aria-selected={persona === k} onClick={() => setPersona(k)}
            className={`text-left py-3 px-3 sm:px-5 ${i ? 'border-l border-line' : ''} ${persona === k ? 'bg-ink text-paper' : 'hover:bg-paper-2'}`}>
            <span className={`font-mono text-[11px] ${persona === k ? 'text-accent' : 'text-muted'}`}>FOR</span>
            <span className="block font-semibold text-[14px] sm:text-[16px]">{PERSONAS[k].label}</span>
            <span className={`hidden sm:block text-xs ${persona === k ? 'text-paper/70' : 'text-muted'}`}>{PERSONAS[k].blurb}</span>
          </button>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-10 lg:gap-14" key={persona}>
        <div className="min-w-0">
          <h2 className="kicker text-accent-ink border-b border-ink pb-2">The brief</h2>
          <p className="mt-4 text-[20px] font-[family-name:var(--font-serif)] leading-snug">{v.scope}</p>
          <div className="mt-4 flex flex-wrap gap-2">{v.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>

          <h2 className="kicker text-accent-ink border-b border-ink pb-2 mt-12">Architecture</h2>
          <dl className="divide-y divide-line">
            {p.architecture.map((a) => (
              <div key={a.part} className="py-3 grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-6">
                <dt className="font-semibold">{a.part}</dt><dd className="text-ink-2">{a.role}</dd>
              </div>
            ))}
          </dl>

          <h2 className="kicker text-accent-ink border-b border-ink pb-2 mt-12">Build it in {v.milestones.length} milestones</h2>
          <ol className="divide-y divide-line">
            {v.milestones.map((m, i) => {
              const locked = !isPro && i > 0
              return (
                <li key={m.title} className={`py-5 grid grid-cols-[44px_1fr] gap-4 ${locked ? 'select-none' : ''}`}>
                  <span className="display text-[32px] font-semibold text-accent leading-none">{i + 1}</span>
                  <span>
                    <span className="font-semibold text-[17px] flex items-center gap-2">{m.title}{locked && <Lock size={13} className="text-faint" />}</span>
                    <span className={`block mt-1 text-ink-2 leading-relaxed ${locked ? 'blur-[5px]' : ''}`} aria-hidden={locked}>{m.detail}</span>
                  </span>
                </li>
              )
            })}
          </ol>
          {!isPro && <div className="mt-6"><ProLock compact title="Get the full build plan and the talking points" body="Every milestone, the 30-second pitch, and the follow-up questions interviewers ask — for all three personas." /></div>}
        </div>

        <aside className="grid gap-8 content-start lg:sticky lg:top-6">
          {isPro ? (
            <>
              <div className="bg-ink text-paper p-6">
                <MessageSquareQuote className="text-accent" size={22} />
                <p className="kicker text-paper/60 mt-3">Your 30-second yap</p>
                <p className="mt-2 font-[family-name:var(--font-display)] italic text-[20px] leading-[1.3]">{v.pitch}</p>
              </div>
              <div>
                <h3 className="kicker text-accent-ink border-b border-ink pb-2">Talking points</h3>
                <ul className="divide-y divide-line">{v.talkingPoints.map((t) => <li key={t} className="py-3 text-[15px] text-ink-2">{t}</li>)}</ul>
              </div>
              <div>
                <h3 className="kicker text-accent-ink border-b border-ink pb-2">Follow-ups they'll ask</h3>
                <dl className="divide-y divide-line">
                  {v.followUps.map((f) => (
                    <div key={f.q} className="py-3"><dt className="font-semibold text-[15px]">{f.q}</dt><dd className="mt-1 text-[14px] text-ink-2 leading-relaxed">{f.a}</dd></div>
                  ))}
                </dl>
              </div>
            </>
          ) : (
            <div className="border border-line-2 p-6 bg-card">
              <p className="kicker text-muted flex items-center gap-1.5"><Lock size={11} /> Pro</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-[21px] font-semibold leading-tight">The pitch, the talking points and the follow-up questions</p>
              <p className="mt-2 text-sm text-muted">{v.talkingPoints.length} talking points · {v.followUps.length} follow-ups with answers</p>
              <Link to="/app/upgrade" className="btn btn-accent mt-5 w-full">Unlock Pro</Link>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
