import { useEffect } from 'react';
import { siteUrl } from '@/lib/siteUrl';

const SITE_NAME = 'JerseyLab';
const DEFAULT_IMAGE = 'https://media.base44.com/images/public/6a42e762005950f7dc39df84/de8c45ac1_ChatGPTImageJul31202602_56_05AM.png';

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

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function Seo({ title, description, image, type = 'website', canonicalPath, jsonLd }) {
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    if (title) document.title = title;

    // Always absolute to the canonical origin — never to whatever host this
    // copy is being served from. See src/lib/siteUrl.js.
    const url = canonicalPath
      ? siteUrl(canonicalPath)
      : siteUrl(window.location.pathname + window.location.search);

    upsertMeta('meta[name="description"]', 'name', 'description', description);

    // Open Graph (Facebook / WhatsApp)
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', image || DEFAULT_IMAGE);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', 'he_IL');

    // Twitter / X
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image || DEFAULT_IMAGE);

    // Canonical URL
    upsertLink('canonical', url);

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
  }, [title, description, image, type, canonicalPath, jsonLdStr]);

  return null;
}