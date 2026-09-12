// Catalogue search.
//
// The previous search was a case-insensitive `includes` over a handful of
// fields. Run against the 49 searches customers had actually made, 22 came
// back empty - most of them for shirts the shop does stock:
//
//   messi, ronaldo, רונלדו, רולנדו  -> 0   (no shirt has a player name at all)
//   ברסה                           -> 0   (while ברצלונה returns 12)
//   retro                          -> 0   (while 56 shirts are retro)
//   בית״ר ירושלים                   -> 0   (the gershayim; the data says ביתר)
//
// Four different causes, handled here in order:
//
//   1. Spelling noise. Geresh, gershayim, quotes, niqqud, final letters and
//      Latin accents are folded away, so צ'לסי finds צלסי and בית״ר finds ביתר.
//   2. Other names for the same thing. Nicknames, English names and category
//      words map to what the catalogue calls it: ברסה, barca -> ברצלונה.
//   3. Players. Nothing in the data names a player, so a player is resolved to
//      the teams they played for and the seasons they were there, and only
//      shirts from those teams in those years are returned. Messi finds
//      Barcelona 2004-2021, PSG, Inter Miami and Argentina - not a 1995
//      Barcelona shirt.
//   4. Typos. What is left is matched against the catalogue's own vocabulary
//      with an edit distance that allows a swapped or missing letter, so רולנדו
//      still finds רונלדו.
//
// Tested against the real search log in Node before shipping; that is what
// caught "מילאן" being read as a misspelling of Mbappé's first name, and the
// guards below exist because of it.
//
// Plain JavaScript with no app imports on purpose: it runs in the browser, and
// the same file runs in Node to test it.

// --- normalisation --------------------------------------------------------

