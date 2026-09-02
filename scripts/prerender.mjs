// Writes a real HTML file for every public route, after `vite build`.
//
// The site is a Vite SPA: the server sends 4.5KB with an empty <div id="root">
// and everything — title, description, canonical, structured data, the words on
// the page — appears only once JavaScript has run. Google does render JS, but
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
  ROOT, SITE_ORIGIN, escapeHtml, fetchShirts, fetchFaqs, shirtPrice, shirtDescription,
} from './lib/build-data.mjs';
import { COLLECTIONS, collectionShirts } from '../src/lib/collections.js';

const DIST = resolve(ROOT, 'dist');
const TEMPLATE_PATH = resolve(DIST, 'index.html');
const DEFAULT_IMAGE = 'https://media.base44.com/images/public/6a42e762005950f7dc39df84/de8c45ac1_ChatGPTImageJul31202602_56_05AM.png';

if (!existsSync(TEMPLATE_PATH)) {
  console.error('[prerender] dist/index.html not found — run `vite build` first.');
  process.exit(1);
}
const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf8');

// The homepage is written back over this same file, so a template that already
// carries prerendered markup would nest one page inside another. Vite empties
// dist/ on every build, but fail loudly rather than ship that silently.
if (!TEMPLATE.includes('<div id="root"></div>')) {
  console.error('[prerender] dist/index.html is not a clean Vite template — run a fresh `vite build`.');
  process.exit(1);
}

