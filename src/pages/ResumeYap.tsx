import { useMemo, useState } from 'react'
import { Check, Copy, Plus, Trash2, X } from 'lucide-react'
import { useProgress } from '../lib/progress'
import { checks, coverage, detectSkills, detectTech, variants, type Variant } from '../lib/resume'
import { useDocs, useDraft } from '../lib/docs'
import { ProTag } from '../components/ProLock'
import { PreviewGate } from './ProjectYap'

interface Bullet { id: string; text: string }
interface ResumeSet { bullets: Bullet[]; jd: string }

const EXAMPLE = 'I built a Power Automate flow that sends project status emails and creates folders for different project statuses.'
const uid = () => Math.random().toString(36).slice(2, 10)

export default function ResumeYap() {
  const { isPro } = useProgress()
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1180px]">
      <header className="border-b border-line pb-6">
        <p className="kicker text-accent-ink flex items-center gap-2">Resume Yapping <ProTag /></p>
        <h1 className="display text-[40px] sm:text-[58px] font-semibold mt-2">Say what you did. Get a bullet you can defend.</h1>
        <p className="mt-3 text-ink-2 max-w-2xl">Describe your work in plain words. You get technical, impact and concise versions, the keywords they cover, and a check against a job description. We never add tools, numbers or responsibilities you didn't give us.</p>
      </header>
      {isPro ? <Workbench /> : <Demo />}
    </div>
  )
}