const FINAL_LETTERS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[֑-ׇ]/g, '')            // Hebrew niqqud and cantillation
    .replace(/[̀-ͯ]/g, '')            // Latin accents: mbappé -> mbappe
    .replace(/[׳״'"`´‘’“”]/g, '')               // geresh, gershayim, quotes
    .replace(/[ךםןףץ]/g, c => FINAL_LETTERS[c])
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Normalising folds final letters away; anything shown back to the reader gets
// them restored, or a corrected word reads as a spelling mistake of its own.
const FINAL_FORMS = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
export const toDisplay = (text) => String(text ?? '').replace(/[כמנפצ](?=\s|$)/g, c => FINAL_FORMS[c]);

// Words that describe every shirt in the shop and so narrow nothing.
const STOPWORDS = new Set(['חולצה', 'חולצת', 'חולצות', 'של', 'עם', 'shirt', 'shirts', 'jersey', 'jerseys', 'kit']);

// --- other names for the same thing ---------------------------------------
// canonical term -> the other ways people write it. The canonical side must be
// what the catalogue itself says, since that is what gets matched.

const ALIAS_GROUPS = {
  // clubs
  'ברצלונה': ['ברסה', 'בארסה', 'ברצה', 'ברסלונה', 'barca', 'barcelona', 'fcb'],
  'ריאל מדריד': ['ריאל', 'real', 'real madrid'],
  'אתלטיקו מדריד': ['אתלטיקו', 'atletico', 'atleti', 'atletico madrid'],
  'מנצסטר יונייטד': ['יונייטד', 'man utd', 'man united', 'manchester united', 'united'],
  'מנצסטר סיטי': ['סיטי', 'man city', 'manchester city'],
  'פריז סן זרמן': ['פסז', 'פריז', 'psg', 'paris', 'paris saint germain'],
  'יובנטוס': ['יובה', 'juve', 'juventus'],
  'באיירן מינכן': ['באיירן', 'ביירן', 'bayern', 'bayern munich'],
  'דורטמונד': ['dortmund', 'bvb', 'בורוסיה דורטמונד'],
  'אינטר': ['inter', 'internazionale', 'inter milan'],
  'אינטר מיאמי': ['מיאמי', 'inter miami', 'miami'],
  'מילאן': ['milan', 'ac milan'],
  'צלסי': ['chelsea'],
  'ארסנל': ['arsenal'],
  'ליברפול': ['liverpool'],
  'טוטנהאם': ['tottenham', 'spurs', 'ספרס'],
  'אייאקס': ['ajax', 'איאקס'],
  'נאפולי': ['napoli'],
  'רומא': ['roma', 'as roma'],
  'ביתר ירושלים': ['ביתר', 'beitar'],
  'הפועל תל אביב': ['הפועל תא', 'hapoel tel aviv'],
  'מכבי תל אביב': ['מכבי תא', 'maccabi tel aviv'],
  'מכבי חיפה': ['maccabi haifa'],
  'הפועל באר שבע': ['הפועל בש', 'hapoel beer sheva'],
  'בוקה גוניורס': ['בוקה', 'boca', 'boca juniors'],
  'פורטו': ['porto'],
  'בנפיקה': ['benfica'],
  'מונאקו': ['monaco'],
  'ולנסיה': ['valencia'],
  'סנטוס': ['santos'],
  'ניוקאסל': ['newcastle'],
  'אסטון וילה': ['aston villa', 'וילה'],
  'לסטר סיטי': ['leicester'],
  'סנט פאולי': ['st pauli'],
  'ראיו וייקאנו': ['ראיו', 'rayo vallecano'],

  // national teams
  'ארגנטינה': ['argentina'],
  'ברזיל': ['brazil', 'brasil'],
  'פורטוגל': ['portugal'],
  'ספרד': ['spain', 'espana'],
  'אנגליה': ['england'],
  'צרפת': ['france'],
  'איטליה': ['italy', 'italia'],
  'גרמניה': ['germany'],
  'הולנד': ['netherlands', 'holland'],
  'בלגיה': ['belgium'],
  'קרואטיה': ['croatia'],
  'יפן': ['japan'],
  'דרום קוריאה': ['קוריאה', 'korea', 'south korea'],
  'ארצות הברית': ['ארהב', 'usa', 'america'],
  'מקסיקו': ['mexico'],
  'נורווגיה': ['norway'],
  'אורוגוואי': ['אורוגואי', 'uruguay'],
  'קולומביה': ['colombia'],

  // leagues and competitions
  'פרמייר ליג': ['פרמייר', 'premier league', 'epl'],
  'לה ליגה': ['la liga', 'laliga'],
  'סרייה א': ['סרייה', 'serie a'],
  'בונדסליגה': ['בונדס', 'bundesliga'],
  'ליגת האלופות': ['אלופות', 'צמפיונס', 'champions league', 'ucl'],
  'ליגה צרפתית': ['ligue 1'],
  'ליגת העל': ['ישראלית', 'israeli league'],
  'מונדיאל': ['גביע העולם', 'world cup'],
  'יורו': ['euro'],

  // what a shirt is, rather than who it belongs to
  'רטרו': ['retro', 'vintage', 'וינטג', 'קלאסית', 'ישנה'],
  'נבחרת': ['נבחרות', 'national', 'national team'],
  'חדש': ['חדשה', 'חדשות', 'new'],
  'ילדים': ['ילד', 'kids', 'youth'],
  'בית': ['home'],
  'חוץ': ['away'],
  'שלישית': ['third'],
};

// normalised phrase -> normalised canonical. Canonical names map to themselves,
// so a typed "לה ליגה" is recognised as one phrase rather than two words - left
// as two, "ליגה" alone matched every league in the shop.
const ALIAS_MAP = new Map();
for (const [canonical, others] of Object.entries(ALIAS_GROUPS)) {
  const c = normalize(canonical);
  ALIAS_MAP.set(c, c);
  for (const o of others) ALIAS_MAP.set(normalize(o), c);
}
const MAX_PHRASE_WORDS = Math.max(...[...ALIAS_MAP.keys()].map(k => k.split(' ').length));

// --- players --------------------------------------------------------------
// Seasons are given by the year they start: Messi's last Barcelona season was
// 2020/21, so `to: 2020`. A shirt matches when its own season starts inside the
// range. `to: null` means still there. Team names are the catalogue's own.
//
// Kept to players whose clubs and years are well documented. Adding one is a
// matter of adding a line; nothing else needs to change.

const PLAYERS = [
  { names: ['מסי', 'ליאו מסי', 'ליונל מסי', 'messi', 'leo messi', 'lionel messi'], label: 'מסי',
    teams: [['ברצלונה', 2004, 2020], ['פריז סן זרמן', 2021, 2022], ['אינטר מיאמי', 2023, null], ['ארגנטינה', 2005, null]] },
  { names: ['רונלדו', 'כריסטיאנו', 'כריסטיאנו רונלדו', 'ronaldo', 'cristiano', 'cristiano ronaldo', 'cr7'], label: 'כריסטיאנו רונלדו',
    teams: [['מנצסטר יונייטד', 2003, 2008], ['ריאל מדריד', 2009, 2017], ['יובנטוס', 2018, 2020], ['מנצסטר יונייטד', 2021, 2021], ['פורטוגל', 2003, null]] },
  { names: ['רונלדו נאזריו', 'נאזריו', 'ronaldo nazario', 'r9'], label: 'רונלדו נאזריו',
    teams: [['ברצלונה', 1996, 1996], ['אינטר', 1997, 2001], ['ריאל מדריד', 2002, 2006], ['מילאן', 2006, 2007], ['ברזיל', 1994, 2006]] },
  { names: ['ניימאר', 'ניימר', 'neymar'], label: 'ניימאר',
    teams: [['סנטוס', 2009, 2013], ['ברצלונה', 2013, 2016], ['פריז סן זרמן', 2017, 2022], ['ברזיל', 2010, null]] },
  { names: ['מבאפה', 'אמבפה', 'קיליאן מבאפה', 'mbappe', 'kylian mbappe'], label: 'מבאפה',
    teams: [['מונאקו', 2015, 2016], ['פריז סן זרמן', 2017, 2023], ['ריאל מדריד', 2024, null], ['צרפת', 2017, null]] },
  { names: ['הולאנד', 'האלנד', 'haaland', 'erling haaland'], label: 'הולאנד',
    teams: [['דורטמונד', 2019, 2021], ['מנצסטר סיטי', 2022, null], ['נורווגיה', 2019, null]] },
  { names: ['סלאח', 'מוחמד סלאח', 'salah', 'mohamed salah'], label: 'סלאח',
    teams: [['צלסי', 2013, 2015], ['רומא', 2015, 2016], ['ליברפול', 2017, null]] },
  { names: ['קיין', 'הארי קיין', 'kane', 'harry kane'], label: 'הארי קיין',
    teams: [['טוטנהאם', 2011, 2022], ['באיירן מינכן', 2023, null], ['אנגליה', 2015, null]] },
  { names: ['בלינגהאם', 'bellingham', 'jude bellingham'], label: 'בלינגהאם',
    teams: [['דורטמונד', 2020, 2022], ['ריאל מדריד', 2023, null], ['אנגליה', 2020, null]] },
  { names: ['ויניסיוס', 'vinicius', 'vini jr'], label: 'ויניסיוס',
    teams: [['ריאל מדריד', 2018, null], ['ברזיל', 2019, null]] },
  { names: ['לבנדובסקי', 'lewandowski'], label: 'לבנדובסקי',
    teams: [['דורטמונד', 2010, 2013], ['באיירן מינכן', 2014, 2021], ['ברצלונה', 2022, null]] },
  { names: ['מודריץ', 'modric', 'luka modric'], label: 'מודריץ',
    teams: [['טוטנהאם', 2008, 2011], ['ריאל מדריד', 2012, 2024], ['מילאן', 2025, null], ['קרואטיה', 2006, null]] },
  { names: ['בנזמה', 'benzema'], label: 'בנזמה',
    teams: [['ריאל מדריד', 2009, 2022], ['צרפת', 2007, 2022]] },
  { names: ['זידאן', 'זיזו', 'zidane'], label: 'זידאן',
    teams: [['יובנטוס', 1996, 2000], ['ריאל מדריד', 2001, 2005], ['צרפת', 1994, 2006]] },
  { names: ['בקהאם', 'beckham', 'david beckham'], label: 'בקהאם',
    teams: [['מנצסטר יונייטד', 1992, 2002], ['ריאל מדריד', 2003, 2006], ['מילאן', 2008, 2009], ['פריז סן זרמן', 2012, 2012], ['אנגליה', 1996, 2009]] },
  { names: ['רונאלדיניו', 'רונלדיניו', 'ronaldinho'], label: 'רונאלדיניו',
    teams: [['פריז סן זרמן', 2001, 2002], ['ברצלונה', 2003, 2007], ['מילאן', 2008, 2010], ['ברזיל', 1999, 2013]] },
  { names: ['קאקה', 'kaka'], label: 'קאקה',
    teams: [['מילאן', 2003, 2008], ['ריאל מדריד', 2009, 2012], ['מילאן', 2013, 2013], ['ברזיל', 2002, 2016]] },
  { names: ['טוטי', 'totti'], label: 'טוטי',
    teams: [['רומא', 1992, 2016], ['איטליה', 1998, 2006]] },
  { names: ['מלדיני', 'maldini'], label: 'מלדיני',
    teams: [['מילאן', 1984, 2008], ['איטליה', 1988, 2002]] },
  { names: ['פירלו', 'pirlo'], label: 'פירלו',
    teams: [['אינטר', 1998, 2000], ['מילאן', 2001, 2010], ['יובנטוס', 2011, 2014], ['איטליה', 2002, 2015]] },
  { names: ['דל פיירו', 'del piero'], label: 'דל פיירו',
    teams: [['יובנטוס', 1993, 2011], ['איטליה', 1995, 2008]] },
  { names: ['זלאטן', 'איברהימוביץ', 'ibrahimovic', 'zlatan'], label: 'זלאטן',
    teams: [['אייאקס', 2001, 2003], ['יובנטוס', 2004, 2005], ['אינטר', 2006, 2008], ['ברצלונה', 2009, 2009], ['מילאן', 2010, 2011], ['פריז סן זרמן', 2012, 2015], ['מנצסטר יונייטד', 2016, 2017], ['מילאן', 2019, 2022]] },
  { names: ['אנרי', 'טיירי אנרי', 'henry', 'thierry henry'], label: 'טיירי אנרי',
    teams: [['ארסנל', 1999, 2006], ['ברצלונה', 2007, 2009], ['צרפת', 1997, 2010]] },
  { names: ['מראדונה', 'maradona'], label: 'מראדונה',
    teams: [['בוקה גוניורס', 1981, 1981], ['ברצלונה', 1982, 1983], ['נאפולי', 1984, 1990], ['בוקה גוניורס', 1995, 1997], ['ארגנטינה', 1977, 1994]] },
  { names: ['פלה', 'pele'], label: 'פלה',
    teams: [['סנטוס', 1956, 1974], ['ברזיל', 1957, 1971]] },
  { names: ['סוארס', 'suarez', 'luis suarez'], label: 'סוארס',
    teams: [['אייאקס', 2006, 2010], ['ליברפול', 2010, 2013], ['ברצלונה', 2014, 2019], ['אתלטיקו מדריד', 2020, 2021], ['אינטר מיאמי', 2024, null], ['אורוגוואי', 2007, 2024]] },
  { names: ['גריזמן', 'griezmann'], label: 'גריזמן',
    teams: [['אתלטיקו מדריד', 2014, 2018], ['ברצלונה', 2019, 2020], ['אתלטיקו מדריד', 2021, null], ['צרפת', 2014, 2024]] },
  { names: ['סון הונג מין', 'son heung min'], label: 'סון הונג-מין',
    teams: [['טוטנהאם', 2015, 2024], ['דרום קוריאה', 2010, null]] },
  { names: ['קווארצחליה', 'kvaratskhelia', 'kvara'], label: 'קווארצחליה',
    teams: [['נאפולי', 2022, 2024], ['פריז סן זרמן', 2024, null]] },
  { names: ['ימאל', 'לאמין ימאל', 'yamal', 'lamine yamal'], label: 'לאמין ימאל',
    teams: [['ברצלונה', 2023, null], ['ספרד', 2023, null]] },
  { names: ['פדרי', 'pedri'], label: 'פדרי',
    teams: [['ברצלונה', 2020, null], ['ספרד', 2021, null]] },
  { names: ['ואן דייק', 'van dijk'], label: 'ואן דייק',
    teams: [['ליברפול', 2017, null], ['הולנד', 2015, null]] },
  { names: ['קרויף', 'cruyff'], label: 'קרויף',
    teams: [['אייאקס', 1964, 1972], ['ברצלונה', 1973, 1977], ['הולנד', 1966, 1977]] },
  { names: ['בופון', 'buffon'], label: 'בופון',
    teams: [['יובנטוס', 2001, 2017], ['פריז סן זרמן', 2018, 2018], ['יובנטוס', 2019, 2020], ['איטליה', 1997, 2018]] },
  { names: ['בייל', 'bale', 'gareth bale'], label: 'בייל',
    teams: [['טוטנהאם', 2007, 2012], ['ריאל מדריד', 2013, 2021], ['טוטנהאם', 2020, 2020]] },
  { names: ['דה בראונה', 'de bruyne'], label: 'דה בראונה',
    teams: [['מנצסטר סיטי', 2015, 2024], ['נאפולי', 2025, null], ['בלגיה', 2010, null]] },
  { names: ['הזאר', 'hazard', 'eden hazard'], label: 'הזאר',
    teams: [['צלסי', 2012, 2018], ['ריאל מדריד', 2019, 2022], ['בלגיה', 2008, 2022]] },
].map(p => ({
  ...p,
  names: p.names.map(normalize),
  teams: p.teams.map(([team, from, to]) => ({ team: normalize(team), display: team, from, to })),
}));

const PLAYER_NAME_WORDS = new Set(PLAYERS.flatMap(p => p.names.flatMap(n => n.split(' '))));

// --- typo tolerance -------------------------------------------------------

// Optimal string alignment distance: insertions, deletions, substitutions, and
// a swap of two neighbouring letters counted as one edit - which is exactly the
// רונלדו / רולנדו mistake.
function editDistance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > limit) return limit + 1;
  }
  return d[a.length][b.length];
}

