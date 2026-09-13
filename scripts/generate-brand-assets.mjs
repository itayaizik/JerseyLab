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
import { statSync, mkdirSync, writeFileSync } from 'node:fs';
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

// --- favicon.ico ----------------------------------------------------------
// Browsers ask for /favicon.ico by convention whether or not the page declares
// <link rel="icon">, so without this every first visit takes a 404. An .ico is
// only a container, and every browser in use reads PNG entries inside one, so
// the 16 and 32 PNGs above go in as they are.
{
  const entries = await Promise.all([16, 32].map(async size => ({
    size,
    png: await sharp(master('logo-square.png'))
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  })));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);             // reserved
  header.writeUInt16LE(1, 2);             // type 1 = icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const { size, png } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size, 0);                // width, 0 would mean 256
    e.writeUInt8(size, 1);                // height
    e.writeUInt8(0, 2);                   // palette size, 0 = not paletted
    e.writeUInt8(0, 3);                   // reserved
    e.writeUInt16LE(1, 4);                // colour planes
    e.writeUInt16LE(32, 6);               // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    dir.push(e);
    offset += png.length;
  }

  writeFileSync(out('favicon.ico'), Buffer.concat([header, ...dir, ...entries.map(e => e.png)]));
  note(out('favicon.ico'));
}

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

// The same logo for light backgrounds. The master's wordmark and the L are
// white, drawn for the navy bar, so on the white header they vanish. Every
// light, unsaturated pixel is recoloured navy with its alpha kept, which
// carries the anti-aliased edges across; the orange J is saturated and stays.
{
  const { data, info } = await sharp(master('logo-wide.png'))
    .resize({ height: 128, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a === 0) continue;
    const light = Math.min(r, g, b) > 150;
    const grey = Math.max(r, g, b) - Math.min(r, g, b) < 60;
    if (light && grey) { data[i] = NAVY.r; data[i + 1] = NAVY.g; data[i + 2] = NAVY.b; }
  }
  await sharp(data, { raw: info })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out('logo-navbar-dark.png'));
  note(out('logo-navbar-dark.png'));
}

const total = written.reduce((n, [, size]) => n + size, 0);
for (const [path, size] of written) {
  console.log(`  public/${basename(path).padEnd(28)} ${(size / 1024).toFixed(1)} KB`);
}
console.log(`[brand] ${written.length} files, ${(total / 1024).toFixed(0)} KB total`);
