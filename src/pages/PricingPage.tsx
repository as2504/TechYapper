import { PublicNav, Footer } from '../components/PublicNav'
import { PricingTable } from '../components/Pricing'

const FAQ = [
  ['Is the free plan actually useful?', 'Yes. Every topic, the talk-about-it answers, core interview questions, daily battles, XP and the leaderboard are free forever. Pro adds tools for talking about your own work: Project Yapping and Resume Yapping.'],
  ['Why not just ask a chatbot?', 'A chatbot answers what you already know to ask. TechYapper gives you a curated, checked path through a topic, the words to explain it, the questions people ask next, and practice that tracks your progress.'],
  ['Can I pay in INR with UPI?', 'That is the plan. Checkout will run on Razorpay (UPI, cards, netbanking) once payments go live. Until then you can start a free 7-day Pro preview — no card, no charge.'],
  ['Does Resume Yapping guarantee an ATS score?', 'No, and no tool honestly can. It helps you use clear verbs and real keywords, and shows which terms from a job description your bullets cover. It never adds experience you did not describe.'],
  ['Student pricing?', 'The yearly plan already works out to about ₹67 a month. Student discounts are on the roadmap.'],
]

export default function PricingPage() {
  return (
    <div>
      <PublicNav />
      <main className="max-w-[1000px] mx-auto px-4 sm:px-8 pt-14 sm:pt-20">
        <p className="kicker text-accent-ink">Pricing</p>
        <h1 className="display text-[52px] sm:text-[88px] font-semibold mt-4">Cheaper than <em className="font-normal">one</em> bad interview.</h1>
        <p className="mt-6 text-[19px] sm:text-[22px] font-[family-name:var(--font-serif)] text-ink-2 max-w-2xl leading-snug">Free gets you the habit. Pro gets you the archive, the deep dives and the interview tracks.</p>
        <div className="mt-12"><PricingTable /></div>
        <section className="mt-20">
          <h2 className="section-title">Questions</h2>
          <dl className="divide-y divide-line">
            {FAQ.map(([q, a]) => (
              <div key={q} className="py-6 grid sm:grid-cols-[1fr_1.4fr] gap-3 sm:gap-10">
                <dt className="font-[family-name:var(--font-display)] text-[21px] font-semibold leading-tight">{q}</dt>
                <dd className="text-ink-2 leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </div>
  )
}
