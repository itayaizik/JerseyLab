-- Snapshot of site_settings_raw taken immediately before site-texts.sql was
-- applied on 2026-09-12. Run this to put the previous wording back.
--
-- Only the four keys that site-texts.sql touches are restored; the other three
-- rows were not modified.

begin;

update site_settings_raw set value =
  'אנחנו אתר שמתמחה בחולצות כדורגל, נבחרות וחולצות מיוחדות לאוהדים ואספנים. המטרה שלנו היא לתת מקום פשוט, נוח ואמין למצוא חולצות יפות בלי להסתבך.'
  where key = 'about_us_text';

update site_settings_raw set value =
  'חולצות כדורגל איכותיות ונדירות במחירים טובים.'
  where key = 'homepage_hero_title';

update site_settings_raw set value =
  'מצא חולצות של קבוצות, נבחרות ושחקנים אהובים במקום אחד.'
  where key = 'homepage_hero_subtitle';

delete from site_settings_raw where key = 'chat_proofs_title';

commit;