function Demo() {
  const r = variants(EXAMPLE)
  return (
    <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-10">
      <div>
        <p className="kicker text-muted">Example input</p>
        <p className="mt-2 font-[family-name:var(--font-serif)] text-[19px] italic border-l-2 border-line-2 pl-4">“{EXAMPLE}”</p>
        <ul className="mt-6 grid gap-3">
          {r.variants.map((v) => (
            <li key={v.id} className="border border-line bg-card p-4">
              <p className="kicker text-accent-ink">{v.label}</p>
              <p className="mt-1.5 text-[16px] leading-relaxed">{v.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">Keywords covered: {[...r.tech, ...r.skills].join(', ')}</p>
      </div>
      <PreviewGate what="Resume Yapping" />
    </div>
  )
}

function Workbench() {
  const [form, setForm] = useDraft('ty:resume-form', { raw: '', scope: '', result: '', extra: '' })
  const [set, setSet] = useDraft<ResumeSet & { docId?: string; title: string }>('ty:resume-set', { bullets: [], jd: '', title: '' })
  const [picked, setPicked] = useState<Variant['id'] | null>(null)
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const { docs, save, remove, error } = useDocs<ResumeSet>('resume')
  const [savedMsg, setSavedMsg] = useState('')

  const extraTech = form.extra.split(',').map((x) => x.trim()).filter(Boolean)
  const out = useMemo(() => (form.raw.trim().length > 8 ? variants(form.raw, { scope: form.scope, result: form.result, tech: extraTech }) : null), [form.raw, form.scope, form.result, form.extra])
  const cov = coverage(set.jd, set.bullets.map((b) => b.text))

  const pick = (v: Variant) => { setPicked(v.id); setDraft(v.text) }
  const add = (text: string) => { setSet({ ...set, bullets: [...set.bullets, { id: uid(), text }] }); setPicked(null); setForm({ raw: '', scope: '', result: '', extra: '' }) }
  const doSave = async () => {
    const id = await save(set.title || set.bullets[0]?.text.slice(0, 60) || 'Resume bullets', { bullets: set.bullets, jd: set.jd }, set.docId)
    if (id) { setSet({ ...set, docId: id }); setSavedMsg('Saved'); setTimeout(() => setSavedMsg(''), 1800) }
  }

  return (
    <div className="mt-8 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14">
      {/* Composer */}
      <section>
        <h2 className="kicker text-muted">1 · What did you do?</h2>
        <textarea className="input mt-2 min-h-[110px] text-[16px]" value={form.raw} onChange={(e) => setForm({ ...form, raw: e.target.value })}
          placeholder={EXAMPLE} aria-label="Describe what you did" />
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <label className="text-sm">Who was it for? <span className="text-muted">(optional)</span><input className="input mt-1" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="the 12-person PMO team" /></label>
          <label className="text-sm">What changed? <span className="text-muted">(only if real)</span><input className="input mt-1" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="removing ~3 hours of manual work a week" /></label>
        </div>
        <label className="text-sm block mt-3">Other tools you used here <span className="text-muted">(comma separated)</span><input className="input mt-1" value={form.extra} onChange={(e) => setForm({ ...form, extra: e.target.value })} placeholder="SharePoint, Outlook" /></label>
        {!form.raw && <button onClick={() => setForm({ ...form, raw: EXAMPLE })} className="mt-3 text-sm underline underline-offset-4 text-muted hover:text-ink">Use an example</button>}

        {out && (
          <div className="mt-8">
            <h2 className="kicker text-muted">2 · Pick a version, then edit it</h2>
            <ul className="mt-3 grid gap-3">
              {out.variants.map((v) => (
                <li key={v.id}>
                  <button onClick={() => pick(v)} aria-pressed={picked === v.id}
                    className={`w-full text-left border p-4 transition-colors ${picked === v.id ? 'border-ink bg-card shadow-[4px_4px_0_var(--color-accent)]' : 'border-line hover:border-ink bg-paper'}`}>
                    <span className="kicker text-accent-ink">{v.label}</span>
                    <span className="block mt-1.5 text-[16px] leading-relaxed">{v.text}</span>
                  </button>
                </li>
              ))}
            </ul>
            {out.notes.length > 0 && <ul className="mt-4 grid gap-1.5">{out.notes.map((n) => <li key={n} className="text-sm text-ink-2 flex gap-2"><span className="text-accent">→</span>{n}</li>)}</ul>}
          </div>
        )}

        {picked && out && (
          <div className="mt-6 border border-ink p-5 rise">
            <BulletDetail text={draft} setText={setDraft} communicates={out.variants.find((v) => v.id === picked)!.communicates} />
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => add(draft)} className="btn btn-primary"><Plus size={16} /> Add to my bullets</button>
              <CopyBtn text={draft} />
            </div>
          </div>
        )}
      </section>

      {/* Set + JD */}
      <section>
        <div className="flex items-baseline justify-between border-b border-line-2 pb-2.5">
          <h2 className="font-[family-name:var(--font-display)] text-[24px] font-semibold">Your bullets</h2>
          <span className="font-mono text-xs text-muted">{set.bullets.length}</span>
        </div>
        {set.bullets.length === 0 && <p className="py-5 text-muted text-sm">Bullets you add show up here. Click one to edit, check or copy it.</p>}
        <ul className="divide-y divide-line">
          {set.bullets.map((b) => (
            <li key={b.id} className="py-3">
              <button onClick={() => setOpen(open === b.id ? null : b.id)} className="w-full text-left flex gap-3 group">
                <span className="text-accent mt-1">•</span><span className="flex-1 group-hover:text-accent-ink leading-relaxed">{b.text}</span>
              </button>
              {open === b.id && (
                <div className="mt-3 ml-5 rise">
                  <BulletDetail text={b.text} setText={(t) => setSet({ ...set, bullets: set.bullets.map((x) => (x.id === b.id ? { ...x, text: t } : x)) })} />
                  <div className="mt-3 flex gap-3"><CopyBtn text={b.text} />
                    <button onClick={() => setSet({ ...set, bullets: set.bullets.filter((x) => x.id !== b.id) })} className="btn btn-quiet text-sm"><Trash2 size={15} /> Remove</button></div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {set.bullets.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input className="input !w-auto flex-1 min-w-[180px]" value={set.title} onChange={(e) => setSet({ ...set, title: e.target.value })} placeholder="Name this set, e.g. Accenture role" />
            <button onClick={doSave} className="btn btn-primary">{savedMsg ? <><Check size={16} /> {savedMsg}</> : 'Save'}</button>
            <CopyBtn text={set.bullets.map((b) => `• ${b.text}`).join('\n')} label="Copy all" />
          </div>
        )}
        {error && <p className="mt-2 text-sm text-bad">{error}</p>}

        <div className="mt-10">
          <h3 className="section-title">Tailor to a job description</h3>
          <textarea className="input mt-3 min-h-[110px] text-sm" value={set.jd} onChange={(e) => setSet({ ...set, jd: e.target.value })} placeholder="Paste the job description here" aria-label="Job description" />
          {set.jd.trim() && (
            <div className="mt-4 text-sm">
              {cov.asked.length === 0 ? <p className="text-muted">We didn't recognise specific tools or skills in this description yet.</p> : <>
                <p className="font-semibold">The description asks for {cov.asked.length} things we recognise. Your bullets cover {cov.matched.length}.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cov.matched.map((k) => <span key={k} className="chip !border-good !text-good"><Check size={11} /> {k}</span>)}
                  {cov.missing.map((k) => <span key={k} className="chip">{k}</span>)}
                </div>
                {cov.missing.length > 0 && <p className="mt-3 text-ink-2">Add a missing keyword only if you really used it, and say where. A bullet you can't explain in an interview does more harm than a missing keyword.</p>}
                <p className="mt-2 text-xs text-muted">This checks keyword overlap with the description. It isn't an ATS score; no tool can promise one.</p>
              </>}
            </div>
          )}
        </div>

        {docs.length > 0 && (
          <div className="mt-10">
            <h3 className="section-title">Saved sets</h3>
            <ul className="divide-y divide-line">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <button onClick={() => setSet({ ...d.data, title: d.title, docId: d.id })} className="flex-1 text-left font-medium hover:text-accent-ink truncate">{d.title}<span className="block text-xs text-muted font-mono">{d.data.bullets.length} bullets</span></button>
                  <button onClick={() => remove(d.id)} aria-label={`Delete ${d.title}`} className="text-muted hover:text-bad p-1"><X size={15} /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => setSet({ bullets: [], jd: '', title: '' })} className="mt-3 text-sm underline underline-offset-4">Start a new set</button>
          </div>
        )}
      </section>
    </div>
  )
}

function BulletDetail({ text, setText, communicates }: { text: string; setText: (t: string) => void; communicates?: string }) {
  const tech = detectTech(text)
  const skills = detectSkills(text)
  return (
    <div>
      <label className="kicker text-muted" htmlFor="bullet-edit">The bullet</label>
      <textarea id="bullet-edit" className="input mt-1.5 min-h-[84px] text-[16px]" value={text} onChange={(e) => setText(e.target.value)} />
      {communicates && <p className="mt-3 text-sm text-ink-2"><strong>What it says to a reader:</strong> {communicates}</p>}
      <p className="mt-3 kicker text-muted">Keywords it covers</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{[...tech, ...skills].length ? [...tech, ...skills].map((k) => <span key={k} className="chip">{k}</span>) : <span className="text-sm text-muted">None detected yet</span>}</div>
      <ul className="mt-4 grid gap-1">
        {checks(text).map((c) => <li key={c.label} className={`text-sm flex gap-2 ${c.ok ? 'text-ink-2' : 'text-muted'}`}><span className={c.ok ? 'text-good' : 'text-faint'}>{c.ok ? '✓' : '○'}</span>{c.label}</li>)}
      </ul>
    </div>
  )
}

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) } catch { /* ignore */ } }} className="btn btn-ghost">
      {done ? <Check size={16} /> : <Copy size={16} />} {done ? 'Copied' : label}
    </button>
  )
}

