import { PublicNav, Footer } from '../components/PublicNav'
import { PricingTable } from '../components/Pricing'

const FAQ = [
  ['Is the free plan actually useful?', 'Yes. The daily habit — three concepts, the battle, the code challenges, streaks and your library — is free forever. Pro is for going deeper and going back.'],
  ['Why not just ask a chatbot?', 'A chatbot answers what you already know to ask. TechYapper decides what is worth knowing today, teaches it in three levels, tests you on it and remembers what you got wrong.'],
  ['Can I pay in INR with UPI?', 'That is the plan. Checkout will run on Razorpay (UPI, cards, netbanking) once payments go live. Until then you can start a free 7-day Pro preview — no card, no charge.'],
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
          <h2 className="kicker text-accent-ink border-b border-ink pb-2">Questions</h2>
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
