// Builds public/sitemap.xml from the live catalogue, before `vite build` copies
// public/ into dist/.
//
// The hand-written sitemap listed five static pages on the wrong domain. The
// 178 product pages - the ones that could rank for an actual shirt name - were
// never submitted to Google at all.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, SITE_ORIGIN, escapeHtml, fetchShirts } from './lib/build-data.mjs';
import { COLLECTIONS } from '../src/lib/collections.js';
import { shirtNameEn } from '../src/lib/english.js';
import { GUIDES } from '../src/lib/guides.js';
import { shirtPath } from '../src/lib/shirtSlug.js';

const OUT = resolve(ROOT, 'public/sitemap.xml');

// Matches the pages with English copy in scripts/prerender.mjs. The legal
// pages are binding in Hebrew and have no English version.
const ENGLISH_ROUTES = new Set(['/', '/catalog', '/mystery-box', '/request-shirt', '/faq', '/contact', '/size-guide']);

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
  { path: '/mystery-box', changefreq: 'weekly', priority: '0.8' },
  { path: '/request-shirt', changefreq: 'monthly', priority: '0.7' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/size-guide', changefreq: 'monthly', priority: '0.5' },
  { path: '/legal/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cookies', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/shipping', changefreq: 'yearly', priority: '0.4' },
  { path: '/legal/accessibility', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/business', changefreq: 'yearly', priority: '0.3' },
];

// `lastmod` has to be a valid date or Google ignores the tag; the many rows
// with a null date must simply omit it.
function isoDay(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// The English site is the same pages under /en (src/lib/i18n). A page that
// exists in both languages is listed twice, each entry naming the other, so
// Google reads them as one page in two languages rather than as duplicates.
const enPath = (path) => (path === '/' ? '/en' : `/en${path}`);

function urlEntry({ path, changefreq, priority, lastmod, lang = 'he', alternate = false }) {
  const loc = SITE_ORIGIN + (lang === 'en' ? enPath(path) : path);
  return [
    '  <url>',
    `    <loc>${escapeHtml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    ...(alternate ? [
      `    <xhtml:link rel="alternate" hreflang="he-IL" href="${escapeHtml(SITE_ORIGIN + path)}" />`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${escapeHtml(SITE_ORIGIN + enPath(path))}" />`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeHtml(SITE_ORIGIN + path)}" />`,
    ] : []),
    '  </url>',
  ].filter(Boolean).join('\n');
}

const shirts = await fetchShirts({ label: 'sitemap' });

// Each page, then the same page in English where there is one.
function pageEntries(route, hasEnglish) {
  const entry = { ...route, alternate: hasEnglish };
  return hasEnglish ? [urlEntry(entry), urlEntry({ ...entry, lang: 'en' })] : [urlEntry(entry)];
}

const entries = [
  ...STATIC_ROUTES.flatMap(route => pageEntries(route, ENGLISH_ROUTES.has(route.path))),
  ...pageEntries({ path: '/guides', changefreq: 'monthly', priority: '0.7' }, true),
  ...GUIDES.flatMap(g => pageEntries({ path: `/guides/${g.slug}`, changefreq: 'monthly', priority: '0.7' }, !!g.en)),
  ...COLLECTIONS.flatMap(c => pageEntries({
    path: `/collections/${c.slug}`,
    changefreq: 'weekly',
    priority: '0.85',
  }, !!c.en)),
  ...shirts.flatMap(s => pageEntries({
    path: shirtPath(s),
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: isoDay(s.updated_date) || isoDay(s.created_date),
  }, !!shirtNameEn(s))),
];

writeFileSync(OUT, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`, 'utf8');

console.log(`[sitemap] ${entries.length} URLs written (${shirts.length} products, Hebrew and English) -> public/sitemap.xml`);