// Short words get no slack: at three letters one edit turns almost anything
// into something else.
const allowedEdits = (word) => (word.length <= 3 ? 0 : word.length <= 5 ? 1 : 2);

// Hebrew spellings of foreign names disagree mostly about the vowel letters:
// רונלדו / רונאלדו / רולאנדו, הולאנד / האלנד. Strict edit distance puts רולאנדו
// three edits from רונלדו and only two from הולאנד, so it was being read as
// Haaland. With א, ו and י removed after the first letter they meet at one.
const skeleton = (word) => word[0] + word.slice(1).replace(/[אוי]/g, '');

// Hebrew attaches prepositions to the word: לברצלונה, והפועל, בריאל. Stripping
// is only ever tried as a second reading - ליברפל and באירן start with those
// letters too, and stripping them first turned both into nonsense.
const PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ'];
const withoutPrefix = (word) =>
  word.length >= 4 && PREFIXES.includes(word[0]) ? word.slice(1) : null;

// --- seasons --------------------------------------------------------------

// "1994/95", "2007/2008", "2001/03", "2001", "2026" -> the year the season starts.
export function seasonStartYear(season) {
  const m = String(season ?? '').match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

// --- index ----------------------------------------------------------------

const indexCache = new WeakMap();

function buildIndex(shirts) {
  const cached = indexCache.get(shirts);
  if (cached) return cached;

  // Words the catalogue itself uses. A query word found here is taken at its
  // word and never "corrected" into a player's name: מילאן is a club, not a
  // misspelling of קיליאן, and מדריד is a city, not מודריץ.
  const catalogWords = new Set();
  const docs = shirts.map(shirt => {
    // Words that are true of a shirt but not necessarily written on it.
    const derived = [
      shirt.is_retro && 'רטרו',
      shirt.national_team && 'נבחרת',
      shirt.is_new && 'חדש',
      shirt.gender_category === 'kids' && 'ילדים',
    ].filter(Boolean).join(' ');

    const fields = {
      team: normalize(`${shirt.club || ''} ${shirt.national_team || ''}`),
      name: normalize(shirt.name),
      league: normalize(shirt.league),
      season: normalize(shirt.season),
      tags: normalize([...(Array.isArray(shirt.tags) ? shirt.tags : []), derived].join(' ')),
      description: normalize(shirt.description),
    };
    for (const key of ['team', 'name', 'league', 'tags']) {
      for (const w of fields[key].split(' ')) if (w.length > 1) catalogWords.add(w);
    }
    const words = new Set(['team', 'name', 'league', 'tags', 'season']
      .flatMap(k => fields[k].split(' ').filter(Boolean)));
    // Padded, so a phrase can be looked for as whole words.
    const padded = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, ` ${v} `]));

    return {
      shirt, fields, padded, words,
      teams: [normalize(shirt.club), normalize(shirt.national_team)].filter(Boolean),
      startYear: seasonStartYear(shirt.season),
    };
  });

  for (const [alias, canonical] of ALIAS_MAP) {
    for (const w of `${alias} ${canonical}`.split(' ')) if (w.length > 1) catalogWords.add(w);
  }

  // The vocabulary typos are corrected towards: catalogue words, not player
  // names, which are matched separately.
  const index = { docs, catalogWords, vocabulary: [...catalogWords] };
  indexCache.set(shirts, index);
  return index;
}

