-- Advisor follow-ups: is_pro only ever answers for the caller; trigger function is not an RPC.
drop policy if exists "docs: insert own pro" on public.user_docs;
drop policy if exists "docs: update own pro" on public.user_docs;
drop function if exists public.is_pro(uuid);

create or replace function public.is_pro()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid() and s.plan <> 'free' and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  )
$$;
revoke all on function public.is_pro() from public, anon;
grant execute on function public.is_pro() to authenticated;

create policy "docs: insert own pro" on public.user_docs for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.is_pro()));
create policy "docs: update own pro" on public.user_docs for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and (select public.is_pro()));

revoke all on function public.handle_new_user() from public, anon, authenticated;
