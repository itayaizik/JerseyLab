-- JerseyLab: RLS policies for the Base44 -> Supabase migration.
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query > Run).
-- Safe to re-run: every policy is dropped and recreated.
--
-- Admin is determined by email allowlist (matches src/lib/adminEmails.js).
-- If you add an admin there, add their email here too and re-run this script.

-- ── id column defaults (root cause of the write failures) ───
-- These tables came from the Base44 export with `id text not null` and no
-- default generator, so every insert needs an id supplied. Without this,
-- inserts fail with "null value in column id violates not-null constraint"
-- (Postgres/PostgREST reports this confusingly as an RLS violation).
alter table shirts_raw alter column id set default gen_random_uuid()::text;
alter table wishlists_raw alter column id set default gen_random_uuid()::text;
alter table interest_requests_raw alter column id set default gen_random_uuid()::text;
alter table reviews_raw alter column id set default gen_random_uuid()::text;
alter table faq_raw alter column id set default gen_random_uuid()::text;
alter table admin_logs_raw alter column id set default gen_random_uuid()::text;
alter table search_logs_raw alter column id set default gen_random_uuid()::text;
alter table site_settings_raw alter column id set default gen_random_uuid()::text;
alter table categories_raw alter column id set default gen_random_uuid()::text;
alter table league_cards_raw alter column id set default gen_random_uuid()::text;
alter table popular_clubs_raw alter column id set default gen_random_uuid()::text;
alter table category_cards_raw alter column id set default gen_random_uuid()::text;
alter table contact_messages_raw alter column id set default gen_random_uuid()::text;
alter table customer_profiles_raw alter column id set default gen_random_uuid()::text;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') in ('itayaizik8@gmail.com', 'itayaizik3@gmail.com');
$$;

-- ── shirts_raw: what's actually on the local-stock physical item ────
-- Lets a customer choose "buy this exact one" (fast, predetermined
-- customization) vs a made-to-order custom shirt.
alter table shirts_raw add column if not exists local_stock_player_version boolean not null default false;
alter table shirts_raw add column if not exists local_stock_custom_name text;

-- ── shirts_raw ──────────────────────────────────────────────
alter table shirts_raw enable row level security;
drop policy if exists "public read shirts" on shirts_raw;
create policy "public read shirts" on shirts_raw for select using (true);
drop policy if exists "admin full access shirts" on shirts_raw;
create policy "admin full access shirts" on shirts_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── wishlists_raw ───────────────────────────────────────────
alter table wishlists_raw enable row level security;
drop policy if exists "own wishlist" on wishlists_raw;
create policy "own wishlist" on wishlists_raw for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
drop policy if exists "admin full access wishlists" on wishlists_raw;
create policy "admin full access wishlists" on wishlists_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── interest_requests_raw ───────────────────────────────────
alter table interest_requests_raw enable row level security;
drop policy if exists "own interest requests read" on interest_requests_raw;
create policy "own interest requests read" on interest_requests_raw for select
  using (user_id = auth.uid()::text);
-- Guests (not logged in) can submit too — InterestModal.jsx sends
-- user_id: '' in that case — but a request must be attributed to either
-- the caller's own auth uid or the empty guest value, never someone
-- else's uid (which would let one user's requests be spoofed as another's).
drop policy if exists "own interest requests insert" on interest_requests_raw;
create policy "own interest requests insert" on interest_requests_raw for insert
  with check (user_id = coalesce(auth.uid()::text, '') or user_id = '');
drop policy if exists "admin full access interest requests" on interest_requests_raw;
create policy "admin full access interest requests" on interest_requests_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── reviews_raw ─────────────────────────────────────────────
alter table reviews_raw enable row level security;
drop policy if exists "public read approved reviews" on reviews_raw;
create policy "public read approved reviews" on reviews_raw for select using (approved = true);
drop policy if exists "own review insert" on reviews_raw;
create policy "own review insert" on reviews_raw for insert
  with check (user_id = auth.uid()::text);
drop policy if exists "admin full access reviews" on reviews_raw;
create policy "admin full access reviews" on reviews_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── faq_raw ─────────────────────────────────────────────────
alter table faq_raw enable row level security;
drop policy if exists "public read active faq" on faq_raw;
create policy "public read active faq" on faq_raw for select using (active = true);
drop policy if exists "admin full access faq" on faq_raw;
create policy "admin full access faq" on faq_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── admin_logs_raw ──────────────────────────────────────────
alter table admin_logs_raw enable row level security;
drop policy if exists "admin full access admin logs" on admin_logs_raw;
create policy "admin full access admin logs" on admin_logs_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── search_logs_raw ─────────────────────────────────────────
alter table search_logs_raw enable row level security;
drop policy if exists "anyone can log a search" on search_logs_raw;
create policy "anyone can log a search" on search_logs_raw for insert
  with check (true);
