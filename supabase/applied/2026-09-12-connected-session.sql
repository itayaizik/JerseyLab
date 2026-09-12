-- Changes applied directly to the live database on 12 September 2026, once the
-- Supabase connection made it possible to run them instead of handing them over
-- as a file to paste into the SQL editor.
--
-- This is a record, not a script to run: everything here is already applied.
-- It is written down because a database that drifts from the repository is a
-- database nobody can reason about later. Each block is idempotent, so
-- re-running it is harmless if the project is ever rebuilt from scratch.

-- 1 -------------------------------------------------------------------------
-- chat_proofs_raw did not exist. The customer chat screenshots feature was
-- fully built and wired up, and the home page had been querying this table on
-- every single load and getting a 404 back.

create table if not exists chat_proofs_raw (
  id           text primary key default gen_random_uuid()::text,
  created_date timestamptz default now(),
  updated_date timestamptz,
  image_url    text not null,
  caption      text,
  sort_order   integer default 0,
  active       boolean not null default true
);

alter table chat_proofs_raw enable row level security;

drop policy if exists "public read active chat proofs" on chat_proofs_raw;
create policy "public read active chat proofs" on chat_proofs_raw for select
  using (active = true);

drop policy if exists "admin full access chat proofs" on chat_proofs_raw;
create policy "admin full access chat proofs" on chat_proofs_raw for all
  using (public.is_admin()) with check (public.is_admin());

-- 2 -------------------------------------------------------------------------
-- site_settings_raw is a key/value table whose `key` column had no unique
-- index; only `id` was constrained. Every upsert against it failed with "no
-- unique constraint matching ON CONFLICT", which is why scripts/out/site-texts.sql
-- could never have run as written, and nothing prevented the same setting being
-- stored twice with different values.

create unique index if not exists site_settings_raw_key_idx
  on site_settings_raw (key);

-- 3 -------------------------------------------------------------------------
-- is_admin() gates every admin RLS policy, and had no search_path of its own.
-- It is SECURITY INVOKER rather than DEFINER, so this was not the privilege
-- escalation the generic linter warning implies, but an empty search_path is
-- correct for the one function the whole authorisation model rests on.
-- Verified afterwards: admin emails return true, anon returns false, and an
-- admin still reads admin_logs_raw while a non-admin sees zero rows.

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $function$
  select coalesce(auth.jwt() ->> 'email', '') in ('itayaizik8@gmail.com', 'itayaizik3@gmail.com');
$function$;

-- 4 -------------------------------------------------------------------------
-- All three storage buckets were public with no size limit and no MIME
-- restriction. request-images is writable by any anonymous visitor through the
-- shirt request form, so without a MIME restriction anyone could upload HTML
-- and host a page on the shop's own domain.
--
-- HEIC and HEIF are allowed because that is what an iPhone uploads when Safari
-- does not transcode, and rejecting it would break the form for iPhone users
-- rather than protect anything.

update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
 where id in ('request-images','review-images');

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
 where id = 'shirt-images';

-- 5 -------------------------------------------------------------------------
-- The home page texts from scripts/out/site-texts.sql were applied. The
-- previous wording is preserved in scripts/out/backups/site-settings-before-seed.sql
-- if it is ever wanted back.

-- 6 -------------------------------------------------------------------------
-- 166 product and card images were copied out of i.ibb.co, i.postimg.cc and
-- base44.app into this project's own shirt-images bucket, and the rows updated
-- to point at them. Done with a temporary Edge Function, since uploading to
-- Storage needs the service role key; the function has since been emptied and
-- should be deleted from the dashboard.
--
-- Not moved, deliberately:
--   * 26 club and league crests on upload.wikimedia.org - stable, and not ours.
--   * 16 product photos belonging to other shops (usi-sports.com,
--     retrosleague.com, static.wixstatic.com, www.mystershirt.com). Copying
--     those onto our own storage is a decision about someone else's photographs
--     and belongs to the owner, not to a migration script.

-- 7 -------------------------------------------------------------------------
-- Second image migration pass, later the same day, at the owner's explicit
-- instruction after the trade-off was put to them twice.
--
-- The remaining 45 images were moved into our own storage: 26 club and league
-- crests from Wikimedia, 14 product photos from usi-sports.com, and one each
-- from retrosleague.com, static.wixstatic.com, www.mystershirt.com and Google's
-- thumbnail cache.
--
-- Every image URL in the database now points at our own bucket: 210 of 210,
-- one host. 121 MB across 178 catalogue images, 27 crests and 5 category cards.
--
-- Worth recording about the crests: Wikimedia returns HTTP 400 to requests that
-- do not look like a browser, which made them appear dead to a plain curl while
-- loading perfectly for every real visitor. They were never broken. Supabase's
-- own servers fetched all 45 without a single failure.
--
-- The photographs taken from other shops are a matter for the owner rather than
-- a technical one; the honest long-term answer for those fourteen is the shop's
-- own photographs, since neither hotlinking nor copying is clean.

