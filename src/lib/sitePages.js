// The shop's own pages, as the search box offers them. Customers type "מידות"
// or "וואטסאפ" into the search and expect the size guide or the contact page,
// not an empty list of shirts, so each page lists the words people use for it.
//
// Keywords are matched after the same normalisation the shirt search uses, as
// word prefixes, so "מידה", "מידות" and "טבלת מידות" all find the size guide.

import { normalize } from '@/lib/search';
import { t } from '@/lib/i18n';

export const SITE_PAGES = [
  {
    href: '/size-guide',
    label: t('מדריך מידות ומחשבון מידה', 'Size guide and size calculator'),
    keywords: ['מידה', 'מידות', 'טבלה', 'טבלת', 'מחשבון', 'גודל', 'גובה', 'משקל', 'size', 'sizes', 'sizing', 'fit', 'chart', 'guide'],
  },
  {
    href: '/contact',
    label: t('צור קשר', 'Contact us'),
    keywords: ['קשר', 'צור', 'צרו', 'יצירת', 'טלפון', 'וואטסאפ', 'ווטסאפ', 'whatsapp', 'אינסטגרם', 'instagram', 'מייל', 'שירות', 'עזרה', 'שאלה', 'contact', 'help', 'phone', 'email', 'support'],
  },
  {
    href: '/catalog',
    label: t('כל החולצות (קטלוג)', 'All shirts (catalog)'),
    keywords: ['קטלוג', 'כל', 'חנות', 'catalog', 'catalogue', 'shop', 'all'],
  },
  {
    href: '/mystery-box',
    label: t('מיסטרי בוקס', 'Mystery Box'),
    keywords: ['מיסטרי', 'מסטרי', 'בוקס', 'הפתעה', 'אקראי', 'mystery', 'box', 'surprise'],
  },
  {
    href: '/request-shirt',
    label: t('בקשת חולצה שלא מצאתם', "Request a shirt you can't find"),
    keywords: ['בקשה', 'בקשת', 'לבקש', 'הזמנה מיוחדת', 'request'],
  },
  {
    href: '/faq',
    label: t('שאלות ותשובות', 'FAQ'),
    keywords: ['שאלות', 'תשובות', 'faq', 'questions'],
  },
  {
    href: '/legal/shipping',
    label: t('משלוחים, אספקה וביטול', 'Shipping, delivery and cancellation'),
    keywords: ['משלוח', 'משלוחים', 'אספקה', 'ביטול', 'החזרה', 'החזרות', 'החלפה', 'זמן', 'זמני', 'shipping', 'delivery', 'return', 'returns', 'refund', 'cancel'],
  },
  {
    href: '/legal/accessibility',
    label: t('הצהרת נגישות', 'Accessibility statement'),
    keywords: ['נגישות', 'נגיש', 'accessibility'],
  },
];

const PREPARED = SITE_PAGES.map(page => ({
  ...page,
  words: page.keywords.map(normalize).filter(Boolean),
}));

// Pages whose keywords match the query, best first. A query word matches a
// keyword when either is a prefix of the other, so a half-typed "מיד" already
// finds the size guide and "מידות" finds "מידה" too.
function scorePages(query) {
  const words = normalize(query).split(' ').filter(w => w.length >= 2);
  if (!words.length) return [];
  return PREPARED
    .map(page => ({
      page,
      // Two letters only match a whole keyword, so "אי" on its way to "אינטר"
      // does not offer the contact page for "אינסטגרם".
      score: words.filter(w => page.words.some(k => k === w
        || (w.length >= 3 && (k.startsWith(w) || (k.length >= 4 && w.startsWith(k)))))).length,
    }))
    .filter(r => r.score > 0)
    .map(r => ({ ...r, whole: r.score === words.length }))
    .sort((a, b) => b.score - a.score);
}

export const matchPages = (query, limit = 3) => scorePages(query).slice(0, limit).map(r => r.page);

// The page a query plainly asks for - every word in it points there - or null.
// Pressing Enter on "מידות" opens the size guide; on "ריאל מידות" it searches.
export function pageForQuery(query) {
  const best = scorePages(query)[0];
  return best?.whole ? best.page : null;
}
