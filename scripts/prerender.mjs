// Writes a real HTML file for every public route, after `vite build`.
//
// The site is a Vite SPA: the server sends 4.5KB with an empty <div id="root">
// and everything - title, description, canonical, structured data, the words on
// the page - appears only once JavaScript has run. Google does render JS, but
// in a second pass that can be days later, and it reads the canonical tag in
// the *first* pass, when it does not yet exist. Every one of the 185 pages was
// therefore served identical, contentless HTML. That is most of the reason the
// site surfaced for its own name and nothing else. AI crawlers are worse: most
// do not run JavaScript at all.
//
// This does not replace React. It writes a per-route <head> plus a plain-HTML
// version of the page inside #root. React clears that container on mount, so
// visitors get the app exactly as before; crawlers get a page with content.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import {
  ROOT, SITE_ORIGIN, escapeHtml, fetchShirts, fetchFaqs, fetchHeroImages, shirtPrice, shirtDescription,
} from './lib/build-data.mjs';
import { COLLECTIONS, collectionShirts } from '../src/lib/collections.js';
import { shirtNameEn, shirtDescriptionIn, termIn } from '../src/lib/english.js';
import { GUIDES } from '../src/lib/guides.js';
import { resized } from '../src/lib/imageUrl.js';

const DIST = resolve(ROOT, 'dist');
const TEMPLATE_PATH = resolve(DIST, 'index.html');
const DEFAULT_IMAGE = 'https://www.jerseylab.co/og-image.jpg';

if (!existsSync(TEMPLATE_PATH)) {
  console.error('[prerender] dist/index.html not found - run `vite build` first.');
  process.exit(1);
}
const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf8');

// The homepage is written back over this same file, so a template that already
// carries prerendered markup would nest one page inside another. Vite empties
// dist/ on every build, but fail loudly rather than ship that silently.
if (!TEMPLATE.includes('<div id="root"></div>')) {
  console.error('[prerender] dist/index.html is not a clean Vite template - run a fresh `vite build`.');
  process.exit(1);
}

