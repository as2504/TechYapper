import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PublicNav, Footer } from '../components/PublicNav'
import { SearchBox } from '../components/SearchBox'
import { useLibrary } from '../lib/content'
import { CATEGORIES } from '../content/types'

export default function Landing() {
  const lib = useLibrary()
  const demo = lib.techBySlug.get('rag') ?? lib.techs[0]
  const [len, setLen] = useState<'10' | '30'>('10')

  return (
    <div className="min-h-dvh flex flex-col">
      <PublicNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-5 sm:px-10 pt-16 sm:pt-32 pb-20 sm:pb-28 max-w-[960px] mx-auto">
          <h1 className="display text-[44px] sm:text-[84px] font-semibold">What do you want to yap about today?</h1>
          <p className="mt-6 text-[17px] sm:text-[20px] text-muted max-w-xl">Understand any technology, and learn how to talk about it.</p>
          <div className="mt-12"><SearchBox autoFocus /></div>
        </section>

        {/* Categories */}
        <section className="px-5 sm:px-10 pb-24 sm:pb-32 max-w-[960px] mx-auto">
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((c) => {
              const n = lib.techs.filter((t) => t.category === c.id).length
              if (!n) return null
              return (
                <li key={c.id}>
                  <Link to={`/app/explore#${c.id}`} className="group panel flex flex-col justify-between h-full min-h-[110px] p-5 hover:border-ink-2">
                    <span className="font-semibold leading-snug group-hover:text-accent-ink">{c.label}</span>
                    <span className="text-xs text-muted mt-3">{n} topic{n > 1 ? 's' : ''}</span>
                  </Link>
                </li>
              )
            })}
            <li>
              <Link to="/app/explore" className="group flex items-end h-full min-h-[110px] p-5 rounded-[3px] bg-ink text-paper hover:bg-accent-ink">
                <span className="font-semibold flex items-center gap-2">See all <ArrowRight size={16} /></span>
              </Link>
            </li>
          </ul>
        </section>

        {/* One example */}
        {demo && (
          <section className="bg-ink text-paper">
            <div className="px-5 sm:px-10 py-20 sm:py-28 max-w-[960px] mx-auto">
              <p className="kicker text-accent">How it works</p>
              <h2 className="display text-[34px] sm:text-[52px] font-semibold mt-4 max-w-2xl">Get the words, not just the facts.</h2>
              <div className="mt-12 border-l-2 border-accent pl-6 sm:pl-8">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-paper/60 text-sm">If someone asks “What is {demo.title}?”</p>
                  <div className="flex border border-paper/25 rounded-[3px] overflow-hidden" role="group" aria-label="Answer length">
                    {(['10', '30'] as const).map((l) => (
                      <button key={l} onClick={() => setLen(l)} aria-pressed={len === l} className={`px-3 py-1 text-xs font-medium ${len === l ? 'bg-paper text-ink' : 'text-paper/70'}`}>{l === '10' ? 'Short' : '30 sec'}</button>
                    ))}
                  </div>
                </div>
                <p className="mt-5 font-[family-name:var(--font-display)] text-[22px] sm:text-[30px] leading-[1.35] max-w-3xl">“{len === '10' ? demo.talk10 : demo.talk30}”</p>
              </div>
              <Link to={`/app/yap/${demo.slug}`} className="btn btn-accent mt-12">Try it with {demo.title} <ArrowRight size={16} /></Link>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-5 sm:px-10 py-24 sm:py-32 max-w-[960px] mx-auto text-center">
          <h2 className="display text-[34px] sm:text-[52px] font-semibold">Free to start.</h2>
          <p className="mt-4 text-muted">Battles, leaderboard and every topic. Pro adds Project and Resume Yapping.</p>
          <div className="mt-9 flex justify-center gap-3"><Link to="/app" className="btn btn-primary">Start yapping</Link><Link to="/pricing" className="btn btn-ghost">Pricing</Link></div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
