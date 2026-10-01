import { useEffect } from 'react';
import { siteUrl } from '@/lib/siteUrl';
import { isEn, pathInLang } from '@/lib/i18n';

const SITE_NAME = 'JerseyLab';
const DEFAULT_IMAGE = 'https://www.jerseylab.co/og-image.jpg';

function upsertMeta(selector, attrKey, attrValue, content) {
  if (content === undefined || content === null || content === '') return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrKey, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href, hreflang) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function removeLink(rel, hreflang) {
  document.head.querySelector(`link[rel="${rel}"][hreflang="${hreflang}"]`)?.remove();
}

// `shareTitle` is for the card WhatsApp and Facebook draw when the link is
// pasted. It defaults to `title`, and is worth setting apart only where the tab
// wants to be short and the shared card still wants to say what the page is -
// the home page, whose tab is just the brand name.
export default function Seo({ title, shareTitle, description, image, type = 'website', canonicalPath, jsonLd, noindex = false, hebrewOnly = false }) {
  // The Hebrew path of this page, whichever side we are on: what the two
  // hreflang links are built from.
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    if (title) document.title = title;

    // Always absolute to the canonical origin - never to whatever host this
    // copy is being served from. See src/lib/siteUrl.js.
    const here = canonicalPath || (window.location.pathname + window.location.search);
    const hebrewPath = pathInLang(here.startsWith('/') ? here : `/${here}`, 'he');
    const url = siteUrl(hebrewOnly ? hebrewPath : pathInLang(hebrewPath, isEn ? 'en' : 'he'));

    upsertMeta('meta[name="description"]', 'name', 'description', description);

    // Open Graph (Facebook / WhatsApp)
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', shareTitle || title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', image || DEFAULT_IMAGE);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', isEn ? 'en_US' : 'he_IL');

    // Twitter / X
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', shareTitle || title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image || DEFAULT_IMAGE);

    upsertMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, follow' : 'index, follow');

    // Canonical URL
    upsertLink('canonical', url);

    // The same page in the other language. Without these Google treats the
    // English pages as duplicates of nothing and drops them.
    if (noindex || hebrewOnly) {
      removeLink('alternate', 'he-IL');
      removeLink('alternate', 'en');
      removeLink('alternate', 'x-default');
    } else {
      upsertLink('alternate', siteUrl(hebrewPath), 'he-IL');
      upsertLink('alternate', siteUrl(pathInLang(hebrewPath, 'en')), 'en');
      upsertLink('alternate', siteUrl(hebrewPath), 'x-default');
    }

    // Structured data (JSON-LD)
    let script = document.head.querySelector('script[data-seo-jsonld]');
    if (jsonLdStr) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        document.head.appendChild(script);
      }
      script.textContent = jsonLdStr;
    } else if (script) {
      script.remove();
    }
  }, [title, shareTitle, description, image, type, canonicalPath, jsonLdStr, noindex, hebrewOnly]);

  return null;
}