// Mirrors the copy each page's <Seo> component sets at runtime. Kept here
// rather than imported because these files are JSX the build step cannot load.
const STATIC_PAGES = [
  {
    path: '/',
    en: {
      title: 'JerseyLab',
      shareTitle: "JerseyLab - Football Shirts for Collectors and Fans",
      description: "Football shirts for collectors and fans: club and national team kits, current seasons and retro, with name and number printing. Delivery across Israel.",
      h1: "Football shirts, rare ones included, at fair prices",
      body: "<p>JerseyLab sells football shirts - club kits, national teams, retro and player versions - and can source shirts that are not in the catalog.</p>",
    },
    title: 'JerseyLab',
    shareTitle: 'JerseyLab - חולצות כדורגל נדירות לאספנים ואוהדים',
    description: 'חולצות כדורגל איכותיות ונדירות לאספנים ואוהדים. מצא חולצות של קבוצות, נבחרות ושחקנים אהובים - חדשות, רטרו ומהדורות מיוחדות במחירים טובים.',
    h1: 'חולצות כדורגל איכותיות, נדירות ובמחירים טובים',
    body: `<p>JerseyLab מוכר חולצות כדורגל - חולצות מועדון, נבחרות, רטרו וגרסאות שחקן, ואפשר להזמין גם חולצות שלא נמצאות בקטלוג.</p>`,
  },
  {
    path: '/catalog',
    en: {
      title: "All Shirts - JerseyLab",
      description: "The full catalog of football shirts: clubs, national teams and players. Retro kits and special editions, with sizes S to 3XL.",
      h1: "Football shirt catalog",
      body: "<p>Every shirt in the catalog - by club, national team, season and size. Filter by retro, national teams and sale.</p>",
    },
    title: 'קטלוג - JerseyLab',
    description: 'קטלוג חולצות כדורגל: חולצות של קבוצות, נבחרות ושחקנים במחירים טובים. רטרו ומהדורות מיוחדות.',
    h1: 'קטלוג חולצות כדורגל',
    body: `<p>כל החולצות במלאי - לפי קבוצה, נבחרת, עונה ומידה. אפשר לסנן לפי רטרו, נבחרות וסייל.</p>`,
  },
  {
    path: '/mystery-box',
    en: {
      title: "Mystery Box - JerseyLab",
      description: "A surprise football shirt in the style and size you choose. Regular ₪70, retro ₪80, World Cup ₪70. Rule out teams and colours you don't want.",
      h1: "Mystery Box",
      body: "<p>You choose the style and size, and the shirt is drawn at random. Regular ₪70, World Cup ₪70, retro ₪80. Name and number ₪10, all patches ₪5, long sleeves ₪20, matching shorts ₪40. You can rule out teams and colours in advance, and order a box each for a group of friends.</p>",
    },
    title: 'מיסטרי בוקס - JerseyLab',
    description: 'מיסטרי בוקס של JerseyLab: חולצת כדורגל מפתיעה לפי סגנון ומידה שתבחר. רגיל ₪70, רטרו ₪80, מונדיאל ₪70. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל.',
    h1: 'מיסטרי בוקס',
    body: `<p>אתה בוחר סגנון ומידה - החולצה יוצאת אקראית. רגיל ₪70, מונדיאל ₪70, רטרו ₪80. תוספת שם ומספר ₪10, כל הפאצ'ים ₪5, שרוול ארוך ₪20, מכנס קצר ₪40. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל.</p>`,
  },
  {
    path: '/request-shirt',
    en: {
      title: "Looking for a Shirt We Don't Have? - JerseyLab",
      description: "Can't find the shirt in the catalog? Send us a photo or a description and we'll check whether we can get it, and at what price.",
      h1: "Looking for a shirt we don't have?",
      body: "<p>The catalog is not everything. Send a photo or a description - club, season and size - and we'll come back to you with an answer and a price.</p>",
    },
    title: 'מחפשים חולצה שאין באתר? - JerseyLab',
    description: 'לא מצאתם את החולצה בקטלוג? שלחו לנו בקשה עם תמונה או תיאור, ונבדוק אם אפשר להשיג אותה ובאיזה מחיר.',
    h1: 'מחפשים חולצה שאין באתר?',
    body: `<p>הקטלוג הוא לא הכל. שלחו תמונה או תיאור של החולצה שאתם מחפשים - קבוצה, עונה ומידה - ונחזור אליכם עם תשובה ומחיר.</p>`,
  },
  {
    path: '/faq',
    en: {
      title: "FAQ - JerseyLab",
      description: "Common questions about ordering football shirts from JerseyLab: how ordering works, payment, delivery, sizes and availability.",
      h1: "Questions and answers",
      body: "<p>Nothing is paid on the site. Sending an order is a request - we get back to you on WhatsApp or Instagram to confirm the details, and payment is arranged with us directly once everything is agreed.</p>",
    },
    title: 'שאלות ותשובות - JerseyLab',
    description: 'שאלות ותשובות נפוצות על רכישת חולצות כדורגל ב-JerseyLab: משלוחים, מידות, זמינות ופרטי הזמנה.',
    h1: 'שאלות ותשובות',
    body: `<p>באתר לא מתבצע תשלום. שליחת ההזמנה היא בקשה בלבד - נחזור אליך בוואטסאפ או באינסטגרם לאישור הפרטים, והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו.</p>`,
  },
  {
    path: '/contact',
    en: {
      title: "Contact Us - JerseyLab",
      description: "Contact JerseyLab on WhatsApp or Instagram for questions about sizes, availability and special orders.",
      h1: "Contact us",
      body: "<p>Reach us on WhatsApp at +972-50-558-6255 or on Instagram at @Jerseylabil. We're happy to help with sizes, availability and special orders.</p>",
    },
    title: 'צור קשר - JerseyLab',
    description: 'צור קשר עם JerseyLab לשאלות, הזמנות ויעוץ בוואטסאפ ואינסטגרם. מענה מהיר ושירות אישי.',
    h1: 'צור קשר',
    body: `<p>אפשר להשיג אותנו בוואטסאפ 050-558-6255 או באינסטגרם @Jerseylabil. נשמח לעזור עם מידות, זמינות והזמנות מיוחדות.</p>`,
  },
  {
    path: '/legal/terms',
    title: 'תנאי שימוש — JerseyLab',
    description: 'תנאי השימוש באתר JerseyLab: איך נוצרת הזמנה, מה המחירים כוללים, זכויות יוצרים ואחריות.',
    h1: 'תנאי שימוש',
    body: '<p>באתר לא מתבצע תשלום. שליחת טופס הזמנה היא בקשה בלבד, והעסקה נכרתת רק לאחר אישור הדדי בשיחה.</p>',
  },
  {
    path: '/legal/privacy',
    title: 'מדיניות פרטיות — JerseyLab',
    description: 'איזה מידע JerseyLab אוסף, לשם מה, למי הוא מועבר, כמה זמן הוא נשמר, ואילו זכויות יש לך לגביו.',
    h1: 'מדיניות פרטיות',
    body: '<p>נאסף רק המידע הדרוש לטיפול בהזמנה: שם, טלפון, דוא״ל וערוץ הקשר המועדף. המידע אינו נמכר ואינו מועבר למטרות שיווק. נכתב לפי חוק הגנת הפרטיות התשמ״א-1981, לרבות תיקון 13.</p>',
  },
  {
    path: '/legal/cookies',
    title: 'עוגיות וכלי מעקב — JerseyLab',
    description: 'אילו עוגיות ואחסון מקומי JerseyLab משתמש בהם, לשם מה, ואיך אפשר לשלוט בהם.',
    h1: 'עוגיות וכלי מעקב',
    body: '<p>האתר לא משתמש בעוגיות, ואין בו פרסום או מעקב בין אתרים. באחסון המקומי של הדפדפן נשמרים רק סל הקניות, החיבור לחשבון, פרטי קשר אחרונים, הגדרות תפריט הנגישות והגדרות הבאנר בדף הבית.</p>',
  },
  {
    path: '/legal/shipping',
    title: 'משלוחים, אספקה וביטול — JerseyLab',
    description: 'זמני אספקה, עלויות משלוח, איסוף עצמי, וזכות הביטול לפי חוק הגנת הצרכן.',
    h1: 'משלוחים, אספקה וביטול',
    body: '<p>מלאי בארץ עד 7 ימי עסקים, הזמנה מיוחדת עד 3 שבועות, ואיסוף עצמי בתיאום מקריית אונו. זכות ביטול של 14 יום לפי חוק הגנת הצרכן.</p>',
  },
  {
    path: '/legal/accessibility',
    title: 'הצהרת נגישות — JerseyLab',
    description: 'הצהרת הנגישות של JerseyLab: רמת ההנגשה, ההתאמות שבוצעו, מגבלות ידועות, ופרטי רכז הנגישות.',
    h1: 'הצהרת נגישות',
    body: '<p>האתר פועל להתאמה לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013, ולתקן הישראלי ת״י 5568 ברמה AA.</p>',
  },
  {
    path: '/legal/business',
    title: 'פרטי העסק — JerseyLab',
    description: 'פרטי העסק של JerseyLab: מי עומד מאחורי האתר, כתובת ודרכי יצירת קשר, כנדרש בחוק הגנת הצרכן.',
    h1: 'פרטי העסק',
    body: '<p>פרטי העסק המלאים, כנדרש בחוק הגנת הצרכן לעסקת מכר מרחוק.</p>',
  },
  {
    path: '/size-guide',
    en: {
      title: "Size Guide - JerseyLab",
      description: "Football shirt size guide: fan version, player version, women's and kids' size charts, and a calculator that suggests a size from your height, weight, build and preferred fit.",
      h1: "Size guide",
      body: "<p>Size charts for fan and player versions, for adults and kids, plus a calculator that suggests a size from height, weight, build and how you like the shirt to fit.</p>",
    },
    title: 'מדריך מידות - JerseyLab',
    description: 'מדריך מידות לחולצות כדורגל: טבלאות מידות לאוהד, גרסת שחקן, נשים וילדים. איך לבחור את המידה הנכונה לפי מידות הגוף.',
    h1: 'מדריך מידות',
    body: `<p>טבלאות מידות לחולצות אוהד וגרסת שחקן, למבוגרים ולילדים, לפי היקף חזה ואורך.</p>`,
  },
];

