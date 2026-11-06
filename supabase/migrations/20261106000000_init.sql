-- TechYapper initial schema
-- Content tables are world-readable (published rows only) and writable only by the service role / SQL editor.
-- User tables are protected by RLS: every row belongs to auth.uid().

-- ───────────── Profiles ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), 60))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ───────────── Content ─────────────
-- `data` holds the full typed document (see src/content/types.ts). Indexed columns are duplicated for querying.
create table if not exists public.concepts (
  slug text primary key,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  pro boolean not null default false,
  title text not null,
  data jsonb not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists concepts_topic_idx on public.concepts (topic) where published;

create table if not exists public.questions (
  id text primary key,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  pro boolean not null default false,
  data jsonb not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists questions_topic_idx on public.questions (topic, difficulty) where published;

create table if not exists public.challenges (
  id text primary key,
  kind text not null check (kind in ('predict', 'bug', 'explain', 'implementation', 'complexity', 'approach')),
  topic text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  pro boolean not null default false,
  data jsonb not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.concepts enable row level security;
alter table public.questions enable row level security;
alter table public.challenges enable row level security;
create policy "concepts: public read" on public.concepts for select to anon, authenticated using (published);
create policy "questions: public read" on public.questions for select to anon, authenticated using (published);
create policy "challenges: public read" on public.challenges for select to anon, authenticated using (published);

-- ───────────── User activity (reads, checks, battle answers, challenges) ─────────────
create table if not exists public.user_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('read', 'check', 'battle', 'challenge')),
  item_id text not null,
  correct boolean,
  choice smallint check (choice between 0 and 9),
  xp integer not null default 0 check (xp between 0 and 60),
  activity_date date not null default current_date,
  created_at timestamptz not null default now(),
  -- one answer per item: battles are one-shot
  unique (user_id, kind, item_id),
  -- client sends its local date; allow timezone skew only
  check (activity_date between (created_at at time zone 'utc')::date - 1 and (created_at at time zone 'utc')::date + 1)
);
create index if not exists user_activity_user_date_idx on public.user_activity (user_id, activity_date);
alter table public.user_activity enable row level security;

create policy "activity: read own" on public.user_activity for select to authenticated using ((select auth.uid()) = user_id);
create policy "activity: insert own" on public.user_activity for insert to authenticated with check ((select auth.uid()) = user_id);
-- no update/delete policies: answers are immutable

-- ───────────── Saved concepts ─────────────
create table if not exists public.saved_concepts (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  concept_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, concept_slug)
);
alter table public.saved_concepts enable row level security;
create policy "saved: read own" on public.saved_concepts for select to authenticated using ((select auth.uid()) = user_id);
create policy "saved: insert own" on public.saved_concepts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saved: delete own" on public.saved_concepts for delete to authenticated using ((select auth.uid()) = user_id);

-- ───────────── Subscriptions ─────────────
-- Read-only for users. Writes happen through start_pro_preview() today and a Razorpay webhook (service role) later.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('free', 'pro_monthly', 'pro_yearly', 'pro_preview')),
  status text not null check (status in ('active', 'trialing', 'canceled', 'expired')),
  provider text not null default 'demo' check (provider in ('demo', 'razorpay', 'manual')),
  provider_ref text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions: read own" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);

-- One free 7-day Pro preview per account. No payment is taken or simulated.
create or replace function public.start_pro_preview()
returns public.subscriptions language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  result public.subscriptions;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.subscriptions where user_id = uid) then
    raise exception 'Your account has already used its Pro preview.';
  end if;
  insert into public.subscriptions (user_id, plan, status, provider, current_period_end)
  values (uid, 'pro_preview', 'trialing', 'demo', now() + interval '7 days')
  returning * into result;
  return result;
end $$;

revoke all on function public.start_pro_preview() from public, anon;
grant execute on function public.start_pro_preview() to authenticated;
