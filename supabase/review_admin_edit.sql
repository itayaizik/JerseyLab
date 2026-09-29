-- Hiding a review's photo without losing it.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Everything else the admin can now change about a review - the rating, the
-- name, the words, the date, which shirt it is about - is an existing column.
-- "Show the photo or not" was the one that had no home: the only way to take a
-- picture off the site was to clear image_url, and that threw the picture away
-- for good. A flag keeps the file and the decision apart, so hiding a photo is
-- something you can undo.

alter table reviews_raw add column if not exists image_hidden boolean not null default false;
