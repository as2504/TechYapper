import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useLibrary } from '../lib/content'
import { useProgress } from '../lib/progress'
import { CATEGORIES } from '../content/types'
import { SearchBox } from '../components/SearchBox'

export default function Explore() {
  const lib = useLibrary()
  const { find } = useProgress()
  const { hash } = useLocation()
  useEffect(() => { if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 50) }, [hash])
  const yapped = lib.techs.filter((t) => find('topic', t.slug)).length

  return (
    <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-16 max-w-[1180px]">
      <header className="border-b border-line pb-6">
        <h1 className="display text-[38px] sm:text-[54px] font-semibold">Explore topics</h1>
        <p className="mt-2 text-muted">{lib.techs.length} topics · you can talk about {yapped} of them</p>
        <div className="mt-6 max-w-2xl"><SearchBox size="md" suggestions={false} /></div>
      </header>

      <nav className="mt-6 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Categories">
        {CATEGORIES.map((c) => <a key={c.id} href={`#${c.id}`} className="chip shrink-0 hover:border-ink">{c.label}</a>)}
      </nav>

      {CATEGORIES.map((c) => {
        const items = lib.techs.filter((t) => t.category === c.id)
        if (!items.length) return null
        return (
          <section key={c.id} id={c.id} className="mt-12 scroll-mt-28">
            <div className="flex items-baseline justify-between gap-4 border-b border-line-2 pb-2.5">
              <h2 className="font-[family-name:var(--font-display)] text-[22px] sm:text-[26px] font-semibold tracking-[-0.015em]">{c.label}</h2>
              <span className="hidden sm:block text-sm text-muted">{c.blurb}</span>
            </div>
            <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((t) => {
                const done = !!find('topic', t.slug)
                return (
                  <li key={t.slug}>
                    <Link to={`/app/yap/${t.slug}`} className="group panel block p-5 h-full hover:border-ink-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-[family-name:var(--font-display)] text-[24px] font-semibold group-hover:text-accent-ink leading-tight">{t.title}</span>
                        {done && <span className="chip !border-good !text-good shrink-0"><Check size={11} /> Can yap</span>}
                      </div>
                      <p className="mt-2 text-[15px] text-ink-2 leading-snug line-clamp-2">{t.tagline}</p>
                      <p className="mt-3 text-xs text-muted first-letter:uppercase">{t.level} · {t.minutes} min · {t.interview.length} interview Qs</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
