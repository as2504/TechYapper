import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Flame, Minus } from 'lucide-react'
import { PublicNav, Footer } from '../components/PublicNav'
import { PricingTable } from '../components/Pricing'
import { useLibrary } from '../lib/content'
import { useAuth } from '../lib/auth'
import { conceptsForDay, questionsForDay } from '../lib/daily'
import { dateKey, issueNumber, prettyDate } from '../lib/dates'
import { TOPICS } from '../content/types'
import { Markdown } from '../components/Markdown'
import { Options } from '../components/Quiz'

const PILLARS = [
  { n: '01', title: "Today's Yap", body: 'Three hand-picked concepts a day. Each one in three levels — The Basics, Under the Hood, Deep Dive — with code, misconceptions and the one line worth repeating.' },
  { n: '02', title: 'Yap Battle', body: 'Five questions, beginner to advanced. One shot each. Every answer comes with the why, so wrong answers teach more than right ones.' },
  { n: '03', title: 'Code or Explain', body: 'Predict the output. Find the bug. Name the complexity. Real snippets, read like a reviewer — no compiler needed.' },
  { n: '04', title: 'Yap Score', body: 'Streak, XP, accuracy, a knowledge map by topic and a heatmap of your consistency. Proof you are actually getting sharper.' },
]

const COMPARE: [string, boolean, boolean][] = [
  ['Decides what is worth learning today', false, true],
  ['Same structure every time: basics → internals → trade-offs', false, true],
  ['Tests you, and locks your answer', false, true],
  ['Remembers what you got wrong last week', false, true],
  ['Streaks and a record of what you know', false, true],
  ['Content reviewed for accuracy, not generated on the fly', false, true],
]

