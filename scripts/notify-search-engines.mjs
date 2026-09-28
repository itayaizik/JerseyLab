// Tells Bing and Yandex that pages have changed, through IndexNow.
//
// Google finds new pages on its own schedule and ignores this protocol; Bing
// acts on it within minutes, and Bing is what answers ChatGPT's web searches.
// For a shop that adds shirts weekly, the difference between "crawled in a few
// days" and "crawled this afternoon" is worth one HTTP request.
//
// Run after a deploy:
//   npm run notify                 - the whole sitemap
//   npm run notify -- /shirt/abc   - only the pages named
//
// The key file (public/<key>.txt) proves the submission comes from someone who
// can publish on this domain, which is the whole of IndexNow's authentication.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, SITE_ORIGIN } from './lib/build-data.mjs';

const KEY = '91b13aa091ee65c29603167f581a35ec';
const HOST = new URL(SITE_ORIGIN).host;
// IndexNow takes 10,000 URLs per request; the sitemap is nowhere near that.
const MAX_URLS = 10000;

function sitemapUrls() {
  const xml = readFileSync(resolve(ROOT, 'public/sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

const named = process.argv.slice(2).filter(Boolean);
const urls = (named.length
  ? named.map(p => (p.startsWith('http') ? p : SITE_ORIGIN + (p.startsWith('/') ? p : `/${p}`)))
  : sitemapUrls()
).slice(0, MAX_URLS);

if (!urls.length) {
  console.warn('[notify] no URLs to submit.');
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `${SITE_ORIGIN}/${KEY}.txt`,
    urlList: urls,
  }),
});

// 200 and 202 both mean accepted; 403 means the key file could not be read,
// which is the one failure worth shouting about.
if (res.ok || res.status === 202) {
  console.log(`[notify] ${urls.length} URLs submitted to IndexNow (${res.status}).`);
} else {
  console.error(`[notify] IndexNow refused the submission: ${res.status} ${await res.text()}`);
  process.exitCode = 1;
}