// --- head rewriting -------------------------------------------------------
// The template already carries site-wide tags; these are replaced per page so
// no two pages ship the same title and description.

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

function setMeta(html, matcher, attr, name, content) {
  const tag = `<meta ${attr}="${name}" content="${escapeHtml(content)}" />`;
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

// The English site is the same pages under /en (src/lib/i18n).
export const enPath = (path) => (path === '/' ? '/en' : `/en${path}`);

// The banner photo the home page will draw, so the browser starts fetching it
// with the HTML rather than after the app has booted.
const hero = await fetchHeroImages({ label: 'prerender' });

// `shareTitle` splits the tab from the card a shared link draws. Only the home
// page uses it: its tab is just the brand name, while the card still has to say
// what the site sells.
function buildHead(html, { path, title, shareTitle, description, image, lang = 'he', alternate = true, preloadHero = false }) {
  const en = lang === 'en';
  const url = SITE_ORIGIN + (en ? enPath(path) : path);
  const social = shareTitle || title;
  let out = setTitle(html, title);
  if (en) {
    out = out.replace('<html lang="he" dir="rtl">', '<html lang="en" dir="ltr">');
  }
  out = setMeta(out, /<meta name="description"[^>]*>/, 'name', 'description', description);
  out = setMeta(out, /<meta property="og:title"[^>]*>/, 'property', 'og:title', social);
  out = setMeta(out, /<meta property="og:description"[^>]*>/, 'property', 'og:description', description);
  out = setMeta(out, /<meta property="og:image"[^>]*>/, 'property', 'og:image', image || DEFAULT_IMAGE);
  out = setMeta(out, /<meta name="twitter:title"[^>]*>/, 'name', 'twitter:title', social);
  out = setMeta(out, /<meta name="twitter:description"[^>]*>/, 'name', 'twitter:description', description);
  out = setMeta(out, /<meta name="twitter:image"[^>]*>/, 'name', 'twitter:image', image || DEFAULT_IMAGE);
  out = setMeta(out, /<meta property="og:url"[^>]*>/, 'property', 'og:url', url);
  out = setMeta(out, /<meta property="og:locale"[^>]*>/, 'property', 'og:locale', en ? 'en_US' : 'he_IL');
  // Canonical in the served HTML is the whole point: it is read on the first
  // crawl, long before the client-side one exists. The hreflang pair beside it
  // says the two addresses are one page in two languages, which is what keeps
  // Google from reading the English side as a duplicate.
  const alternates = [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    // Only where the page exists in both languages. Pointing hreflang at a
    // page with no English version is worse than not pointing at all.
    ...(alternate ? [
      `<link rel="alternate" hreflang="he-IL" href="${escapeHtml(SITE_ORIGIN + path)}" />`,
      `<link rel="alternate" hreflang="en" href="${escapeHtml(SITE_ORIGIN + enPath(path))}" />`,
      `<link rel="alternate" hreflang="x-default" href="${escapeHtml(SITE_ORIGIN + path)}" />`,
    ] : []),
  ].join('\n    ');
  out = out.replace('</head>', `    ${alternates}\n  </head>`);
  if (preloadHero) {
    const preloads = [
      // The same addresses components/HomeHero will ask for, or the browser
      // downloads the banner twice.
      `<link rel="preload" as="image" href="${escapeHtml(resized(hero.mobile, 900))}" media="(max-width: 767px)" fetchpriority="high" />`,
      `<link rel="preload" as="image" href="${escapeHtml(resized(hero.desktop, 1600))}" media="(min-width: 768px)" fetchpriority="high" />`,
    ].join('\n    ');
    out = out.replace('</head>', `    ${preloads}\n  </head>`);
  }
  return out;
}

function withJsonLd(html, data) {
  if (!data) return html;
  // Escaped so a shirt name containing "</script>" cannot break out of the tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return html.replace('</head>', `    <script type="application/ld+json">${json}</script>\n  </head>`);
}

// React clears #root when it mounts, so this is crawler-facing content that
// costs visitors nothing. It is real markup - the same facts the rendered page
// shows.
//
// Until React mounts, though, a visitor used to see it: a bare heading, a
// paragraph and a row of blue links, for the second before the shop appeared.
// A style in index.html now keeps it off screen (still in the page for
// crawlers and screen readers) and shows the logo instead, the same loading
// screen the app puts up next, so the handover is invisible.
function withBody(html, inner) {
  return html.replace(
    '<div id="root"></div>',
    `<div id="root"><div id="boot-splash" aria-hidden="true"><img src="/logo-navbar-dark.png" alt="" width="391" height="128" /></div>` +
      `<div id="prerendered-content">${inner}</div></div>`,
  );
}

const NAV = {
  he: { label: 'ניווט', links: [['/catalog', 'קטלוג'], ['/mystery-box', 'מיסטרי בוקס'], ['/request-shirt', 'בקשת חולצה'], ['/size-guide', 'מדריך מידות'], ['/faq', 'שאלות ותשובות'], ['/contact', 'צור קשר']] },
  en: { label: 'Navigation', links: [['/catalog', 'All shirts'], ['/mystery-box', 'Mystery Box'], ['/request-shirt', 'Request a shirt'], ['/size-guide', 'Size guide'], ['/faq', 'FAQ'], ['/contact', 'Contact']] },
};

function shell({ h1, body, lang = 'he' }) {
  const nav = NAV[lang];
  const at = (path) => (lang === 'en' ? enPath(path) : path);
  return `<header><a href="${at('/')}">JerseyLab</a></header><main><h1>${escapeHtml(h1)}</h1>${body}</main>` +
    `<nav aria-label="${nav.label}">${nav.links.map(([path, label]) => `<a href="${at(path)}">${escapeHtml(label)}</a>`).join(' ')}</nav>`;
}

// Written as flat `<route>.html` files, paired with `"cleanUrls": true` in
// vercel.json so Vercel serves dist/shirt/abc.html at /shirt/abc - the exact
// URL the sitemap advertises and Google will crawl. Directory-index resolution
// for an extensionless path is host-specific behaviour; this is documented and
// explicit instead. Routes with no file (a shirt added since the last build,
// /profile, /admin) fall through to the SPA rewrite and render client-side as
// they always did.
function writePage(path, html) {
  const target = path === '/'
    ? resolve(DIST, 'index.html')
    : resolve(DIST, `.${path}.html`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html, 'utf8');
}

// --- pages ----------------------------------------------------------------

const organisation = {
  '@type': 'OnlineStore',
  '@id': `${SITE_ORIGIN}/#shop`,
  name: 'JerseyLab',
  url: SITE_ORIGIN,
  logo: DEFAULT_IMAGE,
  image: DEFAULT_IMAGE,
  description: 'חנות חולצות כדורגל לאספנים ולאוהדים: חולצות מועדונים ונבחרות, חדשות ורטרו, עם הדפסת שם ומספר.',
  currenciesAccepted: 'ILS',
  areaServed: { '@type': 'Country', name: 'Israel' },
  sameAs: ['https://instagram.com/Jerseylabil'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: '+972505586255',
    availableLanguage: ['he', 'en'],
    url: `${SITE_ORIGIN}/contact`,
  },
};

// Google wants to know what an order costs to ship and how it can be sent
// back before it will show a price and availability in the results. The
// numbers are the ones on the shipping policy (lib/business), and the 14-day
// right to cancel is the one the Consumer Protection Law gives.
const SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: 25, currency: 'ILS' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IL' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 5, maxValue: 21, unitCode: 'DAY' },
  },
};

