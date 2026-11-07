-- Weekly leagues and friend duels. All access goes through security-definer RPCs;
-- the tables themselves have RLS on and no policies, so clients can't read or write them directly.

-- Shared: a public-safe display name (never exposes an email).
create or replace function public.display_handle(uid uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when p.display_name is null or p.display_name = split_part(u.email, '@', 1)
    then 'Yapper ' || upper(left(replace(uid::text, '-', ''), 4)) else p.display_name end
  from auth.users u left join public.profiles p on p.id = u.id where u.id = uid
$$;
revoke all on function public.display_handle(uuid) from public, anon, authenticated;

-- Verified XP for one user over a date range (same rules as the leaderboard).
create or replace function public.verified_xp(uid uuid, d_from date, d_to date)
returns bigint language sql stable security definer set search_path = '' as $$
  select coalesce(sum(x), 0)::bigint from (
    select sum(v.scored_xp) + least(sum(v.flat_xp), 60) as x
    from public.verified_activity v
    where v.user_id = uid and v.valid and v.activity_date between d_from and d_to
    group by v.activity_date
  ) d
$$;
revoke all on function public.verified_xp(uuid, date, date) from public, anon, authenticated;

-- ───────────── Leagues ─────────────
create table if not exists public.league_members (
  week_start date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  division smallint not null check (division between 0 and 4), -- 0 Bronze … 4 Diamond
  group_no int not null,
  joined_at timestamptz not null default now(),
  primary key (week_start, user_id)
);
create index if not exists league_group_idx on public.league_members (week_start, division, group_no);
alter table public.league_members enable row level security;

create or replace function public.my_league()
returns table (division smallint, week_start date, week_end date, rank bigint, name text, xp bigint, is_me boolean, group_size bigint)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  wk date := date_trunc('week', (now() at time zone 'utc'))::date;
  prev public.league_members;
  prev_rank int;
  prev_size int;
  div smallint := 0;
  grp int;
  mine public.league_members;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into mine from public.league_members m where m.week_start = wk and m.user_id = uid;
  if not found then
    -- Placement from last week's group result: top 5 up, bottom 5 down (groups of 10+).
    select * into prev from public.league_members m where m.week_start = wk - 7 and m.user_id = uid;
    if found then
      div := prev.division;
      with g as (
        select m.user_id, public.verified_xp(m.user_id, wk - 7, wk - 1) as x
        from public.league_members m where m.week_start = wk - 7 and m.division = prev.division and m.group_no = prev.group_no
      ), r as (select g.user_id, rank() over (order by g.x desc) as rk, count(*) over () as n from g)
      select r.rk, r.n into prev_rank, prev_size from r where r.user_id = uid;
      if prev_rank <= 5 and public.verified_xp(uid, wk - 7, wk - 1) > 0 then div := least(4, div + 1);
      elsif prev_size >= 10 and prev_rank > prev_size - 5 then div := greatest(0, div - 1);
      end if;
    end if;
    -- Fill groups of 20 within the division.
    select coalesce(max(m.group_no), 0) into grp from public.league_members m where m.week_start = wk and m.division = div;
    if (select count(*) from public.league_members m where m.week_start = wk and m.division = div and m.group_no = grp) >= 20 then grp := grp + 1; end if;
    insert into public.league_members (week_start, user_id, division, group_no) values (wk, uid, div, grp)
    on conflict do nothing;
    select * into mine from public.league_members m where m.week_start = wk and m.user_id = uid;
  end if;

  return query
  with g as (
    select m.user_id, public.verified_xp(m.user_id, wk, wk + 6) as x
    from public.league_members m where m.week_start = wk and m.division = mine.division and m.group_no = mine.group_no
  )
  select mine.division, wk, wk + 6, rank() over (order by g.x desc, g.user_id = uid desc), public.display_handle(g.user_id), g.x, g.user_id = uid, count(*) over ()
  from g order by 4;
end $$;
revoke all on function public.my_league() from public, anon;
grant execute on function public.my_league() to authenticated;

-- ───────────── Duels ─────────────
create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  creator uuid not null references auth.users (id) on delete cascade,
  question_ids text[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
create table if not exists public.duel_answers (
  duel_id uuid not null references public.duels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  q_index smallint not null check (q_index between 0 and 9),
  choice smallint,
  correct boolean not null,
  ms int check (ms between 0 and 60000),
  created_at timestamptz not null default now(),
  primary key (duel_id, user_id, q_index)
);
alter table public.duels enable row level security;
alter table public.duel_answers enable row level security;

create or replace function public.create_duel()
returns text language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  c text;
  ids text[];
begin
  if uid is null then raise exception 'Sign in to start a duel.'; end if;
  if (select count(*) from public.duels d where d.creator = uid and d.created_at > now() - interval '1 day') >= 20 then
    raise exception 'Duel limit reached for today.';
  end if;
  -- 2 beginner, 2 intermediate, 1 advanced, free questions only.
  select array_agg(id) into ids from (
    (select id from public.questions where published and not pro and difficulty = 'beginner' order by random() limit 2)
    union all (select id from public.questions where published and not pro and difficulty = 'intermediate' order by random() limit 2)
    union all (select id from public.questions where published and not pro and difficulty = 'advanced' order by random() limit 1)
  ) q;
  loop
    c := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.duels where code = c);
  end loop;
  insert into public.duels (code, creator, question_ids) values (c, uid, ids);
  return c;
end $$;
revoke all on function public.create_duel() from public, anon;
grant execute on function public.create_duel() to authenticated;

-- Question ids for a duel (anyone with the link can see which questions; answers stay server-side checked).
create or replace function public.get_duel(p_code text)
returns table (code text, question_ids text[], creator_name text, expires_at timestamptz, expired boolean)
language sql stable security definer set search_path = '' as $$
  select d.code, d.question_ids, public.display_handle(d.creator), d.expires_at, d.expires_at < now()
  from public.duels d where d.code = lower(p_code)
$$;
revoke all on function public.get_duel(text) from public;
grant execute on function public.get_duel(text) to anon, authenticated;

create or replace function public.answer_duel(p_code text, p_index int, p_choice int, p_ms int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d public.duels;
  ok boolean;
begin
  if uid is null then raise exception 'Sign in to play.'; end if;
  select * into d from public.duels where code = lower(p_code);
  if not found then raise exception 'Duel not found.'; end if;
  if d.expires_at < now() then raise exception 'This duel has ended.'; end if;
  if p_index < 0 or p_index >= array_length(d.question_ids, 1) then raise exception 'Bad question.'; end if;
  select p_choice is not null and p_choice = (q.data ->> 'answer')::int into ok
  from public.questions q where q.id = d.question_ids[p_index + 1];
  insert into public.duel_answers (duel_id, user_id, q_index, choice, correct, ms)
  values (d.id, uid, p_index, p_choice, coalesce(ok, false), least(greatest(coalesce(p_ms, 60000), 0), 60000))
  on conflict do nothing;
  -- Return the stored result (first answer wins).
  select a.correct into ok from public.duel_answers a where a.duel_id = d.id and a.user_id = uid and a.q_index = p_index;
  return ok;
end $$;
revoke all on function public.answer_duel(text, int, int, int) from public, anon;
grant execute on function public.answer_duel(text, int, int, int) to authenticated;

-- Scoreboard: everyone who played, ranked by correct answers then total time.
create or replace function public.duel_results(p_code text)
returns table (name text, is_me boolean, is_creator boolean, answered int, correct int, total_ms bigint, marks boolean[])
language sql stable security definer set search_path = '' as $$
  select public.display_handle(a.user_id), a.user_id = auth.uid(), a.user_id = d.creator,
    count(*)::int, count(*) filter (where a.correct)::int, sum(a.ms)::bigint,
    array_agg(a.correct order by a.q_index)
  from public.duels d join public.duel_answers a on a.duel_id = d.id
  where d.code = lower(p_code)
  group by a.user_id, d.creator
  order by 5 desc, 6 asc
$$;
revoke all on function public.duel_results(text) from public;
grant execute on function public.duel_results(text) to anon, authenticated;
