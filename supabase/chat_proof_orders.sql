-- What the conversation was about.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- A screenshot of a WhatsApp conversation proves someone talked to us. It does
-- not say what they ended up buying, and that is the half a shopper actually
-- wants: the shirts, with a way into them. So a chat proof can now carry the
-- order it belongs to and the shirts from it, picked in the admin panel.
--
--   order_id   the order it came from, kept so the admin can show which one
--              is attached and refresh the shirts from it later
--   shirt_ids  the shirts shown under the screenshot, in the order they are
--              listed; filled from the order and then editable by hand, so a
--              proof can also be attached to shirts with no order behind them

alter table chat_proofs_raw add column if not exists order_id  text;
alter table chat_proofs_raw add column if not exists shirt_ids jsonb not null default '[]'::jsonb;
