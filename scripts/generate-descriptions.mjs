// Writes a SQL file that fills in the shirt descriptions.
//
// The catalogue's descriptions run to a median of 34 characters and 19 shirts
// have none at all, which is far too thin to rank a product page. This does not
// invent anything: every sentence is assembled from fields already on the row -
// club, season, kit type, league, retro flag, player, stock and sizes. Nothing
// is said about fabric, fit, or provenance, because those are not in the data
// and a guess there is a returned parcel and a disappointed customer.
//
// The shop owner's own sentence is kept as the opening line where one exists;
// the generated context is added after it.
//
// Run:  node scripts/generate-descriptions.mjs
// Then run the printed SQL file in the Supabase SQL editor.

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, fetchShirts } from './lib/build-data.mjs';
import { normalizeLeague } from '../src/lib/collections.js';

const OUT_DIR = resolve(ROOT, 'scripts/out');
const OUT_SQL = resolve(OUT_DIR, 'descriptions.sql');

// Deterministic pick so a rerun produces the same text for the same shirt -
// otherwise every build would rewrite all 178 rows for no reason.
function pick(options, seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

function kitType(shirt) {
  const name = String(shirt.name || '').replace(String(shirt.club || ''), '');
  if (name.includes('שלישית')) return 'שלישית';
  if (name.includes('חוץ')) return 'חוץ';
  if (name.includes('בית')) return 'בית';
  return null;
}

function sizeList(shirt) {
  const sizes = shirt.sizes && typeof shirt.sizes === 'object' ? Object.keys(shirt.sizes) : [];
  const order = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'];
  const sorted = sizes
    .map(s => (s === 'XXL' ? '2XL' : s === 'XXXL' ? '3XL' : s))
    .filter((s, i, a) => a.indexOf(s) === i)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return sorted;
}

function localStockSizes(shirt) {
  const map = shirt.local_stock_sizes;
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map).filter(([, qty]) => Number(qty) > 0).map(([s]) => (s === 'XXL' ? '2XL' : s));
}

// --- sentence builders. Each returns null when the data does not support it.

function openingSentence(shirt) {
  const team = shirt.club || shirt.national_team;
  const kit = kitType(shirt);
  const season = shirt.season;
  if (!team) return null;

  const isNational = !!shirt.national_team && !shirt.club;
  const subject = isNational ? `נבחרת ${team}` : team;
  const kitWord = kit ? `חולצת ה${kit}` : 'החולצה';
  const when = season ? (isNational ? ` ${season}` : ` לעונת ${season}`) : '';

  return pick([
    `${kitWord} של ${subject}${when}.`,
    `${kitWord} הרשמית של ${subject}${when}.`,
  ], shirt.id + 'open');
}

function eraSentence(shirt, lead) {
  if (!shirt.is_retro) return null;
  if (lead.includes('רטרו')) {
    return 'מהדורה שיצאה מהייצור. העיצוב, הספונסר והגזרה של אותה תקופה, לא שחזור מודרני.';
  }
  const season = shirt.season;
  const team = shirt.club || shirt.national_team || '';
  return pick([
    `דגם רטרו${season ? ` מעונת ${season}` : ''}. מהדורה שכבר לא מיוצרת, מהסוג שאספנים מחפשים ולא מוצאים בחנויות.`,
    `זו חולצת רטרו${season ? ` מעונת ${season}` : ''}: העיצוב, הספונסר והגזרה של אותה תקופה, לא שחזור מודרני.`,
    `${team ? `${team} ` : ''}כפי שנראתה${season ? ` בעונת ${season}` : ' באותה תקופה'}. דגם רטרו שיצא מהייצור.`,
  ], shirt.id + 'era');
}

function leagueSentence(shirt, lead) {
  const league = normalizeLeague(shirt.league);
  if (!league) return null;
  // Do not repeat a league the owner's own sentence already named.
  if (lead.includes(league)) return null;
  if (league === 'ליגת האלופות') {
    return 'גרסת ליגת האלופות, עם הכיתובים והפאצ׳ים של המפעל האירופי.';
  }
  if (league === 'מונדיאל' || league === 'יורו') {
    return `דגם ${league}, החולצה שהנבחרת לבשה בטורניר.`;
  }
  if (league === 'נבחרות') return null;
  return `הקבוצה משחקת ב${league}.`;
}

function raritySentence(shirt) {
  if (shirt.is_rare) return 'פריט נדיר בכמות מוגבלת מאוד, ולא תמיד אפשר להשיג אותו שוב.';
  if (shirt.limited_stock) return 'מלאי מוגבל.';
  if (shirt.best_seller) return 'אחת החולצות המבוקשות אצלנו.';
  return null;
}

function conditionSentence(shirt) {
  const map = {
    like_new: 'מצב כמו חדש.',
    used: 'חולצה משומשת במצב טוב, נבדקה לפני שעלתה לאתר.',
  };
  return map[shirt.condition] || null;
}

function playerSentence(shirt) {
  const player = String(shirt.player_name || '').trim();
  if (!player) return null;
  return `עם השם והמספר של ${player} מאחורה.`;
}

