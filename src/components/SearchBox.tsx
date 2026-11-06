import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Search } from 'lucide-react'
import { useLibrary } from '../lib/content'
import { search, type Hit } from '../lib/search'

const KIND: Record<Hit['kind'], string> = { topic: 'Topic', concept: 'Deep read', interview: 'Interview Q' }

export function SearchBox({ autoFocus, size = 'lg', suggestions = true }: { autoFocus?: boolean; size?: 'lg' | 'md'; suggestions?: boolean }) {
  const lib = useLibrary()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const hits = useMemo(() => search(lib, q), [lib, q])
  const popular = useMemo(() => ['react', 'rag', 'docker', 'power-apps', 'system-design', 'llms'].map((s) => lib.techBySlug.get(s)).filter((t): t is NonNullable<typeof t> => !!t), [lib])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); input.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (h?: Hit) => { if (!h) return; setOpen(false); setQ(''); nav(h.to) }
  const big = size === 'lg'

  return (
    <div>
      <div className="relative">
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(hits[active]) }}
        className={`flex items-center gap-3 bg-card border-2 border-ink ${big ? 'h-16 sm:h-[72px] px-5' : 'h-12 px-4'} focus-within:shadow-[4px_4px_0_var(--color-accent)] transition-shadow`}>
        <Search size={big ? 22 : 18} className="text-muted shrink-0" aria-hidden />
        <input ref={input} autoFocus={autoFocus} value={q} type="search" enterKeyHint="search"
          onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder="React, RAG, Docker, Power Apps…" aria-label="Search technologies and concepts"
          role="combobox" aria-expanded={open && !!q} aria-controls={listId} aria-autocomplete="list"
          className={`flex-1 min-w-0 bg-transparent outline-none placeholder:text-faint ${big ? 'text-[19px] sm:text-[22px]' : 'text-[16px]'}`} />
        <kbd className="hidden sm:inline font-mono text-[11px] text-faint border border-line px-1.5 py-0.5">/</kbd>
      </form>

      {open && q && (
        <div id={listId} role="listbox" className="absolute z-40 left-0 right-0 top-full mt-2 bg-card border border-ink shadow-[0_12px_40px_-12px_rgba(22,20,15,.35)] max-h-[60vh] overflow-auto">
          {hits.length ? hits.map((h, i) => (
            <button key={h.to} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => go(h)} onMouseEnter={() => setActive(i)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-line last:border-0 ${i === active ? 'bg-paper-2' : ''}`}>
              <span className={`font-mono text-[10px] tracking-widest uppercase mt-1 w-20 shrink-0 ${h.kind === 'topic' ? 'text-accent-ink' : 'text-muted'}`}>{KIND[h.kind]}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">{h.title}</span>
                <span className="block text-sm text-muted truncate">{h.sub}</span>
              </span>
              <ArrowUpRight size={15} className="text-faint mt-1 shrink-0" />
            </button>
          )) : (
            <div className="px-4 py-4 text-sm">
              <p className="font-semibold">No topic for “{q}” yet.</p>
              <p className="text-muted mt-1">We add topics every week. Try one of these:</p>
              <div className="flex flex-wrap gap-2 mt-3">{popular.map((t) => <Link key={t.slug} to={`/app/yap/${t.slug}`} className="chip hover:border-ink">{t.title}</Link>)}</div>
            </div>
          )}
        </div>
      )}
      </div>

      {suggestions && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="kicker text-muted mr-1">Try</span>
          {popular.map((t) => <Link key={t.slug} to={`/app/yap/${t.slug}`} className="chip hover:border-ink hover:text-ink">{t.title}</Link>)}
        </div>
      )}
    </div>
  )
}
