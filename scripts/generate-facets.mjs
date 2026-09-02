// Writes src/lib/catalogFacets.json: how many shirts sit behind each category
// link in the navigation.
//
// Four links in the menus led to an empty page — ילדים, שחקנים, סייל and NBA —
// because every shirt in the catalogue is a men's football shirt with no player
// name and no sale price. A customer tapping one got nothing, and a crawler
// following one got a thin page worth less than no page at all.
//
// Counted at build time rather than fetched at runtime so the navbar costs
// nothing extra to render. Runs before `vite build`.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, fetchShirts } from './lib/build-data.mjs';

const OUT = resolve(ROOT, 'src/lib/catalogFacets.json');

const FACETS = {
  'gender=men': s => s.gender_category === 'men',
  'gender=kids': s => s.gender_category === 'kids',
  'type=national': s => !!s.national_team,
  'type=player': s => !!s.player_name,
  'tag=retro': s => !!s.is_retro,
  'sale=true': s => s.sale_price && s.sale_price < s.price,
  'new=true': s => !!s.is_new,
  'fast=true': s => s.local_stock_sizes && Object.values(s.local_stock_sizes).some(q => Number(q) > 0),
  'sport=basketball': s => s.sport_category === 'basketball',
  'best=true': s => s.best_seller === true,
};

const shirts = await fetchShirts({ label: 'facets' });

// With no catalogue data every count would be zero and every link would vanish.
// An empty file means "unknown", and the UI shows everything, which is the
// behaviour we had before this existed.
const counts = shirts.length
  ? Object.fromEntries(Object.entries(FACETS).map(([key, match]) => [key, shirts.filter(match).length]))
  : {};

writeFileSync(OUT, JSON.stringify(counts, null, 2) + '\n', 'utf8');

const empty = Object.entries(counts).filter(([, n]) => n === 0).map(([k]) => k);
console.log(`[facets] ${Object.keys(counts).length} counted -> src/lib/catalogFacets.json`);
if (empty.length) console.log(`[facets] hidden (no stock): ${empty.join(', ')}`);
