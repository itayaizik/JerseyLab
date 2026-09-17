-- Mystery box groups: one person starts a group order, friends fill in their
-- own box on a page of their own, and the organiser sees each box arrive.
--
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- The tables are closed to the browser. Everything goes through the functions
-- below, which take a group id (a random uuid, only known to whoever was sent
-- the link) and, for changes, a token only the person who made the row holds.

create table if not exists mystery_groups_raw (
  id            text primary key default gen_random_uuid()::text,
  created_date  timestamptz default now(),
  owner_name    text not null,
  owner_phone   text,
  owner_token   text not null default gen_random_uuid()::text,
  closed        boolean not null default false
);

create table if not exists mystery_group_boxes_raw (
  id            text primary key default gen_random_uuid()::text,
  created_date  timestamptz default now(),
  updated_date  timestamptz,
  group_id      text not null references mystery_groups_raw(id) on delete cascade,
  editor_token  text not null,
  for_whom      text not null,
  box_type      text not null,
  size          text not null,
  add_name      boolean not null default false,
  patches       boolean not null default false,
  long_sleeve   boolean not null default false,
  shorts        boolean not null default false,
  note          text
);

create index if not exists mystery_group_boxes_group_idx on mystery_group_boxes_raw (group_id, created_date);

alter table mystery_groups_raw enable row level security;
alter table mystery_group_boxes_raw enable row level security;
drop policy if exists "admin full access mystery groups" on mystery_groups_raw;
create policy "admin full access mystery groups" on mystery_groups_raw for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin full access mystery group boxes" on mystery_group_boxes_raw;
create policy "admin full access mystery group boxes" on mystery_group_boxes_raw for all
  using (public.is_admin()) with check (public.is_admin());

-- Starting a group. Returns the id for the link and the token that lets the
-- organiser close it.
create or replace function public.create_mystery_group(p_owner_name text, p_owner_phone text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g mystery_groups_raw;
  name text := left(trim(coalesce(p_owner_name, '')), 40);
begin
  if name = '' then
    return jsonb_build_object('ok', false, 'reason', 'name_required');
  end if;
  insert into mystery_groups_raw (owner_name, owner_phone)
  values (name, nullif(left(regexp_replace(coalesce(p_owner_phone, ''), '[^0-9+]', '', 'g'), 20), ''))
  returning * into g;
  return jsonb_build_object('ok', true, 'id', g.id, 'owner_token', g.owner_token);
end;
$$;

-- A group as its members see it. Groups older than 30 days read as expired.
create or replace function public.get_mystery_group(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  g mystery_groups_raw;
begin
  select * into g from mystery_groups_raw where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  return jsonb_build_object(
    'ok', true,
    'owner_name', g.owner_name,
    'owner_phone', g.owner_phone,
    'closed', g.closed or g.created_date < now() - interval '30 days',
    'boxes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id, 'created_date', b.created_date, 'updated_date', b.updated_date,
        'for_whom', b.for_whom, 'type', b.box_type, 'size', b.size,
        'add_name', b.add_name, 'patches', b.patches, 'long_sleeve', b.long_sleeve,
        'shorts', b.shorts, 'note', b.note
      ) order by b.created_date)
      from mystery_group_boxes_raw b where b.group_id = g.id
    ), '[]'::jsonb)
  );
end;
$$;

-- A friend's box: added the first time, updated after that by whoever holds
-- its token.
create or replace function public.save_mystery_group_box(p_group_id text, p_box_id text, p_token text, p_box jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g mystery_groups_raw;
  box_id text;
  who text := left(trim(coalesce(p_box ->> 'for_whom', '')), 40);
  kind text := p_box ->> 'type';
  sz text := p_box ->> 'size';
begin
  select * into g from mystery_groups_raw where id = p_group_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if g.closed or g.created_date < now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'reason', 'closed');
  end if;
  if coalesce(length(p_token), 0) < 16 then
    return jsonb_build_object('ok', false, 'reason', 'bad_request');
  end if;
  if who = '' then
    return jsonb_build_object('ok', false, 'reason', 'name_required');
  end if;
  if kind is null or kind not in ('regular', 'retro', 'mundial') then
    kind := 'regular';
  end if;
  if sz is null or sz not in ('S', 'M', 'L', 'XL', '2XL', '3XL') then
    return jsonb_build_object('ok', false, 'reason', 'size_required');
  end if;

  if p_box_id is not null then
    update mystery_group_boxes_raw set
      updated_date = now(),
      for_whom = who, box_type = kind, size = sz,
      add_name = coalesce((p_box ->> 'add_name')::boolean, false),
      patches = coalesce((p_box ->> 'patches')::boolean, false),
      long_sleeve = coalesce((p_box ->> 'long_sleeve')::boolean, false),
      shorts = coalesce((p_box ->> 'shorts')::boolean, false) and kind <> 'retro',
      note = left(coalesce(p_box ->> 'note', ''), 200)
    where id = p_box_id and group_id = g.id and editor_token = p_token
    returning id into box_id;
    if box_id is not null then
      return jsonb_build_object('ok', true, 'id', box_id);
    end if;
  end if;

  if (select count(*) from mystery_group_boxes_raw where group_id = g.id) >= 30 then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;
  insert into mystery_group_boxes_raw (group_id, editor_token, for_whom, box_type, size, add_name, patches, long_sleeve, shorts, note)
  values (
    g.id, p_token, who, kind, sz,
    coalesce((p_box ->> 'add_name')::boolean, false),
    coalesce((p_box ->> 'patches')::boolean, false),
    coalesce((p_box ->> 'long_sleeve')::boolean, false),
    coalesce((p_box ->> 'shorts')::boolean, false) and kind <> 'retro',
    left(coalesce(p_box ->> 'note', ''), 200)
  )
  returning id into box_id;
  return jsonb_build_object('ok', true, 'id', box_id);
end;
$$;

-- The organiser has ordered: the link stops taking boxes.
create or replace function public.close_mystery_group(p_id text, p_owner_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update mystery_groups_raw set closed = true where id = p_id and owner_token = p_owner_token;
  return jsonb_build_object('ok', found);
end;
$$;

revoke all on function public.create_mystery_group(text, text) from public;
revoke all on function public.get_mystery_group(text) from public;
revoke all on function public.save_mystery_group_box(text, text, text, jsonb) from public;
revoke all on function public.close_mystery_group(text, text) from public;
grant execute on function public.create_mystery_group(text, text) to anon, authenticated;
grant execute on function public.get_mystery_group(text) to anon, authenticated;
grant execute on function public.save_mystery_group_box(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.close_mystery_group(text, text) to anon, authenticated;
