// The size tables, shared by the size guide page and the size guide drawer on
// the product page, so the two can never show different numbers.

import { t } from '@/lib/i18n';

// FAN VERSION - columns: S, M, L, XL, 2XL, 3XL
export const FAN_ROWS = [
  { key: 'length', measure: t('אורך (ס"מ)', 'Length (cm)'), S: '69-71',   M: '71-73',   L: '73-75',  XL: '75-78',  '2XL': '78-81',  '3XL': '81-83' },
  { key: 'width', measure: t('רוחב (ס"מ)', 'Width (cm)'), S: '53-55',   M: '55-57',   L: '57-58',  XL: '58-60',  '2XL': '60-62',  '3XL': '62-64' },
  { key: 'height', measure: t('גובה (ס"מ)', 'Height (cm)'), S: '162-170', M: '170-176', L: '175-182', XL: '182-190', '2XL': '192-197', '3XL': '197-200' },
  { key: 'weight', measure: t('משקל (ק"ג)', 'Weight (kg)'), S: '50-62',   M: '62-70',   L: '70-83',  XL: '83-90',  '2XL': '90-97',  '3XL': '97-104' },
];

// PLAYER VERSION - columns: S, M, L, XL, 2XL, 3XL
export const PLAYER_ROWS = [
  { key: 'length', measure: t('אורך (ס"מ)', 'Length (cm)'), S: '67-69',   M: '69-71',   L: '71-73',  XL: '75-76',  '2XL': '76-78',  '3XL': '78-79' },
  { key: 'width', measure: t('רוחב (ס"מ)', 'Width (cm)'), S: '49-51',   M: '51-53',   L: '53-55',  XL: '55-57',  '2XL': '57-60',  '3XL': '60-63' },
  { key: 'height', measure: t('גובה (ס"מ)', 'Height (cm)'), S: '162-170', M: '170-176', L: '175-180', XL: '180-185', '2XL': '185-190', '3XL': '190-195' },
  { key: 'weight', measure: t('משקל (ק"ג)', 'Weight (kg)'), S: '50-62',   M: '62-75',   L: '75-80',  XL: '80-85',  '2XL': '85-90',  '3XL': '90-95' },
];

// WOMEN'S VERSION - columns: S, M, L, XL
export const WOMEN_ROWS = [
  { key: 'length', measure: t('אורך (ס"מ)', 'Length (cm)'), S: '61-63',   M: '63-66', L: '66-69',   XL: '69-71' },
  { key: 'width', measure: t('רוחב (ס"מ)', 'Width (cm)'), S: '40-41',   M: '41-44', L: '44-47',   XL: '47-50' },
  { key: 'height', measure: t('גובה (ס"מ)', 'Height (cm)'), S: '150-160', M: '160-165', L: '165-170', XL: '170-175' },
];

export const ADULT_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

// The size to recommend from height, weight, build and how the shirt should
// sit. Each measure picks the first size whose range reaches it. A slim build
// goes by height alone, since the weight row would only pull the size down;
// an average build takes the larger of the two. A fuller or broader build adds
// a size, and so does the fit: nothing for snug, one for regular, two for
// loose - but the two together add at most two sizes, since a muscular
// customer who likes it loose still rarely needs 2XL.
// The shirts also run long, so a short customer goes at most two sizes past
// their height, or one past what their weight alone asks for, whichever is
// bigger.
// 173 cm / 61 kg, average, regular -> L. 171 cm / 65 kg, broad, loose -> XL.
const upperBound = (range) => Number(String(range).split('-').pop());

function sizeIndexFor(value, row) {
  const i = ADULT_SIZES.findIndex(size => value <= upperBound(row[size]));
  return i === -1 ? ADULT_SIZES.length - 1 : i;
}

export const BODY_TYPES = [
  { id: 'slim', label: t('רזה', 'Slim') },
  { id: 'average', label: t('ממוצע', 'Average') },
  { id: 'full', label: t('מלא / עם בטן', 'Fuller / some belly') },
  { id: 'broad', label: t('רחב / שרירי', 'Broad / muscular') },
];

