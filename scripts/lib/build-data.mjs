// Shared build-time access to the catalogue, used by the sitemap generator and
// the prerenderer. Both need the same rows, and both must degrade gracefully:
// a deploy that cannot reach Supabase should still ship a working site.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const SITE_ORIGIN = 'https://www.jerseylab.co';

// Vite exposes these during a Vercel build; locally they come from .env.local.
export function env(name) {
  if (process.env[name]) return process.env[name];
  const envFile = resolve(ROOT, '.env.local');
  if (!existsSync(envFile)) return null;
  const line = readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find(l => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : null;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// `sizes` and `local_stock_sizes` are stored as JSON text, matching what
// coerceRow does at runtime.
function coerce(row) {
  const out = { ...row };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === 'string' && v.length > 1 && (v[0] === '[' || v[0] === '{')) {
      try { out[k] = JSON.parse(v); } catch { /* not JSON */ }
    }
  }
  return out;
}

export async function fetchShirts({ label = 'build' } = {}) {
  const url = env('VITE_SUPABASE_URL');
  const key = env('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) {
    console.warn(`[${label}] Supabase credentials not found — continuing without catalogue data.`);
    return [];
  }

  const endpoint = `${url}/rest/v1/shirts_raw?select=*&limit=2000`;
  let res;
  try {
    res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  } catch (err) {
    console.warn(`[${label}] Supabase unreachable (${err.message}) — continuing without catalogue data.`);
    return [];
  }
  if (!res.ok) {
    console.warn(`[${label}] Supabase returned ${res.status} — continuing without catalogue data.`);
    return [];
  }

  const rows = await res.json();
  // Hidden shirts must never be advertised to search engines.
  return rows.filter(r => r.id && r.status !== 'hidden').map(coerce);
}

export function shirtPrice(shirt) {
  return shirt.sale_price && shirt.sale_price < shirt.price ? shirt.sale_price : shirt.price;
}

// One-line summary used as the meta description when the shirt has no
// description of its own — better than repeating the site-wide boilerplate on
// 178 pages, which is what search engines treat as duplicate content.
export function shirtDescription(shirt) {
  if (shirt.description?.trim()) return shirt.description.trim().slice(0, 300);
  const parts = [
    shirt.name,
    shirt.club || shirt.national_team,
    shirt.season,
    shirt.player_name,
    shirt.is_retro ? 'רטרו' : null,
  ].filter(Boolean);
  const price = shirtPrice(shirt);
  return `${parts.join(' · ')}${price ? ` — ₪${price}` : ''}. חולצת כדורגל מקורית מ-JerseyLab, משלוח לכל הארץ.`;
}
