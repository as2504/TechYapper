// Checks a spoken/typed explanation against a topic's key points. Runs locally and instantly.
const STOP = new Set('the a an and or of to in on for with is are be it its this that they them their your you can will from into out over under more most less than then when what which who how why does do not no but as at by about just very also only every each make makes made matter matters important things thing know use used uses using like good well much many some any'.split(' '))
const stem = (w: string) => w.replace(/(ings|ing|edly|ed|es|s)$/, (m) => (w.length - m.length >= 4 ? '' : m))
const words = (s: string) => s.toLowerCase().replace(/\*\*|`/g, '').match(/[a-z0-9+#.]+/g)?.map((w) => w.replace(/\.+$/, '')).filter(Boolean) ?? []

export interface KeyPoint { label: string; terms: string[] }

/** Up to 4 distinctive terms per point, taken from its headline (and any bold words). */
export function keyPoints(know: string[], heads: string[]): KeyPoint[] {
  return know.map((k, i) => {
    const bold = [...k.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1])
    const src = [...bold, heads[i]].join(' ')
    const terms = [...new Set(words(src).filter((w) => w.length >= 3 && !STOP.has(w)).map(stem))].slice(0, 4)
    return { label: heads[i], terms }
  })
}

export function coverage(text: string, points: KeyPoint[]): boolean[] {
  const have = new Set(words(text).map(stem))
  return points.map((p) => {
    if (!p.terms.length) return false
    const hit = p.terms.filter((t) => have.has(t) || [...have].some((h) => h.length >= 5 && (h.startsWith(t) || t.startsWith(h)))).length
    return hit >= Math.max(1, Math.ceil(p.terms.length * 0.4))
  })
}

/* ───────── Browser speech recognition (optional) ───────── */
interface SR { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; abort(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null }
type SRCtor = new () => SR
export const speechCtor = (): SRCtor | null => {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}
export type { SR }
