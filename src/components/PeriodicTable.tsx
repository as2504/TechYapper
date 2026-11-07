import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useLibrary } from '../lib/content'
import { LEVEL_LABEL, symbolOf, useMastery, type Level, type Mastery } from '../lib/mastery'
import { CATEGORIES, type Tech } from '../content/types'

const SHORT: Record<string, string> = {
  development: 'Dev', ai: 'AI · ML', 'data-cloud': 'Data · Cloud', 'backend-infra': 'Infra', enterprise: 'Enterprise', security: 'Security', engineering: 'Engineering',
}

const STYLE: Record<Level, string> = {
  0: 'bg-card border border-line text-faint hover:border-ink-2 hover:text-ink-2',
  1: 'bg-card border-2 border-ink-2 text-ink',
  2: 'bg-accent border border-accent text-white',
  3: 'bg-spot border-2 border-accent text-on-spot',
}
const RUSTY = 'bg-rust-wash border-2 border-dashed border-rust text-ink'

function Tile({ t, n, m, size }: { t: Tech; n: number; m: Mastery; size: 'md' | 'sm' }) {
  const cls = m.rusty ? RUSTY : STYLE[m.level]
  return (
    <Link to={`/app/yap/${t.slug}`} title={`${t.title} · ${m.rusty ? 'Getting rusty' : LEVEL_LABEL[m.level]}`}
      className={`group relative block aspect-square rounded-[4px] p-2 sm:p-2.5 transition-transform hover:-translate-y-0.5 ${cls}`}>
      <span className="absolute top-1.5 left-2 font-mono text-[9px] sm:text-[10px] opacity-70">{n}</span>
      <span className="absolute top-2 right-2 flex gap-0.5" aria-hidden>
        {m.level === 3 ? <Star size={10} className="fill-current" /> : [1, 2, 3].map((d) => <span key={d} className={`w-1 h-1 rounded-full ${m.level >= d ? 'bg-current' : 'bg-current opacity-20'}`} />)}
      </span>
      <span className={`absolute inset-0 grid place-items-center font-[family-name:var(--font-display)] font-semibold tracking-[-0.03em] ${size === 'md' ? 'text-[30px] sm:text-[36px]' : 'text-[22px] sm:text-[26px]'}`}>{symbolOf(t)}</span>
      <span className={`absolute bottom-1.5 inset-x-2 truncate text-center ${size === 'md' ? 'text-[10px] sm:text-[11px]' : 'text-[9px]'} font-medium opacity-80`}>{t.title}</span>
    </Link>
  )
}

/** The signature view: every topic as an element that lights up as you master it. */
export function PeriodicTable({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const { techs } = useLibrary()
  const { map } = useMastery()
  const cols = CATEGORIES.map((c) => ({ c, items: techs.filter((t) => t.category === c.id) })).filter((x) => x.items.length)
  const number = new Map(cols.flatMap((x) => x.items).map((t, i) => [t.slug, i + 1]))

  return (
    <>
      {/* Desktop: categories as columns, like element groups */}
      <div className="hidden md:grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
        {cols.map(({ c, items }) => (
          <div key={c.id} className="grid gap-2.5 content-start">
            <p className="kicker text-faint text-center truncate pb-1">{SHORT[c.id]}</p>
            {items.map((t) => <Tile key={t.slug} t={t} n={number.get(t.slug)!} m={map.get(t.slug)!} size={size} />)}
          </div>
        ))}
      </div>
      {/* Mobile: one dense grid, still in group order */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        {cols.flatMap(({ items }) => items).map((t) => <Tile key={t.slug} t={t} n={number.get(t.slug)!} m={map.get(t.slug)!} size="sm" />)}
      </div>
    </>
  )
}

export function Legend() {
  const { counts, rusty } = useMastery()
  const items: { cls: string; label: string; n: number }[] = [
    { cls: STYLE[0], label: LEVEL_LABEL[0], n: counts[0] },
    { cls: STYLE[1], label: LEVEL_LABEL[1], n: counts[1] },
    { cls: STYLE[2], label: LEVEL_LABEL[2], n: counts[2] - rusty.length + 0 },
    { cls: STYLE[3], label: LEVEL_LABEL[3], n: counts[3] },
    { cls: RUSTY, label: 'Getting rusty', n: rusty.length },
  ]
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
      {items.map((i) => <li key={i.label} className="flex items-center gap-2"><span className={`w-3.5 h-3.5 rounded-[3px] ${i.cls}`} />{i.label}<span className="font-mono text-xs text-faint">{Math.max(0, i.n)}</span></li>)}
    </ul>
  )
}