function stockSentence(shirt) {
  const local = localStockSizes(shirt);
  if (local.length) {
    return `יש מלאי בארץ במידות ${local.join(', ')}, עם משלוח תוך כשבוע או איסוף מקריית אונו.`;
  }
  return 'ההזמנה מיוחדת ומגיעה תוך כשלושה שבועות.';
}

function sizesSentence(shirt) {
  const sizes = sizeList(shirt);
  if (!sizes.length) return null;
  return `זמינה במידות ${sizes.join(', ')}.`;
}

function personalisationSentence(shirt) {
  if (shirt.player_name) return null;
  return pick([
    'אפשר להוסיף הדפסת שם ומספר לבחירתך.',
    'ניתן להזמין עם הדפסת שם ומספר על הגב.',
  ], shirt.id + 'print');
}

// The opening words of every sentence this script can produce. An earlier
// run's output is already stored in the database, so without this the context
// sentences would be appended to themselves on every re-run and the
// descriptions would grow without bound. Cutting the stored text at the first
// generated sentence recovers the owner's original line, whatever state the
// row is currently in.
const GENERATED_MARKERS = [
  'זמינה במידות',
  'ההזמנה מיוחדת ומגיעה',
  'יש מלאי בארץ במידות',
  'אפשר להוסיף הדפסת',
  'ניתן להזמין עם הדפסת',
  'הקבוצה משחקת ב',
  'מהדורה שיצאה מהייצור',
  'דגם רטרו',
  'זו חולצת רטרו',
  'כפי שנראתה',
  'גרסת ליגת האלופות',
  'דגם מונדיאל',
  'דגם יורו',
  'עם השם והמספר של',
  'פריט נדיר',
  'מלאי מוגבל.',
  'אחת החולצות המבוקשות',
  'מצב כמו חדש.',
  'חולצה משומשת במצב טוב',
];

function stripGenerated(text) {
  let cut = text.length;
  for (const marker of GENERATED_MARKERS) {
    const at = text.indexOf(marker);
    if (at !== -1 && at < cut) cut = at;
  }
  return text.slice(0, cut).replace(/[\s.,–-]+$/, '').trim();
}

function buildDescription(shirt) {
  const stored = String(shirt.description || '').trim().replace(/\s+/g, ' ');

  // The owner's line leads when there is one; the opening is only generated
  // to replace an empty field. Anything this script wrote previously is cut
  // away first, so re-running rebuilds rather than accumulates.
  const existing = stripGenerated(stored);
  const lead = existing || openingSentence(shirt);
  if (!lead) return null;

  const leadText = lead.endsWith('.') ? lead : `${lead}.`;
  const sentences = [
    leadText,
    eraSentence(shirt, leadText),
    leagueSentence(shirt, leadText),
    playerSentence(shirt),
    raritySentence(shirt),
    conditionSentence(shirt),
    sizesSentence(shirt),
    stockSentence(shirt),
    personalisationSentence(shirt),
  ].filter(Boolean);

  // Four to five sentences is enough substance for a product page without
  // padding it out with filler.
  return sentences
    .slice(0, 7)
    .join(' ')
    // No dashes anywhere in the copy, including any that came in with the
    // owner's own sentence.
    .replace(/s*[-–]s*/g, ', ')
    .replace(/s*,s*,/g, ',')
    .replace(/s+/g, ' ')
    .trim();
}

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;

const shirts = await fetchShirts({ label: 'descriptions' });
if (!shirts.length) {
  console.error('[descriptions] no catalogue data - nothing to write.');
  process.exit(1);
}

const rows = [];
for (const shirt of shirts) {
  const description = buildDescription(shirt);
  if (!description) continue;
  const existing = String(shirt.description || '').trim();
  if (description === existing) continue;
  rows.push({ shirt, description, wasEmpty: !existing });
}

const lengths = rows.map(r => r.description.length).sort((a, b) => a - b);
mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(OUT_SQL, `-- Generated by scripts/generate-descriptions.mjs
-- Fills in the shirt descriptions from data already on each row. Safe to
-- re-run: it only sets the description column, and regenerating produces the
-- same text for the same shirt.
--
-- ${rows.length} rows, ${rows.filter(r => r.wasEmpty).length} of which had no description at all.
-- Review a few below before running.

begin;

${rows.map(r => `update shirts_raw set description = ${sqlString(r.description)} where id = ${sqlString(r.shirt.id)};`).join('\n')}

commit;
`, 'utf8');

console.log(`[descriptions] ${rows.length} rows -> scripts/out/descriptions.sql`);
console.log(`[descriptions] length: min ${lengths[0]}, median ${lengths[Math.floor(lengths.length / 2)]}, max ${lengths[lengths.length - 1]}`);
console.log('\n--- samples ---');
for (const r of [rows[0], rows[Math.floor(rows.length / 3)], rows.find(x => x.shirt.is_retro), rows.find(x => x.wasEmpty)].filter(Boolean)) {
  console.log(`\n[${r.shirt.name}]\n${r.description}`);
}
