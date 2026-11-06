import { Link } from 'react-router-dom'

export function Mark({ size = 28, inverted = false }: { size?: number; inverted?: boolean }) {
  const bg = inverted ? '#F3EFE6' : '#16140F'
  const fg = inverted ? '#16140F' : '#F3EFE6'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M6 6h52v40H26L12 58V46H6z" fill={bg} />
      <path d="M17 18l9 8-9 8" fill="none" stroke={fg} strokeWidth="5" strokeLinecap="square" />
      <rect x="31" y="30" width="15" height="5" fill="#E5482A" className="caret" />
    </svg>
  )
}

export function Logo({ to = '/', inverted = false, size = 26 }: { to?: string; inverted?: boolean; size?: number }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group" aria-label="TechYapper home">
      <Mark size={size} inverted={inverted} />
      <span className={`font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-[-0.03em] leading-none ${inverted ? 'text-paper' : 'text-ink'}`}>
        tech<span className="italic font-normal">yapper</span>
      </span>
    </Link>
  )
}