const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'IL',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
  returnShippingFeesAmount: { '@type': 'MonetaryAmount', value: 25, currency: 'ILS' },
  merchantReturnLink: `${SITE_ORIGIN}/legal/shipping`,
};

// A year out: the tag only has to say the price is not stale, and the build
// runs often enough to keep pushing it forward.
const priceValidUntil = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const faqs = await fetchFaqs({ label: 'prerender' });

// Always present, whatever is in the database: a customer must never reach the
// FAQ without finding out that nothing is paid on the site.
const HOW_IT_WORKS_FAQ = {
  question: 'איך מזמינים? האם משלמים באתר?',
  answer: 'באתר לא מתבצע תשלום. שליחת ההזמנה היא בקשה בלבד. אנחנו חוזרים אליך בוואטסאפ או באינסטגרם לאישור כל הפרטים, והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו.',
};

// A page with English copy is written twice: the Hebrew one at its own
// address and the English one under /en. Pages without it - the legal ones,
// which are binding in Hebrew - stay Hebrew only.
for (const page of STATIC_PAGES) {
  for (const lang of page.en ? ['he', 'en'] : ['he']) {
  const copy = lang === 'en' ? { ...page, ...page.en } : page;
  let html = buildHead(TEMPLATE, { ...copy, path: page.path, lang, alternate: !!page.en, preloadHero: page.path === '/' });

  const graph = [
    organisation,
    {
      '@type': page.path === '/' ? 'WebSite' : 'WebPage',
      name: copy.title,
      description: copy.description,
      url: SITE_ORIGIN + (lang === 'en' ? enPath(page.path) : page.path),
      inLanguage: lang === 'en' ? 'en' : 'he-IL',
      ...(page.path === '/' ? {
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_ORIGIN}/catalog?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      } : {}),
    },
  ];

  let body = copy.body;

  // The questions are written in the admin in Hebrew, so only the Hebrew
  // page carries them.
  if (page.path === '/faq' && lang === 'he') {
    const entries = [HOW_IT_WORKS_FAQ, ...faqs];
    graph.push({
      '@type': 'FAQPage',
      mainEntity: entries.map(f => ({
        '@type': 'Question',
        name: f.question.trim(),
        acceptedAnswer: { '@type': 'Answer', text: f.answer.trim() },
      })),
    });
    // The questions and answers also go into the served markup, not only the
    // structured data - a crawler that ignores JSON-LD still gets the text.
    body += `<dl>${entries.map(f =>
      `<dt>${escapeHtml(f.question.trim())}</dt><dd>${escapeHtml(f.answer.trim())}</dd>`
    ).join('')}</dl>`;
  }

  html = withJsonLd(html, { '@context': 'https://schema.org', '@graph': graph });
  writePage(lang === 'en' ? enPath(page.path) : page.path, withBody(html, shell({ ...copy, body, lang })));
  }
}

