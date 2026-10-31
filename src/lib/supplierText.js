// Hebrew -> English lookup for the clubs/national teams currently in the
// catalog (pulled from shirts_raw). New clubs added later that aren't in
// this table just fall back to their Hebrew name - update this list when
// that happens rather than trying to auto-translate arbitrary text.
const TEAM_NAMES_EN = {
  "אלצ'ה": 'Elche',
  "לצ'ה": 'Lecce',
  "סאות'המפטון": 'Southampton',
  'אורוגוואי': 'Uruguay',
  'איטליה': 'Italy',
  'אייאקס': 'Ajax',
  'אינטר': 'Inter Milan',
  'אינטר מיאמי': 'Inter Miami',
  'אנגליה': 'England',
  'אסטון וילה': 'Aston Villa',
  'ארגנטינה': 'Argentina',
  'ארסנל': 'Arsenal',
  'ארצות הברית': 'United States',
  'אתלטיקו מדריד': 'Atletico Madrid',
  'באיירן מינכן': 'Bayern Munich',
  'בולטון': 'Bolton Wanderers',
  'בוקה גוניורס': 'Boca Juniors',
  'ביתר ירושלים': 'Beitar Jerusalem',
  'בלגיה': 'Belgium',
  'בנפיקה': 'Benfica',
  'ברזיל': 'Brazil',
  'ברצלונה': 'Barcelona',
  'גרמניה': 'Germany',
  'דורטמונד': 'Borussia Dortmund',
  'דרום קוריאה': 'South Korea',
  'הולנד': 'Netherlands',
  'הכוכב האדום בלגרד': 'Red Star Belgrade',
  'הפועל באר שבע': 'Hapoel Beer Sheva',
  'הפועל חיפה': 'Hapoel Haifa',
  'הפועל פתח תקווה': 'Hapoel Petah Tikva',
  'הפועל תל אביב': 'Hapoel Tel Aviv',
  'ווסטהאם': 'West Ham United',
  'ולנסיה': 'Valencia',
  'זלצבורג': 'Red Bull Salzburg',
  'טוטנהאם': 'Tottenham',
  'יובנטוס': 'Juventus',
  'יפן': 'Japan',
  'לאציו': 'Lazio',
  'ליברפול': 'Liverpool',
  'לידס יונייטד': 'Leeds United',
  'לסטר סיטי': 'Leicester City',
  'מונאקו': 'Monaco',
  'מילאן': 'AC Milan',
  'מכבי חיפה': 'Maccabi Haifa',
  'מכבי תל אביב': 'Maccabi Tel Aviv',
  'מנצסטר יונייטד': 'Manchester United',
  'מנצסטר סיטי': 'Manchester City',
  'מקסיקו': 'Mexico',
  'מרוקו': 'Morocco',
  'נאפולי': 'Napoli',
  'נורווגיה': 'Norway',
  'ניוקאסל': 'Newcastle',
  'סנט פאולי': 'St. Pauli',
  'סנטוס': 'Santos',
  'ספורטינג ליסבון': 'Sporting CP',
  'ספרד': 'Spain',
  'פולהאם': 'Fulham',
  'פורטו': 'Porto',
  'פורטוגל': 'Portugal',
  'פורטסמות': 'Portsmouth',
  'פי אס וי': 'PSV Eindhoven',
  'פיורנטינה': 'Fiorentina',
  'פלרמו': 'Palermo',
  'פריז סן זרמן': 'Paris Saint-Germain',
  'פרנצווארוש': 'Ferencvaros',
  'צלסי': 'Chelsea',
  'צרפת': 'France',
  'קולומביה': 'Colombia',
  'קיו פי אר': 'Queens Park Rangers',
  'קנדה': 'Canada',
  'קרואטיה': 'Croatia',
  'קריסטל פאלאס': 'Crystal Palace',
  'ראיו וייקאנו': 'Rayo Vallecano',
  'רומא': 'Roma',
  'ריאל מדריד': 'Real Madrid',
  'שחטאר דונייצק': 'Shakhtar Donetsk',
};

// Patches belong to a competition, and the supplier needs to know which one.
// A national team shirt outside a tournament has none to name, so it falls
// back to the plain word.
const LEAGUE_NAMES_EN = {
  'פרמייר ליג': 'Premier League',
  'צמפיונשיפ': 'Championship',
  'לה ליגה': 'La Liga',
  'סגונדה': 'Segunda',
  'סרייה א': 'Serie A',
  'בונדסליגה': 'Bundesliga',
  'בונדסליגה 2': '2. Bundesliga',
  'ליגה צרפתית': 'Ligue 1',
  'ליגה הולנדית': 'Eredivisie',
  'ליגה פורטוגלית': 'Primeira Liga',
  'ליגה ארגנטינאית': 'Liga Argentina',
  'ליגה ברזילאית': 'Brasileirao',
  'ליגת העל': 'Israeli Premier League',
  'ליגת האלופות': 'Champions League',
  'מונדיאל': 'World Cup',
  'יורו': 'Euro',
  'MLS': 'MLS',
};

