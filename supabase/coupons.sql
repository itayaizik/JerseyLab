-- Coupon codes.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- The codes themselves are admin-only: the shop never reads the table, so the
-- list of codes cannot be pulled from the browser. A customer's code is checked
-- by check_coupon(), which answers for that one code only, and an order that
-- used one is recorded by redeem_coupon(), which also counts the use.

-- 1. The coupons --------------------------------------------------------------

create table if not exists coupons_raw (
  id                  text primary key default gen_random_uuid()::text,
  created_date        timestamptz default now(),
  updated_date        timestamptz,
  code                text not null unique,
  description         text,
  active              boolean not null default true,
  -- 'percent': discount_value is a percentage. 'fixed': shekels off the order.
  discount_type       text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value      numeric not null check (discount_value > 0),
  -- The most a percentage coupon can take off, in shekels. Null: no cap.
  max_discount        numeric check (max_discount is null or max_discount > 0),
  -- Which items the coupon counts and discounts.
  applies_to          text not null default 'all' check (applies_to in ('all', 'shirts', 'mystery')),
  min_items           integer not null default 0 check (min_items >= 0),
  min_total           numeric not null default 0 check (min_total >= 0),
  starts_at           timestamptz,
  ends_at             timestamptz,
  -- Null: unlimited.
  max_uses            integer check (max_uses is null or max_uses > 0),
  uses                integer not null default 0,
  once_per_customer   boolean not null default false,
  -- No stacking: items already on sale are left out.
  exclude_sale_items  boolean not null default false
);

alter table coupons_raw enable row level security;
drop policy if exists "admin full access coupons" on coupons_raw;
create policy "admin full access coupons" on coupons_raw for all
  using (public.is_admin()) with check (public.is_admin());

-- 2. Every order that used a coupon ---------------------------------------------

create table if not exists coupon_redemptions_raw (
  id            text primary key default gen_random_uuid()::text,
  created_date  timestamptz default now(),
  coupon_id     text references coupons_raw(id) on delete cascade,
  code          text not null,
  order_id      text,
  email         text,
  phone         text,
  discount      numeric
);

create index if not exists coupon_redemptions_coupon_idx on coupon_redemptions_raw (coupon_id);

alter table coupon_redemptions_raw enable row level security;
drop policy if exists "admin full access coupon redemptions" on coupon_redemptions_raw;
create policy "admin full access coupon redemptions" on coupon_redemptions_raw for all
  using (public.is_admin()) with check (public.is_admin());

-- 3. Checking a code ----------------------------------------------------------
-- Returns the rules the cart needs to price the order, or the reason the code
-- cannot be used. Never the use count, and never any other code.

create or replace function public.check_coupon(p_code text, p_email text default null, p_phone text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c coupons_raw;
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  select * into c from coupons_raw where code = upper(trim(coalesce(p_code, '')));
  if not found or not c.active then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('ok', false, 'reason', 'not_started');
  end if;
  if c.ends_at is not null and now() > c.ends_at then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if c.max_uses is not null and c.uses >= c.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'used_up');
  end if;
  if c.once_per_customer and exists (
    select 1 from coupon_redemptions_raw r
    where r.coupon_id = c.id
      and ((coalesce(p_email, '') <> '' and lower(r.email) = lower(trim(p_email)))
        or (length(digits) >= 9 and regexp_replace(coalesce(r.phone, ''), '\D', '', 'g') = digits))
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_used');
  end if;
  return jsonb_build_object(
    'ok', true,
    'code', c.code,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'max_discount', c.max_discount,
    'applies_to', c.applies_to,
    'min_items', c.min_items,
    'min_total', c.min_total,
    'exclude_sale_items', c.exclude_sale_items,
    'once_per_customer', c.once_per_customer
  );
end;
$$;

-- 4. Recording a use ----------------------------------------------------------
-- Checks the code again (it may have run out since the cart checked it), then
-- records the order and counts the use.

create or replace function public.redeem_coupon(p_code text, p_order_id text, p_email text, p_phone text, p_discount numeric)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  result jsonb := public.check_coupon(p_code, p_email, p_phone);
  c coupons_raw;
begin
  if not (result ->> 'ok')::boolean then
    return result;
  end if;
  select * into c from coupons_raw where code = upper(trim(p_code)) for update;
  if c.max_uses is not null and c.uses >= c.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'used_up');
  end if;
  update coupons_raw set uses = uses + 1 where id = c.id;
  insert into coupon_redemptions_raw (coupon_id, code, order_id, email, phone, discount)
  values (c.id, c.code, left(p_order_id, 100), left(lower(trim(p_email)), 254), left(p_phone, 30), greatest(coalesce(p_discount, 0), 0));
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.check_coupon(text, text, text) from public;
revoke all on function public.redeem_coupon(text, text, text, text, numeric) from public;
grant execute on function public.check_coupon(text, text, text) to anon, authenticated;
grant execute on function public.redeem_coupon(text, text, text, text, numeric) to anon, authenticated;