const shirts = await fetchShirts({ label: 'prerender' });

for (const shirt of shirts) {
  const path = `/shirt/${shirt.id}`;
  const price = shirtPrice(shirt);

  // The English page only exists where the shirt has an English name; a
  // shirt whose club is not in the translation list would otherwise be a
  // Hebrew page at an English address.
  for (const lang of shirtNameEn(shirt) ? ['he', 'en'] : ['he']) {
  const en = lang === 'en';
  const url = SITE_ORIGIN + (en ? enPath(path) : path);
  const name = en ? shirtNameEn(shirt) : shirt.name;
  const description = en ? shirtDescriptionIn(shirt, true) : shirtDescription(shirt);
  const title = `${name} - JerseyLab`;

  let html = buildHead(TEMPLATE, { path, title, description, image: shirt.main_image, lang, alternate: !!shirtNameEn(shirt) });
  html = withJsonLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name,
        description,
        url,
        ...(shirt.main_image ? { image: [shirt.main_image] } : {}),
        sku: shirt.id,
        brand: { '@type': 'Brand', name: 'JerseyLab' },
        ...(shirt.club || shirt.national_team
          ? { audience: { '@type': 'Audience', name: en ? `${termIn(shirt.club || shirt.national_team, true)} fans` : `אוהדי ${shirt.club || shirt.national_team}` } }
          : {}),
        offers: {
          '@type': 'Offer',
          url,
          price,
          priceCurrency: 'ILS',
          priceValidUntil: priceValidUntil(),
          availability: shirt.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: shirt.condition && shirt.condition !== 'new'
            ? 'https://schema.org/UsedCondition'
            : 'https://schema.org/NewCondition',
          seller: { '@id': `${SITE_ORIGIN}/#shop` },
          shippingDetails: SHIPPING_DETAILS,
          hasMerchantReturnPolicy: RETURN_POLICY,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: en ? 'Home' : 'דף הבית', item: SITE_ORIGIN + (en ? '/en' : '/') },
          { '@type': 'ListItem', position: 2, name: en ? 'All shirts' : 'קטלוג', item: SITE_ORIGIN + (en ? enPath('/catalog') : '/catalog') },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
    ],
  });

  const facts = [
    [en ? 'Team' : 'קבוצה', termIn(shirt.club || shirt.national_team, en)],
    [en ? 'Season' : 'עונה', shirt.season],
    [en ? 'Player' : 'שחקן', shirt.player_name],
    [en ? 'League' : 'ליגה', termIn(shirt.league, en)],
    [en ? 'Sizes' : 'מידות', Array.isArray(shirt.sizes) ? shirt.sizes.join(', ')
      : shirt.sizes && typeof shirt.sizes === 'object' ? Object.keys(shirt.sizes).join(', ') : null],
  ].filter(([, v]) => v);

  const inner =
    `<header><a href="${en ? '/en' : '/'}">JerseyLab</a> · <a href="${en ? enPath('/catalog') : '/catalog'}">${en ? 'All shirts' : 'קטלוג'}</a></header>` +
    `<main><h1>${escapeHtml(name)}</h1>` +
    (shirt.main_image ? `<img src="${escapeHtml(shirt.main_image)}" alt="${escapeHtml(name)}" width="600" />` : '') +
    (price ? `<p><strong>₪${escapeHtml(price)}</strong></p>` : '') +
    `<p>${escapeHtml(description)}</p>` +
    (facts.length ? `<ul>${facts.map(([k, v]) => `<li>${escapeHtml(k)}: ${escapeHtml(v)}</li>`).join('')}</ul>` : '') +
    `<p><a href="${escapeHtml(url)}">${en ? `Order the ${escapeHtml(name)}` : `להזמנת ${escapeHtml(name)}`}</a></p></main>`;

  writePage(en ? enPath(path) : path, withBody(html, inner));
  }
}

