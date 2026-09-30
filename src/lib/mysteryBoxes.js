// One mystery box as the customer builds it, and what it costs. Shared by the
// builder on the mystery box page and the page a friend opens to fill in
// their own box, so both price and describe a box the same way.

import { EXTRA_PRICES, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { BOX_TYPES, SIZES, NAME_PRICE, PATCHES_PRICE, EXCLUDE_COLORS, isKidsType } from '@/lib/mysteryBox';
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
  excludeClubs: '',
  excludeColors: [],
});

export const typeOf = (box) => BOX_TYPES.find(b => b.id === box.type) || BOX_TYPES[0];
// A kids box is sized by the child's height, an adult one by S/M/L.
export const sizesFor = (box) => (isKidsType(box.type) ? KIDS_SIZES : SIZES);
// A kids box is the catalogue's kids kit: one price, ₪100, with matching
// shorts and a name and number on the back already in it, and no long sleeve -
// the kit is not made in one. So for a kids box these three are not choices,
// and the extras a grown-up ticks are shown as already included instead.
export const kidsBox = (box) => isKidsType(box.type);

// Same rule as a catalogue shirt: retro comes without shorts. Kids shorts are
// in the price rather than an extra, so there is nothing to tick.
export const shortsAllowed = (box) => box.type !== 'retro' && !kidsBox(box);
export const longSleeveAllowed = (box) => !kidsBox(box);
export const wantsShorts = (box) => (kidsBox(box) ? true : box.shorts && shortsAllowed(box));
export const wantsName = (box) => kidsBox(box) || box.addName;
export const wantsLongSleeve = (box) => box.longSleeve && longSleeveAllowed(box);

// `discount` is what the order's quantity earns off every box in it
// (lib/mysteryTiers). Extras are never discounted: the ladder is a reason to
// order more shirts, not cheaper printing.
export const boxPrice = (box, discount = 0) => Math.max(0, typeOf(box).price - Math.max(0, discount))
  + (!kidsBox(box) && box.addName ? NAME_PRICE : 0)
  + (box.patches ? PATCHES_PRICE : 0)
  + (wantsLongSleeve(box) ? EXTRA_PRICES.longSleeve : 0)
  + (!kidsBox(box) && wantsShorts(box) ? EXTRA_PRICES.shorts : 0);

export const LONG_SLEEVE_TEXT = t(LONG_SLEEVE_LABEL, 'Long sleeve');
export const SHORTS_TEXT = t(SHORTS_LABEL, 'Shorts');

// "רגיל · L · שם ומספר · מכנס קצר"
export function boxSummary(box) {
  const type = typeOf(box);
  return [
    t(type.label, type.labelEn),
    box.size || t('בלי מידה', 'No size yet'),
    wantsName(box) && t('שם ומספר', 'Name and number'),
    box.patches && t("פאצ'ים", 'Patches'),
    wantsLongSleeve(box) && LONG_SLEEVE_TEXT,
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
    excludeClubs: text(raw?.excludeClubs, 200),
    excludeColors: Array.isArray(raw?.excludeColors)
      ? raw.excludeColors.filter(c => EXCLUDE_COLORS.some(x => x.label === c)).slice(0, EXCLUDE_COLORS.length)
      : [],
    ...(raw?.remoteId ? { remoteId: String(raw.remoteId) } : {}),
  };
}
