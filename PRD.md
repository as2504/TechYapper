# TechYapper — PRD (MVP)

## Problem
Developers know their own slice deeply and everything adjacent by name only. They struggle to explain what happens under the hood of tools they use daily, and to hold their own in interviews and design reviews.

## Product
A 10–15 minute daily habit — not a blog, course or chatbot.

| Pillar | What | Why it isn't "just ask AI" |
|---|---|---|
| Today's Yap | 3 curated concepts/day, each in 3 levels (Basics / Under the Hood / Deep Dive) + misconceptions, facts, real-world uses, related concepts, knowledge check, a "say this tomorrow" line | Curated agenda; consistent structure; reviewed content |
| Yap Battle | 5 daily MCQs (2 beginner, 2 intermediate, 1 advanced), one shot, explanations, XP, log of past answers | Locked answers, accuracy history |
| Code or Explain | 3 daily snippet challenges: predict, bug, explain, complexity, approach, implementation | Think-first flow (draft your explanation before revealing) |
| Yap Score | XP, level, streaks, accuracy, accuracy by level, knowledge map by topic, 26-week heatmap | Persistent personal record |

Plus: saved library + archive, interview tracks, guest mode, installable PWA.

## Users
Working developers, IT/low-code professionals (Power Platform), students and interview candidates — India first (INR pricing).

## Monetisation
- **Free**: the daily habit in full; Levels 1–2 everywhere; archive limited to the last 3 days.
- **Pro** ₹99/month or ₹799/year: full archive, Deep Dives on advanced concepts, interview tracks, advanced challenges, premium question collections.
- Checkout (Razorpay) is not live. The upgrade page says so explicitly; users can start a one-time **7-day Pro preview** (no card, nothing charged). `subscriptions` is ready for webhook-driven plans.

## Success metrics
D1/D7 retention, daily completion (3/3 tasks), streak distribution, free→Pro conversion.

## Out of scope (MVP)
Code execution, leaderboards, AI chat, social features, admin UI (content via text files/SQL).

---

## v2 positioning (Nov 2026)

**Central question:** "Can I talk about this technology after using TechYapper?"

TechYapper is not a course, a documentation site or a roadmap. Roadmaps tell you *what* to learn; TechYapper helps you *understand* it and *say it*.

- **Tech Yapping (core, free):** search any topic → what it is, why it exists, how it works, where it's used, the few things worth knowing, an analogy, and *how to talk about it* (one-breath and 30-second answers, replies to common follow-ups). Optional "Go deeper" with internals, code, trade-offs and sources. Interview questions live inside each topic (core free, advanced Pro).
- **Project Yapping (Pro):** structured, editable 11-part speaking script for the user's own project. Only the user's facts; gaps are shown, never filled.
- **Resume Yapping (Pro):** plain-language description → technical / impact / concise bullets, keywords, ATS-conscious checks and job-description coverage. No invented metrics, no score promises.
- **Yap Battle & competition (free):** daily MCQs and code challenges, XP verified server-side, streaks, badges, weekly / monthly / all-time leaderboard.

Success test: a new user understands the product in seconds, finds a topic by search, can explain it out loud, can go deeper if they want, and can practise interview answers. Pro users can prepare a project explanation and resume bullets.
