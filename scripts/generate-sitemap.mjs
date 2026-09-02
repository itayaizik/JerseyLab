// Builds public/sitemap.xml from the live catalogue, before `vite build` copies
// public/ into dist/.
//
// The hand-written sitemap listed five static pages on the wrong domain. The
// 178 product pages — the ones that could rank for an actual shirt name — were
// never submitted to Google at all.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, SITE_ORIGIN, escapeHtml, fetchShirts } from './lib/build-data.mjs';
import { COLLECTIONS } from '../src/lib/collections.js';

const OUT = resolve(ROOT, 'public/sitemap.xml');

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
  { path: '/mystery-box', changefreq: 'weekly', priority: '0.8' },
  { path: '/request-shirt', changefreq: 'monthly', priority: '0.7' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/size-guide', changefreq: 'monthly', priority: '0.5' },
];

// `lastmod` has to be a valid date or Google ignores the tag; the many rows
// with a null date must simply omit it.
function isoDay(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function urlEntry({ path, changefreq, priority, lastmod }) {
  return [
    '  <url>',
    `    <loc>${escapeHtml(SITE_ORIGIN + path)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

const shirts = await fetchShirts({ label: 'sitemap' });

const entries = [
  ...STATIC_ROUTES.map(urlEntry),
  ...COLLECTIONS.map(c => urlEntry({
    path: `/collections/${c.slug}`,
    changefreq: 'weekly',
    priority: '0.85',
  })),
  ...shirts.map(s => urlEntry({
    path: `/shirt/${s.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: isoDay(s.updated_date) || isoDay(s.created_date),
  })),
];

writeFileSync(OUT, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`, 'utf8');

console.log(`[sitemap] ${entries.length} URLs written (${shirts.length} products) -> public/sitemap.xml`);
