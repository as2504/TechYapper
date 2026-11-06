---
slug: supabase-rls
title: Row Level Security, or why your anon key can be public
topic: backend
difficulty: intermediate
minutes: 6
pro: false
related: jwt-auth, postgres-mvcc, sql-indexes
---
::dek
Supabase lets the browser talk straight to Postgres. That's only safe because the database itself decides which rows each user may see.

::hook
The first time you see a Supabase app, something feels wrong: the frontend queries the database directly, with a key sitting in the JavaScript bundle for anyone to copy. No API layer. No backend checks. The reason this isn't a security disaster is a Postgres feature that's been around since 2016 — and the reason some Supabase apps *are* disasters is forgetting to turn it on.

::yap
In Supabase, the API key just says which project you're talking to. Who you are comes from the JWT, and what you can see is decided by RLS policies inside Postgres.

::basics
Normally an app looks like this: browser → your API server → database. Your API checks "is this user allowed?" before running queries.

Supabase removes the middle layer. The browser talks to an auto-generated REST API (PostgREST) that runs queries directly against Postgres. So where do the permission checks go? **Into the database**, as **Row Level Security (RLS)** policies.

```sql
alter table notes enable row level security;

create policy "Users read their own notes"
on notes for select
using (auth.uid() = user_id);
```

Now, when anyone runs `select * from notes`, Postgres silently adds the policy as a filter. A user only ever gets their own notes — even if they edit the frontend code, call the API with curl, or try to guess IDs.

Two keys matter:

- **Anon / publishable key**: public, goes in the browser. It has only the permissions your RLS policies grant.
- **Service-role / secret key**: bypasses RLS completely. Server-only. Never in the frontend, never in Git.

::hood
### How Postgres knows who you are

When a user logs in, Supabase Auth issues a **JWT** containing their user ID (`sub`) and role (`authenticated`). Every API request carries it. PostgREST verifies the signature, switches to the matching Postgres role, and exposes the claims to SQL. `auth.uid()` simply reads the `sub` claim.

### USING vs WITH CHECK

- `USING (…)` filters which **existing rows** a query can see or affect (SELECT, UPDATE, DELETE).
- `WITH CHECK (…)` validates **new or changed rows** (INSERT, UPDATE).

```sql
create policy "insert own" on notes for insert
to authenticated
with check (auth.uid() = user_id);
```

Without `WITH CHECK`, a user could insert notes with someone else's `user_id`.

### Default deny

With RLS enabled and **no policies**, nobody (except the service role and table owner) can read or write anything. That's the safe default. The dangerous state is RLS *disabled* on a table exposed through the API — then the anon key can read everything.

### Policies per command and role

Policies are permissive by default and combined with OR. Scope them: `for select to authenticated` is clearer and faster than one catch-all policy.

::deep
### Performance: policies run per row

A policy is effectively an extra `WHERE` clause. Two habits keep it fast:

```sql
-- Wrap auth functions in a subquery so Postgres evaluates them once per query
using ((select auth.uid()) = user_id)
```

and **index the columns your policies filter on** (`user_id`). Supabase's own benchmarks show order-of-magnitude differences on large tables from these two changes alone.

### Team and org access

Membership checks often look like:

```sql
using (exists (
  select 1 from team_members m
  where m.team_id = projects.team_id and m.user_id = (select auth.uid())
))
```

On hot paths, wrap the membership lookup in a `security definer` function returning the user's team IDs, so it isn't re-evaluated for every row (and isn't itself subject to RLS recursion).

### Things RLS doesn't do

- **Column-level control**: RLS is about rows. Hide columns with views, column privileges, or separate tables.
- **Rate limiting or business workflows**: "a user may start one free trial" belongs in a `security definer` function or an Edge Function, not a policy that users could race.
- **Protect against the service role**: anything holding that key bypasses RLS by design.

### Testing policies

Impersonate a user in SQL to verify behaviour:

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
select * from notes; -- should return only that user's rows
```

Tools like pgTAP let you keep these as automated tests in your migrations.

::myths
- The anon key is a secret || It's designed to be public. Security comes from RLS, not from hiding the key.
- Filtering by user_id in the frontend is enough || Anyone can call the API directly. Only database-enforced policies count.
- RLS makes queries slow || Well-written policies with indexed columns add negligible overhead.

::facts
- Row Level Security arrived in PostgreSQL 9.5 (2016), long before Supabase existed.
- Supabase's dashboard and security advisor warn about tables exposed to the API with RLS disabled — the most common Supabase security mistake.

::realworld
- Multi-tenant SaaS: every row has a `tenant_id`, and policies isolate customers.
- This app: your XP, answers and saved concepts are protected by policies like `auth.uid() = user_id`.
- Realtime subscriptions in Supabase also respect RLS, so users only receive changes to rows they can see.

::check
A table has RLS enabled and this single policy: `create policy p on posts for select using (true)`. What can an authenticated user do?
- [ ] Read, insert, update and delete all posts
- [x] Read all posts, but not insert, update or delete
- [ ] Nothing — `true` is not a valid policy
- [ ] Only read their own posts
> The policy only covers `select`, and `true` lets every row through. With no insert/update/delete policies, those operations are denied by default.
