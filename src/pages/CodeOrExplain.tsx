import { useState } from 'react'
import { Lock, PenLine } from 'lucide-react'
import { PageHead } from '../components/AppShell'
import { Explanation, Options, QuizPrompt } from '../components/Quiz'
import { useDaily } from '../lib/useDaily'
import { useLibrary } from '../lib/content'
import { useProgress, XP } from '../lib/progress'
import { KIND_LABEL, TOPICS, type Challenge } from '../content/types'
import { LevelChip } from './Battle'
import { ProLock, ProTag } from '../components/ProLock'

export default function CodeOrExplain() {
  const { challenges } = useDaily()
  const lib = useLibrary()
  const { isPro } = useProgress()
  const pro = lib.challenges.filter((c) => c.pro)

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1180px]">
      <PageHead kicker="Pillar 03 · Daily" title={<>Code <em className="font-normal">or</em> Explain</>}
        dek="Three snippets. Read them like a reviewer, not a compiler. Predict, debug, or explain — then see why." />

      <div className="mt-4 grid gap-0">
        {challenges.map((c, i) => <ChallengeCard key={c.id} c={c} n={i + 1} />)}
      </div>

      <section className="mt-16">
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold tracking-[-0.02em]">Advanced challenges</h2>
          <ProTag />
        </div>
        {isPro ? (
          <div className="grid">{pro.map((c, i) => <ChallengeCard key={c.id} c={c} n={i + 1} />)}</div>
        ) : (
          <>
            <ul className="divide-y divide-line mb-8">
              {pro.map((c) => (
                <li key={c.id} className="py-4 flex items-center gap-4">
                  <Lock size={14} className="text-faint shrink-0" />
                  <span className="flex-1">
                    <span className="block font-medium">{c.title}</span>
                    <span className="block font-mono text-[11px] text-muted mt-0.5">{KIND_LABEL[c.kind].toUpperCase()} · {TOPICS[c.topic].label.toUpperCase()}</span>
                  </span>
                  <LevelChip level={c.difficulty} />
                </li>
              ))}
            </ul>
            <ProLock compact title={`${pro.length} advanced challenges, more every week`} body="Concurrency traps, query-plan puzzles and the code-review questions senior interviews actually use." />
          </>
        )}
      </section>
    </div>
  )
}

function ChallengeCard({ c, n }: { c: Challenge; n: number }) {
  const { find, record } = useProgress()
  const act = find('challenge', c.id)
  const [draft, setDraft] = useState('')
  const [writing, setWriting] = useState(false)
  const xp = XP.challenge[c.difficulty]

  return (
    <article className="py-10 border-b border-line grid lg:grid-cols-[180px_minmax(0,1fr)] gap-4 lg:gap-10">
      <div>
        <p className="display text-[56px] font-semibold text-accent leading-none">{String(n).padStart(2, '0')}</p>
        <p className="kicker mt-3">{KIND_LABEL[c.kind]}</p>
        <div className="mt-3 flex flex-wrap gap-2"><LevelChip level={c.difficulty} /><span className="chip">{TOPICS[c.topic].label}</span></div>
        <p className="mt-3 font-mono text-xs text-muted">{xp} XP</p>
      </div>
      <div className="min-w-0 max-w-[780px]">
        <h3 className="kicker text-muted mb-2">{c.title}</h3>
        <QuizPrompt quiz={c} size="md" />

        {c.kind === 'explain' && !act && (
          <div className="mb-5">
            {writing ? (
              <div>
                <label htmlFor={`d-${c.id}`} className="kicker text-muted">Your explanation, before you peek</label>
                <textarea id={`d-${c.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} rows={4}
                  className="input !h-auto py-3 mt-2 font-mono !text-[14px] leading-relaxed" placeholder="In plain words, this code…" />
                <p className="text-xs text-muted mt-1.5">Not graded. Writing it down first is what makes it stick.</p>
              </div>
            ) : (
              <button onClick={() => setWriting(true)} className="btn btn-quiet !px-0 text-sm"><PenLine size={15} /> Explain it in your own words first</button>
            )}
          </div>
        )}

        <Options quiz={c} chosen={act?.choice ?? null}
          onChoose={(i) => record({ kind: 'challenge', item_id: c.id, correct: i === c.answer, choice: i, xp: i === c.answer ? xp : XP.attempt })} />
        {act?.choice != null && (
          <>
            {draft && <p className="mt-5 text-sm border-l-2 border-line-2 pl-3 text-ink-2"><span className="kicker text-muted block mb-1">You wrote</span>{draft}</p>}
            <Explanation quiz={c} chosen={act.choice} xp={act.xp} />
          </>
        )}
      </div>
    </article>
  )
}