// --- collection landing pages --------------------------------------------
// These are the pages meant to rank for "חולצות רטרו" and the like, so the
// served HTML carries the intro copy, the real list of shirts in the
// collection, and an ItemList linking to each one - which is also how a
// crawler discovers product pages without following JavaScript.

for (const source of COLLECTIONS) {
  const path = `/collections/${source.slug}`;
  const items = collectionShirts(source, shirts);

  for (const lang of source.en ? ['he', 'en'] : ['he']) {
  const en = lang === 'en';
  const collection = en ? { ...source, ...source.en } : source;
  const url = SITE_ORIGIN + (en ? enPath(path) : path);

  let html = buildHead(TEMPLATE, {
    path,
    lang,
    alternate: !!source.en,
    title: collection.title,
    description: collection.description,
    image: items.find(s => s.main_image)?.main_image,
  });

  html = withJsonLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: collection.h1,
        description: collection.description,
        url,
        inLanguage: en ? 'en' : 'he-IL',
      },
      {
        '@type': 'ItemList',
        name: collection.h1,
        numberOfItems: items.length,
        itemListElement: items.slice(0, 40).map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: SITE_ORIGIN + (en && shirtNameEn(s) ? enPath(`/shirt/${s.id}`) : `/shirt/${s.id}`),
          name: (en && shirtNameEn(s)) || s.name,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: en ? 'Home' : 'דף הבית', item: SITE_ORIGIN + (en ? '/en' : '/') },
          { '@type': 'ListItem', position: 2, name: en ? 'All shirts' : 'קטלוג', item: SITE_ORIGIN + (en ? enPath('/catalog') : '/catalog') },
          { '@type': 'ListItem', position: 3, name: collection.h1, item: url },
        ],
      },
    ],
  });

  const list = items.length
    ? `<ul>${items.map(s => {
        const price = shirtPrice(s);
        const shirtName = (en && shirtNameEn(s)) || s.name;
        const shirtPath = en && shirtNameEn(s) ? enPath(`/shirt/${s.id}`) : `/shirt/${s.id}`;
        return `<li><a href="${escapeHtml(shirtPath)}">${escapeHtml(shirtName)}</a>${price ? ` - ₪${escapeHtml(price)}` : ''}</li>`;
      }).join('')}</ul>`
    : en
      ? `<p>Nothing in this category right now. <a href="${enPath('/request-shirt')}">Send us a request</a> and we'll see if we can get it.</p>`
      : `<p>אין כרגע מלאי בקטגוריה הזו. <a href="/request-shirt">אפשר לשלוח לנו בקשה</a> ונבדוק אם אפשר להשיג.</p>`;

  const related = `<nav aria-label="${en ? 'More categories' : 'קטגוריות נוספות'}">${
    COLLECTIONS.filter(c => c.slug !== collection.slug)
      .map(c => {
        const other = en && c.en ? { ...c, ...c.en } : c;
        const href = en && c.en ? enPath(`/collections/${c.slug}`) : `/collections/${c.slug}`;
        return `<a href="${escapeHtml(href)}">${escapeHtml(other.name)}</a>`;
      })
      .join(' ')
  }</nav>`;

  const inner =
    `<header><a href="${en ? '/en' : '/'}">JerseyLab</a> · <a href="${en ? enPath('/catalog') : '/catalog'}">${en ? 'All shirts' : 'קטלוג'}</a></header>` +
    `<main><h1>${escapeHtml(collection.h1)}</h1>` +
    `<p>${escapeHtml(collection.intro)}</p>` +
    `<p>${en ? `${escapeHtml(items.length)} shirts in this category.` : `${escapeHtml(items.length)} חולצות בקטגוריה.`}</p>` +
    list +
    `</main>${related}`;

  writePage(en ? enPath(path) : path, withBody(html, inner));
  }
}

