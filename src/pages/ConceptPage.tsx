import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, Lock, Quote, Share2 } from 'lucide-react'
import { useLibrary } from '../lib/content'
import { useDaily } from '../lib/useDaily'
import { useProgress, XP } from '../lib/progress'
import { TOPICS } from '../content/types'
import { Markdown, inline } from '../components/Markdown'
import { Explanation, Options, QuizPrompt } from '../components/Quiz'
import { ProLock, ProTag } from '../components/ProLock'
import NotFound from './NotFound'

const LEVELS = [
  { key: 'basics', n: '01', label: 'The Basics', sub: 'First encounter' },
  { key: 'hood', n: '02', label: 'Under the Hood', sub: 'How it works' },
  { key: 'deep', n: '03', label: 'Deep Dive', sub: 'Trade-offs & architecture' },
] as const
type LevelKey = (typeof LEVELS)[number]['key']

export default function ConceptPage() {
  const { slug = '' } = useParams()
  const lib = useLibrary()
  const { canRead } = useDaily()
  const { isPro, saved, toggleSave, find, record } = useProgress()
  const c = lib.bySlug.get(slug)
  const [level, setLevel] = useState<LevelKey>('basics')
  const [shared, setShared] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setLevel('basics') }, [slug])
  if (!c) return <NotFound inApp />

  const open = canRead(c.slug)
  const isSaved = saved.includes(c.slug)
  const readAct = find('read', c.slug)
  const checkAct = find('check', c.slug)
  const deepLocked = c.pro && !isPro
  const idx = LEVELS.findIndex((l) => l.key === level)

  const goLevel = (k: LevelKey) => {
    setLevel(k)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const markRead = () => record({ kind: 'read', item_id: c.slug, correct: null, choice: null, xp: XP.read })
  const answerCheck = (i: number) => {
    record({ kind: 'check', item_id: c.slug, correct: i === c.check.answer, choice: i, xp: i === c.check.answer ? XP.check : XP.attempt })
    if (!readAct) markRead()
  }
  const share = async () => {
    const text = `“${c.yap}” — today's yap on TechYapper`
    try {
      if (navigator.share) await navigator.share({ title: c.title, text, url: location.origin })
      else { await navigator.clipboard.writeText(`${text} ${location.origin}`); setShared(true); setTimeout(() => setShared(false), 1600) }
    } catch { /* cancelled */ }
  }

  return (
    <article className="px-5 sm:px-10 lg:px-14 py-10 sm:py-16 max-w-[1180px]">
      <div className="flex items-center justify-between">
        <Link to="/app" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Today</Link>
        <div className="flex items-center gap-1">
          <button onClick={share} className="btn btn-quiet text-sm" aria-label="Share the yap line"><Share2 size={16} /> <span className="hidden sm:inline">{shared ? 'Copied' : 'Share'}</span></button>
          <button onClick={() => toggleSave(c.slug)} className={`btn btn-quiet text-sm ${isSaved ? '!text-accent-ink' : ''}`} aria-pressed={isSaved}>
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <header className="mt-6 sm:mt-10 max-w-[860px]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="kicker text-accent-ink">{TOPICS[c.topic].label}</span>
          <span className="kicker text-muted">{c.minutes} min read · {c.difficulty}</span>
          {readAct && <span className="chip !border-good !text-good"><Check size={11} /> Read</span>}
        </div>
        <h1 className="display text-[44px] sm:text-[76px] font-semibold mt-4">{c.title}</h1>
        <p className="mt-5 text-[20px] sm:text-[24px] leading-snug font-[family-name:var(--font-serif)] text-ink-2">{c.dek}</p>
      </header>

      {!open ? (
        <div className="mt-10 max-w-[720px]">
          <p className="prose-yap first-letter:font-[family-name:var(--font-display)] first-letter:text-[64px] first-letter:float-left first-letter:leading-[.8] first-letter:mr-2 first-letter:mt-1.5 first-letter:font-semibold">{inline(c.hook)}</p>
          <div className="mt-8"><ProLock title="This yap is in the archive" body={`Free members get today's yaps plus the last few days. Pro opens all ${lib.concepts.length} concepts, every Deep Dive and the interview tracks.`} /></div>
        </div>
      ) : (
        <div className="mt-10 grid lg:grid-cols-[minmax(0,720px)_1fr] gap-10 lg:gap-14">
          <div className="min-w-0">
            <p className="prose-yap first-letter:font-[family-name:var(--font-display)] first-letter:text-[64px] first-letter:float-left first-letter:leading-[.8] first-letter:mr-2 first-letter:mt-1.5 first-letter:font-semibold">{inline(c.hook)}</p>

            {/* Level switcher */}
            <div ref={topRef} className="scroll-mt-16 lg:scroll-mt-4" />
            <nav className="sticky top-14 lg:top-0 z-20 bg-paper mt-10 border-y border-ink grid grid-cols-3" aria-label="Knowledge level">
              {LEVELS.map((l, i) => {
                const locked = l.key === 'deep' && deepLocked
                const active = level === l.key
                return (
                  <button key={l.key} onClick={() => goLevel(l.key)} aria-current={active}
                    className={`text-left py-3 px-2 sm:px-4 ${i ? 'border-l border-line' : ''} ${active ? 'bg-ink text-paper' : 'hover:bg-paper-2'}`}>
                    <span className={`font-mono text-[11px] ${active ? 'text-accent' : 'text-muted'}`}>LEVEL {l.n}</span>
                    <span className="flex items-center gap-1.5 font-semibold text-[13px] sm:text-[15px] leading-tight mt-0.5">{l.label}{locked && <Lock size={12} />}</span>
                    <span className={`hidden sm:block text-xs ${active ? 'text-paper/70' : 'text-muted'}`}>{l.sub}</span>
                  </button>
                )
              })}
            </nav>

            <div className="mt-8" key={level}>
              {level === 'deep' && deepLocked ? (
                <ProLock title="Deep Dive is a Pro level" body="Architecture, trade-offs and the details interviewers dig for. Levels 1 and 2 stay free, always." />
              ) : (
                <div className="rise"><Markdown source={c[level]} /></div>
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              {idx > 0 ? <button onClick={() => goLevel(LEVELS[idx - 1].key)} className="btn btn-quiet text-sm"><ArrowLeft size={15} /> {LEVELS[idx - 1].label}</button> : <span />}
              {idx < 2 && <button onClick={() => goLevel(LEVELS[idx + 1].key)} className="btn btn-primary">Level {LEVELS[idx + 1].n}: {LEVELS[idx + 1].label} <ArrowRight size={15} /></button>}
            </div>

            {/* Misconceptions */}
            <section className="mt-14">
              <h2 className="section-title">Common misconceptions</h2>
              <dl className="divide-y divide-line">
                {c.myths.map((m, i) => (
                  <div key={i} className="py-5 grid sm:grid-cols-2 gap-2 sm:gap-8">
                    <dt className="text-[17px] leading-snug"><span className="font-mono text-xs text-bad mr-2">MYTH</span><span className="line-through decoration-bad/40 [&_code]:inline-code">{inline(m.myth)}</span></dt>
                    <dd className="text-[17px] leading-snug text-ink-2 [&_code]:inline-code"><span className="font-mono text-xs text-good mr-2">ACTUALLY</span>{inline(m.truth)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Knowledge check */}
            <section className="mt-12 border border-ink p-5 sm:p-8 bg-card">
              <div className="flex items-center justify-between mb-4">
                <p className="kicker text-accent-ink">Quick knowledge check</p>
                <span className="kicker text-muted">+{XP.check} XP</span>
              </div>
              <QuizPrompt quiz={c.check} size="md" />
              <Options quiz={c.check} chosen={checkAct?.choice ?? null} onChoose={answerCheck} />
              {checkAct?.choice != null && <Explanation quiz={c.check} chosen={checkAct.choice} xp={checkAct.xp} />}
            </section>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {readAct ? (
                <p className="text-sm text-good font-semibold flex items-center gap-2"><Check size={16} /> In your knowledge log · +{readAct.xp} XP</p>
              ) : (
                <button onClick={markRead} className="btn btn-primary"><Check size={16} /> Mark as read · +{XP.read} XP</button>
              )}
              <Link to="/app/battle" className="text-sm font-semibold underline underline-offset-4">Next: today's battle</Link>
            </div>
          </div>

          {/* Margin column */}
          <aside className="grid gap-10 content-start lg:sticky lg:top-6">
            <div className="bg-ink text-paper p-6">
              <Quote className="text-accent" size={22} />
              <p className="mt-3 font-[family-name:var(--font-display)] italic text-[22px] leading-[1.25]">{c.yap}</p>
              <p className="kicker text-paper/60 mt-4">Your line for tomorrow's standup</p>
            </div>
            <Margin title="Interesting facts" items={c.facts} />
            <Margin title="In the real world" items={c.realWorld} />
            {c.related.length > 0 && (
              <div>
                <h3 className="section-title">Related yaps</h3>
                <ul className="divide-y divide-line">
                  {c.related.map((r) => lib.bySlug.get(r)).filter(Boolean).map((r) => (
                    <li key={r!.slug}>
                      <Link to={`/app/concept/${r!.slug}`} className="flex items-center justify-between py-3 group gap-3">
                        <span>
                          <span className="block text-xs text-muted">{TOPICS[r!.topic].label}</span>
                          <span className="font-[family-name:var(--font-display)] text-[17px] font-medium group-hover:text-accent-ink leading-tight">{r!.title}</span>
                        </span>
                        {canRead(r!.slug) ? <ArrowRight size={15} className="text-muted shrink-0" /> : <ProTag />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}
    </article>
  )
}

function Margin({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <h3 className="section-title">{title}</h3>
      <ul className="divide-y divide-line">
        {items.map((f, i) => (
          <li key={i} className="py-3 text-[15px] leading-relaxed text-ink-2 flex gap-3 [&_code]:inline-code">
            <span className="font-mono text-xs text-muted pt-1">{String(i + 1).padStart(2, '0')}</span><span>{inline(f)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
