// The shop's navigation: what the header menus, the mobile menu and the footer
// link to. One list, so a category added here appears everywhere at once.
//
// Clubs link to their collection page when there is one and to a search
// otherwise. Every entry is checked against the stock counted at build time
// (lib/catalogFacets), so a menu never offers a page with nothing on it.

import { COLLECTIONS } from '@/lib/collections';
import { linkHasStock, withStock } from '@/lib/catalogFacets';

const collectionHref = (slug) => `/collections/${slug}`;
const searchHref = (query) => `/catalog?q=${encodeURIComponent(query)}`;

// `query` is the spelling stored on the shirts, which is what search matches,
// when it differs from the label a customer reads ("צ׳לסי" is stored "צלסי").
function club(label, { slug, query } = {}) {
  const hasPage = slug && COLLECTIONS.some(c => c.slug === slug);
  return { label, href: hasPage ? collectionHref(slug) : searchHref(query || label) };
}

// Clubs grouped by league, most stocked first within each.
const CLUB_GROUPS = [
  {
    label: 'לה ליגה', href: collectionHref('la-liga'), image: 'collection:la-liga',
    links: [
      club('ריאל מדריד', { slug: 'real-madrid' }),
      club('ברצלונה', { slug: 'barcelona' }),
      club('אתלטיקו מדריד', { slug: 'atletico-madrid' }),
      club('ולנסיה'),
      club('ראיו וייקאנו'),
    ],
  },
  {
    label: 'פרמייר ליג', href: collectionHref('premier-league'), image: 'collection:premier-league',
    links: [
      club('צ׳לסי', { slug: 'chelsea' }),
      club('טוטנהאם'),
      club('ארסנל'),
      club('ליברפול'),
      club('מנצ׳סטר יונייטד', { query: 'מנצסטר יונייטד' }),
      club('מנצ׳סטר סיטי', { query: 'מנצסטר סיטי' }),
      club('ניוקאסל'),
    ],
  },
  {
    label: 'סרייה א', href: collectionHref('serie-a'), image: 'collection:serie-a',
    links: [
      club('מילאן', { slug: 'milan' }),
      club('אינטר', { slug: 'inter' }),
      club('רומא', { slug: 'roma' }),
      club('יובנטוס'),
      club('נאפולי'),
    ],
  },
  {
    label: 'ליגת העל', href: collectionHref('israeli-league'), image: 'collection:israeli-league',
    links: [
      club('הפועל תל אביב', { slug: 'hapoel-tel-aviv' }),
      club('ביתר ירושלים', { slug: 'beitar-jerusalem' }),
      club('מכבי תל אביב'),
      club('מכבי חיפה'),
      club('הפועל באר שבע'),
    ],
  },
  {
    label: 'עוד מהעולם', href: '/catalog', image: 'collection:psg',
    links: [
      club('פריז סן ז׳רמן', { slug: 'psg' }),
      club('אינטר מיאמי', { slug: 'inter-miami' }),
      club('באיירן מינכן', { slug: 'bayern-munich' }),
      club('דורטמונד'),
      club('אייאקס'),
      club('בוקה ג׳וניורס', { query: 'בוקה גוניורס' }),
      club('בנפיקה'),
      club('פורטו'),
    ],
  },
];

export const CLUBS_MENU = CLUB_GROUPS
  .map(group => ({ ...group, links: withStock(group.links) }))
  .filter(group => group.links.length > 0);

const NATIONAL_TEAMS = [
  'ברזיל', 'הולנד', 'פורטוגל', 'אנגליה', 'ספרד', 'איטליה', 'גרמניה', 'צרפת',
  'יפן', 'ארגנטינה', 'בלגיה', 'קרואטיה', 'מקסיקו', 'ארצות הברית', 'דרום קוריאה', 'אורוגוואי',
];

export const NATIONAL_MENU = {
  card: { label: 'כל הנבחרות', href: collectionHref('national-teams'), image: 'collection:national-teams' },
  links: NATIONAL_TEAMS.map(name => ({ label: name, href: searchHref(name) })),
};

export const SHIRTS_MENU = {
  cards: withStock([
    { label: 'חדשים באתר', href: '/catalog?new=true', image: 'new=true' },
    { label: 'נבחרות', href: collectionHref('national-teams'), image: 'collection:national-teams' },
    { label: 'רטרו', href: collectionHref('retro'), image: 'collection:retro' },
    { label: 'ליגת האלופות', href: collectionHref('champions-league'), image: 'collection:champions-league' },
    { label: 'הנמכרים ביותר', href: '/catalog?best=true', image: 'best=true' },
  ]).slice(0, 5),
  links: withStock([
    { label: 'כל החולצות', href: '/catalog' },
    { label: 'מלאי בארץ', href: '/catalog?fast=true' },
    { label: 'מיסטרי בוקס', href: '/mystery-box' },
    { label: 'לא מצאתם? בקשו חולצה', href: '/request-shirt' },
    { label: 'מדריך מידות', href: '/size-guide' },
  ]),
};

// The row under the header. Items with a `menu` open a panel; the rest are
// plain links.
export const NAV_ITEMS = [
  { id: 'shirts', label: 'חולצות', menu: 'shirts' },
  { id: 'clubs', label: 'קבוצות', menu: 'clubs' },
  { id: 'national', label: 'נבחרות', menu: 'national' },
  { id: 'retro', label: 'רטרו', href: collectionHref('retro') },
  { id: 'fast', label: 'מלאי בארץ', href: '/catalog?fast=true' },
  { id: 'mystery', label: 'מיסטרי בוקס', href: '/mystery-box' },
  { id: 'request', label: 'בקשת חולצה', href: '/request-shirt' },
].filter(item => item.menu || linkHasStock(item.href));

// The plain links at the foot of the mobile menu.
export const SITE_LINKS = withStock([
  { label: 'כל החולצות', href: '/catalog' },
  { label: 'רטרו', href: collectionHref('retro') },
  { label: 'מלאי בארץ', href: '/catalog?fast=true' },
  { label: 'מיסטרי בוקס', href: '/mystery-box' },
  { label: 'בקשת חולצה', href: '/request-shirt' },
  { label: 'מדריך מידות', href: '/size-guide' },
  { label: 'שאלות ותשובות', href: '/faq' },
  { label: 'צור קשר', href: '/contact' },
]);