// --- guides ---------------------------------------------------------------
// The articles (src/lib/guides), written out in full so a crawler that runs
// no JavaScript - and an AI assistant quoting an answer - gets the whole text.

const guideIndex = {
  path: '/guides',
  title: 'מדריכים - JerseyLab',
  description: 'מדריכים על חולצות כדורגל: איך לזהות חולצה מקורית, ההבדל בין גרסת אוהד לגרסת שחקן, חולצות הרטרו המפורסמות, ומה קונים לאוהד.',
  h1: 'מדריכים',
};

const guideIndexEn = {
  path: '/guides',
  title: 'Guides - JerseyLab',
  description: 'Guides to football shirts: how to tell an original from a replica, fan version against player version, the famous retro shirts, and what to buy a fan.',
  h1: 'Guides',
};

for (const lang of ['he', 'en']) {
  const en = lang === 'en';
  const index = en ? guideIndexEn : guideIndex;
  let html = buildHead(TEMPLATE, { ...index, lang });
  html = withJsonLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      organisation,
      {
        '@type': 'CollectionPage',
        name: index.h1,
        description: index.description,
        url: SITE_ORIGIN + (en ? enPath('/guides') : '/guides'),
        inLanguage: en ? 'en' : 'he-IL',
      },
    ],
  });
  const list = `<ul>${GUIDES.map(source => {
    const g = en ? { ...source, ...source.en } : source;
    const href = en ? enPath(`/guides/${source.slug}`) : `/guides/${source.slug}`;
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(g.h1)}</a> - ${escapeHtml(g.description)}</li>`;
  }).join('')}</ul>`;
  writePage(en ? enPath('/guides') : '/guides', withBody(html, shell({ h1: index.h1, body: list, lang })));
}

for (const source of GUIDES) {
  const path = `/guides/${source.slug}`;
  for (const lang of ['he', 'en']) {
  const en = lang === 'en';
  const guide = en ? { ...source, ...source.en } : source;
  const url = SITE_ORIGIN + (en ? enPath(path) : path);
  let html = buildHead(TEMPLATE, {
    path,
    lang,
    title: guide.title,
    description: guide.description,
  });
  html = withJsonLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      organisation,
      {
        '@type': 'Article',
        headline: guide.h1,
        description: guide.description,
        url,
        mainEntityOfPage: url,
        inLanguage: en ? 'en' : 'he-IL',
        publisher: { '@id': `${SITE_ORIGIN}/#shop` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: en ? 'Home' : 'דף הבית', item: SITE_ORIGIN + (en ? '/en' : '/') },
          { '@type': 'ListItem', position: 2, name: en ? 'Guides' : 'מדריכים', item: SITE_ORIGIN + (en ? enPath('/guides') : '/guides') },
          { '@type': 'ListItem', position: 3, name: guide.h1, item: url },
        ],
      },
    ],
  });

  const article = `<p>${escapeHtml(guide.intro)}</p>` + guide.sections.map(section =>
    `<h2>${escapeHtml(section.h2)}</h2>` +
    (section.paragraphs || []).map(text => `<p>${escapeHtml(text)}</p>`).join('') +
    (section.list ? `<ul>${section.list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '')).join('') +
    `<nav aria-label="${en ? 'Links from this guide' : 'קישורים מהמדריך'}">${guide.links.map(link =>
      `<a href="${escapeHtml(en ? enPath(link.to) : link.to)}">${escapeHtml(link.label)}</a>`).join(' ')}</nav>`;

  writePage(en ? enPath(path) : path, withBody(html, shell({ h1: guide.h1, body: article, lang })));
  }
}

console.log(`[prerender] ${STATIC_PAGES.length} static + ${COLLECTIONS.length} collection + ${shirts.length} product + ${GUIDES.length + 1} guide pages written to dist/, in Hebrew and, where there is English copy, in English`);
