import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, Check, Lock, Search } from 'lucide-react'
import { PageHead } from '../components/AppShell'
import { useLibrary } from '../lib/content'
import { useProgress } from '../lib/progress'
import { useDaily } from '../lib/useDaily'
import { TOPICS, type Concept, type TopicId } from '../content/types'
import { ProTag } from '../components/ProLock'

export default function Library() {
  const { concepts, bySlug } = useLibrary()
  const { saved, find, isPro } = useProgress()
  const { canRead } = useDaily()
  const [tab, setTab] = useState<'saved' | 'archive'>(saved.length ? 'saved' : 'archive')
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState<TopicId | 'all'>('all')

  const topics = useMemo(() => [...new Set(concepts.map((c) => c.topic))], [concepts])
  const list = useMemo(() => {
    const base = tab === 'saved' ? saved.map((s) => bySlug.get(s)).filter((c): c is Concept => !!c) : concepts
    const needle = q.trim().toLowerCase()
    return base.filter((c) => (topic === 'all' || c.topic === topic) && (!needle || (c.title + c.dek + c.topic).toLowerCase().includes(needle)))
  }, [tab, saved, bySlug, concepts, q, topic])

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1180px]">
      <PageHead kicker="Your knowledge library" title="Library" dek={`${concepts.length} concepts across ${topics.length} topics. Save the ones you want to be able to explain on demand.`} />

      <div className="mt-6 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex border border-ink" role="tablist">
          {(['saved', 'archive'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 h-10 text-sm font-semibold capitalize ${tab === t ? 'bg-ink text-paper' : 'hover:bg-paper-2'}`}>
              {t === 'saved' ? `Saved (${saved.length})` : 'Full archive'}
            </button>
          ))}
        </div>
        <label className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input !h-10 !pl-9 !text-sm" placeholder="Search concepts" aria-label="Search concepts" />
        </label>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['all', ...topics] as const).map((t) => (
          <button key={t} onClick={() => setTopic(t)} className={`chip shrink-0 ${topic === t ? '!bg-ink !text-paper !border-ink' : 'hover:border-ink'}`}>{t === 'all' ? 'All topics' : TOPICS[t].label}</button>
        ))}
      </div>

      {!isPro && tab === 'archive' && (
        <p className="mt-6 text-sm text-ink-2 border-l-2 border-accent pl-3">Free plan: today's yaps and the last 3 days are open. <Link to="/app/upgrade" className="font-semibold underline underline-offset-4">Pro unlocks the full archive.</Link></p>
      )}

      {list.length === 0 ? (
        <div className="py-20 text-center">
          <Bookmark className="mx-auto text-faint" size={32} />
          <p className="mt-4 font-[family-name:var(--font-display)] text-[26px] font-semibold">{tab === 'saved' && !q ? 'Nothing saved yet' : 'No matches'}</p>
          <p className="mt-2 text-muted">{tab === 'saved' && !q ? 'Tap Save on any concept to keep it here for revision.' : 'Try another search or topic.'}</p>
          {tab === 'saved' && <Link to="/app" className="btn btn-primary mt-6">Read today's yap</Link>}
        </div>
      ) : (
        <ul className="mt-6 border-t border-ink divide-y divide-line">
          {list.map((c) => {
            const open = canRead(c.slug)
            return (
              <li key={c.slug}>
                <Link to={`/app/concept/${c.slug}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto] gap-x-6 gap-y-1 py-5 group items-baseline">
                  <span className="kicker text-accent-ink sm:pt-1">{TOPICS[c.topic].label}</span>
                  <span className="col-start-1 sm:col-start-2 row-start-2 sm:row-start-1">
                    <span className="font-[family-name:var(--font-display)] text-[22px] sm:text-[24px] font-semibold leading-tight group-hover:text-accent-ink tracking-[-0.015em]">{c.title}</span>
                    <span className="block text-[15px] text-ink-2 mt-1 font-[family-name:var(--font-serif)]">{c.dek}</span>
                  </span>
                  <span className="row-span-2 sm:row-span-1 col-start-2 sm:col-start-3 flex items-center gap-2 self-center">
                    {find('read', c.slug) && <Check size={15} className="text-good" aria-label="read" />}
                    {open ? <ArrowRight size={16} className="text-muted" /> : <span className="flex items-center gap-1 text-faint"><Lock size={13} /><ProTag /></span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
