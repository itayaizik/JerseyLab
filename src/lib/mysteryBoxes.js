// One mystery box as the customer builds it, and what it costs. Shared by the
// builder on the mystery box page and the page a friend opens to fill in
// their own box, so both price and describe a box the same way.

import { EXTRA_PRICES, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { BOX_TYPES, SIZES, NAME_PRICE, PATCHES_PRICE, isKidsType } from '@/lib/mysteryBox';
import { KIDS_SIZES } from '@/lib/kidsKit';
import { t } from '@/lib/i18n';

let nextId = 1;
export const newBoxId = () => nextId++;

export const newBox = (from) => ({
  id: newBoxId(),
  forWhom: '',
  type: from?.type || 'regular',
  size: '',
  addName: false,
  patches: false,
  longSleeve: false,
  shorts: false,
  note: '',
});

export const typeOf = (box) => BOX_TYPES.find(b => b.id === box.type) || BOX_TYPES[0];
// A kids box is sized by the child's height, an adult one by S/M/L.
export const sizesFor = (box) => (isKidsType(box.type) ? KIDS_SIZES : SIZES);
// Same rule as a catalogue shirt: retro comes without shorts.
export const shortsAllowed = (box) => box.type !== 'retro';
export const wantsShorts = (box) => box.shorts && shortsAllowed(box);

// `discount` is what the order's quantity earns off every box in it
// (lib/mysteryTiers). Extras are never discounted: the ladder is a reason to
// order more shirts, not cheaper printing.
export const boxPrice = (box, discount = 0) => Math.max(0, typeOf(box).price - Math.max(0, discount))
  + (box.addName ? NAME_PRICE : 0)
  + (box.patches ? PATCHES_PRICE : 0)
  + (box.longSleeve ? EXTRA_PRICES.longSleeve : 0)
  + (wantsShorts(box) ? EXTRA_PRICES.shorts : 0);

export const LONG_SLEEVE_TEXT = t(LONG_SLEEVE_LABEL, 'Long sleeve');
export const SHORTS_TEXT = t(SHORTS_LABEL, 'Shorts');

// "רגיל · L · שם ומספר · מכנס קצר"
export function boxSummary(box) {
  const type = typeOf(box);
  return [
    t(type.label, type.labelEn),
    box.size || t('בלי מידה', 'No size yet'),
    box.addName && t('שם ומספר', 'Name and number'),
    box.patches && t("פאצ'ים", 'Patches'),
    box.longSleeve && LONG_SLEEVE_TEXT,
    wantsShorts(box) && SHORTS_TEXT,
  ].filter(Boolean).join(' · ');
}

// A box nobody has started on: no name, no size.
export const isBlank = (box) => !box.forWhom.trim() && !box.size;

// What the whole order costs, and what the ladder took off it.
export const boxesTotal = (boxes, discount = 0) => boxes.reduce((sum, b) => sum + boxPrice(b, discount), 0);
export const boxesSaving = (boxes, discount = 0) => boxesTotal(boxes, 0) - boxesTotal(boxes, discount);

// A box read back from storage or from the server, which is not trusted to
// have the right shape.
export function cleanBox(raw) {
  const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
  return {
    id: newBoxId(),
    forWhom: text(raw?.forWhom, 40),
    type: BOX_TYPES.some(b => b.id === raw?.type) ? raw.type : BOX_TYPES[0].id,
    size: [...SIZES, ...KIDS_SIZES].includes(raw?.size) ? raw.size : '',
    addName: !!raw?.addName,
    patches: !!raw?.patches,
    longSleeve: !!raw?.longSleeve,
    shorts: !!raw?.shorts,
    note: text(raw?.note, 200),
    ...(raw?.remoteId ? { remoteId: String(raw.remoteId) } : {}),
  };
}