function patchesLabel(shirt) {
  const league = String(shirt?.league || '').trim();
  const en = LEAGUE_NAMES_EN[league];
  return en ? `With ${en} Patches` : 'With Patches';
}

function translateTeamName(name) {
  if (!name) return '';
  const trimmed = name.trim();
  return TEAM_NAMES_EN[trimmed] || trimmed;
}

// The shirt's display name (Hebrew) always embeds the kit type as a plain
// word - "בית"/"חוץ"/"שלישית"/"רביעית" - anything else (special editions,
// anniversary kits, collabs) has none of those, which is the "Special" bucket.
function detectKitType(shirtName) {
  if (!shirtName) return '';
  if (shirtName.includes('בית')) return 'Home';
  if (shirtName.includes('חוץ')) return 'Away';
  if (shirtName.includes('שלישית')) return 'Third';
  if (shirtName.includes('רביעית')) return 'Fourth';
  return 'Special';
}

// Player-version and custom name+number aren't stored as their own columns
// - the cart drawer folds them into the free-text `message` as
// "גרסת שחקן (+₪20)" and "הדפסת שם: {name} {number} (+₪10)". Parse them
// back out rather than duplicating that formatting logic in two places.
function parseCustomization(message) {
  if (!message) return { playerVersion: false, customText: '', patches: false, longSleeve: false, shorts: false };
  const playerVersion = message.includes('גרסת שחקן');
  // Either shape of print: one the customer paid for, or a legionnaire's own,
  // which is in the shirt's price and reaches the order as a detail line.
  const match = message.match(/הדפסת שם:\s*([^(|]+)/) || message.match(/הדפסה כלולה:\s*([^(|]+)/);
  const customText = match ? match[1].trim() : '';
  // "פאצ'ים (+₪5)" from a shirt or from a mystery box; either
  // apostrophe, in case one was typed by hand.
  const patches = /פאצ['׳]ים/.test(message);
  const longSleeve = message.includes('שרוול ארוך');
  const shorts = message.includes('מכנס קצר');
  return { playerVersion, customText, patches, longSleeve, shorts };
}

// An English search phrase for finding a shirt's photo on Google:
// "Real Madrid 2026/27 Home Jersey", "Argentina 1986 Home Retro Jersey".
// The season comes from its own field, or from the year in the name for rows
// that never had one filled in.
export function buildSearchQuery(shirt) {
  const teamHe = (shirt?.club || shirt?.national_team || '').trim();
  const team = teamHe ? translateTeamName(teamHe) : '';
  // A name with no kit word is "Special" in the supplier text, but most of those
  // are home shirts whose name simply leaves it out, and "Special" would send a
  // search after a special edition. It is only kept when the name says so.
  const detected = detectKitType(shirt?.name || '');
  const kit = detected === 'Special' && !String(shirt?.name || '').includes('מיוחדת') ? '' : detected;
  const season = (shirt?.season || '').trim() || (String(shirt?.name || '').match(/\d{4}(?:\/\d{2,4})?/) || [''])[0];
  return [team, season, kit, shirt?.is_retro ? 'Retro' : '', 'Jersey'].filter(Boolean).join(' ');
}

// Builds one shirt's supplier-facing order text, fully in English:
// "Size L - Player Version - With La Liga Patches - Ronaldo 7"
//
// What the shirt IS - club, kit, season - is deliberately absent: the photo
// is pasted into the same message and says all of it better than a line of
// text can. This carries only what a photo cannot, and anything not asked for
// is left out rather than written as "no".
export function buildSupplierLine(request, shirt) {
  const { playerVersion, customText, patches, longSleeve, shorts } = parseCustomization(request.message || '');

  const parts = [];
  if (request.wanted_size) parts.push(`Size ${request.wanted_size}`);
  if (playerVersion) parts.push('Player Version');
  if (longSleeve) parts.push('Long Sleeve');
  if (shorts) parts.push('With Shorts');
  if (patches) parts.push(patchesLabel(shirt));
  if (customText) parts.push(`Print: ${customText}`);
  // An order with none of the above still needs to say something.
  return parts.length ? parts.join(' - ') : 'Standard, no extras';
}
