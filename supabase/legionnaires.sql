-- The Israelis abroad, as a list the shop owns.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- A shirt already knows which player it belongs to (shirts_raw.player_name),
-- so the row of players on the home page could have been derived from the
-- catalogue. It is not, for one reason: a player the shop has no shirt for yet
-- would not appear, and those are exactly the ones worth showing - a fan who
-- taps Zahavi and finds nothing tells us what to get next, and a list that can
-- only grow after the stock does is a list that never leads.
--
-- So the players are their own rows: added, renamed, reordered and hidden from
-- ניהול > לגיונרים, with or without a shirt behind them.
--
-- `name` is what a shirt's player_name must equal for the two to be matched,
-- so renaming a player here without renaming it on the shirts unlinks them.
-- The admin page warns about that rather than preventing it: the spelling on
-- the shirts is sometimes the one that has to change.

create table if not exists legionnaires_raw (
  id           text primary key default gen_random_uuid()::text,
  created_date timestamptz default now(),
  updated_date timestamptz,
  -- The player, exactly as shirts_raw.player_name spells him.
  name         text not null,
  -- Where he plays now, shown under his name. Free text: it changes with the
  -- transfer window and is not worth a foreign key.
  club         text,
  sort_order   integer not null default 0,
  active       boolean not null default true
);

alter table legionnaires_raw enable row level security;

drop policy if exists "public read active legionnaires" on legionnaires_raw;
create policy "public read active legionnaires" on legionnaires_raw for select
  using (active = true);

drop policy if exists "admin full access legionnaires" on legionnaires_raw;
create policy "admin full access legionnaires" on legionnaires_raw for all
  using (public.is_admin()) with check (public.is_admin());

-- A face for each player, uploaded from the admin page. Optional: a player
-- with no photo shows as a name alone, which is how the row started.
alter table legionnaires_raw add column if not exists image_url text;