drop policy if exists "admin full access search logs" on search_logs_raw;
create policy "admin full access search logs" on search_logs_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── site_settings_raw ───────────────────────────────────────
alter table site_settings_raw enable row level security;
drop policy if exists "public read site settings" on site_settings_raw;
create policy "public read site settings" on site_settings_raw for select using (true);
drop policy if exists "admin full access site settings" on site_settings_raw;
create policy "admin full access site settings" on site_settings_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── categories_raw ──────────────────────────────────────────
alter table categories_raw enable row level security;
drop policy if exists "public read categories" on categories_raw;
create policy "public read categories" on categories_raw for select using (true);
drop policy if exists "admin full access categories" on categories_raw;
create policy "admin full access categories" on categories_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── league_cards_raw ────────────────────────────────────────
alter table league_cards_raw enable row level security;
drop policy if exists "public read league cards" on league_cards_raw;
create policy "public read league cards" on league_cards_raw for select using (true);
drop policy if exists "admin full access league cards" on league_cards_raw;
create policy "admin full access league cards" on league_cards_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── popular_clubs_raw ───────────────────────────────────────
alter table popular_clubs_raw enable row level security;
drop policy if exists "public read popular clubs" on popular_clubs_raw;
create policy "public read popular clubs" on popular_clubs_raw for select using (true);
drop policy if exists "admin full access popular clubs" on popular_clubs_raw;
create policy "admin full access popular clubs" on popular_clubs_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── category_cards_raw ──────────────────────────────────────
alter table category_cards_raw enable row level security;
drop policy if exists "public read category cards" on category_cards_raw;
create policy "public read category cards" on category_cards_raw for select using (true);
drop policy if exists "admin full access category cards" on category_cards_raw;
create policy "admin full access category cards" on category_cards_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── contact_messages_raw ────────────────────────────────────
alter table contact_messages_raw enable row level security;
drop policy if exists "anyone can send a contact message" on contact_messages_raw;
create policy "anyone can send a contact message" on contact_messages_raw for insert
  with check (true);
drop policy if exists "admin full access contact messages" on contact_messages_raw;
create policy "admin full access contact messages" on contact_messages_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── customer_profiles_raw ───────────────────────────────────
alter table customer_profiles_raw enable row level security;
drop policy if exists "authenticated users can create a profile" on customer_profiles_raw;
create policy "authenticated users can create a profile" on customer_profiles_raw for insert
  with check (auth.uid() is not null);
drop policy if exists "admin full access customer profiles" on customer_profiles_raw;
create policy "admin full access customer profiles" on customer_profiles_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── instagram_posts_raw (table didn't exist yet) ────────────
create table if not exists instagram_posts_raw (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  post_url text not null,
  caption text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_date timestamptz not null default now()
);
alter table instagram_posts_raw enable row level security;
drop policy if exists "public read active instagram posts" on instagram_posts_raw;
create policy "public read active instagram posts" on instagram_posts_raw for select using (active = true);
drop policy if exists "admin full access instagram posts" on instagram_posts_raw;
create policy "admin full access instagram posts" on instagram_posts_raw for all using (public.is_admin()) with check (public.is_admin());

-- ── Storage: shirt image uploads (admin panel) ──────────────
-- NOTE: create the bucket by hand first — Storage > New bucket > name
-- "shirt-images" > Public bucket: ON. Inserting into storage.buckets via
-- SQL doesn't reliably work on all projects, so this only sets the
-- policies on storage.objects (works regardless of how the bucket was made).

drop policy if exists "public read shirt images" on storage.objects;
create policy "public read shirt images" on storage.objects for select
  using (bucket_id = 'shirt-images');

drop policy if exists "admin upload shirt images" on storage.objects;
create policy "admin upload shirt images" on storage.objects for insert
  with check (bucket_id = 'shirt-images' and public.is_admin());

drop policy if exists "admin update shirt images" on storage.objects;
create policy "admin update shirt images" on storage.objects for update
  using (bucket_id = 'shirt-images' and public.is_admin());

drop policy if exists "admin delete shirt images" on storage.objects;
create policy "admin delete shirt images" on storage.objects for delete
  using (bucket_id = 'shirt-images' and public.is_admin());

-- ── interest_requests_raw: group multi-item cart checkouts ──
-- Every item from one cart checkout now shares an order_id (generated
-- client-side per checkout) so the admin panel can display them as one
-- order instead of N disconnected rows.
alter table interest_requests_raw add column if not exists order_id text;

-- ── interest_requests_raw: how the customer wants to be reached ──
-- Checkout now asks for an email (the order confirmation goes there) and lets
-- the customer choose whether we follow up on WhatsApp or Instagram; the
-- handle is only filled in for the Instagram case.
alter table interest_requests_raw add column if not exists email text;
alter table interest_requests_raw add column if not exists contact_channel text;
alter table interest_requests_raw add column if not exists instagram_handle text;

-- ── reviews_raw: optional photo + anonymous display name ────
alter table reviews_raw add column if not exists image_url text;
alter table reviews_raw add column if not exists is_anonymous boolean not null default false;

-- ── Storage: customer-submitted review photos ───────────────
-- NOTE: create the bucket by hand first — Storage > New bucket > name
-- "review-images" > Public bucket: ON.

drop policy if exists "public read review images" on storage.objects;
create policy "public read review images" on storage.objects for select
  using (bucket_id = 'review-images');

drop policy if exists "authenticated upload review images" on storage.objects;
create policy "authenticated upload review images" on storage.objects for insert
  with check (bucket_id = 'review-images' and auth.uid() is not null);
