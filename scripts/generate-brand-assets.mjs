// Builds the site's icons and share image from the brand masters in
// assets/brand/, into public/.
//
// Why this exists: all of these used to be served from media.base44.com, the
// platform the shop has left. The favicon, the apple touch icon, the PWA icon,
// the Open Graph share image and the navbar logo were four references to two
// files on a CDN nobody here controls any more, and the day it stops answering
// the site loses its tab icon, its logo on every page and every WhatsApp link
// preview. They are now built from masters in the repo and served from our own
// domain.
//
// The second reason is size. The favicon was a 1090x1090 PNG weighing 1.1MB,
// fetched on every page load to be drawn at 32 pixels. Recompressing the
// masters alone took them from 1.1MB to 130KB with identical pixels, and the
// derived icons below are a fraction of that again.
//
// Run with: node scripts/generate-brand-assets.mjs

import sharp from 'sharp';
import { statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const master = name => resolve(ROOT, 'assets/brand', name);
const out = name => resolve(ROOT, 'public', name);

const NAVY = { r: 0x1b, g: 0x2a, b: 0x4a, alpha: 1 };

mkdirSync(resolve(ROOT, 'public'), { recursive: true });

const written = [];
const note = path => written.push([path, statSync(path).size]);

// --- icons ----------------------------------------------------------------
// Square logo, scaled down. Flat artwork, so a palette PNG is both smaller and
// lossless here.
for (const size of [16, 32, 180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await sharp(master('logo-square.png'))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out(name));
  note(out(name));
}

// A maskable icon is cropped to a circle or squircle by the launcher, so the
// artwork needs padding inside a filled square or its edges get shaved off.
await sharp(master('logo-square.png'))
  .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: NAVY })
  .flatten({ background: NAVY })
  .png({ compressionLevel: 9, palette: true })
  .toFile(out('icon-maskable-512.png'));
note(out('icon-maskable-512.png'));

// --- share image ----------------------------------------------------------
// Open Graph wants a landscape image; the master is square, so it is centred on
// a brand-coloured 1200x630 canvas rather than cropped into. JPEG, because this
// is photographic-ish artwork and nothing here needs transparency.
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: NAVY },
})
  .composite([{ input: await sharp(master('share.png')).resize(630, 630, { fit: 'contain', background: NAVY }).toBuffer() }])
  .jpeg({ quality: 82, progressive: true, mozjpeg: true })
  .toFile(out('og-image.jpg'));
note(out('og-image.jpg'));

// --- navbar logo ----------------------------------------------------------
// Displayed at h-12 (48px) and h-16 (64px) on large screens, so 128px tall
// covers both at 2x.
await sharp(master('logo-wide.png'))
  .resize({ height: 128, fit: 'inside' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(out('logo-navbar.png'));
note(out('logo-navbar.png'));

const total = written.reduce((n, [, size]) => n + size, 0);
for (const [path, size] of written) {
  console.log(`  public/${basename(path).padEnd(28)} ${(size / 1024).toFixed(1)} KB`);
}
console.log(`[brand] ${written.length} files, ${(total / 1024).toFixed(0)} KB total`);