// --- query understanding --------------------------------------------------

const FIELD_WEIGHT = { team: 10, name: 6, league: 5, tags: 4, season: 4, description: 1 };

// The closest catalogue word to a misspelled one, or null.
function correct(word, vocabulary) {
  const limit = allowedEdits(word);
  if (!limit) return null;
  let best = null;
  let bestDistance = limit + 1;
  for (const candidate of vocabulary) {
    if (candidate === word) return null;
    const dist = editDistance(word, candidate, limit);
    if (dist < bestDistance || (dist === bestDistance && best && candidate[0] === word[0] && best[0] !== word[0])) {
      best = candidate;
      bestDistance = dist;
    }
  }
  return bestDistance <= limit ? best : null;
}

// Finds a player named in the query.
//
// Every name is scored and the closest wins, rather than the first that comes
// within reach: רולאנדו is two edits from both רונלדו and הולאנד, and a first-
// match rule gave it to Haaland. Ties go to the longer name, then to the one
// that starts with the same letter as what was typed.
function findPlayer(queryText, catalogWords) {
  const qWords = queryText.split(' ');
  let best = null;

  for (const p of PLAYERS) {
    for (const name of p.names) {
      const nWords = name.split(' ');
      for (let start = 0; start + nWords.length <= qWords.length; start++) {
        let distance = 0;
        let ok = true;
        for (let k = 0; k < nWords.length && ok; k++) {
          const qw = qWords[start + k];
          const nw = nWords[k];
          if (qw === nw) continue;
          // A word the catalogue already knows is not a typo for a player.
          if (catalogWords.has(qw) && !PLAYER_NAME_WORDS.has(qw)) { ok = false; break; }
          // Loose matching only where it is needed. Transliteration drift is a
          // problem of long foreign names; on short words the vowel-free
          // comparison is far too generous - קקי came out one edit from קיין,
          // and טוב one edit from טוטי. So nothing under four letters is
          // matched to a player approximately, and skeletons only compare
          // words of five letters or more.
          const limit = qw.length >= 4 ? allowedEdits(nw) : 0;
          const skeletonDist = qw.length >= 5 && nw.length >= 5
            ? editDistance(skeleton(qw), skeleton(nw), limit)
            : limit + 1;
          const dist = limit ? Math.min(editDistance(qw, nw, limit), skeletonDist) : limit + 1;
          if (dist > limit) ok = false; else distance += dist;
        }
        if (!ok) continue;
        const candidate = { p, name, start, length: nWords.length, distance };
        const better = !best
          || distance < best.distance
          || (distance === best.distance && name.length > best.name.length)
          || (distance === best.distance && name.length === best.name.length
              && name[0] === qWords[start][0] && best.name[0] !== qWords[best.start][0]);
        if (better) best = candidate;
      }
    }
  }

  if (!best) return null;
  return {
    player: best.p,
    typed: qWords.slice(best.start, best.start + best.length).join(' '),
    rest: [...qWords.slice(0, best.start), ...qWords.slice(best.start + best.length)].join(' '),
  };
}

