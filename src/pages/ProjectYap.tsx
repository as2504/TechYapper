import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Copy, Plus, RefreshCw, Sparkles, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'
import { useDocs, useDraft } from '../lib/docs'
import { EMPTY_PROJECT, gapCount, generate, pitch, techLinks, type ProjectInput, type ScriptSection } from '../lib/projectYap'
import { ProTag } from '../components/ProLock'

interface ProjectDoc { input: ProjectInput; sections: ScriptSection[] }

const SAMPLE: ProjectInput = {
  ...EMPTY_PROJECT,
  name: 'StudyBuddy', oneLiner: 'a web app that turns lecture notes into flashcards', context: 'as a final-year college project',
  problem: 'students re-read notes before exams instead of testing themselves', users: 'students in my batch', motivation: 'existing flashcard apps made you type every card by hand',
  stack: [{ tech: 'React', why: 'I knew it and needed a quick, interactive UI' }, { tech: 'Supabase', why: 'it gave me Postgres and login without running a server' }],
  features: 'Paste notes to create cards\nSpaced repetition schedule\nProgress per subject', contribution: 'I built the front end and the card scheduling logic', team: 'with two classmates',
  challenges: [{ challenge: 'cards were shown in the wrong order after a day off', solution: 'storing the next review date per card instead of a counter' }],
}

export default function ProjectYap() {
  const { isPro } = useProgress()
  return (
    <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-16 max-w-[1120px]">
      <header className="border-b border-line pb-6">
        <p className="kicker text-accent-ink flex items-center gap-2">Project Yapping <ProTag /></p>
        <h1 className="display text-[40px] sm:text-[58px] font-semibold mt-2">Explain your project like you built it.</h1>
        <p className="mt-3 text-ink-2 max-w-2xl">Tell us the facts about your project. You get an 11-part speaking script with follow-up questions and the points you'll have to defend. Anything you leave out is shown as a gap. We don't fill it in for you.</p>
      </header>
      {isPro ? <Builder /> : <Sample />}
    </div>
  )
}

function Sample() {
  const sections = generate(SAMPLE)
  return (
    <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-10">
      <div>
        <p className="kicker text-muted">Sample · {SAMPLE.name}</p>
        <ol className="mt-3 border-t border-line-2">
          {sections.slice(0, 4).map((s, i) => (
            <li key={s.key} className="py-4 border-b border-line">
              <p className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, '0')} · {s.title.toUpperCase()}</p>
              <p className="mt-2 font-[family-name:var(--font-serif)] text-[17px] leading-relaxed"><Script text={s.script} /></p>
            </li>
          ))}
          <li className="py-4 text-sm text-muted">+ 7 more sections, follow-up questions, things to defend and a 60-second pitch.</li>
        </ol>
      </div>
      <PreviewGate what="Project Yapping" />
    </div>
  )
}

/** Shown to non-Pro users on the Pro tools: honest path to try them. */
export function PreviewGate({ what }: { what: string }) {
  const { user } = useAuth()
  const { startPreview, subscription } = useProgress()
  const [err, setErr] = useState('')
  const used = !!subscription
  return (
    <aside className="border border-ink bg-card p-6 sm:p-7 self-start relative">
      <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <p className="kicker text-accent-ink">TechYapper Pro</p>
      <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-tight mt-2">{what} is part of Pro.</h2>
      <p className="mt-2 text-[15px] text-ink-2">Pro also includes advanced interview answers, every Deep Dive and the advanced challenges. ₹99/month or ₹799/year.</p>
      <div className="mt-5 grid gap-3">
        {!user ? (
          <><Link to="/signup?next=upgrade" className="btn btn-accent">Create a free account</Link><p className="text-xs text-muted">Then start a free 7-day Pro preview. No card needed.</p></>
        ) : !used ? (
          <button onClick={async () => { const r = await startPreview(); if (r.error) setErr(r.error) }} className="btn btn-accent"><Sparkles size={16} /> Start free 7-day preview</button>
        ) : null}
        <Link to="/app/upgrade" className="btn btn-ghost">See Pro plans</Link>
        {err && <p className="text-sm text-bad">{err}</p>}
      </div>
    </aside>
  )
}

