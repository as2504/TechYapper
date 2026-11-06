# Tasks

## v2 — "Can I talk about this?" (done)
- [x] Topic model (`src/content/topics/*.md`): what / why / how / where / know / analogy / one-breath + 30-second answers / comebacks / facts / deeper / sources / yap check / interview Qs
- [x] 17 topics across 7 categories, 47 interview questions (answer points, spoken version, detail, follow-ups, mistakes); validator in `scripts/generate-seed.ts`
- [x] Search across topics, concepts and interview questions (`/` shortcut, keyboard nav)
- [x] Home rebuilt around search: continue yapping, today's yap, daily challenges, explore, trending, career tools
- [x] Landing rebuilt: search-first, categories, one live "how to talk about it" example
- [x] Topic page: Understand · Talk about it · Go deeper · Interview, plus "Could you talk about it now?"
- [x] Explore page by category
- [x] Project Yapping (Pro): 11-section editable speaking script, follow-ups, defend points, visible gaps, 60-second pitch, saved to `user_docs`
- [x] Resume Yapping (Pro): technical / impact / concise bullets, keyword + ATS checks, job-description coverage, saved sets
- [x] Leaderboard (week / 30 days / all time) on server-verified XP; badges; leaderboard name + opt-out
- [x] Trending computed from real activity (falls back to "Popular picks")
- [x] Free users can browse as guests automatically; all concept Basics / Under the Hood free
- [x] Migrations: topics, activity kinds, verified_activity view, leaderboard(), trending_topics(), user_docs with Pro-gated writes, advisor hardening

## Needs Sumit
- [ ] Supabase → Authentication → Sign In / Providers → Email → turn OFF "Confirm email" (still on: `mailer_autoconfirm=false`)
- [ ] Optional: Authentication → turn on leaked-password protection

## In progress
- [ ] Custom domain TLS (DNS verified; certificate issuing)

## Next
- Razorpay checkout + webhook (Pro is preview-only until then)
- More topics (Python, Node.js, Next.js, Azure, Kafka, Redis, OAuth deep dive)
- Weak-spot insights for Pro
- Admin UI for content; code-splitting the bundle
