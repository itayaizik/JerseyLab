-- Leaving a review without proving anything.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- The card in the box carries one QR for everyone, and asking a customer to
-- dig out the phone and email they ordered with is most of the reason a review
-- never gets written. So /review takes stars, a few words and, if they feel
-- like it, what they bought - and nothing else is required.
--
-- The order details stay on the page as an optional extra: fill them in and
-- the review is marked a verified purchase and attached to the order. Leave
-- them out and it is still a review, just an unverified one.
--
-- Nothing published here appears on the site until the admin approves it
-- (reviews_raw.approved), which is what keeps an open form from being a hole.

create or replace function public.submit_open_review(
  p_rating    integer,
  p_comment   text,
  p_name      text default null,
  p_anonymous boolean default false,
  p_bought    text default null,
  p_shirt_id  text default null,
  p_image_url text default null,
  p_phone     text default null,
  p_email     text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  comment   text := btrim(coalesce(p_comment, ''));
  name      text := left(btrim(coalesce(p_name, '')), 60);
  bought    text := left(btrim(coalesce(p_bought, '')), 120);
  image     text := nullif(btrim(coalesce(p_image_url, '')), '');
  shirt     text := nullif(btrim(coalesce(p_shirt_id, '')), '');
  key       text := phone_key(p_phone);
  mail      text := lower(btrim(coalesce(p_email, '')));
  verified  boolean := false;
  order_key text;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('ok', false, 'reason', 'rating_required');
  end if;
  if length(comment) < 5 then
    return jsonb_build_object('ok', false, 'reason', 'comment_required');
  end if;
  comment := left(comment, 1000);

  -- A flood guard rather than a spam filter: the admin approves every review,
  -- so the worst an open form can do is fill the queue.
  if (select count(*) from reviews_raw
      where created_by = 'open' and created_date > now() - interval '10 minutes') >= 20 then
    return jsonb_build_object('ok', false, 'reason', 'busy');
  end if;

  -- A shirt id has to be one of ours, or it is dropped rather than stored as a
  -- link to nothing.
  if shirt is not null and not exists (select 1 from shirts_raw where id = shirt) then
    shirt := null;
  end if;

  -- Photos may only come from where the site puts them.
  if image is not null and image not like '%/storage/v1/object/public/review-images/open/%' then
    image := null;
  end if;

  -- The order details are optional. When both are there and they match an
  -- order, the review says so.
  if length(key) >= 9 and mail <> '' then
    select coalesce(r.order_id, r.id) into order_key
      from interest_requests_raw r
     where phone_key(r.phone) = key
       and lower(btrim(coalesce(r.email, ''))) = mail
     order by r.created_date desc
     limit 1;
    verified := order_key is not null;
    -- A shirt they did not pick is taken from the order itself, so the review
    -- lands on the product page it belongs to.
    if verified and shirt is null then
      select r.shirt_id into shirt
        from interest_requests_raw r
       where coalesce(r.order_id, r.id) = order_key
         and r.shirt_id is not null
         and exists (select 1 from shirts_raw s where s.id = r.shirt_id)
       order by r.created_date
       limit 1;
    end if;
  end if;

  insert into reviews_raw (
    shirt_id, rating, title, comment, reviewer_name, verified_purchase,
    approved, created_date, image_url, is_anonymous, created_by
  ) values (
    shirt, p_rating, nullif(bought, ''), comment,
    coalesce(nullif(name, ''), 'לקוח'), verified,
    false, now(), image, coalesce(p_anonymous, false), 'open'
  );

  return jsonb_build_object('ok', true, 'verified', verified);
end;
$$;

revoke all on function public.submit_open_review(integer, text, text, boolean, text, text, text, text, text) from public;
grant execute on function public.submit_open_review(integer, text, text, boolean, text, text, text, text, text) to anon, authenticated;

-- Photos for an open review. A separate folder from the invite ones, so the
-- rule for each stays readable: invites/<id>/ needs a live invite, open/ is
-- open to anyone holding the card.
drop policy if exists "open review photo upload" on storage.objects;
create policy "open review photo upload" on storage.objects for insert
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = 'open'
  );
