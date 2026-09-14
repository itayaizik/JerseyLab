// The size tables, shared by the size guide page and the size guide drawer on
// the product page, so the two can never show different numbers.

// FAN VERSION - columns: S, M, L, XL, 2XL, 3XL
export const FAN_ROWS = [
  { measure: 'אורך (ס"מ)', S: '69-71',   M: '71-73',   L: '73-75',  XL: '75-78',  '2XL': '78-81',  '3XL': '81-83' },
  { measure: 'רוחב (ס"מ)', S: '53-55',   M: '55-57',   L: '57-58',  XL: '58-60',  '2XL': '60-62',  '3XL': '62-64' },
  { measure: 'גובה (ס"מ)', S: '162-170', M: '170-176', L: '175-182', XL: '182-190', '2XL': '192-197', '3XL': '197-200' },
  { measure: 'משקל (ק"ג)', S: '50-62',   M: '62-70',   L: '70-83',  XL: '83-90',  '2XL': '90-97',  '3XL': '97-104' },
];

// PLAYER VERSION - columns: S, M, L, XL, 2XL, 3XL
export const PLAYER_ROWS = [
  { measure: 'אורך (ס"מ)', S: '67-69',   M: '69-71',   L: '71-73',  XL: '75-76',  '2XL': '76-78',  '3XL': '78-79' },
  { measure: 'רוחב (ס"מ)', S: '49-51',   M: '51-53',   L: '53-55',  XL: '55-57',  '2XL': '57-60',  '3XL': '60-63' },
  { measure: 'גובה (ס"מ)', S: '162-170', M: '170-176', L: '175-180', XL: '180-185', '2XL': '185-190', '3XL': '190-195' },
  { measure: 'משקל (ק"ג)', S: '50-62',   M: '62-75',   L: '75-80',  XL: '80-85',  '2XL': '85-90',  '3XL': '90-95' },
];

// WOMEN'S VERSION - columns: S, M, L, XL
export const WOMEN_ROWS = [
  { measure: 'אורך (ס"מ)', S: '61-63',   M: '63-66', L: '66-69',   XL: '69-71' },
  { measure: 'רוחב (ס"מ)', S: '40-41',   M: '41-44', L: '44-47',   XL: '47-50' },
  { measure: 'גובה (ס"מ)', S: '150-160', M: '160-165', L: '165-170', XL: '170-175' },
];

export const ADULT_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

// The size to recommend from height and weight. Each measure picks the first
// size whose range reaches it, the larger of the two wins, and then one size
// up, because customers want the shirt comfortable rather than tight:
// 173 cm / 60 kg -> L, 178 cm / 70 kg -> XL.
const upperBound = (range) => Number(String(range).split('-').pop());

function sizeIndexFor(value, row) {
  const i = ADULT_SIZES.findIndex(size => value <= upperBound(row[size]));
  return i === -1 ? ADULT_SIZES.length - 1 : i;
}

export function recommendSize(height, weight, tab = 'fan') {
  const rows = tab === 'player' ? PLAYER_ROWS : FAN_ROWS;
  const h = Number(height);
  const w = Number(weight);
  if (!(h >= 120 && h <= 230) || !(w >= 30 && w <= 200)) return null;
  const byHeight = sizeIndexFor(h, rows.find(r => r.measure.startsWith('גובה')));
  const byWeight = sizeIndexFor(w, rows.find(r => r.measure.startsWith('משקל')));
  return ADULT_SIZES[Math.min(Math.max(byHeight, byWeight) + 1, ADULT_SIZES.length - 1)];
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
  { key: 'size', label: 'מידה' },
  { key: 'height', label: 'גובה (ס"מ)' },
  { key: 'age', label: 'גיל' },
  { key: 'length', label: 'אורך (ס"מ)' },
  { key: 'width', label: 'רוחב (ס"מ)' },
  { key: 'waist', label: 'היקף מותן (ס"מ)' },
];

export const SIZE_TIPS = [
  'מודדים אורך מהכתף ועד קצה החולצה בצד האחורי',
  'רוחב נמדד מבית שחי לבית שחי (מתחת לבית השחי)',
  'גובה ומשקל מתארים טווח מומלץ לבחירת המידה',
  'בין שתי מידות? תמיד עדיף לקחת את הגדולה יותר',
  'מידות עשויות להשתנות בין יצרנים - פנו אלינו לאישור',
];

export const SIZE_TABS = [
  { key: 'fan', label: 'גרסת אוהד' },
  { key: 'player', label: 'גרסת שחקן' },
  { key: 'women', label: 'נשים' },
  { key: 'kids', label: 'ילדים' },
];