// Splits what is left of the query into terms. A known phrase - a club, a
// league, an alias of either - becomes one term, longest first. An alias keeps
// the words actually typed as a weaker second reading: סיטי means Manchester
// City first, but Leicester City is still a City.
function parseTerms(text) {
  const words = text.split(' ').filter(Boolean);
  const terms = [];
  for (let i = 0; i < words.length;) {
    let matched = false;
    for (let len = Math.min(MAX_PHRASE_WORDS, words.length - i); len >= 1; len--) {
      const phrase = words.slice(i, i + len).join(' ');
      const canonical = ALIAS_MAP.get(phrase);
      if (!canonical) continue;
      terms.push({ typed: phrase, readings: canonical === phrase ? [[phrase, 1]] : [[canonical, 1], [phrase, 0.7]] });
      i += len;
      matched = true;
      break;
    }
    if (matched) continue;
    const w = words[i++];
    if (STOPWORDS.has(w) || (w.length < 2 && !/\d/.test(w))) continue;
    terms.push({ typed: w, readings: [[w, 1]] });
  }
  return terms;
}

// How strongly one term matches one shirt, 0 for not at all.
function scoreTerm(term, doc, vocabulary, corrections) {
  let best = 0;

  for (const [reading, factor] of term.readings) {
    // A term that is exactly a shirt's team outranks one that merely contains
    // it: אינטר is Inter before Inter Miami, פורטו is Porto before Portugal.
    if (doc.teams.includes(reading)) best = Math.max(best, FIELD_WEIGHT.team * factor + 2);
    if (reading.includes(' ')) {
      // A phrase matches as whole consecutive words, never as loose words.
      for (const [field, text] of Object.entries(doc.padded)) {
        if (text.includes(` ${reading} `)) best = Math.max(best, FIELD_WEIGHT[field] * factor);
      }
      continue;
    }

    for (const [field, text] of Object.entries(doc.fields)) {
      if (!text) continue;
      const weight = FIELD_WEIGHT[field] * factor;
      const fieldWords = text.split(' ');
      if (fieldWords.includes(reading)) best = Math.max(best, weight);
      else if (reading.length >= 2 && fieldWords.some(fw => fw.startsWith(reading))) best = Math.max(best, weight * 0.8);
      else if (field === 'description' && reading.length >= 3 && text.includes(reading)) best = Math.max(best, weight * 0.5);
    }

    // לברצלונה: the same word with its preposition removed, on the fields that
    // name the shirt. Not on the description, where it matched half the shop.
    const stripped = withoutPrefix(reading);
    if (stripped && !best) {
      for (const field of ['team', 'name', 'league', 'tags']) {
        if (doc.fields[field].split(' ').includes(stripped)) best = Math.max(best, FIELD_WEIGHT[field] * factor * 0.9);
      }
    }
  }
  if (best || term.readings.length > 1 || term.typed.includes(' ')) return best;

  // Nothing matched as typed: the nearest word the catalogue actually uses,
  // trying the word whole before trying it without a leading preposition.
  const word = term.typed;
  const fixed = correct(word, vocabulary) || (withoutPrefix(word) && correct(withoutPrefix(word), vocabulary));
  if (fixed && doc.words.has(fixed)) {
    corrections.set(word, fixed);
    return 5;
  }
  return 0;
}

