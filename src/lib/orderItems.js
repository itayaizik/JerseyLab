import { EXTRA_PRICES, PATCHES_LABEL, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';

// An order item's options live in its free-text `message`, the way the cart
// wrote them at checkout:
//   "סל קניות | גרסת שחקן (+₪20) | הדפסת שם: MESSI 10 (+₪15) | שרוול ארוך (+₪20) | מכנס קצר (+₪40) | פאצ'ים (+₪5) | מחיר סופי: ₪175"
// The supplier text and the admin list already read that string, so the order
// editor reads it the same way and writes it back in the same shape rather than
// moving the options into columns that nothing else knows about.

const SEP = ' | ';
const PRICE_RE = /^מחיר סופי:\s*₪\s*(\d+(?:\.\d+)?)$/;
const PLAYER_RE = /^גרסת שחקן/;
const PRINT_RE = /^הדפסת שם:\s*(.*?)\s*(?:\(\+₪\d+\))?$/;
// Starts with the word, so a mystery box's "כל הפאצ'ים" is not taken for it.
const PATCHES_RE = /^פאצ['׳]ים/;
const LONG_SLEEVE_RE = /^שרוול ארוך/;
const SHORTS_RE = /^מכנס קצר/;

export const isMysteryBoxRequest = (request) => request?.shirt_id === MYSTERY_BOX_ID;

export function parseOrderItem(request) {
  const message = request?.message || '';
  // The old "add item" button appended notes on a new line; they are kept as is.
  const [firstLine, ...moreLines] = message.split('\n');
  const mystery = isMysteryBoxRequest(request);
  const item = {
    prefix: '', playerVersion: false, customName: '', patches: false, longSleeve: false, shorts: false, price: null,
    other: [], trailing: moreLines.join('\n'),
  };

  firstLine.split(SEP).map(part => part.trim()).filter(Boolean).forEach((part, i) => {
    if (i === 0 && !part.includes(':') && !part.includes('(+₪')) { item.prefix = part; return; }
    const price = part.match(PRICE_RE);
    if (price) { item.price = Number(price[1]); return; }
    // A mystery box prices its own add-ons, so its parts are kept untouched.
    if (!mystery) {
      if (PLAYER_RE.test(part)) { item.playerVersion = true; return; }
      const print = part.match(PRINT_RE);
      if (print) { item.customName = print[1].trim(); return; }
      if (PATCHES_RE.test(part)) { item.patches = true; return; }
      if (LONG_SLEEVE_RE.test(part)) { item.longSleeve = true; return; }
      if (SHORTS_RE.test(part)) { item.shorts = true; return; }
    }
    item.other.push(part);
  });

  return item;
}

export function buildOrderMessage(item, mystery = false) {
  const parts = [];
  if (item.prefix) parts.push(item.prefix);
  if (!mystery) {
    if (item.playerVersion) parts.push(`גרסת שחקן (+₪${EXTRA_PRICES.player})`);
    if (item.customName) parts.push(`הדפסת שם: ${item.customName} (+₪${EXTRA_PRICES.name})`);
    if (item.longSleeve) parts.push(`${LONG_SLEEVE_LABEL} (+₪${EXTRA_PRICES.longSleeve})`);
    if (item.shorts) parts.push(`${SHORTS_LABEL} (+₪${EXTRA_PRICES.shorts})`);
    if (item.patches) parts.push(`${PATCHES_LABEL} (+₪${EXTRA_PRICES.patches})`);
  }
  parts.push(...(item.other || []));
  if (item.price !== null && item.price !== '' && item.price !== undefined) parts.push(`מחיר סופי: ₪${Number(item.price)}`);
  return [parts.join(SEP), item.trailing].filter(Boolean).join('\n');
}

// What a draft's options add to the base price, so toggling one moves the price.
export function extraPrice(draft) {
  if (draft.mystery) return 0;
  return (draft.playerVersion ? EXTRA_PRICES.player : 0)
    + (draft.customName?.trim() ? EXTRA_PRICES.name : 0)
    + (draft.patches ? EXTRA_PRICES.patches : 0)
    + (draft.longSleeve ? EXTRA_PRICES.longSleeve : 0)
    + (draft.shorts ? EXTRA_PRICES.shorts : 0);
}

export const priceOf = (draft) => Number(draft.price) || 0;

export const orderTotal = (drafts) => drafts.filter(d => !d.removed).reduce((sum, d) => sum + priceOf(d), 0);

export function itemLine(draft) {
  const extras = [];
  if (draft.playerVersion) extras.push('גרסת שחקן');
  if (draft.customName?.trim()) extras.push(`הדפסה: ${draft.customName.trim()}`);
  if (draft.longSleeve) extras.push(LONG_SLEEVE_LABEL);
  if (draft.shorts) extras.push(SHORTS_LABEL);
  if (draft.patches) extras.push(PATCHES_LABEL);
  const size = draft.size?.trim() ? ` - מידה ${draft.size.trim()}` : '';
  return `${draft.name}${size} - ₪${priceOf(draft)}${extras.length ? ` (${extras.join(', ')})` : ''}`;
}

// The changes between the order as it was and the edited drafts, one Hebrew
// line each, for the history and for the message to the customer.
export function diffOrder(original, drafts) {
  const changes = [];
  drafts.forEach(d => {
    if (!d.requestId) {
      if (!d.removed) changes.push(`נוסף פריט: ${itemLine(d)}`);
      return;
    }
    const o = original.find(x => x.requestId === d.requestId);
    if (!o) return;
    if (d.removed) {
      changes.push(`הוסר פריט: ${o.name}${o.size ? ` (מידה ${o.size})` : ''}`);
      return;
    }

    const parts = [];
    const size = d.size.trim();
    if (size !== o.size) parts.push(`מידה שונתה מ-${o.size || 'ללא'} ל-${size || 'ללא'}`);
    if (d.playerVersion !== o.playerVersion) parts.push(d.playerVersion ? 'שודרג לגרסת שחקן' : 'שונה לגרסה רגילה');
    const before = o.customName.trim();
    const after = d.customName.trim();
    if (before !== after) parts.push(!after ? 'ההדפסה הוסרה' : before ? `ההדפסה שונתה ל-${after}` : `נוספה הדפסה: ${after}`);
    if (d.longSleeve !== o.longSleeve) parts.push(d.longSleeve ? `שונה ל${LONG_SLEEVE_LABEL}` : 'שונה לשרוול קצר');
    if (d.shorts !== o.shorts) parts.push(d.shorts ? `נוסף ${SHORTS_LABEL}` : `ה${SHORTS_LABEL} הוסר`);
    if (d.patches !== o.patches) parts.push(d.patches ? `נוספו ${PATCHES_LABEL}` : `ה${PATCHES_LABEL} הוסרו`);
    if (String(d.price) !== String(o.price)) {
      parts.push(`המחיר עודכן${o.price !== '' && o.price !== null ? ` מ-₪${o.price}` : ''} ל-₪${priceOf(d)}`);
    }
    if (parts.length) changes.push(`${o.name}: ${parts.join(', ')}`);
  });
  return changes;
}

export function customerUpdateText({ fullName, changes, items, total }) {
  const firstName = (fullName || '').trim().split(/\s+/)[0];
  return [
    `היי${firstName ? ` ${firstName}` : ''}, כאן JerseyLab.`,
    'עדכנו את ההזמנה שלך:',
    ...changes.map(c => `• ${c}`),
    '',
    'ההזמנה עכשיו:',
    ...items.map(d => `• ${itemLine(d)}`),
    `סה"כ: ₪${total}`,
    '',
    'אם משהו לא מתאים, פשוט תענו להודעה הזו.',
  ].join('\n');
}

export function whatsappLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^0/, '972');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function parseEditLog(value) {
  if (!value) return [];
  try {
    const log = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(log) ? log.filter(entry => entry && Array.isArray(entry.changes)) : [];
  } catch {
    return [];
  }
}

// The shape the send-order-update email expects for each item.
export const emailItem = (draft) => ({
  name: draft.name,
  size: draft.size,
  player_version: !!draft.playerVersion,
  custom_name: draft.customName?.trim() || '',
  patches: !!draft.patches,
  long_sleeve: !!draft.longSleeve,
  shorts: !!draft.shorts,
  price: priceOf(draft),
});
