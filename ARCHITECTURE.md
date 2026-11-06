# Architecture

```
Browser (React SPA, PWA)
 ├─ ContentProvider  — bundled library (src/content), then merges published rows from Supabase
 ├─ AuthProvider     — Supabase Auth (email/password, persisted session) or guest mode
 ├─ ProgressProvider — activities / saved / subscription
 │     ├─ signed in → Supabase tables (RLS)
 │     └─ guest     → localStorage; migrated into the account on first sign-in
 └─ Pages: Landing, Pricing, Auth, Today, Concept, Battle, Code, Score, Library, Tracks, Upgrade
Supabase: Postgres + RLS, auth.users trigger → profiles, start_pro_preview() RPC
Vercel: static hosting, SPA rewrites, immutable asset caching
```

## Key decisions
- **Content as text files + DB.** Authored in readable files, validated by `scripts/generate-seed.ts`, seeded to Postgres. The bundled copy gives instant paint and offline reading; DB rows can add/override content without a deploy.
- **Deterministic daily rotation** (`src/lib/daily.ts`). The day number picks today's 3 concepts, 5 questions (by difficulty) and 3 challenges. Everyone gets the same issue; no cron.
- **One activity table.** `user_activity(kind, item_id)` is unique per user → one-shot answers. XP, streaks, accuracy and the heatmap are derived client-side from the user's own rows.
- **Local calendar dates.** Activity uses the user's local day so streaks match their experience; the DB constrains it to ±1 day of the row timestamp.
- **No secrets in the client.** Only the publishable anon key. Subscriptions are read-only to users; the only write path is a `security definer` RPC.
- **PWA.** Workbox precaches the app shell (works offline with bundled content); Google Fonts stale-while-revalidate; content API network-first.
