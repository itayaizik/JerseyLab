-- Orian Goren joins the legionnaires.
--
-- Run this in the Supabase SQL editor. It is safe to run twice: both halves
-- check for themselves first and do nothing if they already ran.
--
-- The player's photo is NOT set here - uploading to the shirt-images bucket
-- needs an admin session, which only you have. After running this, open
-- ניהול > הלגיונרים and upload the portrait onto the row this creates.

begin;

-- 1. The player. `sort_order` puts him after the five already showing; the
--    row is active so he appears as soon as the photo is on it.
insert into legionnaires_raw (id, name, club, sort_order, active, image_url, created_date, updated_date)
select gen_random_uuid()::text, 'אוריין גורן', 'ברצלונה',
       coalesce((select max(sort_order) from legionnaires_raw where active), 0) + 1,
       true, null, now(), now()
where not exists (select 1 from legionnaires_raw where name = 'אוריין גורן');

-- 2. His three shirts, built from Barcelona's own 2026/27 kits so the photos,
--    sizes and price are the ones already on the site rather than a second
--    copy that can drift from them.
insert into shirts_raw (
  id, name, club, league, season, player_name, price, sizes, status,
  main_image, extra_images, is_retro, gender_category, is_new,
  created_date, updated_date
)
select
  gen_random_uuid()::text,
  s.name || ' גורן',
  s.club, s.league, s.season,
  'אוריין גורן',
  s.price, s.sizes, 'available',
  s.main_image, s.extra_images, s.is_retro, s.gender_category, true,
  now(), now()
from shirts_raw s
where s.id in (
  '6a42ea92005950f7dc39e0a9',  -- חולצת ברצלונה בית 2026/27
  '6a6ebfd946cb081997549ce0',  -- חולצת ברצלונה חוץ 2026/27
  '0e2b58c585eb7023885968b4'   -- חולצת ברצלונה שלישית 2026/27
)
and not exists (
  select 1 from shirts_raw x
  where x.player_name = 'אוריין גורן' and x.name = s.name || ' גורן'
);

commit;

-- What it made:
select name, club, season, player_name, status
from shirts_raw where player_name = 'אוריין גורן' order by name;

select name, club, active, sort_order, image_url
from legionnaires_raw where name = 'אוריין גורן';
