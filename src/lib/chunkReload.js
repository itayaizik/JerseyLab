import { lazy } from 'react';

// Recovering from a deploy that happened while the page was open.
//
// Each build gives every page's JavaScript file a new name, and the old files
// are gone the moment Vercel finishes. A visitor who loaded the site before a
// deploy still runs the old code, so the first time they open a page that is
// loaded on demand (the mystery box, contact, a collection, the admin) the
// browser asks for a file that no longer exists and the page goes blank until
// they refresh. The fix is the refresh itself, done for them: reload once, and
// the new version comes down.
//
// A reload is allowed once every 20 seconds, so a file that is genuinely
// broken shows the error screen instead of reloading forever.

const RELOAD_KEY = 'jl_chunk_reload_at';

export function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading chunk/i.test(message);
}

// Reloads the page unless it already did so moments ago. Returns whether it did.
export function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 20000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // No storage (private mode, blocked): still reload, the browser's own
    // cache of the new HTML ends any loop.
  }
  window.location.reload();
  return true;
}

// React.lazy that reloads for the new version when the page's file is missing.
export function lazyPage(importer) {
  return lazy(() => importer().catch(error => {
    if (isChunkLoadError(error) && reloadForNewVersion()) {
      // Keep Suspense showing its spinner while the reload happens.
      return new Promise(() => {});
    }
    throw error;
  }));
}
