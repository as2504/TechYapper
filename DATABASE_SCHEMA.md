# Database schema

Migration: `supabase/migrations/20261106000000_init.sql`. Seed: `supabase/seed.sql` (generated — do not edit).

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | display name; created by trigger on `auth.users` insert | read/update own |
| `concepts` | slug PK, topic, difficulty, pro, title, `data jsonb` (full document) | public read where `published` |
| `questions` | id PK, topic, difficulty, pro, `data jsonb` | public read where `published` |
| `challenges` | id PK, kind, topic, difficulty, pro, `data jsonb` | public read where `published` |
| `user_activity` | user_id, kind (`read`/`check`/`battle`/`challenge`), item_id, correct, choice, xp (0–60), activity_date; **unique (user_id, kind, item_id)** | select/insert own; no update/delete |
| `saved_concepts` | (user_id, concept_slug) PK | select/insert/delete own |
| `subscriptions` | user_id PK, plan, status, provider (`demo`/`razorpay`/`manual`), provider_ref, current_period_end | select own; writes only via RPC/service role |

Functions:
- `handle_new_user()` trigger → inserts the profile.
- `start_pro_preview()` (security definer, authenticated only) → one 7-day `pro_preview` per account.

Indexes: `user_activity (user_id, activity_date)`, topic indexes on content tables, PKs/uniques.

## Adding content without a deploy
```sql
insert into public.questions (id, topic, difficulty, pro, data)
values ('q-new', 'databases', 'beginner', false,
  '{"id":"q-new","topic":"databases","difficulty":"beginner","pro":false,"prompt":"…","options":["…","…"],"answer":0,"explanation":"…"}');
```
Or add to the text files, run `npm run seed:sql`, then `supabase db push --include-seed`.

## Razorpay (future)
An Edge Function creates orders; the webhook (service role) upserts `subscriptions` with `provider='razorpay'`, `provider_ref` and `current_period_end`. The client's `isPro` already reads plan, status and period end.
