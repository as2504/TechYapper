import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Copy, RotateCcw } from 'lucide-react'
import type { Tech } from '../content/types'
import { inline } from './Markdown'
import { Explanation, Options, QuizPrompt } from './Quiz'
import { useProgress, XP } from '../lib/progress'
import { useLibrary } from '../lib/content'
import { YourTurn } from './YourTurn'

type Tone = 'ink' | 'accent' | 'card' | 'tint'
interface Card { key: string; label: string; tone: Tone; body: ReactNode }

const TONE: Record<Tone, string> = {
  ink: 'bg-spot text-on-spot',
  accent: 'bg-accent text-white',
  card: 'bg-card text-ink border border-line',
  tint: 'bg-paper-2 text-ink',
}
const SUB: Record<Tone, string> = { ink: 'text-on-spot/60', accent: 'text-white/75', card: 'text-muted', tint: 'text-muted' }

/** Split "**Term** rest." into a headline and a short note. */
function point(k: string) {
  const m = /^\*\*(.+?)\*\*[\s:.,-]*(.*)$/.exec(k)
  const head = (m ? m[1] : k.split(/[.:]\s/)[0]).replace(/[\s:.,-]+$/, '')
  const rest = m ? m[2] : k.slice(head.length).replace(/^[\s:.,-]+/, '')
  return { head, note: rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '' }
}

