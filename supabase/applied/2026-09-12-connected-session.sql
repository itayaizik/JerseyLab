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
