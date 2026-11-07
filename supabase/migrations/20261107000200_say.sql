-- "Your turn" explanations: repeatable once per topic per day (item_id = <slug>@<YYYY-MM-DD>),
-- so refreshing a rusty topic is real, logged activity.
alter table public.user_activity drop constraint if exists user_activity_kind_check;
alter table public.user_activity add constraint user_activity_kind_check
  check (kind in ('read', 'check', 'battle', 'challenge', 'topic', 'tcheck', 'iq', 'say'));

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
  case a.kind when 'iq' then 5 when 'say' then 10 when 'read' then 15 when 'topic' then 15 else 0 end as flat_xp,
  (q.id is not null or c.id is not null or co.slug is not null or t.slug is not null
    or (a.kind = 'iq' and exists (select 1 from public.topics t2 where a.item_id like t2.slug || '-iq%'))
    or (a.kind = 'say' and exists (select 1 from public.topics t3 where t3.slug = split_part(a.item_id, '@', 1)))) as valid
from public.user_activity a
left join public.questions q on a.kind = 'battle' and q.id = a.item_id
left join public.challenges c on a.kind = 'challenge' and c.id = a.item_id
left join public.concepts co on a.kind in ('check', 'read') and co.slug = a.item_id
left join public.topics t on a.kind in ('tcheck', 'topic') and t.slug = a.item_id;

create or replace function public.trending_topics()
returns table (slug text, learners bigint)
language sql stable security definer set search_path = '' as $$
  select t.slug, count(distinct a.user_id)::bigint
  from public.user_activity a
  join public.topics t on a.item_id = t.slug or a.item_id like t.slug || '-iq%' or a.item_id like t.slug || '@%'
  where a.kind in ('topic', 'tcheck', 'iq', 'say') and a.activity_date >= current_date - 6
  group by t.slug
  order by 2 desc
  limit 8
$$;
