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

// Desktop: the banner fills the screen, roughly 1.8:1 on a laptop, so the
// band is cut to that from near the top: floodlights above, shirts below.
const bandHeight = Math.round(width / 1.8);
await sharp(source)
  .extract({ left: 0, top: Math.min(Math.round(height * 0.04), height - bandHeight), width, height: bandHeight })
  .resize({ width: 1920, kernel: 'lanczos3' })
  .jpeg({ quality: 80, progressive: true, mozjpeg: true })
  .toFile(resolve(ROOT, 'public/hero-desktop.jpg'));

// Phones: the whole portrait photo. The banner is taller than it is wide there,
// and object-cover trims the sides to fit.
await sharp(source)
  .resize({ width: 1000 })
  .jpeg({ quality: 78, progressive: true, mozjpeg: true })
  .toFile(resolve(ROOT, 'public/hero-mobile.jpg'));

for (const name of ['hero-desktop.jpg', 'hero-mobile.jpg']) {
  console.log(`  public/${name.padEnd(20)} ${(statSync(resolve(ROOT, 'public', name)).size / 1024).toFixed(0)} KB`);
}
