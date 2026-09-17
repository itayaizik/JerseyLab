// A group's mystery boxes, carried in a link.
//
// Friends order together, but only one of them is holding the phone. The
// organiser sends the list so far over WhatsApp; each friend opens it, adds a
// box with their own name and size, and sends it on or back. Everything lives
// in the link itself - no account, nothing saved on our side - so it is read
// back as untrusted input: unknown styles and sizes are dropped, text is cut to
// the lengths the form allows.

import { BOX_TYPES, SIZES, EXCLUDE_COLORS } from '@/lib/mysteryBox';
import { SITE_ORIGIN } from '@/lib/siteUrl';

export const GROUP_PARAM = 'group';
export const MAX_GROUP_BOXES = 30;

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}

// Short keys keep the link short enough for WhatsApp to show it whole.
export function encodeGroup({ boxes, excludeClubs, excludeColors, notes }) {
  const data = {
    b: boxes.map(box => [
      box.forWhom.trim(), box.type, box.size,
      (box.addName ? 1 : 0) | (box.patches ? 2 : 0) | (box.longSleeve ? 4 : 0) | (box.shorts ? 8 : 0),
      box.note.trim(),
    ]),
  };
  if (excludeClubs.trim()) data.c = excludeClubs.trim();
  if (excludeColors.length) data.k = excludeColors;
  if (notes.trim()) data.n = notes.trim();
  return toBase64Url(JSON.stringify(data));
}

// The group in a link, or null when there is none or it cannot be read.
export function decodeGroup(value) {
  if (!value || value.length > 8000) return null;
  try {
    const data = JSON.parse(fromBase64Url(value));
    if (!Array.isArray(data?.b)) return null;
    const boxes = data.b.slice(0, MAX_GROUP_BOXES).map(entry => {
      const [forWhom, type, size, flags, note] = Array.isArray(entry) ? entry : [];
      const f = Number(flags) || 0;
      return {
        forWhom: text(forWhom, 40),
        type: BOX_TYPES.some(b => b.id === type) ? type : BOX_TYPES[0].id,
        size: SIZES.includes(size) ? size : '',
        addName: !!(f & 1),
        patches: !!(f & 2),
        longSleeve: !!(f & 4),
        shorts: !!(f & 8),
        note: text(note, 200),
      };
    });
    if (!boxes.length) return null;
    return {
      boxes,
      excludeClubs: text(data.c, 200),
      excludeColors: Array.isArray(data.k) ? data.k.filter(c => EXCLUDE_COLORS.some(x => x.label === c)) : [],
      notes: text(data.n, 500),
    };
  } catch {
    return null;
  }
}

export const groupLink = (group) => `${SITE_ORIGIN}/mystery-box?${GROUP_PARAM}=${encodeGroup(group)}`;

// The group in the address this page was opened with, if any.
export function groupFromLocation() {
  if (typeof window === 'undefined') return null;
  return decodeGroup(new URLSearchParams(window.location.search).get(GROUP_PARAM));
}
