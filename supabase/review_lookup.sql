-- Finding your own review link, without one having been sent to you.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- review_invites.sql covers the case where the admin sends a personal link
-- over WhatsApp. A card printed and dropped in the box cannot carry a personal
-- link - every card is the same - so /review lets a customer find theirs by
-- the two things they gave at checkout: their phone and their email.
--
-- Both must match the same order. A phone on its own would let anyone walk
-- through numbers and read back what a stranger bought, which is why the
-- lookup is not satisfied by one of them.

-- "050-123-4567", "+972 50 123 4567" and "972501234567" are the same phone.
-- Orders were typed by hand into a free-text field, so the comparison happens
-- on digits alone, with the Israeli trunk 0 and country code 972 folded away.
create or replace function public.phone_key(p_phone text)
returns text
language sql
immutable
as $$
  select case
    when digits like '972%' then substring(digits from 4)
    when digits like '0%'   then substring(digits from 2)
    else digits
  end
  from (select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') as digits) d;
$$;

-- Returns the id of an open review link for the caller's most recent order,
-- creating one the first time. Never says which half of the pair was wrong:
-- that would turn it into a way of testing whether a phone or an address is
-- one of ours.
create or replace function public.start_review(p_phone text, p_email text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  key       text := phone_key(p_phone);
  mail      text := lower(btrim(coalesce(p_email, '')));
  order_key text;
  name      text;
  inv       review_invites_raw;
begin
  if length(key) < 9 or mail = '' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- The most recent order that carries both. An order is several rows of
  -- interest_requests_raw sharing an order_id; ones from before order ids
  -- existed stand alone under their own row id.
  select coalesce(r.order_id, r.id), r.full_name
    into order_key, name
    from interest_requests_raw r
   where phone_key(r.phone) = key
     and lower(btrim(coalesce(r.email, ''))) = mail
   order by r.created_date desc
   limit 1;

  if order_key is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into inv from review_invites_raw where order_id = order_key;

  if found then
    if inv.used_at is not null then
      return jsonb_build_object('ok', false, 'reason', 'used');
    end if;
    -- The 60 days get_review_invite() enforces. An expired link is replaced
    -- rather than handed back: the customer is standing in front of us with
    -- the shirt, and the age of a link they never saw is not their problem.
    if inv.created_date <= now() - interval '60 days' then
      delete from review_invites_raw where id = inv.id;
    else
      return jsonb_build_object('ok', true, 'id', inv.id);
    end if;
  end if;

  insert into review_invites_raw (order_id, full_name)
  values (order_key, coalesce(name, ''))
  returning * into inv;

  return jsonb_build_object('ok', true, 'id', inv.id);
end;
$$;

revoke all on function public.phone_key(text) from public;
revoke all on function public.start_review(text, text) from public;
grant execute on function public.start_review(text, text) to anon, authenticated;
