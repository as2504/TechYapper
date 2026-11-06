import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Lock } from 'lucide-react'
import { PageHead } from '../components/AppShell'
import { useLibrary } from '../lib/content'
import { useProgress, XP } from '../lib/progress'
import { ProLock } from '../components/ProLock'
import { Explanation, Options, QuizPrompt } from '../components/Quiz'
import type { TopicId } from '../content/types'

export const TRACKS: { id: string; title: string; who: string; topics: TopicId[]; concepts: string[] }[] = [
  { id: 'frontend', title: 'Frontend Interview Track', who: 'For React / UI engineers heading into SDE-1 to SDE-2 interviews.', topics: ['frontend', 'languages', 'security'], concepts: ['js-event-loop', 'react-useeffect', 'typescript-structural-typing', 'cors', 'caching-strategies'] },
  { id: 'backend', title: 'Backend & Systems Track', who: 'APIs, data and the system-design round.', topics: ['backend', 'databases', 'system-design'], concepts: ['rest-idempotency', 'sql-indexes', 'postgres-mvcc', 'caching-strategies', 'jwt-auth', 'nodejs-event-loop'] },
  { id: 'ai', title: 'AI Engineer Track', who: 'Explain LLMs, embeddings and RAG like you\'ve shipped them.', topics: ['ai', 'genai'], concepts: ['llm-tokens', 'embeddings-vector-db', 'rag', 'python-gil'] },
  { id: 'power', title: 'Power Platform Track', who: 'For makers and consultants who want to talk architecture, not just formulas.', topics: ['lowcode'], concepts: ['power-apps-delegation', 'dataverse', 'supabase-rls'] },
]

export default function Tracks() {
  const { bySlug, questions } = useLibrary()
  const { isPro, find } = useProgress()
  const [active, setActive] = useState(TRACKS[0].id)
  const track = TRACKS.find((t) => t.id === active)!
  const proQs = questions.filter((q) => q.pro && track.topics.includes(q.topic))

  return (
    <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-16 max-w-[1180px]">
      <PageHead kicker="Pro · Structured paths" title={<>Interview <em className="font-normal">Tracks</em></>}
        dek="Concepts and questions in the order interviews escalate." />

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
        {TRACKS.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={`shrink-0 px-4 h-10 text-sm font-semibold border ${active === t.id ? 'bg-ink text-paper border-ink' : 'border-line-2 hover:border-ink'}`}>{t.title.replace(' Track', '')}</button>
        ))}
      </div>

      <section className="mt-8 grid lg:grid-cols-[1fr_1fr] gap-10">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[34px] font-semibold tracking-[-0.02em] leading-tight">{track.title}</h2>
          <p className="mt-2 text-ink-2">{track.who}</p>
          <ol className="mt-6 border-t border-line-2 divide-y divide-line">
            {track.concepts.map((s, i) => {
              const c = bySlug.get(s)
              if (!c) return null
              const unlocked = isPro || i === 0
              const done = !!find('read', s)
              return (
                <li key={s}>
                  <Link to={unlocked ? `/app/concept/${s}` : '/app/upgrade'} className="flex items-center gap-4 py-4 group">
                    <span className={`w-8 h-8 grid place-items-center font-mono text-xs border ${done ? 'bg-ink text-paper border-ink' : 'border-line-2'}`}>{done ? <Check size={14} /> : String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 font-[family-name:var(--font-display)] text-[19px] font-medium group-hover:text-accent-ink">{c.title}</span>
                    {unlocked ? <ArrowRight size={15} className="text-muted" /> : <Lock size={14} className="text-faint" />}
                  </Link>
                </li>
              )
            })}
          </ol>
          {!isPro && <p className="mt-3 text-xs text-muted">Step 01 is free so you can feel the format.</p>}
        </div>
        <div>
          <p className="section-title">Track question set · {proQs.length} premium questions</p>
          {isPro ? <ProQuestions ids={proQs.map((q) => q.id)} /> : (
            <div className="mt-6"><ProLock title="Practise like it's the real round" body="Premium question sets for this track, with full explanations and accuracy tracking. ₹99/month or ₹799/year." /></div>
          )}
        </div>
      </section>
    </div>
  )
}

function ProQuestions({ ids }: { ids: string[] }) {
  const { questions } = useLibrary()
  const { find, record } = useProgress()
  const list = questions.filter((q) => ids.includes(q.id))
  if (!list.length) return <p className="mt-6 text-muted">New questions for this track land weekly.</p>
  return (
    <div className="grid gap-10 mt-6">
      {list.map((q) => {
        const act = find('battle', q.id)
        return (
          <div key={q.id}>
            <QuizPrompt quiz={q} size="md" />
            <Options quiz={q} chosen={act?.choice ?? null} onChoose={(i) => record({ kind: 'battle', item_id: q.id, correct: i === q.answer, choice: i, xp: i === q.answer ? XP.battle[q.difficulty] : XP.attempt })} />
            {act?.choice != null && <Explanation quiz={q} chosen={act.choice} xp={act.xp} />}
          </div>
        )
      })}
    </div>
  )
}
