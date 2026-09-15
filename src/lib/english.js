// The catalogue in English.
//
// Shirts are stored in Hebrew: a name, a club, a league. The English site
// builds its shirt names from those fields rather than asking for a second
// copy of every name in the admin, so a shirt added tomorrow has an English
// name at once. Anything not in these lists is shown as stored.

// Relative, not '@/lib', so build scripts running in Node can import it too.
import { isEn } from './i18n.js';

// Geresh, apostrophes and extra spaces vary between the menus and the data
// ("צ׳לסי" in a menu, "צלסי" on the shirts), so both sides are compared clean.
const clean = (text) => String(text ?? '').replace(/[׳'`"״]/g, '').replace(/\s+/g, ' ').trim();

const TERMS = {
  // clubs
  'ברצלונה': 'Barcelona',
  'ריאל מדריד': 'Real Madrid',
  'מילאן': 'AC Milan',
  'צלסי': 'Chelsea',
  'אתלטיקו מדריד': 'Atlético Madrid',
  'פריז סן זרמן': 'Paris Saint-Germain',
  'פריז סן-זרמן': 'Paris Saint-Germain',
  'באיירן מינכן': 'Bayern Munich',
  'בייארן': 'Bayern Munich',
  'באיירן': 'Bayern Munich',
  'אינטר': 'Inter',
  'יובנטוס': 'Juventus',
  'ארסנל': 'Arsenal',
  'מנצסטר יונייטד': 'Manchester United',
  'דורטמונד': 'Borussia Dortmund',
  'מנצסטר סיטי': 'Manchester City',
  'הפועל תל אביב': 'Hapoel Tel Aviv',
  'ליברפול': 'Liverpool',
  'אינטר מיאמי': 'Inter Miami',
  'רומא': 'AS Roma',
  'ביתר ירושלים': 'Beitar Jerusalem',
  'טוטנהאם': 'Tottenham',
  'נאפולי': 'Napoli',
  'אייאקס': 'Ajax',
  'מכבי חיפה': 'Maccabi Haifa',
  'בוקה גוניורס': 'Boca Juniors',
  'הפועל באר שבע': 'Hapoel Beer Sheva',
  'מכבי תל אביב': 'Maccabi Tel Aviv',
  'מונאקו': 'Monaco',
  'ניוקאסל': 'Newcastle',
  'סנט פאולי': 'St. Pauli',
  'סנטוס': 'Santos',
  'פורטו': 'Porto',
  'לסטר סיטי': 'Leicester City',
  'ולנסיה': 'Valencia',
  'ראיו וייקאנו': 'Rayo Vallecano',
  'בנפיקה': 'Benfica',
  'אסטון וילה': 'Aston Villa',

  // national teams
  'פורטוגל': 'Portugal',
  'ברזיל': 'Brazil',
  'הולנד': 'Netherlands',
  'איטליה': 'Italy',
  'אנגליה': 'England',
  'גרמניה': 'Germany',
  'ספרד': 'Spain',
  'קרואטיה': 'Croatia',
  'צרפת': 'France',
  'ארגנטינה': 'Argentina',
  'יפן': 'Japan',
  'מקסיקו': 'Mexico',
  'בלגיה': 'Belgium',
  'מרוקו': 'Morocco',
  'קנדה': 'Canada',
  'קולומביה': 'Colombia',
  'אורוגוואי': 'Uruguay',
  'דרום קוריאה': 'South Korea',
  'ארצות הברית': 'USA',
  'נורווגיה': 'Norway',

  // leagues, competitions and kinds of shirt
  'פרמייר ליג': 'Premier League',
  'לה ליגה': 'La Liga',
  'סרייה א': 'Serie A',
  'נבחרות': 'National Teams',
  'ליגת העל': 'Israeli Premier League',
  'בונדסליגה': 'Bundesliga',
  'ליגת האלופות': 'Champions League',
  'ליגה צרפתית': 'Ligue 1',
  'מונדיאל': 'World Cup',
  'ליגה הולנדית': 'Eredivisie',
  'יורו': 'Euro',
  'ליגה פורטוגלית': 'Primeira Liga',
  'ליגה ארגנטינאית': 'Argentine League',
  'ליגה ברזילאית': 'Brasileirão',
  'ליגה גרמנית': 'German League',
  'רטרו': 'Retro',
  'עוד מהעולם': 'Rest of the World',
  'בית': 'Home',
  'חוץ': 'Away',
  'שלישית': 'Third',
  'רביעית': 'Fourth',
  'מיוחדת': 'Special Edition',
};

const TERM_MAP = new Map(Object.entries(TERMS).map(([he, en]) => [clean(he), en]));

// A club, national team, league or kit type in the site's language.
export function term(he) {
  if (!isEn || !he) return he;
  return TERM_MAP.get(clean(he)) ?? he;
}

export const hasEnglishTerm = (he) => TERM_MAP.has(clean(he));

const KITS = [
  ['שלישית', 'Third'],
  ['רביעית', 'Fourth'],
  ['מיוחדת', 'Special Edition'],
  ['בית', 'Home'],
  ['חוץ', 'Away'],
];

const hasWord = (text, word) => new RegExp(`(^|\\s)${word}(\\s|$)`).test(text);

// "חולצת ברצלונה בית 2026/27" -> "Barcelona Home Shirt 2026/27". A shirt whose
// club or team is not in the list keeps its Hebrew name rather than a
// half-translated one.
export function shirtNameEn(shirt) {
  if (!shirt) return '';
  const team = TERM_MAP.get(clean(shirt.club || shirt.national_team));
  if (!team) return '';
  const name = clean(shirt.name);
  const kit = KITS.find(([he]) => hasWord(name, he))?.[1];
  const kids = shirt.gender_category === 'kids' || hasWord(name, 'ילדים');
  return [team, kit, shirt.is_retro && 'Retro', kids ? 'Kids Shirt' : 'Shirt', shirt.season]
    .filter(Boolean).join(' ');
}

// The shirt's name in the site's language.
export function shirtName(shirt) {
  if (!shirt) return '';
  return (isEn && shirtNameEn(shirt)) || shirt.name;
}

// The sizes a shirt comes in, as the Hebrew descriptions list them.
const sizeList = (shirt) => {
  let sizes = shirt?.sizes;
  if (typeof sizes === 'string') { try { sizes = JSON.parse(sizes); } catch { sizes = []; } }
  return Array.isArray(sizes) ? sizes : [];
};

// The stored descriptions are generated in Hebrew from the same fields
// (scripts/generate-descriptions.mjs), so the English one is generated too.
export function shirtDescription(shirt) {
  if (!shirt) return '';
  if (!isEn) return shirt.description;
  const name = shirtName(shirt);
  if (name === shirt.name) return shirt.description;
  const league = shirt.league && term(shirt.league) !== shirt.league ? term(shirt.league) : '';
  const sizes = sizeList(shirt);
  return [
    `The ${name}${league && !shirt.national_team ? `, ${league}` : ''}.`,
    shirt.is_retro
      ? 'A retro design from a past season, made to order.'
      : 'Can be ordered with a name and number printed on the back.',
    sizes.length ? `Sizes: ${sizes.join(', ')}.` : '',
  ].filter(Boolean).join(' ');
}
