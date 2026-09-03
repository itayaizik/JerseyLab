// Collection pages - the landing pages for what people actually search.
//
// Nobody types "JerseyLab". They type "חולצות רטרו של ברצלונה" or "חולצת ליגת
// האלופות". Until now the only thing resembling a category was a query string
// on /catalog, which search engines treat as one page with parameters rather
// than a page about a subject - so those searches had nothing here to land on.
//
// Deliberately plain ESM with no imports: the React page and the build-time
// prerenderer both read this file, so the copy and the matching rules cannot
// drift apart between what a crawler is served and what a visitor sees.

// Club and league names arrive from the admin forms with stray whitespace and
// the odd typo ("צלסי " vs "צלסי", "פריימר ליג" vs "פרמייר ליג"), which would
// otherwise split one collection into two half-empty ones.
export function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

const LEAGUE_ALIASES = {
  'פריימר ליג': 'פרמייר ליג',
};

export function normalizeLeague(value) {
  const name = normalizeName(value);
  return LEAGUE_ALIASES[name] || name;
}

const byClub = (...names) => (shirt) => names.includes(normalizeName(shirt.club));
const byLeague = (name) => (shirt) => normalizeLeague(shirt.league) === name;

// Each entry owns its URL, its copy, and the rule for what belongs in it.
// `intro` is the only prose on the page that is not generated from the
// catalogue, so it is written once, per subject, rather than templated - 19
// pages of the same sentence with a name swapped in is the definition of the
// thin content search engines discard.
export const COLLECTIONS = [
  {
    slug: 'retro',
    name: 'רטרו',
    title: 'חולצות כדורגל רטרו - קלאסיקות מהארכיון | JerseyLab',
    h1: 'חולצות כדורגל רטרו',
    description: 'חולצות כדורגל רטרו של הקבוצות הגדולות - עונות קלאסיות ודגמים שכבר לא מייצרים. ברצלונה, ריאל מדריד, מילאן ועוד, במלאי ובמחירים טובים.',
    intro: 'החולצות שכבר לא מייצרים. עונות שהסתיימו, ספונסרים שנעלמו, גזרות שהיו אז - הדגמים שאספנים מחפשים ולא מוצאים בחנויות. כל חולצה כאן נבדקה לפני שעלתה לאתר.',
    match: (shirt) => !!shirt.is_retro,
  },
  {
    slug: 'national-teams',
    name: 'נבחרות',
    title: 'חולצות נבחרות לאומיות - מונדיאל ויורו | JerseyLab',
    h1: 'חולצות נבחרות',
    description: 'חולצות של נבחרות לאומיות - ברזיל, פורטוגל, הולנד, ארגנטינה ועוד. חולצות מונדיאל ויורו, בית וחוץ, חדשות ורטרו.',
    intro: 'חולצות נבחרת מהמונדיאל, מהיורו ומהמשחקים שביניהם. בית וחוץ, עונות אחרונות וקלאסיקות - הנבחרות שגדלנו עליהן והנבחרות שהפתיעו.',
    match: (shirt) => !!normalizeName(shirt.national_team),
  },

  // ── Clubs ──
  {
    slug: 'real-madrid',
    name: 'ריאל מדריד',
    title: 'חולצות ריאל מדריד - בית, חוץ ורטרו | JerseyLab',
    h1: 'חולצות ריאל מדריד',
    description: 'חולצות ריאל מדריד לכל העונות - בית, חוץ ושלישית, חדשות ורטרו. גרסת אוהד וגרסת שחקן, עם אפשרות להדפסת שם ומספר.',
    intro: 'הלבן של הברנבאו, מהעונה הנוכחית ועד הקלאסיקות של שנות האלפיים. בית, חוץ ושלישית - כולל העונות שבהן ריאל לקחה את ליגת האלופות.',
    match: byClub('ריאל מדריד'),
  },
  {
    slug: 'barcelona',
    name: 'ברצלונה',
    title: 'חולצות ברצלונה - בית, חוץ ורטרו | JerseyLab',
    h1: 'חולצות ברצלונה',
    description: 'חולצות ברצלונה לכל העונות - בית, חוץ ורטרו. הבלאוגרנה מהעונות האחרונות ומהתקופות הגדולות, במלאי ובמחירים טובים.',
    intro: 'הבלאוגרנה על כל גרסאותיה - מהעונה הנוכחית ועד הפסים של התקופות הגדולות. חולצות בית, חוץ ושלישית, כולל דגמי רטרו שכבר לא מיוצרים.',
    match: byClub('ברצלונה'),
  },
  {
    slug: 'milan',
    name: 'מילאן',
    title: 'חולצות מילאן - רוסונרי, בית וחוץ | JerseyLab',
    h1: 'חולצות מילאן',
    description: 'חולצות מילאן - האדום-שחור של סן סירו. בית, חוץ ורטרו, מהעונות האחרונות ומהתקופות הקלאסיות של הרוסונרי.',
    intro: 'האדום-שחור של סן סירו. חולצות מילאן מהעונות האחרונות ומהתקופות שבהן הרוסונרי שלטו באירופה.',
    match: byClub('מילאן'),
  },
  {
    slug: 'inter',
    name: 'אינטר',
    title: 'חולצות אינטר מילאן - נראזורי | JerseyLab',
    h1: 'חולצות אינטר',
    description: 'חולצות אינטר מילאן - הכחול-שחור של הנראזורי. בית, חוץ ורטרו, מהעונות האחרונות ומהקלאסיקות.',
    intro: 'הכחול-שחור של הנראזורי. בית, חוץ ושלישית - כולל דגמים מהעונות שבהן אינטר עשתה את הטרבל.',
    match: byClub('אינטר'),
  },
  {
    slug: 'atletico-madrid',
    name: 'אתלטיקו מדריד',
    title: 'חולצות אתלטיקו מדריד | JerseyLab',
    h1: 'חולצות אתלטיקו מדריד',
    description: 'חולצות אתלטיקו מדריד - הפסים האדום-לבן. בית, חוץ ורטרו, מהעונות האחרונות ומהתקופות הקלאסיות.',
    intro: 'הפסים האדום-לבן של הקולצ׳ונרוס. חולצות בית וחוץ מהעונות האחרונות, לצד דגמים מהתקופות שבהן אתלטיקו הגיעה לגמרי אירופה.',
    match: byClub('אתלטיקו מדריד'),
  },
  {
    slug: 'chelsea',
    name: 'צ׳לסי',
    title: 'חולצות צ׳לסי | JerseyLab',
    h1: 'חולצות צ׳לסי',
    description: 'חולצות צ׳לסי - הכחול של סטמפורד ברידג׳. בית, חוץ ורטרו, גרסת אוהד וגרסת שחקן.',
    intro: 'הכחול של סטמפורד ברידג׳, מהעונה הנוכחית ועד הדגמים של תקופות ליגת האלופות.',
    match: byClub('צלסי'),
  },
  {
    slug: 'psg',
    name: 'פריז סן ז׳רמן',
    title: 'חולצות פריז סן ז׳רמן (PSG) | JerseyLab',
    h1: 'חולצות פריז סן ז׳רמן',
    description: 'חולצות PSG - בית, חוץ ורטרו. הכחול-אדום של פארק דה פראנס מהעונות האחרונות ומהקלאסיקות.',
    intro: 'הכחול-אדום של פארק דה פראנס. חולצות מהעונות האחרונות, כולל הדגמים של תקופת הכוכבים הגדולים.',
    match: byClub('פריז סן זרמן'),
  },
  {
    slug: 'inter-miami',
    name: 'אינטר מיאמי',
    title: 'חולצות אינטר מיאמי - מסי | JerseyLab',
    h1: 'חולצות אינטר מיאמי',
    description: 'חולצות אינטר מיאמי - הוורוד של MLS, כולל חולצות מסי. בית וחוץ, עם אפשרות להדפסת שם ומספר.',
    intro: 'הוורוד שהפך לאחת החולצות המבוקשות בעולם מאז שמסי הגיע ל-MLS. בית וחוץ, עם אפשרות להדפסה מאחורה.',
    match: byClub('אינטר מיאמי'),
  },
  {
    slug: 'bayern-munich',
    name: 'באיירן מינכן',
    title: 'חולצות באיירן מינכן | JerseyLab',
    h1: 'חולצות באיירן מינכן',
    description: 'חולצות באיירן מינכן - בית, חוץ ורטרו. האדום של אליאנץ ארנה מהעונות האחרונות ומהקלאסיקות.',
    intro: 'האדום של אליאנץ ארנה. חולצות בית וחוץ מהעונות האחרונות, לצד דגמי רטרו מהתקופות הגדולות של הבאוורן.',
    match: byClub('באיירן מינכן'),
  },
  {
    slug: 'roma',
    name: 'רומא',
    title: 'חולצות רומא | JerseyLab',
    h1: 'חולצות רומא',
    description: 'חולצות רומא - הג׳אלורוסי. בית, חוץ ורטרו, מהעונות האחרונות ומהתקופות הקלאסיות של האולימפיקו.',
    intro: 'הצהוב-אדום של האולימפיקו. חולצות מהעונות האחרונות ומהתקופות שבהן טוטי היה החולצה עצמה.',
    match: byClub('רומא'),
  },
  {
    slug: 'hapoel-tel-aviv',
    name: 'הפועל תל אביב',
    title: 'חולצות הפועל תל אביב | JerseyLab',
    h1: 'חולצות הפועל תל אביב',
    description: 'חולצות הפועל תל אביב - בית, חוץ ורטרו. האדום מבלומפילד, כולל דגמים מליגת האלופות.',
    intro: 'האדום מבלומפילד. חולצות מהעונות האחרונות לצד דגמי רטרו - כולל העונה שבה הפועל שיחקה בליגת האלופות.',
    match: byClub('הפועל תל אביב'),
  },
  {
    slug: 'beitar-jerusalem',
    name: 'ביתר ירושלים',
    title: 'חולצות ביתר ירושלים | JerseyLab',
    h1: 'חולצות ביתר ירושלים',
    description: 'חולצות ביתר ירושלים - בית וחוץ, מהעונות האחרונות. הצהוב-שחור מטדי במלאי ובמחירים טובים.',
    intro: 'הצהוב-שחור מטדי. חולצות בית וחוץ של העונות האחרונות, עם אפשרות להדפסת שם ומספר.',
    match: byClub('ביתר ירושלים'),
  },

  // ── Leagues ──
  {
    slug: 'la-liga',
    name: 'לה ליגה',
    title: 'חולצות לה ליגה - הליגה הספרדית | JerseyLab',
    h1: 'חולצות לה ליגה',
    description: 'חולצות מהליגה הספרדית - ריאל מדריד, ברצלונה, אתלטיקו, ולנסיה ועוד. בית, חוץ ורטרו.',
    intro: 'הליגה הספרדית על כל קבוצותיה - מהענקיות של מדריד וברצלונה ועד הקבוצות שכל אספן מזהה לפי החולצה.',
    match: byLeague('לה ליגה'),
  },
  {
    slug: 'serie-a',
    name: 'סרייה א',
    title: 'חולצות סרייה א - הליגה האיטלקית | JerseyLab',
    h1: 'חולצות סרייה א',
    description: 'חולצות מהליגה האיטלקית - מילאן, אינטר, יובנטוס, רומא, נאפולי ועוד. חדשות ורטרו.',
    intro: 'הליגה האיטלקית, שממנה הגיעו כמה מהחולצות היפות בהיסטוריה. מילאן, אינטר, יובנטוס, רומא ונאפולי.',
    match: byLeague('סרייה א'),
  },
  {
    slug: 'premier-league',
    name: 'פרמייר ליג',
    title: 'חולצות פרמייר ליג - הליגה האנגלית | JerseyLab',
    h1: 'חולצות פרמייר ליג',
    description: 'חולצות מהליגה האנגלית - צ׳לסי, ארסנל, מנצ׳סטר יונייטד, ליברפול, טוטנהאם ועוד.',
    intro: 'הליגה האנגלית - צ׳לסי, ארסנל, שתי המנצ׳סטרים, ליברפול וטוטנהאם. חולצות מהעונות האחרונות ודגמי רטרו.',
    match: byLeague('פרמייר ליג'),
  },
  {
    slug: 'israeli-league',
    name: 'ליגת העל',
    title: 'חולצות ליגת העל הישראלית | JerseyLab',
    h1: 'חולצות ליגת העל',
    description: 'חולצות של קבוצות ליגת העל - הפועל תל אביב, מכבי תל אביב, ביתר ירושלים, מכבי חיפה, הפועל באר שבע.',
    intro: 'הקבוצות מכאן. הפועל ומכבי תל אביב, ביתר ירושלים, מכבי חיפה והפועל באר שבע - עונות אחרונות ודגמים מהארכיון.',
    match: byLeague('ליגת העל'),
  },
  {
    slug: 'champions-league',
    name: 'ליגת האלופות',
    title: 'חולצות ליגת האלופות | JerseyLab',
    h1: 'חולצות ליגת האלופות',
    description: 'חולצות מגרסאות ליגת האלופות - הדגמים עם הפאצ׳ים והעיצובים המיוחדים של המפעל האירופי.',
    intro: 'הגרסאות של ליגת האלופות - עם הפאצ׳ים, הכיתובים והעיצובים שהופיעו רק בערבים של אמצע השבוע.',
    match: byLeague('ליגת האלופות'),
  },
];

export function findCollection(slug) {
  return COLLECTIONS.find(c => c.slug === slug) || null;
}

// Shirts belonging to a collection, newest season first so a landing page opens
// on current stock rather than whatever happens to sort first.
export function collectionShirts(collection, shirts) {
  if (!collection) return [];
  return (shirts || [])
    .filter(s => s && s.status !== 'hidden' && collection.match(s))
    .sort((a, b) => String(b.season || '').localeCompare(String(a.season || '')));
}
