// Builds the home page's default hero photos into public/.
//
// The hero is a photograph with a small card over it. Until the owner uploads
// their own from ניהול > הגדרות אתר, it shows the stadium rack photo that the
// category cards already use, cut two ways: a wide band for desktops and a
// tall crop for phones. The source is a 2.3MB PNG, far too heavy to be the
// first thing a phone downloads, so both come out as compressed JPEGs.
//
// Run with: node scripts/generate-hero.mjs

import sharp from 'sharp';
import { statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'https://cnskcshxvdymabvlghqc.supabase.co/storage/v1/object/public/shirt-images/cards/e3001b3dfaea73dabbeabccd.png';

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`[hero] could not fetch the source photo: HTTP ${response.status}`);
const source = Buffer.from(await response.arrayBuffer());
const { width, height } = await sharp(source).metadata();

// Desktop: a 2.2:1 band from just under the top, so the floodlights and the
// whole row of shirts both fit.
const bandHeight = Math.round(width / 2.2);
await sharp(source)
  .extract({ left: 0, top: Math.round(height * 0.08), width, height: bandHeight })
  .resize({ width: 1600, kernel: 'lanczos3' })
  .jpeg({ quality: 80, progressive: true, mozjpeg: true })
  .toFile(resolve(ROOT, 'public/hero-desktop.jpg'));

// Phones: 4:5 from the top, the shirts in the lower half where the card does
// not cover them.
await sharp(source)
  .extract({ left: 0, top: 0, width, height: Math.round(width * 1.25) })
  .resize({ width: 900 })
  .jpeg({ quality: 78, progressive: true, mozjpeg: true })
  .toFile(resolve(ROOT, 'public/hero-mobile.jpg'));

for (const name of ['hero-desktop.jpg', 'hero-mobile.jpg']) {
  console.log(`  public/${name.padEnd(20)} ${(statSync(resolve(ROOT, 'public', name)).size / 1024).toFixed(0)} KB`);
}
