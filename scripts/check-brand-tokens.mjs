// Fails the build if the brand palette is defined inconsistently.
//
// The palette lives in two places because it has to: Tailwind class names read
// theme.extend.colors.brand in tailwind.config.js, and inline styles read the
// --brand-* custom properties in src/index.css. Nothing makes those two agree
// on its own, so a colour changed in one and not the other would ship a site
// where, say, a card's border is the new navy and its shadow is the old one -
// the kind of difference that is obvious in a screenshot and invisible in a
// diff.
//
// It also catches the palette drifting back: a bare brand hex reappearing in a
// class name or a style, which is what the tokens exist to prevent.
//
// Run as part of `npm run build`.

import { readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(ROOT, p), 'utf8');

const problems = [];

// --- the two definition lists must match ----------------------------------
const config = read('tailwind.config.js');
// The palette is the brand block written in hex. The config has other brand
// blocks too - the dark mode ones, which point at CSS variables - so the first
// block is not necessarily the palette.
const brandBlock = config.match(/brand:\s*\{([^}]*#[0-9a-fA-F]{6}[^}]*)\}/);
if (!brandBlock) {
  problems.push('tailwind.config.js has no theme.extend.colors.brand block.');
}

const fromConfig = new Map();
if (brandBlock) {
  for (const [, name, hex] of brandBlock[1].matchAll(/'?([a-z-]+)'?:\s*'(#[0-9a-fA-F]{6})'/g)) {
    fromConfig.set(name, hex.toUpperCase());
  }
}

const css = read('src/index.css');
const fromCss = new Map();
for (const [, name, hex] of css.matchAll(/--brand-([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
  fromCss.set(name, hex.toUpperCase());
}

for (const [name, hex] of fromConfig) {
  if (!fromCss.has(name)) problems.push(`brand-${name} (${hex}) is in tailwind.config.js but has no --brand-${name} in index.css.`);
  else if (fromCss.get(name) !== hex) problems.push(`brand-${name} disagrees: ${hex} in tailwind.config.js, ${fromCss.get(name)} in index.css.`);
}
for (const name of fromCss.keys()) {
  if (!fromConfig.has(name)) problems.push(`--brand-${name} is in index.css but has no brand.${name} in tailwind.config.js.`);
}

// --- no bare brand hexes in the shop --------------------------------------
// The admin area keeps its own palette and passes hex values into SVG fill
// attributes, where var() does not resolve, so it is not checked.
const hexes = [...fromConfig.values()];
if (hexes.length) {
  const pattern = hexes.map(h => h.slice(1)).join('|');
  let hits = '';
  try {
    hits = execSync(
      `git grep -nI -iE "#(${pattern})" -- "src/**/*.jsx" "src/**/*.js" "src/**/*.css" ` +
      `":!src/components/admin" ":!src/pages/admin" ":!src/index.css"`,
      { cwd: ROOT, encoding: 'utf8' },
    );
  } catch {
    hits = ''; // git grep exits 1 when it finds nothing
  }
  for (const line of hits.split('\n').filter(Boolean)) {
    // A shirt colour the customer can pick is a product attribute that happens
    // to share a value with the brand, and must not follow it.
    if (/hex:\s*'#/.test(line)) continue;
    problems.push(`bare brand hex, use a token instead: ${line.trim()}`);
  }
}

if (problems.length) {
  console.error('[brand-tokens] FAILED\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(`\n${problems.length} problem(s). The palette is defined in tailwind.config.js`);
  console.error('and src/index.css; use brand-* class names or var(--brand-*).');
  process.exit(1);
}

console.log(`[brand-tokens] ${fromConfig.size} tokens, definitions agree, no bare hexes outside admin`);
