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
//
// Each entry carries its English copy under `en`; localizeCollection() picks
// it for the English site.

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
const byTeam = (...names) => (shirt) => names.includes(normalizeName(shirt.national_team));
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
    description: 'חולצות כדורגל רטרו של הקבוצות הגדולות - עונות קלאסיות ודגמים שכבר לא מייצרים. ברצלונה, ריאל מדריד, מילאן ועוד.',
    intro: 'החולצות שכבר לא מייצרים. עונות שהסתיימו, ספונסרים שנעלמו, גזרות שהיו אז - הדגמים שאספנים מחפשים ולא מוצאים בחנויות. כל חולצה כאן נבדקה לפני שעלתה לאתר.',
    en: {
      name: 'Retro',
      title: 'Retro Football Shirts - Classics from the Archive | JerseyLab',
      h1: 'Retro Football Shirts',
      description: 'Retro shirts from the big clubs - classic seasons and designs no longer made. Barcelona, Real Madrid, AC Milan and more.',
      intro: "The shirts they don't make anymore. Seasons that ended, sponsors that vanished, the cuts of the time - the designs collectors look for and can't find in shops. Every shirt here was checked before it went on the site.",
    },
    match: (shirt) => !!shirt.is_retro,
  },
  {
    slug: 'national-teams',
    name: 'נבחרות',
    title: 'חולצות נבחרות לאומיות - מונדיאל ויורו | JerseyLab',
    h1: 'חולצות נבחרות',
    description: 'חולצות של נבחרות לאומיות - ברזיל, פורטוגל, הולנד, ארגנטינה ועוד. חולצות מונדיאל ויורו, בית וחוץ, חדשות ורטרו.',
    intro: 'חולצות נבחרת מהמונדיאל, מהיורו ומהמשחקים שביניהם. בית וחוץ, עונות אחרונות וקלאסיקות - הנבחרות שגדלנו עליהן והנבחרות שהפתיעו.',
    en: {
      name: 'National Teams',
      title: 'National Team Shirts - World Cup and Euro | JerseyLab',
      h1: 'National Team Shirts',
      description: 'National team shirts - Brazil, Portugal, the Netherlands, Argentina and more. World Cup and Euro shirts, home and away, new and retro.',
      intro: 'National team shirts from the World Cup, the Euros and the games in between. Home and away, recent seasons and classics - the teams we grew up on and the teams that surprised us.',
    },
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
    en: {
      name: 'Real Madrid',
      title: 'Real Madrid Shirts - Home, Away and Retro | JerseyLab',
      h1: 'Real Madrid Shirts',
      description: 'Real Madrid shirts from every season - home, away and third, new and retro. Fan and player versions, with name and number printing.',
      intro: 'The white of the Bernabéu, from this season back to the classics of the 2000s. Home, away and third - including the seasons Real won the Champions League.',
    },
    match: byClub('ריאל מדריד'),
  },
  {
    slug: 'barcelona',
    name: 'ברצלונה',
    title: 'חולצות ברצלונה - בית, חוץ ורטרו | JerseyLab',
    h1: 'חולצות ברצלונה',
    description: 'חולצות ברצלונה לכל העונות - בית, חוץ ורטרו. הבלאוגרנה מהעונות האחרונות ומהתקופות הגדולות.',
    intro: 'הבלאוגרנה על כל גרסאותיה - מהעונה הנוכחית ועד הפסים של התקופות הגדולות. חולצות בית, חוץ ושלישית, כולל דגמי רטרו שכבר לא מיוצרים.',
    en: {
      name: 'Barcelona',
      title: 'Barcelona Shirts - Home, Away and Retro | JerseyLab',
      h1: 'Barcelona Shirts',
      description: 'Barcelona shirts from every season - home, away and retro. The blaugrana from recent seasons and the great eras.',
      intro: 'The blaugrana in all its versions - from this season back to the stripes of the great eras. Home, away and third shirts, including retro designs no longer made.',
    },
    match: byClub('ברצלונה'),
  },
  {
    slug: 'milan',
    name: 'מילאן',
    title: 'חולצות מילאן - רוסונרי, בית וחוץ | JerseyLab',
    h1: 'חולצות מילאן',
    description: 'חולצות מילאן - האדום-שחור של סן סירו. בית, חוץ ורטרו, מהעונות האחרונות ומהתקופות הקלאסיות של הרוסונרי.',
    intro: 'האדום-שחור של סן סירו. חולצות מילאן מהעונות האחרונות ומהתקופות שבהן הרוסונרי שלטו באירופה.',
    en: {
      name: 'AC Milan',
      title: 'AC Milan Shirts - Rossoneri, Home and Away | JerseyLab',
      h1: 'AC Milan Shirts',
      description: 'AC Milan shirts - the red and black of San Siro. Home, away and retro, from recent seasons and the classic Rossoneri eras.',
      intro: 'The red and black of San Siro. Milan shirts from recent seasons and from the years the Rossoneri ruled Europe.',
    },
    match: byClub('מילאן'),
  },
  {
    slug: 'inter',
    name: 'אינטר',
    title: 'חולצות אינטר מילאן - נראזורי | JerseyLab',
    h1: 'חולצות אינטר',
    description: 'חולצות אינטר מילאן - הכחול-שחור של הנראזורי. בית, חוץ ורטרו, מהעונות האחרונות ומהקלאסיקות.',
    intro: 'הכחול-שחור של הנראזורי. בית, חוץ ושלישית - כולל דגמים מהעונות שבהן אינטר עשתה את הטרבל.',
    en: {
      name: 'Inter',
      title: 'Inter Milan Shirts - Nerazzurri | JerseyLab',
      h1: 'Inter Shirts',
      description: 'Inter Milan shirts - the blue and black of the Nerazzurri. Home, away and retro, from recent seasons and the classics.',
      intro: 'The blue and black of the Nerazzurri. Home, away and third - including designs from the seasons Inter won the treble.',
    },
    match: byClub('אינטר'),
  },
  {
    slug: 'atletico-madrid',
    name: 'אתלטיקו מדריד',
    title: 'חולצות אתלטיקו מדריד | JerseyLab',
    h1: 'חולצות אתלטיקו מדריד',
    description: 'חולצות אתלטיקו מדריד - הפסים האדום-לבן. בית, חוץ ורטרו, מהעונות האחרונות ומהתקופות הקלאסיות.',
    intro: 'הפסים האדום-לבן של הקולצ׳ונרוס. חולצות בית וחוץ מהעונות האחרונות, לצד דגמים מהתקופות שבהן אתלטיקו הגיעה לגמרי אירופה.',
    en: {
      name: 'Atlético Madrid',
      title: 'Atlético Madrid Shirts | JerseyLab',
      h1: 'Atlético Madrid Shirts',
      description: 'Atlético Madrid shirts - the red and white stripes. Home, away and retro, from recent seasons and the classic eras.',
      intro: 'The red and white stripes of the Colchoneros. Home and away shirts from recent seasons, alongside designs from the years Atlético reached European finals.',
    },
    match: byClub('אתלטיקו מדריד'),
  },
  {
    slug: 'chelsea',
    name: 'צ׳לסי',
    title: 'חולצות צ׳לסי | JerseyLab',
    h1: 'חולצות צ׳לסי',
    description: 'חולצות צ׳לסי - הכחול של סטמפורד ברידג׳. בית, חוץ ורטרו, גרסת אוהד וגרסת שחקן.',
    intro: 'הכחול של סטמפורד ברידג׳, מהעונה הנוכחית ועד הדגמים של תקופות ליגת האלופות.',
    en: {
      name: 'Chelsea',
      title: 'Chelsea Shirts | JerseyLab',
      h1: 'Chelsea Shirts',
      description: 'Chelsea shirts - the blue of Stamford Bridge. Home, away and retro, fan and player versions.',
      intro: 'The blue of Stamford Bridge, from this season back to the designs of the Champions League years.',
    },
    match: byClub('צלסי'),
  },
  {
    slug: 'psg',
    name: 'פריז סן ז׳רמן',
    title: 'חולצות פריז סן ז׳רמן (PSG) | JerseyLab',
    h1: 'חולצות פריז סן ז׳רמן',
    description: 'חולצות PSG - בית, חוץ ורטרו. הכחול-אדום של פארק דה פראנס מהעונות האחרונות ומהקלאסיקות.',
    intro: 'הכחול-אדום של פארק דה פראנס. חולצות מהעונות האחרונות, כולל הדגמים של תקופת הכוכבים הגדולים.',
    en: {
      name: 'Paris Saint-Germain',
      title: 'Paris Saint-Germain (PSG) Shirts | JerseyLab',
      h1: 'Paris Saint-Germain Shirts',
      description: 'PSG shirts - home, away and retro. The blue and red of the Parc des Princes, from recent seasons and the classics.',
      intro: 'The blue and red of the Parc des Princes. Shirts from recent seasons, including the designs of the big-star era.',
    },
    match: byClub('פריז סן זרמן'),
  },
  {
    slug: 'inter-miami',
    name: 'אינטר מיאמי',
    title: 'חולצות אינטר מיאמי - מסי | JerseyLab',
    h1: 'חולצות אינטר מיאמי',
    description: 'חולצות אינטר מיאמי - הוורוד של MLS, כולל חולצות מסי. בית וחוץ, עם אפשרות להדפסת שם ומספר.',
    intro: 'הוורוד שהפך לאחת החולצות המבוקשות בעולם מאז שמסי הגיע ל-MLS. בית וחוץ, עם אפשרות להדפסה מאחורה.',
    en: {
      name: 'Inter Miami',
      title: 'Inter Miami Shirts - Messi | JerseyLab',
      h1: 'Inter Miami Shirts',
      description: 'Inter Miami shirts - the pink of MLS, including Messi shirts. Home and away, with name and number printing.',
      intro: 'The pink that became one of the most wanted shirts in the world once Messi arrived in MLS. Home and away, with printing on the back.',
    },
    match: byClub('אינטר מיאמי'),
  },
  {
    slug: 'bayern-munich',
    name: 'באיירן מינכן',
    title: 'חולצות באיירן מינכן | JerseyLab',
    h1: 'חולצות באיירן מינכן',
    description: 'חולצות באיירן מינכן - בית, חוץ ורטרו. האדום של אליאנץ ארנה מהעונות האחרונות ומהקלאסיקות.',
    intro: 'האדום של אליאנץ ארנה. חולצות בית וחוץ מהעונות האחרונות, לצד דגמי רטרו מהתקופות הגדולות של הבאוורן.',
    en: {
      name: 'Bayern Munich',
      title: 'Bayern Munich Shirts | JerseyLab',
      h1: 'Bayern Munich Shirts',
      description: 'Bayern Munich shirts - home, away and retro. The red of the Allianz Arena, from recent seasons and the classics.',
      intro: 'The red of the Allianz Arena. Home and away shirts from recent seasons, alongside retro designs from the great Bavarian eras.',
    },
    match: byClub('באיירן מינכן'),
  },
  {
    slug: 'roma',
    name: 'רומא',
    title: 'חולצות רומא | JerseyLab',
    h1: 'חולצות רומא',
    description: 'חולצות רומא - הג׳אלורוסי. בית, חוץ ורטרו, מהעונות האחרונות ומהתקופות הקלאסיות של האולימפיקו.',
    intro: 'הצהוב-אדום של האולימפיקו. חולצות מהעונות האחרונות ומהתקופות שבהן טוטי היה החולצה עצמה.',
    en: {
      name: 'AS Roma',
      title: 'AS Roma Shirts | JerseyLab',
      h1: 'AS Roma Shirts',
      description: 'AS Roma shirts - the Giallorossi. Home, away and retro, from recent seasons and the classic Olimpico eras.',
      intro: 'The yellow and red of the Olimpico. Shirts from recent seasons and from the years Totti was the shirt itself.',
    },
    match: byClub('רומא'),
  },
  {
    slug: 'hapoel-tel-aviv',
    name: 'הפועל תל אביב',
    title: 'חולצות הפועל תל אביב | JerseyLab',
    h1: 'חולצות הפועל תל אביב',
    description: 'חולצות הפועל תל אביב - בית, חוץ ורטרו. האדום מבלומפילד, כולל דגמים מליגת האלופות.',
    intro: 'האדום מבלומפילד. חולצות מהעונות האחרונות לצד דגמי רטרו - כולל העונה שבה הפועל שיחקה בליגת האלופות.',
    en: {
      name: 'Hapoel Tel Aviv',
      title: 'Hapoel Tel Aviv Shirts | JerseyLab',
      h1: 'Hapoel Tel Aviv Shirts',
      description: 'Hapoel Tel Aviv shirts - home, away and retro. The red of Bloomfield, including Champions League designs.',
      intro: 'The red of Bloomfield. Shirts from recent seasons alongside retro designs - including the season Hapoel played in the Champions League.',
    },
    match: byClub('הפועל תל אביב'),
  },
  {
    slug: 'beitar-jerusalem',
    name: 'ביתר ירושלים',
    title: 'חולצות ביתר ירושלים | JerseyLab',
    h1: 'חולצות ביתר ירושלים',
    description: 'חולצות ביתר ירושלים - בית וחוץ, מהעונות האחרונות. הצהוב-שחור מטדי.',
    intro: 'הצהוב-שחור מטדי. חולצות בית וחוץ של העונות האחרונות, עם אפשרות להדפסת שם ומספר.',
    en: {
      name: 'Beitar Jerusalem',
      title: 'Beitar Jerusalem Shirts | JerseyLab',
      h1: 'Beitar Jerusalem Shirts',
      description: 'Beitar Jerusalem shirts - home and away, from recent seasons. The yellow and black of Teddy Stadium.',
      intro: 'The yellow and black of Teddy Stadium. Home and away shirts from recent seasons, with name and number printing.',
    },
    match: byClub('ביתר ירושלים'),
  },

  {
    slug: 'juventus',
    name: "יובנטוס",
    title: "חולצות יובנטוס | JerseyLab",
    h1: "חולצות יובנטוס",
    description: "חולצות יובנטוס - בית, חוץ ורטרו. הפסים השחור-לבן של הגברת הזקנה, מהעונות האחרונות ומהתקופות הקלאסיות.",
    intro: "הפסים השחור-לבן של טורינו. חולצות מהעונות האחרונות לצד דגמי רטרו מהשנים שבהן יובנטוס שלטה בסרייה א.",
    en: {
      name: "Juventus",
      title: "Juventus Shirts | JerseyLab",
      h1: "Juventus Shirts",
      description: "Juventus shirts - home, away and retro. The black and white stripes of the Old Lady, from recent seasons and the classic eras.",
      intro: "The black and white stripes of Turin. Shirts from recent seasons alongside retro designs from the years Juventus ruled Serie A.",
    },
    match: byClub('יובנטוס'),
  },
  {
    slug: 'arsenal',
    name: "ארסנל",
    title: "חולצות ארסנל | JerseyLab",
    h1: "חולצות ארסנל",
    description: "חולצות ארסנל - בית, חוץ ורטרו. האדום-לבן מצפון לונדון, מהעונות האחרונות ומדגמים קלאסיים.",
    intro: "האדום-לבן מצפון לונדון. חולצות בית וחוץ של העונות האחרונות, לצד דגמים מהתקופות שאוהדים זוכרים.",
    en: {
      name: "Arsenal",
      title: "Arsenal Shirts | JerseyLab",
      h1: "Arsenal Shirts",
      description: "Arsenal shirts - home, away and retro. The red and white of north London, from recent seasons and classic designs.",
      intro: "The red and white of north London. Home and away shirts from recent seasons, alongside designs fans remember.",
    },
    match: byClub('ארסנל'),
  },
  {
    slug: 'manchester-city',
    name: "מנצ׳סטר סיטי",
    title: "חולצות מנצ׳סטר סיטי | JerseyLab",
    h1: "חולצות מנצ׳סטר סיטי",
    description: "חולצות מנצ׳סטר סיטי - בית, חוץ ושלישית. התכלת של האתיחאד, מהעונות האחרונות.",
    intro: "התכלת של האתיחאד. חולצות מהעונות האחרונות, כולל הדגמים של שנות התארים.",
    en: {
      name: "Manchester City",
      title: "Manchester City Shirts | JerseyLab",
      h1: "Manchester City Shirts",
      description: "Manchester City shirts - home, away and third. The sky blue of the Etihad, from recent seasons.",
      intro: "The sky blue of the Etihad. Shirts from recent seasons, including the designs of the title-winning years.",
    },
    match: byClub('מנצסטר סיטי'),
  },
  {
    slug: 'manchester-united',
    name: "מנצ׳סטר יונייטד",
    title: "חולצות מנצ׳סטר יונייטד | JerseyLab",
    h1: "חולצות מנצ׳סטר יונייטד",
    description: "חולצות מנצ׳סטר יונייטד - בית, חוץ ורטרו, כולל דגמי אולד טראפורד הקלאסיים של שנות ה-90.",
    intro: "האדום של אולד טראפורד. חולצות מהעונות האחרונות, וגם הדגמים של עונת השלושער 1998/99.",
    en: {
      name: "Manchester United",
      title: "Manchester United Shirts | JerseyLab",
      h1: "Manchester United Shirts",
      description: "Manchester United shirts - home, away and retro, including the classic Old Trafford designs of the 1990s.",
      intro: "The red of Old Trafford. Shirts from recent seasons, and the designs of the 1998/99 treble season.",
    },
    match: byClub('מנצסטר יונייטד'),
  },
  {
    slug: 'dortmund',
    name: "דורטמונד",
    title: "חולצות דורטמונד | JerseyLab",
    h1: "חולצות בורוסיה דורטמונד",
    description: "חולצות דורטמונד - בית, חוץ ורטרו. הצהוב-שחור של הקיר הצהוב, מהעונות האחרונות ומדגמים קלאסיים.",
    intro: "הצהוב-שחור של הקיר הצהוב. חולצות מהעונות האחרונות לצד דגמי רטרו מהשנים הגדולות של הווסטפאלן.",
    en: {
      name: "Borussia Dortmund",
      title: "Borussia Dortmund Shirts | JerseyLab",
      h1: "Borussia Dortmund Shirts",
      description: "Borussia Dortmund shirts - home, away and retro. The yellow and black of the Yellow Wall, from recent seasons and classic designs.",
      intro: "The yellow and black of the Yellow Wall. Shirts from recent seasons alongside retro designs from the great Westfalenstadion years.",
    },
    match: byClub('דורטמונד'),
  },
  {
    slug: 'liverpool',
    name: "ליברפול",
    title: "חולצות ליברפול | JerseyLab",
    h1: "חולצות ליברפול",
    description: "חולצות ליברפול - בית, חוץ ורטרו. האדום של אנפילד, מהעונות האחרונות ומדגמים קלאסיים.",
    intro: "האדום של אנפילד. חולצות מהעונות האחרונות, וגם הדגם של 2004/05 - העונה של הגמר באיסטנבול.",
    en: {
      name: "Liverpool",
      title: "Liverpool Shirts | JerseyLab",
      h1: "Liverpool Shirts",
      description: "Liverpool shirts - home, away and retro. The red of Anfield, from recent seasons and classic designs.",
      intro: "The red of Anfield. Shirts from recent seasons, and the 2004/05 design - the season of the Istanbul final.",
    },
    match: byClub('ליברפול'),
  },
  {
    slug: 'tottenham',
    name: "טוטנהאם",
    title: "חולצות טוטנהאם | JerseyLab",
    h1: "חולצות טוטנהאם",
    description: "חולצות טוטנהאם - בית, חוץ ורטרו. הלבן של צפון לונדון, מהעונות האחרונות ומדגמים קלאסיים.",
    intro: "הלבן של צפון לונדון. חולצות מהעונות האחרונות, וגם הדגם של 2018/19 - העונה שנגמרה בגמר ליגת האלופות במדריד.",
    en: {
      name: "Tottenham",
      title: "Tottenham Shirts | JerseyLab",
      h1: "Tottenham Shirts",
      description: "Tottenham shirts - home, away and retro. The white of north London, from recent seasons and classic designs.",
      intro: "The white of north London. Shirts from recent seasons, and the 2018/19 design - the season that ended in the Champions League final in Madrid.",
    },
    match: byClub('טוטנהאם'),
  },
  {
    slug: 'brazil',
    name: "ברזיל",
    title: "חולצות נבחרת ברזיל | JerseyLab",
    h1: "חולצות נבחרת ברזיל",
    description: "חולצות נבחרת ברזיל - הצהוב הקלאסי, כולל דגמי המונדיאל של 1998 ו-2002.",
    intro: "הצהוב שכולם מזהים. חולצות של הנבחרת מהמונדיאלים הגדולים ומהעונות האחרונות.",
    en: {
      name: "Brazil",
      title: "Brazil National Team Shirts | JerseyLab",
      h1: "Brazil National Team Shirts",
      description: "Brazil national team shirts - the classic yellow, including the 1998 and 2002 World Cup designs.",
      intro: "The yellow everyone recognises. Shirts from the great World Cups and from recent years.",
    },
    match: byTeam('ברזיל'),
  },
  {
    slug: 'portugal',
    name: "פורטוגל",
    title: "חולצות נבחרת פורטוגל | JerseyLab",
    h1: "חולצות נבחרת פורטוגל",
    description: "חולצות נבחרת פורטוגל - בית וחוץ, חדשות ורטרו, כולל הדגם של יורו 2004.",
    intro: "האדום-ירוק של פורטוגל. חולצות מהעונות האחרונות ודגמי רטרו, כולל התקופה שבה רונאלדו פרץ.",
    en: {
      name: "Portugal",
      title: "Portugal National Team Shirts | JerseyLab",
      h1: "Portugal National Team Shirts",
      description: "Portugal national team shirts - home and away, new and retro, including the Euro 2004 design.",
      intro: "The red and green of Portugal. Shirts from recent years and retro designs, including the era Ronaldo broke through.",
    },
    match: byTeam('פורטוגל'),
  },
  {
    slug: 'netherlands',
    name: "הולנד",
    title: "חולצות נבחרת הולנד | JerseyLab",
    h1: "חולצות נבחרת הולנד",
    description: "חולצות נבחרת הולנד - הכתום, חדשות ורטרו, כולל הדגם הגיאומטרי של יורו 1988.",
    intro: "הכתום ההולנדי. חולצות מהעונות האחרונות ודגמי רטרו, כולל אחד הדגמים המעוצבים בהיסטוריה.",
    en: {
      name: "Netherlands",
      title: "Netherlands National Team Shirts | JerseyLab",
      h1: "Netherlands National Team Shirts",
      description: "Netherlands national team shirts - the orange, new and retro, including the geometric Euro 1988 design.",
      intro: "Dutch orange. Shirts from recent years and retro designs, including one of the best-looking kits ever made.",
    },
    match: byTeam('הולנד'),
  },
  // ── Leagues ──
  {
    slug: 'la-liga',
    name: 'לה ליגה',
    title: 'חולצות לה ליגה - הליגה הספרדית | JerseyLab',
    h1: 'חולצות לה ליגה',
    description: 'חולצות מהליגה הספרדית - ריאל מדריד, ברצלונה, אתלטיקו, ולנסיה ועוד. בית, חוץ ורטרו.',
    intro: 'הליגה הספרדית על כל קבוצותיה - מהענקיות של מדריד וברצלונה ועד הקבוצות שכל אספן מזהה לפי החולצה.',
    en: {
      name: 'La Liga',
      title: 'La Liga Shirts - The Spanish League | JerseyLab',
      h1: 'La Liga Shirts',
      description: 'Shirts from the Spanish league - Real Madrid, Barcelona, Atlético, Valencia and more. Home, away and retro.',
      intro: 'The Spanish league and all its clubs - from the giants of Madrid and Barcelona to the teams every collector knows by their shirt.',
    },
    match: byLeague('לה ליגה'),
  },
  {
    slug: 'serie-a',
    name: 'סרייה א',
    title: 'חולצות סרייה א - הליגה האיטלקית | JerseyLab',
    h1: 'חולצות סרייה א',
    description: 'חולצות מהליגה האיטלקית - מילאן, אינטר, יובנטוס, רומא, נאפולי ועוד. חדשות ורטרו.',
    intro: 'הליגה האיטלקית, שממנה הגיעו כמה מהחולצות היפות בהיסטוריה. מילאן, אינטר, יובנטוס, רומא ונאפולי.',
    en: {
      name: 'Serie A',
      title: 'Serie A Shirts - The Italian League | JerseyLab',
      h1: 'Serie A Shirts',
      description: 'Shirts from the Italian league - AC Milan, Inter, Juventus, Roma, Napoli and more. New and retro.',
      intro: 'The Italian league, home to some of the most beautiful shirts in history. AC Milan, Inter, Juventus, Roma and Napoli.',
    },
    match: byLeague('סרייה א'),
  },
  {
    slug: 'premier-league',
    name: 'פרמייר ליג',
    title: 'חולצות פרמייר ליג - הליגה האנגלית | JerseyLab',
    h1: 'חולצות פרמייר ליג',
    description: 'חולצות מהליגה האנגלית - צ׳לסי, ארסנל, מנצ׳סטר יונייטד, ליברפול, טוטנהאם ועוד.',
    intro: 'הליגה האנגלית - צ׳לסי, ארסנל, שתי המנצ׳סטרים, ליברפול וטוטנהאם. חולצות מהעונות האחרונות ודגמי רטרו.',
    en: {
      name: 'Premier League',
      title: 'Premier League Shirts - The English League | JerseyLab',
      h1: 'Premier League Shirts',
      description: 'Shirts from the English league - Chelsea, Arsenal, Manchester United, Liverpool, Tottenham and more.',
      intro: 'The English league - Chelsea, Arsenal, both Manchester clubs, Liverpool and Tottenham. Shirts from recent seasons and retro designs.',
    },
    match: byLeague('פרמייר ליג'),
  },
  {
    slug: 'israeli-league',
    name: 'ליגת העל',
    title: 'חולצות ליגת העל הישראלית | JerseyLab',
    h1: 'חולצות ליגת העל',
    description: 'חולצות של קבוצות ליגת העל - הפועל תל אביב, מכבי תל אביב, ביתר ירושלים, מכבי חיפה, הפועל באר שבע.',
    intro: 'הקבוצות מכאן. הפועל ומכבי תל אביב, ביתר ירושלים, מכבי חיפה והפועל באר שבע - עונות אחרונות ודגמים מהארכיון.',
    en: {
      name: 'Israeli Premier League',
      title: 'Israeli Premier League Shirts | JerseyLab',
      h1: 'Israeli Premier League Shirts',
      description: 'Shirts from Israeli Premier League clubs - Hapoel Tel Aviv, Maccabi Tel Aviv, Beitar Jerusalem, Maccabi Haifa and Hapoel Beer Sheva.',
      intro: 'The clubs from here. Hapoel and Maccabi Tel Aviv, Beitar Jerusalem, Maccabi Haifa and Hapoel Beer Sheva - recent seasons and designs from the archive.',
    },
    match: byLeague('ליגת העל'),
  },
  {
    slug: 'champions-league',
    name: 'ליגת האלופות',
    title: 'חולצות ליגת האלופות | JerseyLab',
    h1: 'חולצות ליגת האלופות',
    description: 'חולצות מגרסאות ליגת האלופות - הדגמים עם הפאצ׳ים והעיצובים המיוחדים של המפעל האירופי.',
    intro: 'הגרסאות של ליגת האלופות - עם הפאצ׳ים, הכיתובים והעיצובים שהופיעו רק בערבים של אמצע השבוע.',
    en: {
      name: 'Champions League',
      title: 'Champions League Shirts | JerseyLab',
      h1: 'Champions League Shirts',
      description: 'Champions League versions - the designs with the patches and special details of the European competition.',
      intro: 'The Champions League versions - with the patches, lettering and designs that only appeared on midweek European nights.',
    },
    match: byLeague('ליגת האלופות'),
  },
];

// A collection with its copy in the site's language. The Hebrew fields stay
// the default, so the prerenderer and the Hebrew site read them unchanged.
export function localizeCollection(collection, english) {
  if (!collection || !english || !collection.en) return collection;
  return { ...collection, ...collection.en };
}

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