// Mirrors the copy each page's <Seo> component sets at runtime. Kept here
// rather than imported because these files are JSX the build step cannot load.
const STATIC_PAGES = [
  {
    path: '/',
    title: 'JerseyLab — חולצות כדורגל נדירות לאספנים ואוהדים',
    description: 'חולצות כדורגל איכותיות ונדירות לאספנים ואוהדים. מצא חולצות של קבוצות, נבחרות ושחקנים אהובים — חדשות, רטרו ומהדורות מיוחדות במחירים טובים.',
    h1: 'חולצות כדורגל איכותיות, נדירות ובמחירים טובים',
    body: `<p>JerseyLab מוכר חולצות כדורגל מקוריות — חולצות מועדון, נבחרות, רטרו וגרסאות שחקן. מלאי בארץ עם משלוח מהיר, והזמנות מיוחדות של חולצות שלא נמצאות בקטלוג.</p>`,
  },
  {
    path: '/catalog',
    title: 'קטלוג — JerseyLab',
    description: 'קטלוג חולצות כדורגל: חולצות של קבוצות, נבחרות ושחקנים במחירים טובים. רטרו, מהדורות מיוחדות ומלאי זמין בארץ.',
    h1: 'קטלוג חולצות כדורגל',
    body: `<p>כל החולצות במלאי — לפי קבוצה, נבחרת, עונה ומידה. אפשר לסנן לפי רטרו, נבחרות, סייל ומלאי זמין בארץ.</p>`,
  },
  {
    path: '/mystery-box',
    title: 'מיסטרי בוקס — JerseyLab',
    description: 'מיסטרי בוקס של JerseyLab: חולצת כדורגל מפתיעה לפי סגנון ומידה שתבחר. רגיל ₪70, רטרו ₪90, מונדיאל ₪70. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל.',
    h1: 'מיסטרי בוקס',
    body: `<p>אתה בוחר סגנון ומידה — אנחנו בוחרים את החולצה. רגיל ₪70, מונדיאל ₪70, רטרו ₪90. תוספת שם ומספר ₪10, כל הפאצ'ים ₪5. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל.</p>`,
  },
  {
    path: '/request-shirt',
    title: 'מחפשים חולצה שאין באתר? — JerseyLab',
    description: 'לא מצאתם את החולצה בקטלוג? שלחו לנו בקשה עם תמונה או תיאור, ונבדוק אם אפשר להשיג אותה ובאיזה מחיר.',
    h1: 'מחפשים חולצה שאין באתר?',
    body: `<p>הקטלוג הוא לא הכל. שלחו תמונה או תיאור של החולצה שאתם מחפשים — קבוצה, עונה ומידה — ונחזור אליכם עם תשובה ומחיר.</p>`,
  },
  {
    path: '/faq',
    title: 'שאלות ותשובות — JerseyLab',
    description: 'שאלות ותשובות נפוצות על רכישת חולצות כדורגל ב-JerseyLab: משלוחים, מידות, זמינות ופרטי הזמנה.',
    h1: 'שאלות ותשובות',
    body: `<p>באתר לא מתבצע תשלום. שליחת ההזמנה היא בקשה בלבד — נחזור אליך בוואטסאפ או באינסטגרם לאישור הפרטים, והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו.</p>`,
  },
  {
    path: '/contact',
    title: 'צור קשר — JerseyLab',
    description: 'צור קשר עם JerseyLab לשאלות, הזמנות ויעוץ בוואטסאפ ואינסטגרם. מענה מהיר ושירות אישי.',
    h1: 'צור קשר',
    body: `<p>אפשר להשיג אותנו בוואטסאפ 050-558-6255 או באינסטגרם @Jerseylabil. נשמח לעזור עם מידות, זמינות והזמנות מיוחדות.</p>`,
  },
  {
    path: '/size-guide',
    title: 'מדריך מידות — JerseyLab',
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

function buildHead(html, { path, title, description, image }) {
  const url = SITE_ORIGIN + path;
  let out = setTitle(html, title);
  out = setMeta(out, /<meta name="description"[^>]*>/, 'name', 'description', description);
  out = setMeta(out, /<meta property="og:title"[^>]*>/, 'property', 'og:title', title);
  out = setMeta(out, /<meta property="og:description"[^>]*>/, 'property', 'og:description', description);
  out = setMeta(out, /<meta property="og:image"[^>]*>/, 'property', 'og:image', image || DEFAULT_IMAGE);
  out = setMeta(out, /<meta name="twitter:title"[^>]*>/, 'name', 'twitter:title', title);
  out = setMeta(out, /<meta name="twitter:description"[^>]*>/, 'name', 'twitter:description', description);
  out = setMeta(out, /<meta name="twitter:image"[^>]*>/, 'name', 'twitter:image', image || DEFAULT_IMAGE);
  out = setMeta(out, /<meta property="og:url"[^>]*>/, 'property', 'og:url', url);
  // Canonical in the served HTML is the whole point: it is read on the first
  // crawl, long before the client-side one exists.
  out = out.replace('</head>', `    <link rel="canonical" href="${escapeHtml(url)}" />\n  </head>`);
  return out;
}

function withJsonLd(html, data) {
  if (!data) return html;
  // Escaped so a shirt name containing "</script>" cannot break out of the tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return html.replace('</head>', `    <script type="application/ld+json">${json}</script>\n  </head>`);
}

// React clears #root when it mounts, so this is crawler-facing content that
// costs visitors nothing. It is real markup, not hidden text — the same facts
// the rendered page shows.
function withBody(html, inner) {
  return html.replace(
    '<div id="root"></div>',
    `<div id="root"><div id="prerendered-content">${inner}</div></div>`,
  );
}

function shell({ h1, body }) {
  return `<header><a href="/">JerseyLab</a></header><main><h1>${escapeHtml(h1)}</h1>${body}</main>` +
    `<nav aria-label="ניווט"><a href="/catalog">קטלוג</a> <a href="/mystery-box">מיסטרי בוקס</a> ` +
    `<a href="/request-shirt">בקשת חולצה</a> <a href="/size-guide">מדריך מידות</a> ` +
    `<a href="/faq">שאלות ותשובות</a> <a href="/contact">צור קשר</a></nav>`;
}

// Written as flat `<route>.html` files, paired with `"cleanUrls": true` in
// vercel.json so Vercel serves dist/shirt/abc.html at /shirt/abc — the exact
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
  '@type': 'Organization',
  name: 'JerseyLab',
  url: SITE_ORIGIN,
  logo: DEFAULT_IMAGE,
  sameAs: ['https://instagram.com/Jerseylabil'],
};

const faqs = await fetchFaqs({ label: 'prerender' });

// Always present, whatever is in the database: a customer must never reach the
// FAQ without finding out that nothing is paid on the site.
const HOW_IT_WORKS_FAQ = {
  question: 'איך מזמינים? האם משלמים באתר?',
  answer: 'באתר לא מתבצע תשלום. שליחת ההזמנה היא בקשה בלבד. אנחנו חוזרים אליך בוואטסאפ או באינסטגרם לאישור כל הפרטים, והתשלום מתבצע מולנו ישירות רק אחרי שסיכמנו.',
};

for (const page of STATIC_PAGES) {
  let html = buildHead(TEMPLATE, page);

  const graph = [
    organisation,
    {
      '@type': page.path === '/' ? 'WebSite' : 'WebPage',
      name: page.title,
      description: page.description,
      url: SITE_ORIGIN + page.path,
      inLanguage: 'he-IL',
      ...(page.path === '/' ? {
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_ORIGIN}/catalog?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      } : {}),
    },
  ];

  let body = page.body;

  if (page.path === '/faq') {
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
    // structured data — a crawler that ignores JSON-LD still gets the text.
    body += `<dl>${entries.map(f =>
      `<dt>${escapeHtml(f.question.trim())}</dt><dd>${escapeHtml(f.answer.trim())}</dd>`
    ).join('')}</dl>`;
  }

  html = withJsonLd(html, { '@context': 'https://schema.org', '@graph': graph });
  writePage(page.path, withBody(html, shell({ ...page, body })));
}

