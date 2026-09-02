-- Catalogue data fixes.
--
-- These four problems break the catalogue filters and the collection pages
-- today, independently of anything to do with search. Written as a whole-table
-- pass rather than as updates to the specific rows found, so a stray space
-- typed tomorrow is cleaned by re-running this instead of needing a new script.
--
-- Safe to run more than once: every statement is idempotent, and each one only
-- touches rows that are actually wrong.
--
-- Run in Supabase > SQL Editor.

begin;

-- ── 1. Stray whitespace ────────────────────────────────────
-- A trailing space is invisible in the admin form but makes a separate value
-- everywhere the column is grouped. "צלסי " counted as its own club, with its
-- own half-empty collection page, and "ספרד " split the national side in two.
-- btrim removes leading and trailing whitespace; the regexp collapses runs of
-- spaces inside the value.
update shirts_raw set
  name          = regexp_replace(btrim(name),          '\s+', ' ', 'g'),
  club          = regexp_replace(btrim(club),          '\s+', ' ', 'g'),
  national_team = regexp_replace(btrim(national_team), '\s+', ' ', 'g'),
  league        = regexp_replace(btrim(league),        '\s+', ' ', 'g'),
  season        = regexp_replace(btrim(season),        '\s+', ' ', 'g'),
  player_name   = regexp_replace(btrim(player_name),   '\s+', ' ', 'g')
where
  name          is distinct from regexp_replace(btrim(name),          '\s+', ' ', 'g') or
  club          is distinct from regexp_replace(btrim(club),          '\s+', ' ', 'g') or
  national_team is distinct from regexp_replace(btrim(national_team), '\s+', ' ', 'g') or
  league        is distinct from regexp_replace(btrim(league),        '\s+', ' ', 'g') or
  season        is distinct from regexp_replace(btrim(season),        '\s+', ' ', 'g') or
  player_name   is distinct from regexp_replace(btrim(player_name),   '\s+', ' ', 'g');

-- ── 2. League spelling ─────────────────────────────────────
-- One shirt sat under "פריימר ליג" while the other seventeen were under
-- "פרמייר ליג", so it was missing from the league filter and its collection.
update shirts_raw
   set league = 'פרמייר ליג'
 where btrim(league) = 'פריימר ליג';

-- ── 3. National sides filed as clubs ───────────────────────
-- Germany, Italy and Uruguay had the country in both `club` and
-- `national_team`. That put national sides into club groupings and made them
-- look like clubs in the catalogue. The national_team column is the correct
-- one; the club column is cleared.
update shirts_raw
   set club = null
 where national_team is not null
   and btrim(national_team) <> ''
   and btrim(club) = btrim(national_team);

-- ── 4. Misspelt shirt name ─────────────────────────────────
-- The club field already said ארסנל; only the display name was wrong, so the
-- shirt never matched a search for its own team.
update shirts_raw
   set name = replace(name, 'ארנסל', 'ארסנל')
 where name like '%ארנסל%';

commit;

-- ── Check the result ───────────────────────────────────────
-- Every count below should be 0 after running.
select
  (select count(*) from shirts_raw
     where club is distinct from btrim(club)
        or national_team is distinct from btrim(national_team)
        or league is distinct from btrim(league)
        or name is distinct from btrim(name))                              as untrimmed,
  (select count(*) from shirts_raw where btrim(league) = 'פריימר ליג')     as league_typo,
  (select count(*) from shirts_raw
     where national_team is not null and btrim(club) = btrim(national_team)) as nation_as_club,
  (select count(*) from shirts_raw where name like '%ארנסל%')              as name_typo;
