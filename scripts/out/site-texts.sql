-- Seeds the site texts that the home page now reads from the admin panel.
--
-- Two reasons to run this:
--
-- 1. The hero title and the "about" text were already stored in the settings
--    from an earlier version, and the page had been ignoring them. Now that the
--    page reads them, those old values would replace the designed two-line
--    heading with a single flat line. This puts good text in place.
--
-- 2. Google was showing the "about" paragraph as the search-result description
--    rather than the meta description. The new text is written for that: the
--    facts that matter are in the first 150 characters, which is roughly what
--    Google displays.
--
-- Every claim below is checked against the catalogue: 178 shirts priced ₪70-₪90,
-- 56 of them retro, 11 with stock in Israel.
--
-- After running, edit any of it freely in ניהול > הגדרות אתר. Nothing here is
-- final, and changing it needs no code.

begin;

-- The search-result description. First sentence carries the range and the
-- price; the rest is what makes the shop worth choosing.
insert into site_settings_raw (key, value)
values (
  'about_us_text',
  'JerseyLab מוכר חולצות כדורגל מקוריות: מועדונים, נבחרות ורטרו, החל מ-₪70. יש מלאי בארץ עם משלוח תוך כשבוע, ואפשר להזמין גם חולצות שלא נמצאות בקטלוג.

כל חולצה נבדקת, מצולמת ומתוארת בכנות, כך שמה שרואים באתר זה מה שמגיע אליכם. אנחנו נגישים בוואטסאפ ובאינסטגרם ועונים מהר לכל שאלה על מידה, זמינות או התאמה אישית.'
)
on conflict (key) do update set value = excluded.value;

-- The "|" splits the heading across two lines; the part after it is orange.
insert into site_settings_raw (key, value)
values ('homepage_hero_title', 'חולצות כדורגל איכותיות,|נדירות ובמחירים טובים')
on conflict (key) do update set value = excluded.value;

insert into site_settings_raw (key, value)
values ('homepage_hero_subtitle', 'מועדונים, נבחרות ורטרו במקום אחד. מלאי בארץ עם משלוח מהיר, החל מ-₪70.')
on conflict (key) do update set value = excluded.value;

insert into site_settings_raw (key, value)
values ('chat_proofs_title', 'לקוחות מספרים')
on conflict (key) do update set value = excluded.value;

commit;

-- If the insert above fails with "no unique constraint matching ON CONFLICT",
-- the key column has no unique index. Run this once, then re-run the file:
--
--   delete from site_settings_raw a using site_settings_raw b
--    where a.key = b.key and a.ctid < b.ctid;
--   create unique index if not exists site_settings_raw_key_idx
--       on site_settings_raw (key);