const shirts = await fetchShirts({ label: 'prerender' });

for (const shirt of shirts) {
  const path = `/shirt/${shirt.id}`;
  const url = SITE_ORIGIN + path;
  const price = shirtPrice(shirt);
  const description = shirtDescription(shirt);
  const title = `${shirt.name} — JerseyLab`;

  let html = buildHead(TEMPLATE, { path, title, description, image: shirt.main_image });
  html = withJsonLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: shirt.name,
        description,
        url,
        ...(shirt.main_image ? { image: [shirt.main_image] } : {}),
        sku: shirt.id,
        brand: { '@type': 'Brand', name: shirt.club || shirt.national_team || 'JerseyLab' },
        offers: {
          '@type': 'Offer',
          url,
          price,
          priceCurrency: 'ILS',
          availability: shirt.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          ...(shirt.condition && shirt.condition !== 'new' ? { itemCondition: 'https://schema.org/UsedCondition' } : {}),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'דף הבית', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'קטלוג', item: `${SITE_ORIGIN}/catalog` },
          { '@type': 'ListItem', position: 3, name: shirt.name, item: url },
        ],
      },
    ],
  });

  const facts = [
    ['קבוצה', shirt.club || shirt.national_team],
    ['עונה', shirt.season],
    ['שחקן', shirt.player_name],
    ['ליגה', shirt.league],
    ['מידות', Array.isArray(shirt.sizes) ? shirt.sizes.join(', ')
      : shirt.sizes && typeof shirt.sizes === 'object' ? Object.keys(shirt.sizes).join(', ') : null],
  ].filter(([, v]) => v);

  const inner =
    `<header><a href="/">JerseyLab</a> · <a href="/catalog">קטלוג</a></header>` +
    `<main><h1>${escapeHtml(shirt.name)}</h1>` +
    (shirt.main_image ? `<img src="${escapeHtml(shirt.main_image)}" alt="${escapeHtml(shirt.name)}" width="600" />` : '') +
    (price ? `<p><strong>₪${escapeHtml(price)}</strong></p>` : '') +
    `<p>${escapeHtml(description)}</p>` +
    (facts.length ? `<ul>${facts.map(([k, v]) => `<li>${escapeHtml(k)}: ${escapeHtml(v)}</li>`).join('')}</ul>` : '') +
    `<p><a href="${escapeHtml(url)}">להזמנת ${escapeHtml(shirt.name)}</a></p></main>`;

  writePage(path, withBody(html, inner));
}

// --- collection landing pages --------------------------------------------
// These are the pages meant to rank for "חולצות רטרו" and the like, so the
// served HTML carries the intro copy, the real list of shirts in the
// collection, and an ItemList linking to each one — which is also how a
// crawler discovers product pages without following JavaScript.

for (const collection of COLLECTIONS) {
  const path = `/collections/${collection.slug}`;
  const url = SITE_ORIGIN + path;
  const items = collectionShirts(collection, shirts);

  let html = buildHead(TEMPLATE, {
    path,
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
        inLanguage: 'he-IL',
      },
      {
        '@type': 'ItemList',
        name: collection.h1,
        numberOfItems: items.length,
        itemListElement: items.slice(0, 40).map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_ORIGIN}/shirt/${s.id}`,
          name: s.name,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'דף הבית', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'קטלוג', item: `${SITE_ORIGIN}/catalog` },
          { '@type': 'ListItem', position: 3, name: collection.h1, item: url },
        ],
      },
    ],
  });

  const list = items.length
    ? `<ul>${items.map(s => {
        const price = shirtPrice(s);
        return `<li><a href="/shirt/${escapeHtml(s.id)}">${escapeHtml(s.name)}</a>${price ? ` — ₪${escapeHtml(price)}` : ''}</li>`;
      }).join('')}</ul>`
    : `<p>אין כרגע מלאי בקטגוריה הזו. <a href="/request-shirt">אפשר לשלוח לנו בקשה</a> ונבדוק אם אפשר להשיג.</p>`;

  const related = `<nav aria-label="קטגוריות נוספות">${
    COLLECTIONS.filter(c => c.slug !== collection.slug)
      .map(c => `<a href="/collections/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a>`)
      .join(' ')
  }</nav>`;

  const inner =
    `<header><a href="/">JerseyLab</a> · <a href="/catalog">קטלוג</a></header>` +
    `<main><h1>${escapeHtml(collection.h1)}</h1>` +
    `<p>${escapeHtml(collection.intro)}</p>` +
    `<p>${escapeHtml(items.length)} חולצות בקטגוריה.</p>` +
    list +
    `</main>${related}`;

  writePage(path, withBody(html, inner));
}

console.log(`[prerender] ${STATIC_PAGES.length} static + ${COLLECTIONS.length} collection + ${shirts.length} product pages written to dist/`);
