// Builds public/llms.txt: what this shop is, in the plain text an AI assistant
// reads before answering "where can I buy a retro Barcelona shirt in Israel".
//
// ChatGPT, Perplexity and Google's AI answers quote pages they can summarise.
// They can crawl the site already - every route is prerendered - but a crawler
// has to piece the shop together from 250 product pages. This is the same
// shop in one file: what is sold, how an order works, what it costs, and which
// pages to read for the rest. Written from the live catalogue, so the counts
// and the prices cannot drift from the site the way a hand-written file would.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, SITE_ORIGIN, fetchShirts } from './lib/build-data.mjs';
import { COLLECTIONS } from '../src/lib/collections.js';
import { BOX_TYPES, NAME_PRICE, PATCHES_PRICE } from '../src/lib/mysteryBox.js';
import { EXTRA_PRICES } from '../src/lib/cart.js';
import { BUSINESS } from '../src/lib/business.js';

const OUT = resolve(ROOT, 'public/llms.txt');

const shirts = await fetchShirts({ label: 'llms' });
const available = shirts.filter(s => s.status === 'available');

const price = (s) => {
  const p = Number(s.sale_price) || Number(s.price) || 0;
  if (s.is_retro) return Math.max(p, 80);
  if (s.is_new || s.condition === 'new') return Math.max(p, 70);
  return p;
};
const prices = available.map(price).filter(Boolean).sort((a, b) => a - b);

// The teams with the most shirts, which is what a question about this shop is
// most likely to be about.
const byTeam = new Map();
for (const s of available) {
  const team = s.club || s.national_team;
  if (team) byTeam.set(team, (byTeam.get(team) || 0) + 1);
}
const topTeams = [...byTeam.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

const seasons = available.map(s => String(s.season || '').match(/(19|20)\d{2}/)?.[0]).filter(Boolean).map(Number);
const oldest = seasons.length ? Math.min(...seasons) : null;

const lines = [
  '# JerseyLab',
  '',
  '> חנות אונליין ישראלית לחולצות כדורגל לאספנים ולאוהדים: חולצות מועדונים ונבחרות, עונות חדשות וחולצות רטרו, עם אפשרות להדפסת שם ומספר. An Israeli online shop for football shirts - club and national team kits, current seasons and retro, with optional name and number printing.',
  '',
  `אתר: ${SITE_ORIGIN}`,
  'שפות: עברית ואנגלית. שירות ומשלוחים: ישראל.',
  `יצירת קשר: וואטסאפ ${BUSINESS.phone} · אינסטגרם @${BUSINESS.instagram.replace('@', '')} · ${SITE_ORIGIN}/contact`,
  '',
  '## מה נמכר',
  '',
  `- ${available.length} דגמי חולצות במלאי הקטלוג, מ-${byTeam.size} קבוצות ונבחרות.`,
  oldest ? `- העונות נעות מ-${oldest} ועד העונה הנוכחית. חלק ניכר מהקטלוג הוא חולצות רטרו.` : null,
  prices.length ? `- טווח מחירים: ₪${prices[0]} עד ₪${prices[prices.length - 1]} לחולצה.` : null,
  '- מידות: S, M, L, XL, 2XL, 3XL, ובחלק מהדגמים גם 4XL. גרסת אוהד וגרסת שחקן.',
  `- תוספות בתשלום: הדפסת שם ומספר (₪${EXTRA_PRICES.name}), פאצ'ים (₪${EXTRA_PRICES.patches}), גרסת שחקן (₪${EXTRA_PRICES.player}), שרוול ארוך (₪${EXTRA_PRICES.longSleeve}), מכנס תואם (₪${EXTRA_PRICES.shorts}).`,
  `- מיסטרי בוקס: חולצה אקראית לפי סגנון ומידה שבוחרים. ${BOX_TYPES.map(b => `${b.label} ₪${b.price}`).join(', ')}. תוספת שם ומספר ₪${NAME_PRICE}, פאצ'ים ₪${PATCHES_PRICE}. אפשר להזמין כמה בוקסים לקבוצת חברים, כל אחד עם מידה ותוספות משלו.`,
  '- החולצות הן העתקים באיכות גבוהה, לא מוצרים רשמיים של המועדונים או של יצרני הספורט.',
  '',
  '## הקבוצות המבוקשות בקטלוג',
  '',
  ...topTeams.map(([team, count]) => `- ${team}: ${count} דגמים`),
  '',
  '## איך מזמינים',
  '',
  '- באתר לא מתבצע תשלום. שליחת הזמנה היא בקשה, ואנחנו חוזרים ללקוח בוואטסאפ או באינסטגרם לאישור הפרטים.',
  '- התשלום מסוכם ישירות מול החנות אחרי האישור.',
  `- משלוח: ${BUSINESS.shipping.price}, חינם מעל ${BUSINESS.shipping.freeAbove}. זמן אספקה ${BUSINESS.shipping.specialOrderWeeks} מרגע האישור. איסוף עצמי ב${BUSINESS.shipping.pickupLocation} בתיאום מראש.`,
  '- זכות ביטול: 14 יום מקבלת המוצר, לפי חוק הגנת הצרכן. חולצה עם הדפסה אישית מיוצרת לפי הזמנה ואינה ניתנת לביטול, למעט פגם.',
  '',
  '## עמודים מרכזיים',
  '',
  `- [כל החולצות](${SITE_ORIGIN}/catalog): הקטלוג המלא, עם סינון לפי קבוצה, ליגה, עונה ומידה.`,
  `- [מיסטרי בוקס](${SITE_ORIGIN}/mystery-box): איך זה עובד, המחירים ומה אפשר לפסול מראש.`,
  `- [מדריך מידות](${SITE_ORIGIN}/size-guide): טבלאות מידות לגרסת אוהד, גרסת שחקן, נשים וילדים, ומחשבון שממליץ על מידה לפי גובה, משקל, מבנה גוף וגזרה מועדפת.`,
  `- [בקשת חולצה](${SITE_ORIGIN}/request-shirt): חולצה שאינה בקטלוג - שולחים תיאור או תמונה ואנחנו בודקים אם אפשר להשיג.`,
  `- [שאלות ותשובות](${SITE_ORIGIN}/faq)`,
  `- [משלוחים, אספקה וביטול](${SITE_ORIGIN}/legal/shipping)`,
  `- [צור קשר](${SITE_ORIGIN}/contact)`,
  '',
  '## אוספים',
  '',
  ...COLLECTIONS.map(c => `- [${c.name}](${SITE_ORIGIN}/collections/${c.slug}): ${c.description}`),
  '',
  `עודכן: ${new Date().toISOString().slice(0, 10)}`,
  '',
].filter(line => line !== null);

writeFileSync(OUT, lines.join('\n'), 'utf8');

console.log(`[llms] ${available.length} shirts, ${byTeam.size} teams, ${COLLECTIONS.length} collections -> public/llms.txt`);