// --- public API -----------------------------------------------------------

/**
 * Searches a list of shirts.
 *
 * Returns the matching shirts, best first, together with an explanation of
 * how the query was read so the page can say so: which player it resolved to,
 * which words it corrected, and whether it had to relax the match.
 */
export function searchShirts(shirts, query) {
  const empty = { results: shirts, player: null, corrections: [], relaxed: false, eraFallback: false };
  const q = normalize(query);
  if (!q) return empty;

  const { docs, catalogWords, vocabulary } = buildIndex(shirts);

  // 1. A player, if one is named.
  const found = findPlayer(q, catalogWords);
  const player = found?.player || null;
  let candidates = docs;
  let eraFallback = false;
  const eraScore = new Map();

  if (player) {
    const onTeam = docs.filter(d => player.teams.some(t => d.teams.includes(t.team)));
    const inEra = onTeam.filter(d => d.startYear != null
      && player.teams.some(t => d.teams.includes(t.team) && d.startYear >= t.from && d.startYear <= (t.to ?? 9999)));
    const undated = onTeam.filter(d => d.startYear == null);
    for (const d of inEra) eraScore.set(d, 20);
    for (const d of undated) eraScore.set(d, 8);

    if (inEra.length || undated.length) {
      candidates = [...inEra, ...undated];
    } else {
      // Nothing from the years they played: better their teams than nothing.
      candidates = onTeam;
      eraFallback = onTeam.length > 0;
      for (const d of onTeam) eraScore.set(d, 5);
    }
  }

  // 2. Whatever else the query says.
  const terms = parseTerms(found ? found.rest : q);

  const corrections = new Map();
  const scored = [];
  const partial = [];

  for (const doc of candidates) {
    let total = eraScore.get(doc) || 0;
    let matched = 0;
    for (const term of terms) {
      const s = scoreTerm(term, doc, vocabulary, corrections);
      if (s) { total += s; matched++; }
    }
    if (matched === terms.length) scored.push({ doc, total });
    else if (matched > 0) partial.push({ doc, total: total - (terms.length - matched) * 3 });
  }

  // Every term has to match. If nothing matches them all, say so and show the
  // shirts that match most of them rather than an empty page.
  let relaxed = false;
  let ranked = scored;
  if (!scored.length && partial.length && terms.length > 1) {
    ranked = partial;
    relaxed = true;
  }

  // Stable: equal scores keep the catalogue's own order (newest first).
  const order = new Map(shirts.map((s, i) => [s, i]));
  ranked.sort((a, b) => b.total - a.total || order.get(a.doc.shirt) - order.get(b.doc.shirt));

  return {
    results: ranked.map(r => r.doc.shirt),
    player: player && {
      label: player.label,
      typed: found.typed,
      teams: player.teams.map(t => ({ team: t.display, from: t.from, to: t.to })),
    },
    corrections: [...corrections].map(([from, to]) => ({ from, to })),
    relaxed,
    eraFallback,
  };
}

// "2004–2021", or "2023–היום" for a player still at the club. Seasons are
// stored by start year, so the last season ends a year later.
export function formatEra({ from, to }) {
  return to == null ? `${from}–היום` : from === to ? `${from}/${String(to + 1).slice(2)}` : `${from}–${to + 1}`;
}

export const __test = { normalize, editDistance, parseTerms, findPlayer, PLAYERS, ALIAS_MAP };