-- 8 -------------------------------------------------------------------------
-- SVG allowed on shirt-images only.
--
-- Four of the crests are SVG, and the MIME restriction added in section 4
-- rejected them. SVG can carry script, so it stays blocked on request-images -
-- which any anonymous visitor can write to - and on review-images. It is
-- permitted on shirt-images alone, whose INSERT policy requires is_admin(), so
-- the only person who can put an SVG there is the owner. An SVG referenced by
-- <img src> cannot execute script in any case.

update storage.buckets
   set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','image/svg+xml']
 where id = 'shirt-images';

-- 9 -------------------------------------------------------------------------
-- Auth password policy, set through the dashboard at the owner's request.
--
--   Minimum password length: 6 -> 8
--   Password requirements:   none -> letters and digits
--
-- Deliberately not the "letters, digits and symbols" option Supabase marks as
-- recommended: requiring symbols is the setting that makes people abandon a
-- sign-up form, and this shop needs the registrations more than it needs the
-- last increment of entropy.
--
-- Leaked-password protection (HaveIBeenPwned) remains off. It is not a toggle
-- that was missed: it requires the Pro plan, and this project is on free.

-- 10 ------------------------------------------------------------------------
-- search_logs_raw records how many shirts each search found.
--
-- Without it the log said what people looked for but not whether they found
-- it. Nullable: the searches logged before this existed were never measured,
-- and backfilling them against today's catalogue would record something that
-- was not true at the time. Searches are now logged once, on the catalogue
-- page, where the count is known - not separately by the navbar and home page.

alter table search_logs_raw add column if not exists results_count integer;

-- Three rows left behind by my own verification earlier in this work, which
-- the analytics page was showing as customer searches.
delete from search_logs_raw
 where search_term in ('__adapter_fix_test__', '__audit_recheck__', '__verify_final__');

-- 11 ------------------------------------------------------------------------
-- 13 September 2026, at the owner's instruction: sizes for the shirts that had
-- none, and no XS on any Israeli league shirt.
--
-- Ten shirts had an empty size map, all current-season kits from big clubs, and
-- the product page hides its size block entirely when there are no sizes. Nine
-- got XS-3XL; the one Israeli league shirt among them got S-3XL. Their
-- descriptions gained the same "זמינה במידות" sentence every other shirt has.
--
-- All sixteen Israeli league shirts lost XS from their sizes, their local stock
-- and the size list in their description. Shirts outside that league keep XS.
--
-- The rows as they were are kept in backups.shirts_sizes_20260913 - a schema
-- PostgREST does not expose, so the copy is never readable through the API.

create schema if not exists backups;

update shirts_raw
   set sizes = '{"XS":1,"S":1,"M":1,"L":1,"XL":1,"2XL":1,"3XL":1}',
       description = case when description like '%זמינה במידות%' then description
                          else replace(description, 'ההזמנה מיוחדת', 'זמינה במידות XS, S, M, L, XL, 2XL, 3XL. ההזמנה מיוחדת') end
 where coalesce(nullif(trim(sizes), ''), '{}') in ('{}', 'null', '[]')
   and coalesce(league, '') <> 'ליגת העל';

update shirts_raw
   set sizes = '{"S":1,"M":1,"L":1,"XL":1,"2XL":1,"3XL":1}',
       description = case when description like '%זמינה במידות%' then description
                          else replace(description, 'ההזמנה מיוחדת', 'זמינה במידות S, M, L, XL, 2XL, 3XL. ההזמנה מיוחדת') end
 where coalesce(nullif(trim(sizes), ''), '{}') in ('{}', 'null', '[]')
   and league = 'ליגת העל';

update shirts_raw
   set sizes = case when sizes like '{%' then (sizes::jsonb - 'XS')::text else sizes end,
       local_stock_sizes = case when local_stock_sizes like '{%' then (local_stock_sizes::jsonb - 'XS')::text else local_stock_sizes end,
       description = regexp_replace(regexp_replace(description, 'XS,\s*', '', 'g'), ',\s*XS(?=[.,])', '', 'g')
 where league = 'ליגת העל';