const Script = ({ text }: { text: string }) => (
  <>{text.split(/(\[[^\]]+\])/).map((part, i) => (part.startsWith('[') ? <mark key={i} className="bg-accent-wash text-accent-ink px-1 not-italic font-[family-name:var(--font-sans)] text-[14px]">{part.slice(1, -1)}</mark> : part))}</>
)

type Tab = 'details' | 'script' | 'pitch'

function Builder() {
  const [doc, setDoc] = useDraft<ProjectDoc & { docId?: string }>('ty:project-draft', { input: EMPTY_PROJECT, sections: [] })
  const [tab, setTab] = useState<Tab>(doc.sections.length ? 'script' : 'details')
  const { docs, save, remove, error } = useDocs<ProjectDoc>('project')
  const [msg, setMsg] = useState('')
  const p = doc.input
  const set = (patch: Partial<ProjectInput>) => setDoc({ ...doc, input: { ...p, ...patch } })

  const build = () => {
    const fresh = generate(p)
    // Keep sections the user has edited by hand.
    const sections = fresh.map((s) => { const old = doc.sections.find((o) => o.key === s.key); return old?.edited ? { ...s, script: old.script, edited: true } : s })
    setDoc({ ...doc, sections }); setTab('script'); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const doSave = async () => {
    const id = await save(p.name || 'Untitled project', { input: p, sections: doc.sections }, doc.docId)
    if (id) { setDoc({ ...doc, docId: id }); setMsg('Saved'); setTimeout(() => setMsg(''), 1800) }
  }
  const gaps = gapCount(doc.sections)
  const full = useMemo(() => doc.sections.map((s, i) => `${i + 1}. ${s.title}\n${s.script}`).join('\n\n'), [doc.sections])
  const links = techLinks(p.stack.map((s) => s.tech).filter(Boolean))

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div role="tablist" className="flex">
          {([['details', '1 · Details'], ['script', '2 · Script'], ['pitch', '3 · 60-second pitch']] as [Tab, string][]).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} disabled={id !== 'details' && !doc.sections.length} onClick={() => setTab(id)}
              className={`relative px-3 sm:px-4 py-3 text-sm sm:text-[15px] disabled:text-faint ${tab === id ? 'font-semibold' : 'text-muted hover:text-ink'}`}>
              {label}{tab === id && <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-accent" />}
            </button>
          ))}
        </div>
        {doc.sections.length > 0 && (
          <div className="flex items-center gap-2 pb-2 sm:pb-0">
            <button onClick={doSave} className="btn btn-primary !py-2">{msg ? <><Check size={15} /> {msg}</> : 'Save'}</button>
            <CopyBtn text={tab === 'pitch' ? pitch(doc.sections) : full} />
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}

      {tab === 'details' && (
        <div className="mt-8 grid lg:grid-cols-[1fr_260px] gap-10">
          <div className="grid gap-8">
            <Group n="A" title="The basics">
              <F label="Project name" v={p.name} on={(name) => set({ name })} placeholder="StudyBuddy" />
              <F label="What does it do, in one line?" v={p.oneLiner} on={(oneLiner) => set({ oneLiner })} placeholder="a web app that turns lecture notes into flashcards" />
              <F label="Where did you build it?" v={p.context} on={(context) => set({ context })} placeholder="as a final-year college project / at work for the finance team" />
            </Group>
            <Group n="B" title="Problem">
              <F area label="What problem does it solve?" v={p.problem} on={(problem) => set({ problem })} />
              <F label="Who has that problem?" v={p.users} on={(users) => set({ users })} placeholder="students in my batch / 12 project managers" />
              <F area label="Why was it worth building? What were existing options missing?" v={p.motivation} on={(motivation) => set({ motivation })} />
            </Group>
            <Group n="C" title="Technology">
              {p.stack.map((s, i) => (
                <div key={i} className="grid sm:grid-cols-[180px_1fr_auto] gap-2 items-start">
                  <input className="input" value={s.tech} placeholder="React" aria-label="Technology" onChange={(e) => set({ stack: p.stack.map((x, j) => (j === i ? { ...x, tech: e.target.value } : x)) })} />
                  <input className="input" value={s.why} placeholder="Why this, for this project?" aria-label="Why" onChange={(e) => set({ stack: p.stack.map((x, j) => (j === i ? { ...x, why: e.target.value } : x)) })} />
                  <button onClick={() => set({ stack: p.stack.filter((_, j) => j !== i) })} className="p-2.5 text-muted hover:text-bad" aria-label="Remove technology"><X size={16} /></button>
                </div>
              ))}
              <button onClick={() => set({ stack: [...p.stack, { tech: '', why: '' }] })} className="btn btn-quiet text-sm w-fit"><Plus size={15} /> Add technology</button>
              <F area label="How do the parts connect? (architecture)" v={p.architecture} on={(architecture) => set({ architecture })} placeholder="The React app calls Supabase directly. Postgres stores cards per user, protected by RLS…" />
            </Group>
            <Group n="D" title="What you built">
              <F area label="Main features, one per line" v={p.features} on={(features) => set({ features })} />
              <F area label="What did you personally do?" v={p.contribution} on={(contribution) => set({ contribution })} placeholder="I built the front end and the scheduling logic" />
              <F label="Team (optional)" v={p.team} on={(team) => set({ team })} placeholder="with two classmates / in a team of 5" />
              <F area label="One technical decision, and what else you considered" v={p.decisions} on={(decisions) => set({ decisions })} />
            </Group>
            <Group n="E" title="Challenges and outcome">
              {p.challenges.map((c, i) => (
                <div key={i} className="grid sm:grid-cols-2 gap-2">
                  <input className="input" value={c.challenge} placeholder="A problem you hit" aria-label="Challenge" onChange={(e) => set({ challenges: p.challenges.map((x, j) => (j === i ? { ...x, challenge: e.target.value } : x)) })} />
                  <input className="input" value={c.solution} placeholder="How you solved it" aria-label="Solution" onChange={(e) => set({ challenges: p.challenges.map((x, j) => (j === i ? { ...x, solution: e.target.value } : x)) })} />
                </div>
              ))}
              <button onClick={() => set({ challenges: [...p.challenges, { challenge: '', solution: '' }] })} className="btn btn-quiet text-sm w-fit"><Plus size={15} /> Add challenge</button>
              <F area label="Results. Only real ones: users, feedback, time saved, what you learned" v={p.results} on={(results) => set({ results })} />
              <F area label="What would you improve next?" v={p.improvements} on={(improvements) => set({ improvements })} />
            </Group>
            <div className="flex flex-wrap gap-3">
              <button onClick={build} disabled={!p.name.trim()} className="btn btn-accent">{doc.sections.length ? <><RefreshCw size={16} /> Update my script</> : 'Build my script'}</button>
              {!p.name && <button onClick={() => setDoc({ ...doc, input: SAMPLE })} className="btn btn-ghost">Fill with a sample</button>}
            </div>
          </div>
          <aside className="text-sm text-ink-2 grid gap-6 content-start">
            <div className="border-l-2 border-accent pl-4">
              <p className="font-semibold text-ink">Write it how you'd say it.</p>
              <p className="mt-1">Short, plain answers make better scripts. Leave a field empty instead of guessing; the script shows a gap you can fill later.</p>
            </div>
            {docs.length > 0 && (
              <div>
                <p className="section-title">Saved projects</p>
                <ul className="divide-y divide-line">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 py-2.5">
                      <button onClick={() => { setDoc({ ...d.data, docId: d.id }); setTab('script') }} className="flex-1 text-left font-medium hover:text-accent-ink truncate">{d.title}</button>
                      <button onClick={() => remove(d.id)} className="text-muted hover:text-bad p-1" aria-label={`Delete ${d.title}`}><X size={15} /></button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => { setDoc({ input: EMPTY_PROJECT, sections: [] }) }} className="mt-2 underline underline-offset-4">New project</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === 'script' && (
        <div className="mt-8">
          {gaps > 0 && (
            <p className="flex items-start gap-3 bg-accent-wash text-accent-ink px-4 py-3 text-sm"><AlertTriangle size={17} className="shrink-0 mt-0.5" />
              <span>{gaps} gap{gaps > 1 ? 's' : ''} to fill. Highlighted parts are things only you know. Edit them below, or <button onClick={() => setTab('details')} className="underline underline-offset-2 font-semibold">add details</button> and update.</span></p>
          )}
          {links.length > 0 && (
            <p className="mt-4 text-sm text-ink-2">Brush up before the interview: {links.map((l, i) => <span key={l.slug}>{i > 0 && ', '}<Link to={`/app/yap/${l.slug}?tab=interview`} className="font-semibold underline underline-offset-4">{l.tech}</Link></span>)}</p>
          )}
          <ol className="mt-6 border-t border-line-2">
            {doc.sections.map((s, i) => (
              <SectionCard key={s.key} s={s} n={i + 1} onChange={(script) => setDoc({ ...doc, sections: doc.sections.map((x) => (x.key === s.key ? { ...x, script, edited: true } : x)) })} />
            ))}
          </ol>
        </div>
      )}

      {tab === 'pitch' && (
        <div className="mt-8 max-w-3xl">
          <p className="kicker text-muted">When someone says “tell me about a project you built”</p>
          <p className="mt-4 font-[family-name:var(--font-display)] text-[22px] sm:text-[26px] leading-[1.35]">{pitch(doc.sections) || 'Fill in a few details first.'}</p>
          <p className="mt-6 text-sm text-muted">Built from the first sentence of your intro, problem, stack, features and results. Edit those sections to change it. Say it out loud with a timer; aim for under 60 seconds.</p>
        </div>
      )}
    </div>
  )
}

function SectionCard({ s, n, onChange }: { s: ScriptSection; n: number; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  return (
    <li className="py-6 border-b border-line grid md:grid-cols-[220px_1fr] gap-3 md:gap-8">
      <div>
        <p className="font-mono text-[11px] text-accent">{String(n).padStart(2, '0')}</p>
        <h3 className="font-[family-name:var(--font-display)] text-[21px] font-semibold leading-tight mt-1">{s.title}</h3>
        <p className="text-sm text-muted mt-1.5">{s.explain}</p>
      </div>
      <div className="min-w-0">
        {editing ? (
          <textarea autoFocus className="input min-h-[120px] text-[16px] font-[family-name:var(--font-serif)]" value={s.script} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} aria-label={`Edit ${s.title}`} />
        ) : (
          <button onClick={() => setEditing(true)} className="text-left w-full group" aria-label={`Edit ${s.title}`}>
            <p className="font-[family-name:var(--font-serif)] text-[18px] leading-relaxed group-hover:bg-card">“<Script text={s.script} />”</p>
            <span className="text-xs text-muted underline underline-offset-4">{s.edited ? 'Edited · click to change' : 'Click to edit'}</span>
          </button>
        )}
        <div className="mt-4 grid sm:grid-cols-2 gap-5 text-sm">
          {s.followups.length > 0 && <div><p className="kicker text-muted mb-1.5">They may ask</p><ul className="grid gap-1.5">{s.followups.map((f) => <li key={f}>{f}</li>)}</ul></div>}
          {s.defend.length > 0 && <div><p className="kicker text-accent-ink mb-1.5">Be ready to defend</p><ul className="grid gap-1.5">{s.defend.map((f) => <li key={f}>{f}</li>)}</ul></div>}
        </div>
        {s.points.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{s.points.map((p) => <span key={p} className="chip">{p}</span>)}</div>}
      </div>
    </li>
  )
}

function Group({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="flex items-baseline gap-2 border-b border-line-2 pb-2.5 mb-2 w-full"><span className="font-mono text-[11px] text-accent">{n}</span><span className="font-[family-name:var(--font-display)] text-[22px] font-semibold">{title}</span></legend>
      {children}
    </fieldset>
  )
}

function F({ label, v, on, placeholder, area }: { label: string; v: string; on: (v: string) => void; placeholder?: string; area?: boolean }) {
  return (
    <label className="text-sm font-medium">{label}
      {area ? <textarea className="input mt-1 min-h-[76px] font-normal" value={v} placeholder={placeholder} onChange={(e) => on(e.target.value)} />
        : <input className="input mt-1 font-normal" value={v} placeholder={placeholder} onChange={(e) => on(e.target.value)} />}
    </label>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [d, setD] = useState(false)
  return <button onClick={async () => { try { await navigator.clipboard.writeText(text); setD(true); setTimeout(() => setD(false), 1500) } catch { /* ignore */ } }} className="btn btn-ghost !py-2">{d ? <Check size={15} /> : <Copy size={15} />} {d ? 'Copied' : 'Copy'}</button>
}
