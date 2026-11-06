import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Mic, Trophy } from 'lucide-react'
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
        {/* Discover */}
        <section className="px-4 sm:px-8 pt-12 sm:pt-24 pb-14 max-w-[1040px] mx-auto">
          <h1 className="display text-[44px] sm:text-[80px] font-semibold max-w-4xl">What do you want to yap about today?</h1>
          <p className="mt-5 text-[18px] sm:text-[21px] text-ink-2 max-w-2xl font-[family-name:var(--font-serif)]">Discover technology, understand the concepts, and learn how to talk about them.</p>
          <div className="mt-9"><SearchBox autoFocus /></div>
          <p className="mt-5 text-sm text-muted">No signup needed to explore. {lib.techs.length} topics, from React to Power Automate.</p>
        </section>

        {/* Explore */}
        <section className="px-4 sm:px-8 pb-16 max-w-[1040px] mx-auto">
          <h2 className="kicker text-muted border-b border-ink pb-2">Explore topics</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
            {CATEGORIES.map((c) => {
              const items = lib.techs.filter((t) => t.category === c.id)
              if (!items.length) return null
              return (
                <li key={c.id} className="py-4 border-b border-line">
                  <Link to={`/app/explore#${c.id}`} className="font-semibold hover:text-accent-ink">{c.label}</Link>
                  <p className="mt-1.5 text-[15px] text-muted leading-relaxed">
                    {items.map((t, i) => <span key={t.slug}>{i > 0 && ' · '}<Link to={`/app/yap/${t.slug}`} className="hover:text-ink hover:underline underline-offset-4">{t.title}</Link></span>)}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        {/* The one idea */}
        {demo && (
          <section className="bg-ink text-paper">
            <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-[1040px] mx-auto grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16 items-start">
              <div>
                <p className="kicker text-accent">The point of TechYapper</p>
                <h2 className="display text-[36px] sm:text-[48px] font-semibold mt-3">Understand it well enough to explain it.</h2>
                <p className="mt-4 text-paper/70 text-[17px]">Roadmaps tell you what to learn. TechYapper helps you understand it, then gives you the words: a one-breath answer, a 30-second answer, and replies to the follow-up questions.</p>
                <Link to={`/app/yap/${demo.slug}`} className="btn btn-accent mt-7">Open {demo.title} <ArrowRight size={16} /></Link>
              </div>
              <div className="border border-paper/25 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="kicker text-paper/60">If someone asks “What is {demo.title}?”</p>
                  <div className="flex border border-paper/30" role="group" aria-label="Answer length">
                    {(['10', '30'] as const).map((l) => (
                      <button key={l} onClick={() => setLen(l)} aria-pressed={len === l} className={`px-3 py-1.5 font-mono text-[11px] tracking-wider ${len === l ? 'bg-paper text-ink' : 'text-paper/70'}`}>{l === '10' ? 'ONE BREATH' : '30 SECONDS'}</button>
                    ))}
                  </div>
                </div>
                <p key={len} className="mt-5 font-[family-name:var(--font-display)] text-[21px] sm:text-[25px] leading-[1.35]">“{len === '10' ? demo.talk10 : demo.talk30}”</p>
                {demo.comebacks[0] && (
                  <div className="mt-6 pt-5 border-t border-paper/20 text-[15px]">
                    <p className="text-paper/60">They say: “{demo.comebacks[0].q}”</p>
                    <p className="mt-1.5">You say: {demo.comebacks[0].a}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Ways to yap */}
        <section className="px-4 sm:px-8 py-16 max-w-[1040px] mx-auto">
          <h2 className="kicker text-muted border-b border-ink pb-2">Ways to get confident</h2>
          <ul className="grid md:grid-cols-3">
            <Way icon={Trophy} title="Battle and rank" body="Daily questions from beginner to advanced. Verified XP, streaks and a weekly leaderboard." to="/app/battle" />
            <Way icon={Mic} title="Project Yapping" pro body="Turn your own project into a clear, structured explanation for interviews. Nothing invented." to="/app/project-yap" />
            <Way icon={FileText} title="Resume Yapping" pro body="Turn what you did into ATS-friendly resume bullets and check them against a job description." to="/app/resume-yap" />
          </ul>
          <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-y-2 border-ink py-7">
            <p className="font-[family-name:var(--font-display)] text-[24px] sm:text-[28px] font-semibold leading-tight">Free to explore and compete. Pro from ₹99/month.</p>
            <div className="flex gap-3"><Link to="/app" className="btn btn-primary">Start yapping</Link><Link to="/pricing" className="btn btn-ghost">Pricing</Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Way({ icon: Icon, title, body, to, pro }: { icon: typeof Mic; title: string; body: string; to: string; pro?: boolean }) {
  return (
    <li className="border-b border-line md:border-b-0 md:[&:not(:first-child)]:border-l md:px-6 md:first:pl-0 py-6">
      <Link to={to} className="group block">
        <Icon size={22} className="text-accent" />
        <p className="mt-3 font-[family-name:var(--font-display)] text-[24px] font-semibold group-hover:text-accent-ink flex items-center gap-2">{title}{pro && <span className="pro-tag">PRO</span>}</p>
        <p className="mt-2 text-ink-2 text-[15px]">{body}</p>
      </Link>
    </li>
  )
}
