-- Mystery box quantity pricing, and a short code for a group box.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- ── Why tiers live here and not in the code ────────────────────────────────
--
-- A mystery box has one price per style (src/lib/mysteryBox.js) and no reason
-- to order a sixth one. A quantity ladder gives it one: the more boxes in an
-- order, the less each costs. That turns "how many?" into the first question
-- worth asking and makes a group box worth organising.
--
-- A tier is a discount off whatever the box's own style costs, not a price of
-- its own. One ladder then governs all the styles at once, and a retro box
-- stays ₪10 dearer than a regular one at every quantity - which is the only
-- thing that has to stay true.
--
-- The table ships with a single tier at zero, so nothing changes until the
-- shop owner fills in numbers from ניהול > מיסטרי בוקס. Prices are his.

create table if not exists mystery_tiers_raw (
  id           text primary key default gen_random_uuid()::text,
  created_date timestamptz default now(),
  updated_date timestamptz,
  -- The tier applies from this many boxes in one order, upwards, until the
  -- next tier starts.
  min_boxes    integer not null,
  -- Shekels off each box in the order, before its own extras.
  discount     integer not null default 0,
  active       boolean not null default true,
  constraint mystery_tiers_min_boxes_positive check (min_boxes >= 1),
  constraint mystery_tiers_discount_sane check (discount >= 0 and discount <= 200)
);

create unique index if not exists mystery_tiers_min_idx on mystery_tiers_raw (min_boxes);

alter table mystery_tiers_raw enable row level security;

drop policy if exists "public read active mystery tiers" on mystery_tiers_raw;
create policy "public read active mystery tiers" on mystery_tiers_raw for select
  using (active = true);

drop policy if exists "admin full access mystery tiers" on mystery_tiers_raw;
create policy "admin full access mystery tiers" on mystery_tiers_raw for all
  using (public.is_admin()) with check (public.is_admin());

-- The ladder starts flat: one box, nothing off. Adding rows above this is
-- what turns the feature on.
insert into mystery_tiers_raw (min_boxes, discount, active)
values (1, 0, true)
on conflict (min_boxes) do nothing;

-- ── A code the organiser can type ──────────────────────────────────────────
--
-- A group was reachable only through a long secret link. Lose the link - a
-- cleared tab, a new phone - and the group is gone with every box a friend
-- had already filled in. A five-digit code is something you can read off one
-- screen and type into another.
--
-- It is not a password: it opens the organiser's view of a box he started,
-- and the worst a guess gets is somebody else's shirt sizes. The owner_token
-- still guards closing the group.

alter table mystery_groups_raw add column if not exists code text;

-- Five digits, never starting with a zero so the code is always five
-- characters long when it is read out loud.
create or replace function public.mystery_group_code()
returns text
language plpgsql
volatile
as $$
declare
  candidate text;
  tries     integer := 0;
begin
  loop
    candidate := (10000 + floor(random() * 90000))::int::text;
    exit when not exists (select 1 from mystery_groups_raw where code = candidate);
    tries := tries + 1;
    -- 90,000 codes and a shop that makes a handful a week: this is a
    -- formality, but an unbounded loop in a function is not.
    if tries > 50 then
      return null;
    end if;
  end loop;
  return candidate;
end;
$$;

update mystery_groups_raw set code = public.mystery_group_code() where code is null;

create unique index if not exists mystery_groups_code_idx on mystery_groups_raw (code);

-- Recreated so a new group is born with a code.
create or replace function public.create_mystery_group(p_owner_name text, p_owner_phone text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g mystery_groups_raw;
  name text := left(trim(coalesce(p_owner_name, '')), 40);
begin
  if name = '' then
    return jsonb_build_object('ok', false, 'reason', 'name_required');
  end if;
  insert into mystery_groups_raw (owner_name, owner_phone, code)
  values (name,
          nullif(left(regexp_replace(coalesce(p_owner_phone, ''), '[^0-9+]', '', 'g'), 20), ''),
          public.mystery_group_code())
  returning * into g;
  return jsonb_build_object('ok', true, 'id', g.id, 'owner_token', g.owner_token, 'code', g.code);
end;
$$;

-- Finding a group by the code, for an organiser coming back on another
-- device. Returns what the builder needs to take the group over again.
create or replace function public.find_mystery_group_by_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  g mystery_groups_raw;
  digits text := regexp_replace(coalesce(p_code, ''), '[^0-9]', '', 'g');
begin
  if length(digits) <> 5 then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  select * into g from mystery_groups_raw where code = digits;
  if g.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if g.created_date < now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  return jsonb_build_object('ok', true, 'id', g.id, 'owner_token', g.owner_token,
                            'owner_name', g.owner_name, 'code', g.code, 'closed', g.closed);
end;
$$;

revoke all on function public.find_mystery_group_by_code(text) from public;
grant execute on function public.find_mystery_group_by_code(text) to anon, authenticated;
