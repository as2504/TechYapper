import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Copy, ExternalLink, Lock, MessageSquareQuote } from 'lucide-react'
import { useLibrary } from '../lib/content'
import { pushRecent, useProgress, XP } from '../lib/progress'
import { CATEGORIES, type InterviewQ, type Tech } from '../content/types'
import { inline, Markdown } from '../components/Markdown'
import { Explanation, Options, QuizPrompt } from '../components/Quiz'
import { ProTag } from '../components/ProLock'
import { LevelChip } from './Battle'
import NotFound from './NotFound'

const TABS = [
  { id: 'understand', label: 'Understand' },
  { id: 'talk', label: 'Talk about it' },
  { id: 'deeper', label: 'Go deeper' },
  { id: 'interview', label: 'Interview' },
] as const
type TabId = (typeof TABS)[number]['id']

export default function TechPage() {
  const { slug = '' } = useParams()
  const lib = useLibrary()
  const t = lib.techBySlug.get(slug)
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some((x) => x.id === params.get('tab')) ? params.get('tab') : 'understand') as TabId
  const setTab = (id: TabId) => setParams(id === 'understand' ? {} : { tab: id }, { replace: true })

  useEffect(() => { if (t) { pushRecent(t.slug); document.title = `${t.title} · TechYapper` } return () => { document.title = 'TechYapper' } }, [t])
  if (!t) return <NotFound inApp />
  const cat = CATEGORIES.find((c) => c.id === t.category)

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1080px]">
      <nav className="kicker text-muted flex items-center gap-2" aria-label="Breadcrumb">
        <Link to="/app/explore" className="hover:text-ink">Explore</Link><span>/</span>
        <Link to={`/app/explore#${t.category}`} className="hover:text-ink">{cat?.label}</Link>
      </nav>
      <header className="mt-4">
        <h1 className="display text-[46px] sm:text-[68px] font-semibold">{t.title}</h1>
        <p className="mt-3 text-[18px] sm:text-[20px] font-[family-name:var(--font-serif)] text-ink-2 leading-snug max-w-2xl">{t.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-2"><LevelChip level={t.level} /><span className="chip">{t.minutes} min</span><span className="chip">{t.interview.length} interview Qs</span></div>
      </header>

      <SayIt t={t} />

      <div className="sticky top-14 lg:top-0 z-20 bg-paper/95 backdrop-blur mt-10 border-b border-ink -mx-4 px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label={`${t.title} sections`} className="flex overflow-x-auto no-scrollbar">
          {TABS.map((x) => (
            <button key={x.id} role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}
              className={`relative shrink-0 px-3 sm:px-5 py-3.5 text-[15px] flex items-baseline gap-2 ${tab === x.id ? 'text-ink font-semibold' : 'text-muted hover:text-ink font-medium'}`}>
              {x.label}
              {x.id === 'interview' && <span className="font-mono text-[11px] text-muted">{t.interview.length}</span>}
              {tab === x.id && <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-accent" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mt-10" role="tabpanel">
        {tab === 'understand' && <Understand t={t} />}
        {tab === 'talk' && <Talk t={t} />}
        {tab === 'deeper' && <Deeper t={t} />}
        {tab === 'interview' && <Interview t={t} />}
      </div>

      <CanYouTalk t={t} onNext={() => setTab(tab === 'understand' ? 'talk' : tab === 'talk' ? 'interview' : 'deeper')} tab={tab} />

      {t.related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title">Keep yapping</h2>
          <div className="grid sm:grid-cols-3">
            {t.related.map((r) => lib.techBySlug.get(r)).filter(Boolean).map((r, i) => (
              <Link key={r!.slug} to={`/app/yap/${r!.slug}`} className={`group py-5 border-b border-line sm:border-b-0 ${i ? 'sm:border-l sm:pl-6' : ''} sm:pr-6`}>
                <p className="font-[family-name:var(--font-display)] text-[24px] font-semibold group-hover:text-accent-ink">{r!.title}</p>
                <p className="text-sm text-muted mt-1 line-clamp-2">{r!.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ───────── The headline feature: what to actually say ───────── */
function SayIt({ t }: { t: Tech }) {
  const [len, setLen] = useState<'10' | '30'>('10')
  const [copied, setCopied] = useState(false)
  const text = len === '10' ? t.talk10 : t.talk30
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* ignore */ } }
  return (
    <section aria-label="How to talk about it" className="mt-8 bg-ink text-paper relative">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent" />
      <div className="p-6 sm:p-9 pl-7 sm:pl-11">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="kicker text-accent flex items-center gap-2"><MessageSquareQuote size={14} /> If someone asks “What is {t.title}?”</p>
          <div className="flex border border-paper/30" role="group" aria-label="Answer length">
            {(['10', '30'] as const).map((l) => (
              <button key={l} onClick={() => setLen(l)} aria-pressed={len === l}
                className={`px-3 py-1.5 font-mono text-[11px] tracking-wider ${len === l ? 'bg-paper text-ink' : 'text-paper/70 hover:text-paper'}`}>{l === '10' ? 'IN ONE BREATH' : 'IN 30 SECONDS'}</button>
            ))}
          </div>
        </div>
        <p key={len} className="mt-5 font-[family-name:var(--font-display)] text-[22px] sm:text-[28px] leading-[1.3] tracking-[-0.01em] max-w-3xl">“{text}”</p>
        <button onClick={copy} className="mt-6 inline-flex items-center gap-2 text-sm text-paper/70 hover:text-paper">
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </section>
  )
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid md:grid-cols-[200px_1fr] gap-2 md:gap-10 py-6 border-b border-line first:pt-0">
      <h2 className="font-[family-name:var(--font-display)] text-[20px] sm:text-[22px] font-semibold leading-tight" data-n={n}>{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

const P = ({ s }: { s: string }) => <Markdown source={s} className="prose-yap !text-[17px]" />

function Understand({ t }: { t: Tech }) {
  return (
    <div>
      <Block n="A" title="What is it?"><P s={t.what} /></Block>
      <Block n="B" title="Why does it exist?"><P s={t.why} /></Block>
      <Block n="C" title="How it works"><P s={t.how} /></Block>
      <Block n="D" title="Think of it like…">
        <p className="tint font-[family-name:var(--font-serif)] italic text-[19px] sm:text-[21px] leading-snug border-l-2 border-accent px-5 py-4">{t.analogy}</p>
      </Block>
      <Block n="E" title="Where you'll see it">
        <ul className="grid gap-2">{t.where.map((w) => <li key={w} className="flex gap-3 text-[16px]"><span className="mt-2.5 w-1.5 h-1.5 bg-accent rounded-full shrink-0" />{inline(w)}</li>)}</ul>
      </Block>
      <Block n="F" title={`${t.know.length} things worth knowing`}>
        <ol className="grid gap-3">{t.know.map((k, i) => (
          <li key={i} className="grid grid-cols-[28px_1fr] text-[16px] leading-relaxed"><span className="font-mono text-sm text-muted pt-0.5">{String(i + 1).padStart(2, '0')}</span><span>{inline(k)}</span></li>
        ))}</ol>
      </Block>
      {t.facts.length > 0 && (
        <Block n="G" title="Worth dropping in conversation">
          <ul className="grid gap-3">{t.facts.map((f) => <li key={f} className="text-[16px] text-ink-2 leading-relaxed">{inline(f)}</li>)}</ul>
        </Block>
      )}
    </div>
  )
}

function Talk({ t }: { t: Tech }) {
  const { find, record } = useProgress()
  const act = find('tcheck', t.slug)
  const answer = (i: number) => record({ kind: 'tcheck', item_id: t.slug, correct: i === t.check.answer, choice: i, xp: i === t.check.answer ? XP.tcheck : XP.attempt })
  return (
    <div className="grid gap-10">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-[26px] sm:text-[30px] font-semibold">When the conversation keeps going</h2>
        <p className="text-muted mt-1">The follow-ups people actually ask, and a natural way to answer.</p>
        <div className="mt-5 border-t border-line-2 divide-y divide-line">
          {t.comebacks.map((c) => (
            <div key={c.q} className="py-5 grid md:grid-cols-[1fr_1.4fr] gap-2 md:gap-8">
              <p className="font-semibold text-[17px]"><span className="kicker text-muted block mb-1">They say</span>“{c.q}”</p>
              <p className="text-[17px] text-ink-2 leading-relaxed"><span className="kicker text-accent-ink block mb-1">You say</span>{inline(c.a)}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="border border-ink bg-card p-5 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="kicker text-accent-ink">Yap check</p>
          <span className="kicker text-muted">+{XP.tcheck} XP</span>
        </div>
        <QuizPrompt quiz={t.check} size="md" />
        <Options quiz={t.check} chosen={act?.choice ?? null} onChoose={answer} />
        {act?.choice != null && <Explanation quiz={t.check} chosen={act.choice} xp={act.xp} />}
      </section>
    </div>
  )
}

function Deeper({ t }: { t: Tech }) {
  const lib = useLibrary()
  const { isPro } = useProgress()
  const concepts = t.concepts.map((c) => lib.bySlug.get(c)).filter(Boolean)
  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-10 lg:gap-14">
      <div className="min-w-0"><Markdown source={t.deeper} /></div>
      <aside className="grid gap-8 content-start">
        {concepts.length > 0 && (
          <div>
            <h3 className="section-title">Deep reads</h3>
            <ul className="divide-y divide-line">
              {concepts.map((c) => (
                <li key={c!.slug}>
                  <Link to={`/app/concept/${c!.slug}`} className="group flex items-start justify-between gap-3 py-3">
                    <span><span className="block font-semibold leading-snug group-hover:text-accent-ink">{c!.title}</span><span className="block text-xs text-muted font-mono mt-1">{c!.minutes} MIN · 3 LEVELS</span></span>
                    {c!.pro && !isPro ? <ProTag /> : <ArrowRight size={15} className="text-faint mt-1 shrink-0" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="section-title">Sources</h3>
          <ul className="divide-y divide-line">
            {t.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-3 py-3 text-sm hover:text-accent-ink">{s.title}<ExternalLink size={13} className="text-faint mt-0.5 shrink-0" /></a></li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}

function Interview({ t }: { t: Tech }) {
  const { hash } = useLocation()
  const [open, setOpen] = useState<string | null>(hash ? hash.slice(1) : t.interview[0]?.id ?? null)
  useEffect(() => {
    if (!hash) return
    setOpen(hash.slice(1))
    setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 80)
  }, [hash])
  return (
    <div>
      <p className="text-muted max-w-2xl">Questions interviewers really ask about {t.title}. For each one: the points to hit, how to say it, and what comes next.</p>
      <ol className="mt-6 border-t border-line-2">
        {t.interview.map((q, i) => <IQ key={q.id} q={q} n={i + 1} open={open === q.id} onToggle={() => setOpen(open === q.id ? null : q.id)} />)}
      </ol>
    </div>
  )
}

function IQ({ q, n, open, onToggle }: { q: InterviewQ; n: number; open: boolean; onToggle: () => void }) {
  const { isPro, find, record } = useProgress()
  const [more, setMore] = useState(false)
  const locked = q.pro && !isPro
  const done = !!find('iq', q.id)
  return (
    <li id={q.id} className="border-b border-line scroll-mt-32">
      <button onClick={onToggle} aria-expanded={open} className="w-full text-left py-5 grid grid-cols-[32px_1fr_auto] gap-2 sm:gap-4 items-start group">
        <span className="font-mono text-sm text-muted pt-1">{String(n).padStart(2, '0')}</span>
        <span>
          <span className="block font-[family-name:var(--font-display)] text-[20px] sm:text-[23px] font-semibold leading-snug group-hover:text-accent-ink">{q.q}</span>
          <span className="mt-2 flex items-center gap-2"><LevelChip level={q.level} />{q.pro && <ProTag />}{done && <span className="chip !border-good !text-good"><Check size={11} /> Practised</span>}</span>
        </span>
        <ChevronDown size={18} className={`text-muted mt-1.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (locked ? (
        <div className="pb-6 pl-0 sm:pl-12">
          <div className="border border-ink bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <Lock size={18} className="text-accent shrink-0" />
            <p className="flex-1 text-[15px]">The full answer, talking version, follow-ups and common mistakes for advanced questions are part of <strong>Pro</strong>.</p>
            <Link to="/app/upgrade" className="btn btn-accent shrink-0">See Pro</Link>
          </div>
        </div>
      ) : (
        <div className="pb-8 sm:pl-12 grid gap-7 rise">
          <div>
            <p className="kicker text-muted mb-2">The points to hit</p>
            <Markdown source={q.answer} className="prose-yap !text-[16px]" />
          </div>
          <div className="bg-paper-2 border-l-2 border-accent p-5">
            <p className="kicker text-accent-ink mb-2">Say it like this</p>
            <p className="font-[family-name:var(--font-serif)] text-[18px] leading-relaxed">“{q.short}”</p>
          </div>
          <div>
            <button onClick={() => setMore(!more)} className="text-sm font-semibold underline underline-offset-4">{more ? 'Hide' : 'Show'} the longer explanation</button>
            {more && <div className="mt-3"><Markdown source={q.detail} className="prose-yap !text-[16px]" /></div>}
          </div>
          {q.followups.length > 0 && (
            <div>
              <p className="kicker text-muted mb-2">Likely follow-ups</p>
              <ul className="divide-y divide-line border-y border-line">
                {q.followups.map((f) => <li key={f.q} className="py-3"><p className="font-semibold">{f.q}</p><p className="text-ink-2 mt-1">{inline(f.a)}</p></li>)}
              </ul>
            </div>
          )}
          {q.mistakes.length > 0 && (
            <div>
              <p className="kicker text-bad mb-2">Common mistakes</p>
              <ul className="grid gap-1.5">{q.mistakes.map((m) => <li key={m} className="flex gap-3 text-[15px]"><span className="text-bad">✕</span>{inline(m)}</li>)}</ul>
            </div>
          )}
          <div>
            <button disabled={done} onClick={() => record({ kind: 'iq', item_id: q.id, correct: null, choice: null, xp: XP.iq })} className="btn btn-ghost">
              {done ? <><Check size={16} /> Practised</> : <>I've practised saying this · +{XP.iq} XP</>}
            </button>
          </div>
        </div>
      ))}
    </li>
  )
}

function CanYouTalk({ t, tab, onNext }: { t: Tech; tab: TabId; onNext: () => void }) {
  const { find, record } = useProgress()
  const done = !!find('topic', t.slug)
  const next = useMemo(() => ({ understand: 'Practise the conversation', talk: 'Try the interview questions', interview: 'Go deeper', deeper: 'Go deeper' })[tab], [tab])
  return (
    <section className="mt-14 border-y-2 border-ink py-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
      <div className="flex-1">
        <p className="font-[family-name:var(--font-display)] text-[26px] sm:text-[30px] font-semibold leading-tight">{done ? `You can talk about ${t.title}.` : `Could you talk about ${t.title} now?`}</p>
        <p className="text-muted mt-1">{done ? 'Logged on your Yap Score. Pick another topic or go a level deeper.' : 'Be honest. Say the 30-second version out loud first.'}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {!done && <button onClick={() => record({ kind: 'topic', item_id: t.slug, correct: null, choice: null, xp: XP.topic })} className="btn btn-primary"><Check size={16} /> Yes, I can · +{XP.topic} XP</button>}
        {tab !== 'deeper' && <button onClick={() => { onNext(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="btn btn-ghost">{next} <ArrowRight size={16} /></button>}
      </div>
    </section>
  )
}
