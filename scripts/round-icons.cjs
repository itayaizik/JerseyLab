// Rounds off the corners of the site icon.
//
// The tab icon was a navy square, which next to the round avatars every other
// tab shows read as a block of colour rather than as a logo. This cuts the same
// artwork with its corners taken off, leaving them transparent.
//
// Two files are deliberately left square:
//   - icon-maskable-512.png, which Android crops to its own shape and which
//     must bleed to the edges or it ends up rounded twice.
//   - apple-touch-icon.png, because iOS applies its own rounded mask and fills
//     transparency with black.
//
// Run with `node scripts/round-icons.cjs`. Reads scripts/icon-master.png, the
// square original, so rerunning is safe.

const path = require('path');
const sharp = require('sharp');

const PUB = path.join(__dirname, '..', 'public');
// The square original, kept out of public/ so it is never served and never
// overwritten by a run of this script.
const SRC = path.join(__dirname, 'icon-master.png');
// 48 and 96 are there for Google: the favicon it puts beside a search result
// is asked for as a multiple of 48, and left to scale 32 up to it the circle's
// edge goes soft.
const SIZES = [512, 192, 96, 48, 32, 16];

// A square with its corners taken off, at the proportion app icons use - about
// 22% of the side. Rounding by a fixed number of pixels instead would leave the
// 16px icon almost square and the 512px one barely touched.
const RADIUS = 0.22;

const mask = (size) => Buffer.from(
  `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${
    Math.max(1, Math.round(size * RADIUS))
  }" fill="#fff"/></svg>`,
);

(async () => {
  const square = await sharp(SRC).resize(512, 512, { fit: 'cover' }).png().toBuffer();

  for (const size of SIZES) {
    const out = path.join(PUB, `icon-${size}.png`);
    await sharp(square)
      .resize(size, size)
      .composite([{ input: mask(size), blend: 'dest-in' }])
      .png()
      .toFile(`${out}.tmp`);
    require('fs').renameSync(`${out}.tmp`, out);
    console.log(`icon-${size}.png  round`);
  }

  // favicon.ico: a BMP-less ICO carrying PNG frames, which every browser since
  // IE11 reads. Written by hand because sharp has no ICO encoder.
  const frames = [];
  for (const size of [16, 32, 48]) {
    frames.push({
      size,
      png: await sharp(square)
        .resize(size, size)
        .composite([{ input: mask(size), blend: 'dest-in' }])
        .png()
        .toBuffer(),
    });
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);            // reserved
  header.writeUInt16LE(1, 2);            // 1 = icon
  header.writeUInt16LE(frames.length, 4);
  let offset = 6 + frames.length * 16;
  const dir = [];
  for (const f of frames) {
    const e = Buffer.alloc(16);
    e.writeUInt8(f.size === 256 ? 0 : f.size, 0); // width
    e.writeUInt8(f.size === 256 ? 0 : f.size, 1); // height
    e.writeUInt8(0, 2);                  // palette
    e.writeUInt8(0, 3);                  // reserved
    e.writeUInt16LE(1, 4);               // colour planes
    e.writeUInt16LE(32, 6);              // bits per pixel
    e.writeUInt32LE(f.png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += f.png.length;
    dir.push(e);
  }
  require('fs').writeFileSync(
    path.join(PUB, 'favicon.ico'),
    Buffer.concat([header, ...dir, ...frames.map(f => f.png)]),
  );
  console.log(`favicon.ico   round (${frames.map(f => f.size).join(', ')})`);
})().catch((err) => { console.error(err); process.exit(1); });
