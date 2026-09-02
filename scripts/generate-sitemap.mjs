// Builds public/sitemap.xml from the live catalogue.
//
// The hand-written sitemap listed five static pages on the wrong domain. The
// 178 product pages — the ones that could actually rank for "חולצת ריאל מדריד
// רטרו" and the like — were never submitted to Google at all, which is a large
// part of why the site only surfaced for its own brand name.
//
// Runs as part of `npm run build`. It must never break the build: if Supabase
// is unreachable or the credentials are missing, it writes the static pages
// and warns, rather than failing the deploy.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.jerseylab.co';
const OUT = resolve(ROOT, 'public/sitemap.xml');

// Static routes, with the priority we want Google to weigh them by. Anything
// behind a login (/profile, /wishlist) or admin-only is deliberately absent —
// robots.txt disallows those too.
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
  { path: '/mystery-box', changefreq: 'weekly', priority: '0.8' },
  { path: '/request-shirt', changefreq: 'monthly', priority: '0.7' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/size-guide', changefreq: 'monthly', priority: '0.5' },
];

// Vite exposes these during a Vercel build; locally they come from .env.local.
function env(name) {
  if (process.env[name]) return process.env[name];
  const envFile = resolve(ROOT, '.env.local');
  if (!existsSync(envFile)) return null;
  const line = readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find(l => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : null;
}

const escapeXml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function fetchShirts() {
  const url = env('VITE_SUPABASE_URL');
  const key = env('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) {
    console.warn('[sitemap] Supabase credentials not found — writing static pages only.');
    return [];
  }

  // Only fields the sitemap needs. `status` filters out hidden shirts, which
  // must not be advertised to search engines.
  const endpoint = `${url}/rest/v1/shirts_raw?select=id,updated_date,created_date,status&limit=2000`;
  const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    console.warn(`[sitemap] Supabase returned ${res.status} — writing static pages only.`);
    return [];
  }
  const rows = await res.json();
  return rows.filter(r => r.id && r.status !== 'hidden');
}

function urlEntry({ path, changefreq, priority, lastmod }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(ORIGIN + path)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

// `lastmod` has to be a valid date or Google ignores the whole tag; a null
// column (which plenty of imported rows still have) must simply be omitted.
function isoDay(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const shirts = await fetchShirts();

const entries = [
  ...STATIC_ROUTES.map(urlEntry),
  ...shirts.map(s => urlEntry({
    path: `/shirt/${s.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: isoDay(s.updated_date) || isoDay(s.created_date),
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

writeFileSync(OUT, xml, 'utf8');
console.log(`[sitemap] ${entries.length} URLs written (${shirts.length} products) -> public/sitemap.xml`);
