-- Abandoned baskets, with nothing in them that belongs to a person.
--
-- The cart lives in the browser and never reached the server, so a basket that
-- was filled and left behind left no trace: the only thing anyone could count
-- was the orders that arrived. This table answers the other half - how many
-- people got close, what was in their basket, and where the form lost them.
--
-- There is no name, phone or email here and there is not meant to be. The id
-- is a random string the browser made for itself. A row says "a basket worth
-- 160 reached the details step and stopped at the phone field" and nothing
-- whatever about who, which is the number worth having at no cost to anyone.
--
-- Already applied to the live database. Kept here so the schema is readable in
-- one place and can be rebuilt from scratch.

create table if not exists public.cart_sessions_raw (
  id               text primary key,
  items            text,
  item_count       integer     not null default 0,
  value            numeric     not null default 0,
  reached_checkout boolean     not null default false,
  ordered          boolean     not null default false,
  order_id         text,
  stopped_at       text,
  created_date     timestamptz not null default now(),
  updated_date     timestamptz not null default now()
);

alter table public.cart_sessions_raw enable row level security;

-- Reading is the shop's business only.
drop policy if exists cart_sessions_admin_read on public.cart_sessions_raw;
create policy cart_sessions_admin_read on public.cart_sessions_raw
  for select to anon, authenticated using (public.is_admin());

-- There are deliberately no insert or update policies. Writing from the
-- browser cannot work alongside an admin-only read: an upsert makes Postgres
-- read the conflicting row, and an update's WHERE reads the id column, so both
-- are refused - the upsert loudly, the update silently, by changing nothing
-- and returning 204. Everything goes through the function below instead.

create or replace function public.record_cart_session(
  p_id text,
  p_items text default null,
  p_item_count integer default null,
  p_value numeric default null,
  p_reached_checkout boolean default null,
  p_ordered boolean default null,
  p_order_id text default null,
  p_stopped_at text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- An id has to look like one. Without this the function takes any string and
  -- the table becomes a free-form write target.
  if p_id is null or length(p_id) < 8 or length(p_id) > 64 then
    return;
  end if;

  insert into public.cart_sessions_raw as c
    (id, items, item_count, value, reached_checkout, ordered, order_id, stopped_at, updated_date)
  values
    (p_id,
     left(coalesce(p_items, '[]'), 2000),
     coalesce(p_item_count, 0),
     coalesce(p_value, 0),
     coalesce(p_reached_checkout, false),
     coalesce(p_ordered, false),
     nullif(left(coalesce(p_order_id, ''), 64), ''),
     left(p_stopped_at, 64),
     now())
  on conflict (id) do update set
    -- Null means "this call is not about that column", so a call reporting
    -- that someone reached the checkout does not wipe what is in the basket.
    items            = coalesce(left(p_items, 2000), c.items),
    item_count       = coalesce(p_item_count, c.item_count),
    value            = coalesce(p_value, c.value),
    -- These only ever go from false to true. A later basket update must not
    -- undo the fact that someone reached the checkout, or ordered.
    reached_checkout = c.reached_checkout or coalesce(p_reached_checkout, false),
    ordered          = c.ordered or coalesce(p_ordered, false),
    order_id         = coalesce(nullif(left(p_order_id, 64), ''), c.order_id),
    stopped_at       = coalesce(left(p_stopped_at, 64), c.stopped_at),
    updated_date     = now();
end;
$$;

revoke all on function public.record_cart_session(text, text, integer, numeric, boolean, boolean, text, text) from public;
grant execute on function public.record_cart_session(text, text, integer, numeric, boolean, boolean, text, text) to anon, authenticated;
