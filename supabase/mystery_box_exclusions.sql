-- What to leave out, per box instead of per order - and the kids box, which
-- the server never actually accepted.
--
-- The exclusions used to be asked once for the whole order, which only works
-- when the whole order is for one person. A group of friends does not share a
-- taste: one will not wear red, another does not want Maccabi, and a single
-- list across all of them either over-restricts every box or serves none. So
-- the two fields move onto the box, which also means a friend filling in their
-- own box gets asked them.
--
-- While here: save_mystery_group_box still only knew regular/retro/mundial and
-- S..3XL, so a kids box saved through a friend's link came back as a regular
-- one and a kids size was refused outright. Both lists are widened below.
--
-- Safe to run twice.

alter table mystery_group_boxes_raw
  add column if not exists exclude_clubs  text,
  add column if not exists exclude_colors text[] not null default '{}';

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
        'shorts', b.shorts, 'note', b.note,
        'exclude_clubs', b.exclude_clubs,
        'exclude_colors', to_jsonb(b.exclude_colors)
      ) order by b.created_date)
      from mystery_group_boxes_raw b where b.group_id = g.id
    ), '[]'::jsonb)
  );
end;
$$;

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
  clubs text := nullif(left(trim(coalesce(p_box ->> 'exclude_clubs', '')), 200), '');
  colors text[] := coalesce((
    select array_agg(value)
    from jsonb_array_elements_text(
      case when jsonb_typeof(p_box -> 'exclude_colors') = 'array'
           then p_box -> 'exclude_colors' else '[]'::jsonb end
    ) as value
  ), '{}');
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
  if kind is null or kind not in ('regular', 'retro', 'mundial', 'kids') then
    kind := 'regular';
  end if;
  -- Adult sizes, and the kids table's own 14-28.
  if sz is null or sz not in ('S', 'M', 'L', 'XL', '2XL', '3XL',
                              '14', '16', '18', '20', '22', '24', '26', '28') then
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
      note = left(coalesce(p_box ->> 'note', ''), 200),
      exclude_clubs = clubs,
      exclude_colors = colors
    where id = p_box_id and group_id = g.id and editor_token = p_token
    returning id into box_id;
    if box_id is not null then
      return jsonb_build_object('ok', true, 'id', box_id);
    end if;
  end if;

  if (select count(*) from mystery_group_boxes_raw where group_id = g.id) >= 30 then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;
  insert into mystery_group_boxes_raw (group_id, editor_token, for_whom, box_type, size, add_name, patches, long_sleeve, shorts, note, exclude_clubs, exclude_colors)
  values (
    g.id, p_token, who, kind, sz,
    coalesce((p_box ->> 'add_name')::boolean, false),
    coalesce((p_box ->> 'patches')::boolean, false),
    coalesce((p_box ->> 'long_sleeve')::boolean, false),
    coalesce((p_box ->> 'shorts')::boolean, false) and kind <> 'retro',
    left(coalesce(p_box ->> 'note', ''), 200),
    clubs,
    colors
  )
  returning id into box_id;
  return jsonb_build_object('ok', true, 'id', box_id);
end;
$$;

revoke all on function public.get_mystery_group(text) from public;
revoke all on function public.save_mystery_group_box(text, text, text, jsonb) from public;
grant execute on function public.get_mystery_group(text) to anon, authenticated;
grant execute on function public.save_mystery_group_box(text, text, text, jsonb) to anon, authenticated;
