-- TechYapper v2: topics, interview practice, verified leaderboard, trending, Pro career tools.

-- ───────────── Topics (the "talk about it" unit) ─────────────
create table if not exists public.topics (
  slug text primary key,
  category text not null,
  title text not null,
  data jsonb not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.topics enable row level security;
create policy "topics: public read" on public.topics for select to anon, authenticated using (published);

-- ───────────── Activity kinds ─────────────
-- topic  = "I can talk about this" on a topic      (item_id = topic slug)
-- tcheck = the topic's yap check MCQ               (item_id = topic slug)
-- iq     = an interview question practised         (item_id = <topic>-iqN)
alter table public.user_activity drop constraint if exists user_activity_kind_check;
alter table public.user_activity add constraint user_activity_kind_check
  check (kind in ('read', 'check', 'battle', 'challenge', 'topic', 'tcheck', 'iq'));

-- ───────────── Profiles: leaderboard presence ─────────────
alter table public.profiles add column if not exists show_on_leaderboard boolean not null default true;

-- ───────────── Pro helper ─────────────
create or replace function public.is_pro(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid and s.plan <> 'free' and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  )
$$;
revoke all on function public.is_pro(uuid) from public, anon;
grant execute on function public.is_pro(uuid) to authenticated;

-- ───────────── Verified XP ─────────────
-- The client stores its own xp for instant feedback, but rankings never trust it.
-- Correctness is re-checked against the answer key in the content tables; reading-type
-- activity earns a flat amount, capped per day, so it can't be farmed.
create or replace view public.verified_activity with (security_invoker = true) as
select a.user_id, a.activity_date, a.kind, a.item_id,
  case a.kind
    when 'battle' then case when a.choice = (q.data ->> 'answer')::int
      then case q.difficulty when 'beginner' then 10 when 'intermediate' then 20 else 30 end else 2 end
    when 'challenge' then case when a.choice = (c.data ->> 'answer')::int
      then case c.difficulty when 'beginner' then 20 when 'intermediate' then 30 else 45 end else 2 end
    when 'check' then case when a.choice = (co.data -> 'check' ->> 'answer')::int then 10 else 2 end
    when 'tcheck' then case when a.choice = (t.data -> 'check' ->> 'answer')::int then 10 else 2 end
    else 0
  end as scored_xp,
  case when a.kind in ('read', 'topic', 'iq') then case a.kind when 'iq' then 5 else 15 end else 0 end as flat_xp,
  (q.id is not null or c.id is not null or co.slug is not null or t.slug is not null
    or (a.kind = 'iq' and exists (select 1 from public.topics t2 where a.item_id like t2.slug || '-iq%'))) as valid
from public.user_activity a
left join public.questions q on a.kind = 'battle' and q.id = a.item_id
left join public.challenges c on a.kind = 'challenge' and c.id = a.item_id
left join public.concepts co on a.kind in ('check', 'read') and co.slug = a.item_id
left join public.topics t on a.kind in ('tcheck', 'topic') and t.slug = a.item_id;

create or replace function public.leaderboard(period text default 'week')
returns table (rank bigint, name text, xp bigint, active_days bigint, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with since as (
    select case period
      when 'week' then (now() at time zone 'utc')::date - 6
      when 'month' then (now() at time zone 'utc')::date - 29
      else date '2000-01-01' end as d
  ),
  daily as (
    select v.user_id, v.activity_date,
      sum(v.scored_xp) + least(sum(v.flat_xp), 60) as xp
    from public.verified_activity v, since
    where v.valid and v.activity_date >= since.d
    group by v.user_id, v.activity_date
  ),
  totals as (
    select user_id, sum(xp)::bigint as xp, count(*)::bigint as active_days from daily group by user_id
  ),
  ranked as (
    select t.*, rank() over (order by t.xp desc, t.active_days desc) as rnk
    from totals t join public.profiles p on p.id = t.user_id
    where p.show_on_leaderboard and t.xp > 0
  )
  select r.rnk,
    -- Never expose emails: fall back to an anonymous handle if the name is just the email's local part.
    case when p.display_name is null or p.display_name = split_part(u.email, '@', 1)
      then 'Yapper ' || upper(left(replace(r.user_id::text, '-', ''), 4))
      else p.display_name end,
    r.xp, r.active_days, r.user_id = auth.uid()
  from ranked r
  join public.profiles p on p.id = r.user_id
  join auth.users u on u.id = r.user_id
  where r.rnk <= 50 or r.user_id = auth.uid()
  order by r.rnk
$$;
revoke all on function public.leaderboard(text) from public;
grant execute on function public.leaderboard(text) to anon, authenticated;

-- Topics people actually engaged with in the last 7 days (no fake trending).
create or replace function public.trending_topics()
returns table (slug text, learners bigint)
language sql stable security definer set search_path = '' as $$
  select t.slug, count(distinct a.user_id)::bigint
  from public.user_activity a
  join public.topics t on a.item_id = t.slug or a.item_id like t.slug || '-iq%'
  where a.kind in ('topic', 'tcheck', 'iq') and a.activity_date >= current_date - 6
  group by t.slug
  order by 2 desc
  limit 8
$$;
revoke all on function public.trending_topics() from public;
grant execute on function public.trending_topics() to anon, authenticated;

-- ───────────── Pro career tools: saved project scripts and resume bullets ─────────────
create table if not exists public.user_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('project', 'resume')),
  title text not null check (char_length(title) <= 120),
  data jsonb not null check (pg_column_size(data) < 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_docs_user_idx on public.user_docs (user_id, kind, updated_at desc);
alter table public.user_docs enable row level security;
create policy "docs: read own" on public.user_docs for select to authenticated using ((select auth.uid()) = user_id);
create policy "docs: insert own pro" on public.user_docs for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_pro((select auth.uid())));
create policy "docs: update own pro" on public.user_docs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and public.is_pro((select auth.uid())));
create policy "docs: delete own" on public.user_docs for delete to authenticated using ((select auth.uid()) = user_id);