export default function Landing() {
  const lib = useLibrary()
  const { enterGuest } = useAuth()
  const nav = useNavigate()
  const today = dateKey()
  const [lead] = conceptsForDay(lib.concepts, today)
  const q = questionsForDay(lib.questions, today)[0]
  const allTopics = useMemo(() => Object.values(TOPICS).map((t) => t.label), [])

  const tryIt = () => { enterGuest(); nav('/app') }

  return (
    <div className="overflow-x-clip">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-10 sm:pt-16">
        <div className="flex items-center justify-between border-b border-ink pb-2">
          <p className="kicker text-muted">Issue No. {issueNumber(today)} · {prettyDate(today)}</p>
          <p className="kicker text-muted hidden sm:block">{lib.concepts.length} concepts · {lib.questions.length + lib.challenges.length} challenges</p>
        </div>
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 pt-10 sm:pt-14">
          <div>
            <h1 className="display text-[56px] sm:text-[96px] xl:text-[112px] font-semibold">
              Learn one thing today. <em className="font-normal text-accent">Yap</em> about it tomorrow.
            </h1>
            <p className="mt-7 text-[19px] sm:text-[23px] leading-snug font-[family-name:var(--font-serif)] text-ink-2 max-w-xl">
              TechYapper is a 10-minute daily tech habit for developers. One concept explained in three levels, a five-question battle and a code challenge — so you can explain what you use, not just use it.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="btn btn-primary !h-12 !px-6 text-[15px]">Start free <ArrowRight size={17} /></Link>
              <button onClick={tryIt} className="btn btn-ghost !h-12 !px-6 text-[15px]">Read today's issue</button>
            </div>
            <p className="mt-4 text-sm text-muted">Free forever plan · no card · works on your phone</p>
          </div>
          <ProductPreview lead={lead} />
        </div>
      </section>

      {/* Topic ticker */}
      <section className="mt-16 sm:mt-24 border-y border-ink bg-ink text-paper overflow-hidden" aria-label="Topics covered">
        <div className="flex gap-10 py-4 whitespace-nowrap font-mono text-[13px] tracking-[0.12em] uppercase animate-[ticker_40s_linear_infinite] w-max">
          {[...allTopics, ...allTopics].map((t, i) => <span key={i} className="flex items-center gap-10">{t}<span className="text-accent">/</span></span>)}
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-20 sm:mt-28 grid lg:grid-cols-[1fr_1.4fr] gap-10">
        <p className="kicker text-accent-ink">The problem</p>
        <div>
          <p className="font-[family-name:var(--font-display)] text-[30px] sm:text-[44px] leading-[1.1] tracking-[-0.02em] font-medium">
            You use <code className="font-mono text-[0.75em] bg-paper-2 px-2">useEffect</code> every day. Could you explain what happens <em>after</em> render? You've heard of RAG, embeddings, delegation, MVCC. Could you hold your own if someone asked a follow-up?
          </p>
          <p className="mt-6 text-[19px] font-[family-name:var(--font-serif)] text-ink-2 max-w-2xl">Most developers know their slice deeply and everything else by name only. TechYapper closes that gap a little every day — the stuff that comes up in design reviews, interviews and good conversations.</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-20 sm:mt-28">
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <h2 className="display text-[40px] sm:text-[56px] font-semibold">The daily issue</h2>
          <p className="kicker text-muted hidden sm:block">Four pillars · one habit</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <div key={p.n} className={`py-8 pr-6 ${i ? 'lg:border-l lg:pl-6' : ''} ${i % 2 ? 'md:border-l md:pl-6 lg:pl-6' : ''} border-b lg:border-b-0 border-line`}>
              <p className="font-mono text-sm text-accent">{p.n}</p>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-[30px] font-semibold tracking-[-0.02em] leading-none">{p.title}</h3>
              <p className="mt-4 text-ink-2 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Three levels demo */}
      {lead && <LevelsDemo slug={lead.slug} />}

      {/* Battle preview */}
      {q && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-20 sm:mt-28 grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-start">
          <div>
            <p className="kicker text-accent-ink">Today's battle, round one</p>
            <h2 className="display text-[40px] sm:text-[56px] font-semibold mt-4">Think you know it? Prove it in one tap.</h2>
            <p className="mt-5 text-[18px] font-[family-name:var(--font-serif)] text-ink-2 max-w-md">Answers lock. Explanations follow. Your accuracy is tracked by topic and level, so you know exactly where you're bluffing.</p>
          </div>
          <BattleTeaser q={q} />
        </section>
      )}

      {/* Not a chatbot */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-20 sm:mt-28">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10">
          <div>
            <p className="kicker text-accent-ink">Why not just ask AI?</p>
            <h2 className="display text-[40px] sm:text-[56px] font-semibold mt-4">A chatbot answers questions. A habit asks them.</h2>
            <p className="mt-5 text-[18px] font-[family-name:var(--font-serif)] text-ink-2 max-w-md">You can't ask about what you don't know you're missing. TechYapper is curated, structured and persistent — it remembers, so you don't have to.</p>
          </div>
          <table className="w-full self-end">
            <thead><tr className="border-b border-ink"><th /><th className="kicker text-muted font-medium py-3 w-24 text-center">Chatbot</th><th className="kicker text-accent-ink font-medium py-3 w-28 text-center">TechYapper</th></tr></thead>
            <tbody className="divide-y divide-line">
              {COMPARE.map(([label, a, b]) => (
                <tr key={label}>
                  <td className="py-4 pr-4 text-[16px]">{label}</td>
                  <td className="text-center">{a ? <Check className="inline" size={18} /> : <Minus className="inline text-faint" size={18} />}</td>
                  <td className="text-center">{b && <Check className="inline text-accent" size={20} strokeWidth={2.5} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-[1000px] mx-auto px-4 sm:px-8 mt-20 sm:mt-28">
        <p className="kicker text-accent-ink">Pricing</p>
        <h2 className="display text-[40px] sm:text-[56px] font-semibold mt-4 mb-10">Free for the habit. Pro for the deep end.</h2>
        <PricingTable />
      </section>

      {/* Final CTA */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-24">
        <div className="bg-ink text-paper px-6 sm:px-14 py-14 sm:py-20 grid lg:grid-cols-[1.5fr_1fr] gap-8 items-end">
          <h2 className="display text-[48px] sm:text-[80px] font-semibold">Tomorrow, you'll have something to say.</h2>
          <div>
            <p className="text-paper/70 text-[17px]">Issue No. {issueNumber(today)} is live. It takes about ten minutes.</p>
            <Link to="/signup" className="btn btn-accent !h-12 !px-6 mt-6">Start your streak <Flame size={17} /></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ProductPreview({ lead }: { lead?: ReturnType<typeof conceptsForDay>[number] }) {
  if (!lead) return null
  const days = [0, 1, 1, 2, 3, 2, 0, 1, 3, 4, 2, 3, 1, 4, 3, 2, 4, 3, 4, 4, 3]
  return (
    <div className="relative lg:pt-4" aria-hidden="true">
      <div className="border border-ink bg-card shadow-[10px_10px_0_var(--color-ink)]">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
          <span className="font-mono text-[11px] text-muted">TODAY'S YAP</span>
          <span className="flex items-center gap-1 font-mono text-[12px] font-semibold"><Flame size={13} className="text-accent" /> 21</span>
        </div>
        <div className="p-5 sm:p-7">
          <p className="kicker text-accent-ink">{TOPICS[lead.topic].label} · {lead.minutes} min</p>
          <p className="display text-[34px] sm:text-[42px] font-semibold mt-2">{lead.title}</p>
          <p className="mt-3 font-[family-name:var(--font-serif)] text-[17px] text-ink-2 leading-snug">{lead.dek}</p>
          <div className="mt-5 grid grid-cols-3 border border-ink text-[12px]">
            {['The Basics', 'Under the Hood', 'Deep Dive'].map((l, i) => (
              <span key={l} className={`px-2.5 py-2 ${i ? 'border-l border-line' : 'bg-ink text-paper'}`}><span className={`block font-mono text-[10px] ${i ? 'text-muted' : 'text-accent'}`}>0{i + 1}</span>{l}</span>
            ))}
          </div>
        </div>
        <div className="border-t border-line px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div className="flex gap-[3px]">{days.map((d, i) => <span key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 heat-${d}`} />)}</div>
          <span className="font-mono text-[11px] text-muted">1,240 XP</span>
        </div>
      </div>
      <div className="hidden sm:block absolute -bottom-10 -left-8 bg-ink text-paper p-4 w-[260px] shadow-[6px_6px_0_var(--color-accent)]">
        <p className="kicker text-accent">Say this tomorrow</p>
        <p className="mt-2 font-[family-name:var(--font-display)] italic text-[17px] leading-snug line-clamp-3">{lead.yap}</p>
      </div>
    </div>
  )
}

function LevelsDemo({ slug }: { slug: string }) {
  const { bySlug } = useLibrary()
  const c = bySlug.get(slug)!
  const [lvl, setLvl] = useState<'basics' | 'hood' | 'deep'>('basics')
  const excerpt = (md: string) => md.split(/\n(?=### )/)[0].split(/\n\n/).slice(0, 3).join('\n\n')
  const levels = [
    { k: 'basics' as const, n: '01', label: 'The Basics', sub: 'For your first encounter' },
    { k: 'hood' as const, n: '02', label: 'Under the Hood', sub: 'How it actually works' },
    { k: 'deep' as const, n: '03', label: 'Deep Dive', sub: 'Trade-offs, architecture, edge cases' },
  ]
  return (
    <section className="mt-20 sm:mt-28 bg-paper-2 border-y border-ink">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-16 sm:py-20 grid lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16">
        <div>
          <p className="kicker text-accent-ink">Three levels, every concept</p>
          <h2 className="display text-[40px] sm:text-[56px] font-semibold mt-4">Start simple. Go as deep as you dare.</h2>
          <div className="mt-8 grid border-t border-ink">
            {levels.map((l) => (
              <button key={l.k} onClick={() => setLvl(l.k)} className={`text-left py-4 border-b border-line flex items-baseline gap-4 ${lvl === l.k ? '' : 'text-muted hover:text-ink'}`} aria-pressed={lvl === l.k}>
                <span className={`font-mono text-xs ${lvl === l.k ? 'text-accent' : ''}`}>{l.n}</span>
                <span><span className="block font-[family-name:var(--font-display)] text-[24px] font-semibold leading-tight">{l.label}</span><span className="text-sm">{l.sub}</span></span>
                {lvl === l.k && <ArrowRight size={18} className="ml-auto self-center text-accent" />}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-paper border border-ink p-6 sm:p-10 min-h-[420px] relative overflow-hidden">
          <p className="kicker text-muted">{c.title}</p>
          <div key={lvl} className="mt-4 rise [&_.prose-yap]:!text-[18px]"><Markdown source={excerpt(c[lvl])} /></div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  )
}

function BattleTeaser({ q }: { q: ReturnType<typeof questionsForDay>[number] }) {
  const [chosen, setChosen] = useState<number | null>(null)
  return (
    <div className="border border-ink bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4"><span className="chip">{q.difficulty}</span><span className="font-mono text-xs text-muted">ROUND 1/5</span></div>
      <p className="font-[family-name:var(--font-display)] text-[24px] sm:text-[28px] leading-[1.15] font-medium tracking-[-0.015em] mb-5">{q.prompt}</p>
      <Options quiz={q} chosen={chosen} onChoose={setChosen} />
      {chosen !== null && (
        <div className="mt-5 border-t border-ink pt-4 rise flex flex-wrap items-center justify-between gap-3">
          <p className={`kicker ${chosen === q.answer ? 'text-good' : 'text-bad'}`}>{chosen === q.answer ? 'Correct.' : 'Not quite.'} The explanation is inside.</p>
          <Link to="/signup" className="btn btn-primary !h-10">Play the full battle <ArrowRight size={15} /></Link>
        </div>
      )}
    </div>
  )
}
