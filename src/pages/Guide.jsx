import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Seo from '@/components/Seo';
import CollectionHero from '@/components/catalog/CollectionHero';
import Breadcrumb from '@/components/shop/Breadcrumb';
import PageNotFound from '@/lib/PageNotFound';
import { GUIDES, findGuide, localizeGuide } from '@/lib/guides';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { t, isEn } from '@/lib/i18n';

// One guide, and at the foot of it the other three. Each is written in both
// languages (lib/guides), so /guides/... and /en/guides/... are the same
// article rather than Hebrew under an English address.

export default function Guide() {
  const { slug } = useParams();
  const found = findGuide(slug);
  if (!found) return <PageNotFound />;

  const guide = localizeGuide(found, isEn);
  const others = GUIDES.filter(g => g.slug !== found.slug).map(g => localizeGuide(g, isEn));
  const path = `/guides/${found.slug}`;

  return (
    <div>
      <Seo
        title={guide.title}
        description={guide.description}
        canonicalPath={path}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.h1,
          description: guide.description,
          inLanguage: isEn ? 'en' : 'he-IL',
          mainEntityOfPage: SITE_ORIGIN + path,
          publisher: { '@type': 'Organization', name: 'JerseyLab', url: SITE_ORIGIN },
        }}
      />

      <CollectionHero
        breadcrumb={<Breadcrumb trail={[{ label: t('מדריכים', 'Guides'), to: '/guides' }, { label: guide.h1 }]} />}
        title={guide.h1}
        description={guide.intro}
      />

      <div className="shop-container">
        <article className="mx-auto mt-8 max-w-2xl lg:mt-12">
          {guide.sections.map(section => (
            <section key={section.h2} className="mt-8 first:mt-0">
              <h2 className="text-xl font-semibold text-brand-navy">{section.h2}</h2>
              {section.paragraphs?.map(p => (
                <p key={p} className="mt-3 text-[16px] leading-relaxed text-brand-navy/75">{p}</p>
              ))}
              {section.list && (
                <ul className="mt-3 space-y-2">
                  {section.list.map(item => (
                    <li key={item} className="flex gap-3 text-[16px] leading-relaxed text-brand-navy/75">
                      <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-orange" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <nav aria-label={t('קישורים מהמדריך', 'Links from this guide')} className="mt-10 flex flex-wrap gap-2 border-t border-brand-line pt-6">
            {guide.links.map(link => (
              <Link key={link.to} to={link.to} className="shop-btn-secondary rounded-full">{link.label}</Link>
            ))}
          </nav>
        </article>

        <aside className="mx-auto mt-12 max-w-2xl border-t border-brand-line pt-8" aria-labelledby="more-guides">
          <h2 id="more-guides" className="text-lg font-semibold text-brand-navy">{t('עוד מדריכים', 'More guides')}</h2>
          <ul className="mt-4 space-y-3">
            {others.map(other => (
              <li key={other.slug}>
                <Link to={`/guides/${other.slug}`} className="group flex items-start gap-3 rounded-2xl p-3 transition hover:bg-brand-mist">
                  <ArrowLeft className="mt-1 h-4 w-4 flex-shrink-0 text-brand-orange-ink rtl:rotate-0" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-brand-navy">{other.h1}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-brand-navy/60">{other.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