export const FIT_TYPES = [
  { id: 'snug', label: t('צמוד לגוף', 'Close to the body'), step: 0 },
  { id: 'regular', label: t('רגיל', 'Regular'), step: 1 },
  { id: 'loose', label: t('רפוי / אוברסייז', 'Loose / oversized'), step: 2 },
];

export function recommendSize(height, weight, tab = 'fan', body = 'average', fit = 'regular') {
  const rows = tab === 'player' ? PLAYER_ROWS : FAN_ROWS;
  const h = Number(height);
  const w = Number(weight);
  if (!(h >= 120 && h <= 230) || !(w >= 30 && w <= 200)) return null;
  const byHeight = sizeIndexFor(h, rows.find(r => r.key === 'height'));
  const byWeight = sizeIndexFor(w, rows.find(r => r.key === 'weight'));
  const base = body === 'slim' ? byHeight : Math.max(byHeight, byWeight);
  const bodyStep = body === 'full' || body === 'broad' ? 1 : 0;
  const fitStep = FIT_TYPES.find(f => f.id === fit)?.step ?? 1;
  const index = Math.min(base + Math.min(bodyStep + fitStep, 2), Math.max(byHeight + 2, byWeight + 1));
  return ADULT_SIZES[Math.min(Math.max(index, 0), ADULT_SIZES.length - 1)];
}
export const WOMEN_SIZES = ['S', 'M', 'L', 'XL'];

// KIDS VERSION - rows per size, columns: HEIGHT, AGE, LENGTH, WIDTH, WAIST
export const KIDS_ROWS = [
  { size: '14', height: '85-95',   age: '2-3',   length: '41', width: '33', waist: '19-36' },
  { size: '16', height: '95-105',  age: '3-4',   length: '44', width: '35', waist: '20-37' },
  { size: '18', height: '105-115', age: '4-5',   length: '47', width: '37', waist: '21-39' },
  { size: '20', height: '115-125', age: '5-6',   length: '50', width: '39', waist: '22-41' },
  { size: '22', height: '125-135', age: '6-7',   length: '53', width: '41', waist: '23-42' },
  { size: '24', height: '135-145', age: '8-9',   length: '56', width: '43', waist: '24-44' },
  { size: '26', height: '145-155', age: '10-11', length: '59', width: '45', waist: '25-47' },
  { size: '28', height: '155-165', age: '11-12', length: '62', width: '47', waist: '26-50' },
];

export const KIDS_COLUMNS = [
  { key: 'size', label: t('מידה', 'Size') },
  { key: 'height', label: t('גובה (ס"מ)', 'Height (cm)') },
  { key: 'age', label: t('גיל', 'Age') },
  { key: 'length', label: t('אורך (ס"מ)', 'Length (cm)') },
  { key: 'width', label: t('רוחב (ס"מ)', 'Width (cm)') },
  { key: 'waist', label: t('היקף מותן (ס"מ)', 'Waist (cm)') },
];

export const SIZE_TIPS = [
  t('מודדים אורך מהכתף ועד קצה החולצה בצד האחורי', 'Length is measured from the shoulder to the hem, on the back'),
  t('רוחב נמדד מבית שחי לבית שחי (מתחת לבית השחי)', 'Width is measured from armpit to armpit (just below the armpits)'),
  t('גובה ומשקל מתארים טווח מומלץ לבחירת המידה', 'Height and weight give a recommended range for choosing a size'),
  t('בין שתי מידות? תמיד עדיף לקחת את הגדולה יותר', 'Between two sizes? The larger one is always the safer choice'),
  t('מידות עשויות להשתנות בין יצרנים - פנו אלינו לאישור', 'Sizes can vary between makers - ask us to confirm'),
];

export const SIZE_TABS = [
  { key: 'fan', label: t('גרסת אוהד', 'Fan version') },
  { key: 'player', label: t('גרסת שחקן', 'Player version') },
  { key: 'women', label: t('נשים', 'Women') },
  { key: 'kids', label: t('ילדים', 'Kids') },
];
