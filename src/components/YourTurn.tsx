import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Keyboard, Mic, MicOff, EyeOff } from 'lucide-react'
import type { Tech } from '../content/types'
import { coverage, keyPoints, speechCtor, type SR } from '../lib/explain'
import { useProgress, XP } from '../lib/progress'
import { dateKey } from '../lib/dates'

type Mode = 'quiet' | 'type' | 'speak'
const LIMIT = 30

/** "Explain it back." Quiet by default so it works on a train; typing and speaking are opt-in. */
export function YourTurn({ t, heads }: { t: Tech; heads: string[] }) {
  const { find, record } = useProgress()
  const points = useMemo(() => keyPoints(t.know, heads), [t, heads])
  const canSpeak = typeof window !== 'undefined' && !!speechCtor()
  const [mode, setMode] = useState<Mode>(() => { try { const m = localStorage.getItem('ty:say-mode') as Mode; return m === 'speak' && !canSpeak ? 'quiet' : m || 'quiet' } catch { return 'quiet' } })
  const [ticked, setTicked] = useState<boolean[]>(() => points.map(() => false))
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [left, setLeft] = useState(LIMIT)
  const [note, setNote] = useState('')
  const rec = useRef<SR | null>(null)
  const want = useRef(false)
  const itemId = `${t.slug}@${dateKey()}`
  const done = find('say', itemId)

  useEffect(() => { try { localStorage.setItem('ty:say-mode', mode) } catch { /* ignore */ } }, [mode])
  useEffect(() => () => { want.current = false; rec.current?.abort() }, [])

  const live = mode === 'quiet' ? ticked : coverage(text + ' ' + interim, points)
  const hit = live.filter(Boolean).length

  const stop = () => { want.current = false; rec.current?.stop(); setListening(false); setInterim('') }
  const start = () => {
    const Ctor = speechCtor()
    if (!Ctor) return
    const r = new Ctor()
    r.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      let fin = ''
      let mid = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) fin += res[0].transcript + ' '; else mid += res[0].transcript
      }
      if (fin) setText((x) => (x + ' ' + fin).trim())
      setInterim(mid)
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { setNote('Microphone is blocked, so we switched to typing.'); setMode('type') }
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setNote('Speech stopped. You can keep going by typing.')
    }
    // Browsers end recognition after a pause; quietly resume while the timer is running.
    r.onend = () => { if (want.current) { try { r.start() } catch { setListening(false) } } else setListening(false) }
    rec.current = r
    want.current = true
    setText(''); setInterim(''); setNote(''); setLeft(LIMIT)
    try { r.start(); setListening(true) } catch { setNote('Could not start the microphone.') }
  }
  useEffect(() => {
    if (!listening) return
    if (left <= 0) { stop(); return }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [listening, left])

  const submit = () => {
    if (listening) stop()
    record({ kind: 'say', item_id: itemId, correct: hit / points.length >= 0.6, choice: Math.min(hit, 9), xp: XP.say })
  }

  if (done) {
    const n = done.choice ?? 0
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <p className="font-[family-name:var(--font-display)] text-[64px] sm:text-[88px] leading-none font-semibold text-accent">{n}/{points.length}</p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-[26px] sm:text-[34px] font-semibold leading-tight">{done.correct ? 'You can explain it.' : 'Almost. One more pass tomorrow.'}</p>
        <p className="mt-3 text-muted">+{done.xp} XP · practise again tomorrow to keep it fresh</p>
      </div>
    )
  }

  return (
    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
      <h2 className="font-[family-name:var(--font-display)] text-[28px] sm:text-[40px] font-semibold leading-tight">Explain {t.title} in 30 seconds.</h2>

      <div className="mt-5 inline-flex p-1 rounded-full bg-paper-2" role="tablist" aria-label="How do you want to explain it?">
        {([['quiet', 'In my head', EyeOff], ['type', 'Type', Keyboard], ...(canSpeak ? [['speak', 'Say it', Mic]] : [])] as [Mode, string, typeof Mic][]).map(([m, label, Icon]) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => { if (listening) stop(); setMode(m) }}
            className={`flex items-center gap-1.5 px-3.5 h-9 rounded-full text-sm font-medium transition-colors ${mode === m ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {mode === 'type' && (
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={`${t.title} is…`}
          className="input mt-5 min-h-[96px] py-3 text-[16px] leading-relaxed" aria-label="Your explanation" />
      )}
      {mode === 'speak' && (
        <div className="mt-5 flex items-start gap-4">
          <button onClick={listening ? stop : start} aria-label={listening ? 'Stop' : 'Start speaking'}
            className={`relative shrink-0 w-16 h-16 rounded-full grid place-items-center ${listening ? 'bg-accent text-white' : 'bg-ink text-paper'}`}>
            {listening && <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />}
            {listening ? <MicOff size={22} className="relative" /> : <Mic size={22} />}
          </button>
          <div className="min-w-0 flex-1 min-h-[64px] tint px-4 py-3 text-[15px] leading-relaxed">
            {text || interim ? <>{text} <span className="text-muted">{interim}</span></> : <span className="text-faint">{listening ? 'Listening…' : 'Tap the mic and talk. Words appear as you speak.'}</span>}
          </div>
          {listening && <span className="font-mono text-sm text-accent pt-5 w-8 text-right">{left}s</span>}
        </div>
      )}
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}

      <p className="mt-6 text-sm text-muted">{mode === 'quiet' ? 'Say it in your head, then tick what you covered.' : 'Key points light up as you cover them.'}</p>
      <ul className="mt-3 grid sm:grid-cols-2 gap-2">
        {points.map((p, i) => (
          <li key={p.label}>
            <button disabled={mode !== 'quiet'} onClick={() => setTicked((x) => x.map((v, j) => (j === i ? !v : v)))}
              className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] border text-[15px] transition-colors ${live[i] ? 'border-good bg-good-wash text-ink' : 'border-line bg-paper text-ink-2'} ${mode === 'quiet' ? 'hover:border-ink-2' : 'cursor-default'}`}>
              <span className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${live[i] ? 'bg-good text-paper' : 'border border-line-2'}`}>{live[i] && <Check size={12} strokeWidth={3} />}</span>
              {p.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={submit} disabled={mode === 'quiet' ? false : !(text || interim).trim()} className="btn btn-primary">Done · {hit}/{points.length}</button>
        <span className="text-xs text-faint">+{XP.say} XP</span>
      </div>
      {mode === 'speak' && <p className="mt-3 text-xs text-faint">Speech is turned into text by your browser's speech service. Nothing is recorded or saved by TechYapper.</p>}
    </div>
  )
}