/** The default way to learn a topic: one idea per screen, tap or swipe through. */
export function TopicDeck({ t, onOpenPage, startAt }: { t: Tech; onOpenPage: (tab?: string) => void; startAt?: string }) {
  const { find, record } = useProgress()
  const lib = useLibrary()
  const [i, setI] = useState(0)
  const [copied, setCopied] = useState(false)
  const check = find('tcheck', t.slug)
  const yapped = !!find('topic', t.slug)
  const next = lib.techBySlug.get(t.related[0] ?? '')

  const cards: Card[] = useMemo(() => {
    const big = 'font-[family-name:var(--font-display)] font-semibold tracking-[-0.02em]'
    const c: Card[] = [
      { key: 'cover', label: t.title, tone: 'card', body: (
        <div>
          <h2 className={`${big} display text-[52px] sm:text-[84px] leading-[0.95]`}>{t.title}</h2>
          <p className="mt-6 text-[18px] sm:text-[21px] text-muted max-w-lg leading-snug">{t.tagline}</p>
          <p className="mt-10 text-sm text-muted">{t.know.length + (t.comebacks.length ? 8 : 7)} cards · about 2 minutes</p>
        </div>) },
      { key: 'one', label: 'In one line', tone: 'ink', body: (
        <p className={`${big} text-[28px] sm:text-[42px] leading-[1.18]`}>{t.talk10}</p>) },
      { key: 'like', label: 'Think of it like', tone: 'accent', body: (
        <p className={`${big} text-[24px] sm:text-[36px] leading-[1.25]`}>{t.analogy}</p>) },
      ...t.know.map((k, n) => {
        const p = point(k)
        return { key: `k${n}`, label: `Remember · ${n + 1} of ${t.know.length}`, tone: (n % 2 ? 'tint' : 'card') as Tone, body: (
          <div>
            <span className="font-[family-name:var(--font-display)] text-[64px] sm:text-[96px] leading-none text-accent font-semibold">{n + 1}</span>
            <p className={`${big} mt-4 text-[30px] sm:text-[46px] leading-[1.1]`}>{inline(p.head)}</p>
            {p.note && <p className="mt-5 text-[17px] sm:text-[20px] text-muted max-w-lg leading-relaxed">{inline(p.note)}</p>}
          </div>) }
      }),
      { key: 'say', label: 'Say it in 30 seconds', tone: 'ink', body: (
        <div>
          <p className="font-[family-name:var(--font-serif)] text-[20px] sm:text-[26px] leading-[1.5]">“{t.talk30}”</p>
          <button onClick={async (e) => { e.stopPropagation(); try { await navigator.clipboard.writeText(t.talk30); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ } }}
            className="mt-8 inline-flex items-center gap-2 text-sm text-on-spot/70 hover:text-on-spot">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}</button>
        </div>) },
      ...(t.comebacks[0] ? [{ key: 'back', label: 'If they push back', tone: 'tint' as Tone, body: (
        <div className="grid gap-8">
          {t.comebacks.slice(0, 2).map((cb) => (
            <div key={cb.q}>
              <p className="text-[19px] sm:text-[23px] font-semibold leading-snug">“{cb.q}”</p>
              <p className="mt-3 text-[16px] sm:text-[18px] text-ink-2 leading-relaxed border-l-2 border-accent pl-4">{inline(cb.a)}</p>
            </div>
          ))}
        </div>) }] : []),
      { key: 'turn', label: 'Your turn', tone: 'card', body: <YourTurn t={t} heads={t.know.map((k) => point(k).head)} /> },
      { key: 'check', label: 'Quick check', tone: 'card', body: (
        <div onClick={(e) => e.stopPropagation()}>
          <QuizPrompt quiz={t.check} size="md" />
          <Options quiz={t.check} chosen={check?.choice ?? null} onChoose={(n) => record({ kind: 'tcheck', item_id: t.slug, correct: n === t.check.answer, choice: n, xp: n === t.check.answer ? XP.tcheck : XP.attempt })} />
          {check?.choice != null && <Explanation quiz={t.check} chosen={check.choice} xp={check.xp} />}
        </div>) },
      { key: 'done', label: 'Your call', tone: 'accent', body: (
        <div onClick={(e) => e.stopPropagation()}>
          <h2 className={`${big} text-[34px] sm:text-[54px] leading-[1.05]`}>{yapped ? `You can talk about ${t.title}.` : `Could you explain ${t.title} now?`}</h2>
          <div className="mt-10 flex flex-wrap gap-3">
            {!yapped && <button onClick={() => record({ kind: 'topic', item_id: t.slug, correct: null, choice: null, xp: XP.topic })} className="btn bg-white text-[#16140F] hover:bg-white/90"><Check size={16} /> Yes · +{XP.topic} XP</button>}
            <button onClick={() => onOpenPage('interview')} className="btn border border-white/60 text-white hover:bg-white/10">Interview questions</button>
            <button onClick={() => onOpenPage('deeper')} className="btn border border-white/60 text-white hover:bg-white/10">Go deeper</button>
          </div>
          {next && <Link to={`/app/yap/${next.slug}`} className="mt-10 inline-flex items-center gap-2 font-semibold hover:underline underline-offset-4">Next: {next.title} <ArrowRight size={16} /></Link>}
        </div>) },
    ]
    return c
  }, [t, check, yapped, copied, next, record, onOpenPage])

  const last = cards.length - 1
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(last, x + d))), [last])
  useEffect(() => { const n = startAt ? cards.findIndex((c) => c.key === startAt) : 0; setI(n > 0 ? n : 0) }, [t.slug, startAt]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [go])

  // Swipe on touch screens.
  const start = useRef<number | null>(null)
  const card = cards[i]

  return (
    <div className="select-none">
      {/* Progress */}
      <div className="flex gap-1" aria-label={`Card ${i + 1} of ${cards.length}`}>
        {cards.map((c, n) => (
          <button key={c.key} onClick={() => setI(n)} aria-label={`Go to card ${n + 1}`} className="flex-1 py-2">
            <span className={`block h-[3px] rounded-full transition-colors ${n <= i ? 'bg-accent' : 'bg-line-2'}`} />
          </button>
        ))}
      </div>

      <div
        onPointerDown={(e) => { start.current = e.clientX }}
        onPointerUp={(e) => { if (start.current == null) return; const dx = e.clientX - start.current; start.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1) }}
        className={`mt-3 rounded-[6px] min-h-[62vh] sm:min-h-[520px] p-7 sm:p-14 flex flex-col ${TONE[card.tone]}`}>
        <p className={`kicker ${SUB[card.tone]}`}>{card.label}</p>
        <div key={card.key} className="flex-1 flex items-center py-8 deck-in">
          <div className="w-full max-w-[760px]">{card.body}</div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => go(-1)} disabled={i === 0} className={`p-2.5 -ml-2.5 rounded-full disabled:opacity-0 ${SUB[card.tone]} hover:opacity-100`} aria-label="Previous card"><ArrowLeft size={20} /></button>
          <span className={`font-mono text-xs ${SUB[card.tone]}`}>{i + 1} / {cards.length}</span>
          {i < last ? (
            <button onClick={() => go(1)} className={`h-12 w-12 grid place-items-center rounded-full ${card.tone === 'ink' ? 'bg-on-spot text-spot' : card.tone === 'accent' ? 'bg-white text-[#16140F]' : 'bg-spot text-on-spot'}`} aria-label="Next card"><ArrowRight size={20} /></button>
          ) : (
            <button onClick={() => setI(0)} className="h-12 w-12 grid place-items-center rounded-full bg-white text-[#16140F]" aria-label="Start again"><RotateCcw size={18} /></button>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-faint hidden sm:block">Use ← → or tap the arrows</p>
    </div>
  )
}
