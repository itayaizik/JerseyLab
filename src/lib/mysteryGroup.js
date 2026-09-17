// Mystery box groups, kept on the server (supabase/mystery_groups.sql).
//
// Friends order together, but only one of them places the order. The
// organiser starts a group and sends its link; each friend opens a page of
// their own, fills in one box and saves it. The organiser's builder picks the
// new boxes up while it is open and says who added what.
//
// The browser remembers both sides, so a refresh or a closed tab loses
// nothing: the organiser keeps the group and the boxes being built, a friend
// keeps their box and can come back to change it.

import { supabase } from '@/lib/supabase';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { cleanBox } from '@/lib/mysteryBoxes';
import { t } from '@/lib/i18n';

export const MAX_GROUP_BOXES = 30;

export const joinPath = (groupId) => `/mystery-box/join/${groupId}`;
export const joinLink = (groupId) => `${SITE_ORIGIN}${joinPath(groupId)}`;

// --- local memory ----------------------------------------------------------

const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* private mode - the page still works, it just forgets */ }
};

// The organiser's builder: the boxes, what to leave out, and the group if one
// was started. { boxes, excludeClubs, excludeColors, notes, group }
const DRAFT_KEY = 'jl_mystery_draft';

export function loadDraft() {
  const draft = read(DRAFT_KEY);
  if (!draft || !Array.isArray(draft.boxes) || !draft.boxes.length) return null;
  const g = draft.group;
  return {
    boxes: draft.boxes.slice(0, MAX_GROUP_BOXES).map(cleanBox),
    excludeClubs: typeof draft.excludeClubs === 'string' ? draft.excludeClubs.slice(0, 200) : '',
    excludeColors: Array.isArray(draft.excludeColors) ? draft.excludeColors.filter(c => typeof c === 'string') : [],
    notes: typeof draft.notes === 'string' ? draft.notes.slice(0, 500) : '',
    group: g && typeof g.id === 'string' && typeof g.ownerToken === 'string'
      ? {
        id: g.id, ownerToken: g.ownerToken, ownerName: String(g.ownerName || ''),
        seenVersions: g.seenVersions && typeof g.seenVersions === 'object' ? { ...g.seenVersions } : {},
      }
      : null,
  };
}

export function saveDraft(draft) {
  write(DRAFT_KEY, draft ? {
    ...draft,
    boxes: draft.boxes.map(({ id, ...box }) => box), // eslint-disable-line no-unused-vars
  } : null);
}

// A friend's box in one group: { boxId, token, box }.
const memberKey = (groupId) => `jl_mystery_member_${groupId}`;
export const loadMember = (groupId) => {
  const m = read(memberKey(groupId));
  return m && typeof m.token === 'string' ? { ...m, box: m.box ? cleanBox(m.box) : null } : null;
};
export const saveMember = (groupId, member) => write(memberKey(groupId), member);

const newToken = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`).replace(/-/g, '');
export const ensureMemberToken = (groupId) => loadMember(groupId)?.token || newToken();

// --- the server ------------------------------------------------------------

const REASONS = {
  not_found: () => t('הקישור לא נמצא. בקשו מהחבר קישור חדש.', "This link wasn't found. Ask your friend for a new one."),
  closed: () => t('מי שהזמין סגר את הקבוצה, אז אי אפשר להוסיף אליה בוקסים.', 'The organiser has closed this group, so boxes can no longer be added.'),
  full: () => t('בקבוצה כבר יש את מספר הבוקסים המקסימלי.', 'This group already has the maximum number of boxes.'),
  name_required: () => t('צריך למלא שם', 'Please fill in a name'),
  size_required: () => t('צריך לבחור מידה', 'Please choose a size'),
  unavailable: () => t('משהו השתבש. נסו שוב בעוד רגע.', 'Something went wrong. Please try again in a moment.'),
};
export const groupReason = (reason) => (REASONS[reason] || REASONS.unavailable)();

async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error || !data) return { ok: false, message: groupReason('unavailable') };
  if (!data.ok) return { ok: false, reason: data.reason, message: groupReason(data.reason) };
  return data;
}

export const createGroup = (ownerName, ownerPhone) =>
  call('create_mystery_group', { p_owner_name: ownerName, p_owner_phone: ownerPhone || null });

// Server box -> the builder's shape.
const fromServer = (b) => ({
  remoteId: b.id,
  createdDate: b.created_date,
  updatedDate: b.updated_date,
  forWhom: b.for_whom, type: b.type, size: b.size,
  addName: b.add_name, patches: b.patches, longSleeve: b.long_sleeve, shorts: b.shorts,
  note: b.note || '',
});

export async function fetchGroup(groupId) {
  const data = await call('get_mystery_group', { p_id: groupId });
  if (!data.ok) return data;
  return {
    ok: true,
    ownerName: data.owner_name,
    ownerPhone: data.owner_phone,
    closed: !!data.closed,
    boxes: (data.boxes || []).map(fromServer),
  };
}

export const saveGroupBox = (groupId, { boxId, token, box }) => call('save_mystery_group_box', {
  p_group_id: groupId,
  p_box_id: boxId || null,
  p_token: token,
  p_box: {
    for_whom: box.forWhom.trim(), type: box.type, size: box.size,
    add_name: box.addName, patches: box.patches, long_sleeve: box.longSleeve, shorts: box.shorts,
    note: box.note.trim(),
  },
});

export const closeGroup = (group) => call('close_mystery_group', { p_id: group.id, p_owner_token: group.ownerToken });

// "050-1234567" -> "972501234567", for a wa.me link.
export function whatsappNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
}
