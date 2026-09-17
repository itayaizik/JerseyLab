-- Review requests: a personal link, sent to a customer after their order,
-- where they rate what they bought and add a photo without an account.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- The admin creates an invite for an order and sends its link over WhatsApp.
-- The link's id is a random uuid; get_review_invite() shows what was in that
-- order, and submit_review_invite() saves the reviews - unapproved, for the
-- admin to publish - and closes the link. Photos go to review-images under
-- invites/<id>/, which anyone holding an open link may upload to.

create table if not exists review_invites_raw (
  id            text primary key default gen_random_uuid()::text,
  created_date  timestamptz default now(),
  -- The order's order_id, or the row id for an order of one from before
  -- order ids existed.
  order_id      text not null unique,
  full_name     text,
  used_at       timestamptz,
  review_count  integer not null default 0
);

alter table review_invites_raw enable row level security;
drop policy if exists "admin full access review invites" on review_invites_raw;
create policy "admin full access review invites" on review_invites_raw for all
  using (public.is_admin()) with check (public.is_admin());

-- Open: exists, not used, and younger than 60 days.
create or replace function public.review_invite_open(p_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from review_invites_raw
    where id = p_id and used_at is null and created_date > now() - interval '60 days'
  );
$$;

create or replace function public.get_review_invite(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  inv review_invites_raw;
begin
  select * into inv from review_invites_raw where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  return jsonb_build_object(
    'ok', true,
    'name', split_part(coalesce(inv.full_name, ''), ' ', 1),
    'used', inv.used_at is not null,
    'expired', inv.created_date <= now() - interval '60 days',
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'shirt_id', x.shirt_id, 'name', x.shirt_name, 'size', x.wanted_size, 'image', x.main_image
      ))
      from (
        select distinct on (r.shirt_id) r.shirt_id, r.shirt_name, r.wanted_size, s.main_image
        from interest_requests_raw r
        left join shirts_raw s on s.id = r.shirt_id
        where coalesce(r.order_id, r.id) = inv.order_id and r.shirt_id is not null
        order by r.shirt_id, r.created_date
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- p_reviews: [{ shirt_id, rating, comment, image_url }]
create or replace function public.submit_review_invite(p_id text, p_name text, p_anonymous boolean, p_reviews jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  inv review_invites_raw;
  rev jsonb;
  saved integer := 0;
  rating integer;
  comment text;
  image text;
  shirt text;
  name text := left(trim(coalesce(p_name, '')), 60);
begin
  select * into inv from review_invites_raw where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if inv.used_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'used');
  end if;
  if inv.created_date <= now() - interval '60 days' then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if jsonb_typeof(p_reviews) <> 'array' then
    return jsonb_build_object('ok', false, 'reason', 'bad_request');
  end if;
  if name = '' then
    name := split_part(coalesce(inv.full_name, ''), ' ', 1);
  end if;

  for rev in select * from jsonb_array_elements(p_reviews) limit 10 loop
    shirt := rev ->> 'shirt_id';
    rating := case when (rev ->> 'rating') ~ '^[1-5]$' then (rev ->> 'rating')::integer end;
    comment := left(trim(coalesce(rev ->> 'comment', '')), 1000);
    image := nullif(trim(coalesce(rev ->> 'image_url', '')), '');
    continue when rating is null or comment = '';
    -- Only shirts that were in this order.
    continue when not exists (
      select 1 from interest_requests_raw r
      where coalesce(r.order_id, r.id) = inv.order_id and r.shirt_id = shirt
    );
    -- Only photos uploaded through this link.
    if image is not null and image not like '%/storage/v1/object/public/review-images/invites/' || p_id || '/%' then
      image := null;
    end if;
    -- One review per shirt per link.
    continue when exists (
      select 1 from reviews_raw where created_by = 'invite:' || p_id and shirt_id = shirt
    );

    insert into reviews_raw (shirt_id, rating, comment, reviewer_name, verified_purchase, approved,
                             created_date, image_url, is_anonymous, created_by)
    values (shirt, rating, comment, name, true, false, now(), image, coalesce(p_anonymous, false), 'invite:' || p_id);
    saved := saved + 1;
  end loop;

  if saved = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;
  update review_invites_raw set used_at = now(), review_count = saved where id = p_id;
  return jsonb_build_object('ok', true, 'saved', saved);
end;
$$;

revoke all on function public.review_invite_open(text) from public;
revoke all on function public.get_review_invite(text) from public;
revoke all on function public.submit_review_invite(text, text, boolean, jsonb) from public;
grant execute on function public.review_invite_open(text) to anon, authenticated;
grant execute on function public.get_review_invite(text) to anon, authenticated;
grant execute on function public.submit_review_invite(text, text, boolean, jsonb) to anon, authenticated;

-- Photos for a review link: only into invites/<id>/ of an open link.
drop policy if exists "invite upload review images" on storage.objects;
create policy "invite upload review images" on storage.objects for insert
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = 'invites'
    and public.review_invite_open((storage.foldername(name))[2])
  );
