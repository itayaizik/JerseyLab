// Hebrew -> English lookup for the clubs/national teams currently in the
// catalog (pulled from shirts_raw). New clubs added later that aren't in
// this table just fall back to their Hebrew name — update this list when
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
};

function translateTeamName(name) {
  if (!name) return '';
  const trimmed = name.trim();
  return TEAM_NAMES_EN[trimmed] || trimmed;
}

// The shirt's display name (Hebrew) always embeds the kit type as a plain
// word — "בית"/"חוץ" — anything else (special editions, anniversary kits,
// collabs) has neither, which is exactly the "Special" bucket.
function detectKitType(shirtName) {
  if (!shirtName) return '';
  if (shirtName.includes('בית')) return 'Home';
  if (shirtName.includes('חוץ')) return 'Away';
  return 'Special';
}

// Player-version and custom name+number aren't stored as their own columns
// — InterestModal folds them into the free-text `message` as
// "גרסת שחקן (+₪20)" and "הדפסת שם: {name} {number} (+₪15)". Parse them
// back out rather than duplicating that formatting logic in two places.
function parseCustomization(message) {
  if (!message) return { playerVersion: false, customText: '' };
  const playerVersion = message.includes('גרסת שחקן');
  const match = message.match(/הדפסת שם:\s*([^(|]+)/);
  const customText = match ? match[1].trim() : '';
  return { playerVersion, customText };
}

// Builds one line of supplier-facing order text, fully in English:
// "Real Madrid - Home - Player Version - Ronaldo 7 - Size L"
// Regular version / no custom name are simply omitted, not written out.
export function buildSupplierLine(request, shirt) {
  const teamHe = (shirt?.club || shirt?.national_team || '').trim();
  const team = teamHe ? translateTeamName(teamHe) : (request.shirt_name || '');
  const kit = detectKitType(shirt?.name || request.shirt_name || '');
  const { playerVersion, customText } = parseCustomization(request.message || '');

  const parts = [team];
  if (kit) parts.push(kit);
  if (playerVersion) parts.push('Player Version');
  if (customText) parts.push(customText);
  if (request.wanted_size) parts.push(`Size ${request.wanted_size}`);
  return parts.filter(Boolean).join(' - ');
}
