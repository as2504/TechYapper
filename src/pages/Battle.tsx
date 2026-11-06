import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Flame, Lock, RotateCcw, Trophy } from 'lucide-react'
import { PageHead } from '../components/AppShell'
import { Explanation, Options, QuizPrompt } from '../components/Quiz'
import { useDaily } from '../lib/useDaily'
import { useLibrary } from '../lib/content'
import { useProgress, useStats, XP } from '../lib/progress'
import { TOPICS, type Difficulty, type Question } from '../content/types'
import { ProTag } from '../components/ProLock'
import { prettyDate } from '../lib/dates'

const LEVEL_STYLE: Record<Difficulty, string> = {
  beginner: 'border-line-2 text-ink-2',
  intermediate: 'border-ink text-ink',
  advanced: 'border-accent text-accent-ink bg-accent-wash',
}

export function LevelChip({ level }: { level: Difficulty }) {
  return <span className={`chip ${LEVEL_STYLE[level]}`}>{level}</span>
}

export default function Battle() {
  const { questions } = useDaily()
  const { find, record } = useProgress()
  const stats = useStats()
  const firstOpen = questions.findIndex((q) => !find('battle', q.id))
  const [round, setRound] = useState(firstOpen === -1 ? questions.length : firstOpen)

  const results = questions.map((q) => find('battle', q.id))
  const finished = results.every(Boolean)
  const score = results.filter((r) => r?.correct).length
  const earned = results.reduce((s, r) => s + (r?.xp ?? 0), 0)
  const q = questions[Math.min(round, questions.length - 1)]
  const act = find('battle', q.id)

  const answer = (i: number) => {
    const ok = i === q.answer
    record({ kind: 'battle', item_id: q.id, correct: ok, choice: i, xp: ok ? XP.battle[q.difficulty] : XP.attempt })
  }

  return (
    <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-16 max-w-[1180px]">
      <PageHead title="Yap Battle" dek="5 questions, beginner to advanced. One try each."
        right={<div className="flex gap-8 text-right"><Stat k="Accuracy" v={`${stats.accuracy}%`} /><Stat k="Streak" v={`${stats.streak}d`} /></div>} />

      {/* Round tracker */}
      <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Rounds">
        {questions.map((qq, i) => {
          const r = results[i]
          const cur = i === round && !finished
          return (
            <li key={qq.id}>
              <button onClick={() => (r || i === firstOpen) && setRound(i)} disabled={!r && i !== firstOpen} className="w-full text-left">
                <span className={`block h-1.5 ${r ? (r.correct ? 'bg-good' : 'bg-bad') : cur ? 'bg-ink' : 'bg-line'}`} />
                <span className={`mt-2 block font-mono text-[11px] ${cur ? 'text-ink' : 'text-muted'}`}>R{i + 1} · {qq.difficulty.slice(0, 3).toUpperCase()}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {finished && round >= questions.length ? (
        <Scorecard score={score} total={questions.length} xp={earned} streak={stats.streak} onReview={() => setRound(0)} />
      ) : (
        <section className="mt-8 grid xl:grid-cols-[minmax(0,760px)_220px] gap-12">
          <div className="min-w-0" key={q.id}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="font-mono text-xs text-muted">Round {round + 1} of {questions.length}</span>
              <LevelChip level={q.difficulty} />
              <span className="chip">{TOPICS[q.topic].label}</span>
              <span className="ml-auto font-mono text-xs text-accent-ink">{XP.battle[q.difficulty]} XP</span>
            </div>
            <QuizPrompt quiz={q} />
            <Options quiz={q} chosen={act?.choice ?? null} onChoose={answer} />
            {act?.choice != null && (
              <>
                <Explanation quiz={q} chosen={act.choice} xp={act.xp} />
                <div className="mt-6 flex justify-end">
                  {round < questions.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setRound(round + 1)}>Next round <ArrowRight size={16} /></button>
                  ) : (
                    <button className="btn btn-accent" onClick={() => setRound(questions.length)}><Trophy size={16} /> See your scorecard</button>
                  )}
                </div>
              </>
            )}
          </div>
          <aside className="hidden xl:block content-start">
            <div className="tint p-5">
            <p className="label">Scoring</p>
            <ul className="mt-3 text-sm text-ink-2 grid gap-2">
              <li className="flex justify-between"><span>Beginner</span><span className="font-mono">{XP.battle.beginner} XP</span></li>
              <li className="flex justify-between"><span>Intermediate</span><span className="font-mono">{XP.battle.intermediate} XP</span></li>
              <li className="flex justify-between"><span>Advanced</span><span className="font-mono">{XP.battle.advanced} XP</span></li>
              <li className="flex justify-between text-muted"><span>Wrong, but you tried</span><span className="font-mono">{XP.attempt} XP</span></li>
            </ul>
            <p className="mt-4 pt-3 border-t border-line-2 text-xs text-muted">Answers lock once chosen.</p>
            </div>
          </aside>
        </section>
      )}

      <History />
      <PremiumSets />
    </div>
  )
}

function Scorecard({ score, total, xp, streak, onReview }: { score: number; total: number; xp: number; streak: number; onReview: () => void }) {
  const verdict = score === total ? 'Flawless. You could teach this.' : score >= total - 1 ? 'Sharp. One slipped through.' : score >= total / 2 ? 'Solid. Read the explanations — that\'s where it sticks.' : 'Rough round. The explanations are the real prize.'
  return (
    <section className="mt-8 border border-ink bg-ink text-paper p-7 sm:p-12 rise">
      <p className="kicker text-accent">Today's battle · complete</p>
      <p className="display text-[96px] sm:text-[140px] font-semibold mt-2">{score}<span className="text-paper/40">/{total}</span></p>
      <p className="font-[family-name:var(--font-display)] italic text-[24px] sm:text-[30px] mt-2">{verdict}</p>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-paper/20 pt-6 max-w-xl">
        <div><p className="font-mono text-xs text-paper/60">XP EARNED</p><p className="text-3xl font-semibold mt-1">+{xp}</p></div>
        <div><p className="font-mono text-xs text-paper/60">STREAK</p><p className="text-3xl font-semibold mt-1 flex items-center gap-2"><Flame className="text-accent" size={24} />{streak}</p></div>
        <div className="col-span-2 sm:col-span-1"><p className="font-mono text-xs text-paper/60">NEXT BATTLE</p><p className="text-3xl font-semibold mt-1">Tomorrow</p></div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/app/code" className="btn btn-accent">Next: Code or Explain <ArrowRight size={16} /></Link>
        <button onClick={onReview} className="btn border border-paper/40 hover:bg-paper hover:text-ink"><RotateCcw size={15} /> Review answers</button>
      </div>
    </section>
  )
}

function History() {
  const { questions } = useLibrary()
  const { activities } = useProgress()
  const [openId, setOpenId] = useState<string | null>(null)
  const [all, setAll] = useState(false)
  const past = useMemo(() => {
    const map = new Map(questions.map((q) => [q.id, q]))
    return activities.filter((a) => a.kind === 'battle').reverse().map((a) => ({ a, q: map.get(a.item_id) })).filter((x): x is { a: typeof x.a; q: Question } => !!x.q)
  }, [activities, questions])
  if (!past.length) return null
  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between border-b border-line-2 pb-2.5">
        <h2 className="font-[family-name:var(--font-display)] text-[21px] font-semibold tracking-[-0.015em]">Past answers</h2>
        <span className="text-sm text-muted">{past.length}</span>
      </div>
      <ul className="divide-y divide-line">
        {(all ? past : past.slice(0, 5)).map(({ a, q }) => (
          <li key={q.id}>
            <button onClick={() => setOpenId(openId === q.id ? null : q.id)} className="w-full grid grid-cols-[14px_1fr_auto] gap-4 items-center py-4 text-left group" aria-expanded={openId === q.id}>
              <span className={`w-2.5 h-2.5 ${a.correct ? 'bg-good' : 'bg-bad'}`} aria-label={a.correct ? 'correct' : 'wrong'} />
              <span>
                <span className="block font-medium leading-snug group-hover:text-accent-ink line-clamp-1 [&_code]:inline-code">{q.prompt}</span>
                <span className="block text-xs text-muted mt-1">{prettyDate(a.activity_date, { day: 'numeric', month: 'short' })} · {TOPICS[q.topic].label}</span>
              </span>
              <ChevronDown size={16} className={`text-muted transition-transform ${openId === q.id ? 'rotate-180' : ''}`} />
            </button>
            {openId === q.id && (
              <div className="pb-6 pl-8 max-w-3xl">
                <Options quiz={q} chosen={a.choice} onChoose={() => {}} />
                <Explanation quiz={q} chosen={a.choice ?? -1} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {past.length > 5 && <button onClick={() => setAll(!all)} className="mt-4 text-sm font-medium text-muted hover:text-ink">{all ? 'Show less' : `Show all ${past.length}`}</button>}
    </section>
  )
}

function PremiumSets() {
  const { questions } = useLibrary()
  const { isPro } = useProgress()
  const pro = questions.filter((q) => q.pro)
  const sets = [
    { title: 'System Design Gauntlet', topic: 'system-design', body: 'Caching, queues, consistency and the follow-ups interviewers love.' },
    { title: 'AI Engineer Interview Set', topic: 'genai', body: 'RAG pipelines, embeddings, evals and token economics.' },
    { title: 'Backend Under Pressure', topic: 'backend', body: 'Idempotency, auth, transactions and failure modes.' },
  ]
  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between border-b border-line-2 pb-2.5">
        <h2 className="font-[family-name:var(--font-display)] text-[21px] font-semibold tracking-[-0.015em]">Pro question sets</h2>
        {!isPro && <ProTag />}
      </div>
      <ul className="mt-5 grid sm:grid-cols-3 gap-3">
        {sets.map((s) => (
          <li key={s.title}>
            <Link to={isPro ? '/app/tracks' : '/app/upgrade'} className="group panel flex flex-col justify-between h-full min-h-[104px] p-5 hover:border-ink-2">
              <span className="font-semibold leading-snug group-hover:text-accent-ink flex items-start justify-between gap-3">{s.title}{!isPro && <Lock size={14} className="text-faint mt-1 shrink-0" />}</span>
              <span className="text-xs text-muted mt-3">{pro.filter((q) => q.topic === s.topic).length} questions</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div><p className="kicker text-faint">{k}</p><p className="font-[family-name:var(--font-display)] text-[30px] font-semibold leading-none mt-1.5">{v}</p></div>
}
