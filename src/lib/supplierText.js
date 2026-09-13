// Hebrew -> English lookup for the clubs/national teams currently in the
// catalog (pulled from shirts_raw). New clubs added later that aren't in
// this table just fall back to their Hebrew name - update this list when
// that happens rather than trying to auto-translate arbitrary text.
const TEAM_NAMES_EN = {
  'אורוגוואי': 'Uruguay',
  'איטליה': 'Italy',
  'אייאקס': 'Ajax',
  'אינטר מיאמי': 'Inter Miami',
  'אינטר': 'Inter Milan',
  'אסטון וילה': 'Aston Villa',
  'ארסנל': 'Arsenal',
  'אתלטיקו מדריד': 'Atletico Madrid',
  'באיירן מינכן': 'Bayern Munich',
  'בוקה גוניורס': 'Boca Juniors',
  'ביתר ירושלים': 'Beitar Jerusalem',
  'בנפיקה': 'Benfica',
  'ברצלונה': 'Barcelona',
  'גרמניה': 'Germany',
  'דורטמונד': 'Borussia Dortmund',
  'הפועל באר שבע': 'Hapoel Beer Sheva',
  'הפועל תל אביב': 'Hapoel Tel Aviv',
  'ולנסיה': 'Valencia',
  'טוטנהאם': 'Tottenham',
  'יובנטוס': 'Juventus',
  'יפן': 'Japan',
  'ליברפול': 'Liverpool',
  'לסטר סיטי': 'Leicester City',
  'מונאקו': 'Monaco',
  'מילאן': 'AC Milan',
  'מכבי חיפה': 'Maccabi Haifa',
  'מכבי תל אביב': 'Maccabi Tel Aviv',
  'מנצסטר יונייטד': 'Manchester United',
  'מנצסטר סיטי': 'Manchester City',
  'נאפולי': 'Napoli',
  'ניוקאסל': 'Newcastle',
  'נורווגיה': 'Norway',
  'סנט פאולי': 'St. Pauli',
  'סנטוס': 'Santos',
  'פורטו': 'Porto',
  'פורטוגל': 'Portugal',
  'פריז סן זרמן': 'Paris Saint-Germain',
  'צלסי': 'Chelsea',
  'ראיו וייקאנו': 'Rayo Vallecano',
  'רומא': 'Roma',
  'ריאל מדריד': 'Real Madrid',
  'אנגליה': 'England',
  'ארגנטינה': 'Argentina',
  'ארצות הברית': 'United States',
  'בלגיה': 'Belgium',
  'ברזיל': 'Brazil',
  'דרום קוריאה': 'South Korea',
  'הולנד': 'Netherlands',
  'מקסיקו': 'Mexico',
  'ספרד': 'Spain',
  'צרפת': 'France',
  'קולומביה': 'Colombia',
  'קרואטיה': 'Croatia',
  'מרוקו': 'Morocco',
  'קנדה': 'Canada',
};

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
// "גרסת שחקן (+₪20)" and "הדפסת שם: {name} {number} (+₪15)". Parse them
// back out rather than duplicating that formatting logic in two places.
function parseCustomization(message) {
  if (!message) return { playerVersion: false, customText: '', patches: false };
  const playerVersion = message.includes('גרסת שחקן');
  const match = message.match(/הדפסת שם:\s*([^(|]+)/);
  const customText = match ? match[1].trim() : '';
  // "פאצ'ים (+₪5)" from a shirt, "כל הפאצ'ים (+₪5)" from a mystery box; either
  // apostrophe, in case one was typed by hand.
  const patches = /פאצ['׳]ים/.test(message);
  return { playerVersion, customText, patches };
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

// Builds one line of supplier-facing order text, fully in English:
// "Real Madrid - Home - 2025/26 - Player Version - Ronaldo 7 - Size L"
// Regular version / no custom name are simply omitted, not written out.
export function buildSupplierLine(request, shirt) {
  const teamHe = (shirt?.club || shirt?.national_team || '').trim();
  const team = teamHe ? translateTeamName(teamHe) : (request.shirt_name || '');
  const kit = detectKitType(shirt?.name || request.shirt_name || '');
  const { playerVersion, customText, patches } = parseCustomization(request.message || '');

  const parts = [team];
  if (kit) parts.push(kit);
  if (shirt?.season) parts.push(shirt.season);
  if (playerVersion) parts.push('Player Version');
  if (customText) parts.push(customText);
  if (patches) parts.push('With Patches');
  if (request.wanted_size) parts.push(`Size ${request.wanted_size}`);
  return parts.filter(Boolean).join(' - ');
}
