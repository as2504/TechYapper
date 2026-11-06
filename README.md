# TechYapper

**Know tech. Talk tech. Yap tech.** A daily technology knowledge habit for developers: three concepts a day in three levels, a five-question Yap Battle, Code-or-Explain challenges and a persistent Yap Score.

Live: https://techyapper.sumitsk.in

## Stack
React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Supabase (Auth + Postgres + RLS) · vite-plugin-pwa · Vercel

## Run locally
```bash
npm install
cp .env.example .env.local   # Supabase URL + publishable/anon key
npm run dev
```
Without Supabase keys the app still runs in guest mode with bundled content and localStorage progress.

## Content
Plain text in `src/content/`:
- `concepts/*.md` — one file per concept (frontmatter + `::section` blocks)
- `questions.txt` — Yap Battle bank
- `challenges.txt` — Code or Explain bank

`npm run seed:sql` validates everything and regenerates `supabase/seed.sql`. Published DB rows override/extend the bundled library at runtime, so new content can ship with a DB insert and no deploy.

## Database
```bash
supabase link --project-ref <ref>
supabase db push --include-seed
```
See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Docs
[PRD](PRD.md) · [Architecture](ARCHITECTURE.md) · [Design system](DESIGN_SYSTEM.md) · [Database](DATABASE_SCHEMA.md) · [Tasks](TASKS.md)
