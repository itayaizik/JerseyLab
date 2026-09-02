// The one canonical origin for the site.
//
// Every canonical tag and every JSON-LD `url` used to be built from
// `window.location.origin`, which meant the site told search engines whatever
// host it happened to be served from. The old Vercel host
// (jersey-lab-indol.vercel.app) still answers 200 without redirecting, so
// Google was being shown two complete, self-canonical copies of the same shop
// and had to guess which one was real — the classic way to rank for nothing
// except your own brand name.
//
// Hard-coding it means even the duplicate host points at the real domain.
export const SITE_ORIGIN = 'https://www.jerseylab.co';

// Absolute URL for a path, for canonicals and structured data.
export function siteUrl(path = '/') {
  if (!path) return SITE_ORIGIN;
  return SITE_ORIGIN + (path.startsWith('/') ? path : `/${path}`);
}
