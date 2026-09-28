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
    console.warn(`[${label}] Supabase credentials not found - continuing without catalogue data.`);
    return [];
  }

  const endpoint = `${url}/rest/v1/shirts_raw?select=*&limit=2000`;
  let res;
  try {
    res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  } catch (err) {
    console.warn(`[${label}] Supabase unreachable (${err.message}) - continuing without catalogue data.`);
    return [];
  }
  if (!res.ok) {
    console.warn(`[${label}] Supabase returned ${res.status} - continuing without catalogue data.`);
    return [];
  }

  const rows = await res.json();
  // Hidden shirts must never be advertised to search engines.
  return rows.filter(r => r.id && r.status !== 'hidden').map(coerce);
}

// The home page's banner photos, read at build time so the page can tell the
// browser to start downloading the right one immediately. Without this the
// banner - the largest thing on the screen, and what Google measures the page
// by - only starts loading after the app has booted and asked the database
// which photo to show.
export async function fetchHeroImages({ label = 'build' } = {}) {
  const url = env('VITE_SUPABASE_URL');
  const key = env('VITE_SUPABASE_ANON_KEY');
  const fallback = { desktop: '/hero-desktop.jpg', mobile: '/hero-mobile.jpg' };
  if (!url || !key) return fallback;
  try {
    const endpoint = `${url}/rest/v1/site_settings_raw?select=key,value&key=in.(homepage_hero_image,homepage_hero_image_mobile)`;
    const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) return fallback;
    const rows = await res.json();
    const value = (name) => rows.find(r => r.key === name)?.value || '';
    const desktop = value('homepage_hero_image') || fallback.desktop;
    // Matches components/HomeHero: an uploaded desktop photo with no phone
    // version is used on phones too.
    const mobile = value('homepage_hero_image_mobile') || (value('homepage_hero_image') ? desktop : fallback.mobile);
    return { desktop, mobile };
  } catch (err) {
    console.warn(`[${label}] could not read the hero settings (${err.message}) - using the defaults.`);
    return fallback;
  }
}

// The published FAQ, for the prerendered /faq page. FAQPage structured data is
// what produces the expandable answers in Google's results, and it is one of
// the formats AI assistants quote most readily - but it only existed after
// JavaScript ran, which is exactly when a crawler is no longer looking.
export async function fetchFaqs({ label = 'build' } = {}) {
  const url = env('VITE_SUPABASE_URL');
  const key = env('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) return [];

  const endpoint = `${url}/rest/v1/faq_raw?select=question,answer,active,sort_order&active=eq.true&order=sort_order`;
  try {
    const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) {
      console.warn(`[${label}] FAQ fetch returned ${res.status} - page ships without FAQ schema.`);
      return [];
    }
    const rows = await res.json();
    return rows.filter(r => r.question?.trim() && r.answer?.trim());
  } catch (err) {
    console.warn(`[${label}] FAQ fetch failed (${err.message}) - page ships without FAQ schema.`);
    return [];
  }
}

export function shirtPrice(shirt) {
  return shirt.sale_price && shirt.sale_price < shirt.price ? shirt.sale_price : shirt.price;
}

// One-line summary used as the meta description when the shirt has no
// description of its own - better than repeating the site-wide boilerplate on
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
  return `${parts.join(' · ')}${price ? ` - ₪${price}` : ''}. חולצת כדורגל מ-JerseyLab, משלוח לכל הארץ.`;
}
