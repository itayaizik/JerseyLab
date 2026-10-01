import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { getAllShirts } from '@/api/shirts';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import CollectionHero from '@/components/catalog/CollectionHero';
import FilterBar from '@/components/catalog/FilterBar';
import Seo from '@/components/Seo';
import PageNotFound from '@/lib/PageNotFound';
import { toast } from '@/components/ui/use-toast';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { COLLECTIONS, findCollection, collectionShirts, localizeCollection } from '@/lib/collections';
import { sortShirts } from '@/lib/sortShirts';
import { withStock } from '@/lib/catalogFacets';
import { EMPTY_FILTERS, filterOptions, applyFilters, hasAnyFilter } from '@/lib/shirtFilters';
import { preferredClubs } from '@/lib/taste';
import { t, isEn } from '@/lib/i18n';

// A landing page per subject - "חולצות רטרו", "חולצות ברצלונה" - rather than a
// query string on /catalog. Same grid as the catalogue, but with a title, an
// intro, and a URL that is about one thing, which is what a search engine can
// rank and a person can share.

export default function Collection() {
  const { slug } = useParams();
  const collection = findCollection(slug);
  // The copy in the site's language; matching still uses the Hebrew entry.
  const copy = localizeCollection(collection, isEn);

  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [sort, setSort] = useState('featured');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Read once: localStorage is not reactive, and it only changes at checkout.
  const [taste] = useState(preferredClubs);
  const navigate = useNavigate();

  useEffect(() => {
    if (!collection) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const all = await getAllShirts();
        if (!cancelled) setShirts(collectionShirts(collection, all));
      } catch {
        if (!cancelled) setShirts([]);
      }
      if (!cancelled) setLoading(false);

      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setUser(me);
        const wl = await base44.entities.Wishlist.filter({ user_id: me.id });
        if (!cancelled) setWishlistIds(wl.map(w => w.shirt_id));
      } catch { /* not logged in */ }
    })();

    return () => { cancelled = true; };
  }, [collection]);

  const wishlistIdsRef = useRef(wishlistIds);
  useEffect(() => { wishlistIdsRef.current = wishlistIds; }, [wishlistIds]);

  const toggleWishlist = useCallback(async (shirtId) => {
    if (!user) { navigate('/login'); return; }
    if (wishlistIdsRef.current.includes(shirtId)) {
      const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: shirtId });
      if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
      setWishlistIds(p => p.filter(id => id !== shirtId));
      toast({ title: t('הוסרה מהמועדפים', 'Removed from your wishlist') });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: shirtId });
      setWishlistIds(p => [...p, shirtId]);
      toast({ title: t('נוספה למועדפים', 'Added to your wishlist') });
    }
  }, [user, navigate]);

  // What there is to filter by on this page, taken from this collection's own
  // shirts rather than the whole catalogue.
  const options = useMemo(() => filterOptions(shirts), [shirts]);
  const sorted = useMemo(
    () => sortShirts(applyFilters(shirts, filters), sort, { preferredClubs: taste }),
    [shirts, filters, sort, taste],
  );

  // An unknown slug is a genuine 404, not an empty collection page - otherwise
  // every typo becomes a thin page competing with the real ones.
  if (!collection) return <PageNotFound />;

  const url = `${SITE_ORIGIN}/collections/${collection.slug}`;
  const others = withStock(
    COLLECTIONS.filter(c => c.slug !== collection.slug).map(c => ({ ...localizeCollection(c, isEn), href: `/collections/${c.slug}` })),
  );
  const featureFirst = sort === 'featured' && sorted.length >= 7;

  return (
    <div>
      <Seo
        title={copy.title}
        description={copy.description}
        canonicalPath={`/collections/${collection.slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: collection.h1,
              description: collection.description,
              url,
              inLanguage: 'he-IL',
            },
            // Only where there are real questions on the page; marking up an
            // FAQ that is not shown is what gets structured data ignored.
            ...(copy.faq?.length ? [{
              '@type': 'FAQPage',
              mainEntity: copy.faq.map(item => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            }] : []),
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'דף הבית', item: `${SITE_ORIGIN}/` },
                { '@type': 'ListItem', position: 2, name: 'קטלוג', item: `${SITE_ORIGIN}/catalog` },
                { '@type': 'ListItem', position: 3, name: collection.h1, item: url },
              ],
            },
          ],
        }}
      />

      <CollectionHero
        breadcrumb={(
          <nav aria-label={t('נתיב ניווט', 'Breadcrumb')} className="shop-eyebrow mb-3">
            <Link to="/" className="transition hover:text-brand-navy">{t('דף הבית', 'Home')}</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link to="/catalog" className="transition hover:text-brand-navy">{t('קטלוג', 'Catalog')}</Link>
          </nav>
        )}
        title={copy.h1}
        description={copy.intro}
        chips={others.slice(0, 6).map(c => ({ label: c.name, href: c.href }))}
        images={sorted.filter(s => s.main_image).slice(0, 3).map(s => s.main_image)}
        loading={loading}
      />

      <div className="shop-container">
        <FilterBar
          className="mt-6 sm:mt-8"
          filters={filters}
          onChange={setFilters}
          options={options}
          resultCount={sorted.length}
          sort={sort}
          onSortChange={setSort}
        />

        <h2 className="mt-6 text-2xl font-bold text-brand-navy sm:mt-8 sm:text-[1.75rem]" aria-live="polite">
          {loading ? ' ' : sorted.length === 1 ? t('חולצה אחת', '1 shirt') : t(`${sorted.length} חולצות`, `${sorted.length} shirts`)}
        </h2>

        {loading ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className={i === 0 ? 'col-span-2 md:row-span-2' : ''}>
                <ShirtCardSkeleton featured={i === 0} />
              </li>
            ))}
          </ul>
        ) : sorted.length > 0 ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {sorted.map((s, idx) => {
              const featured = featureFirst && idx === 0;
              return (
                <li key={s.id} className={featured ? 'col-span-2 md:row-span-2' : ''}>
                  <ShirtCard shirt={s} user={user} eager={idx < 6} featured={featured}
                    isWishlisted={wishlistIds.includes(s.id)} onToggleWishlist={toggleWishlist} />
                </li>
              );
            })}
          </ul>
        ) : hasAnyFilter(filters) ? (
          // Nothing left after filtering is not the same as an empty category,
          // and telling someone the shelf is bare when they narrowed it to one
          // size sends them away for no reason.
          <div className="mt-6 rounded-3xl border border-brand-line bg-brand-mist p-8 text-center">
            <p className="text-[17px] font-semibold text-brand-navy">{t('אין חולצה שעונה על הסינון', 'No shirt matches these filters')}</p>
            <p className="mt-1.5 text-[15px] text-brand-navy/65">{t('נסו להוריד סינון אחד, או לנקות הכל.', 'Try removing one filter, or clearing them all.')}</p>
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="shop-btn-secondary mt-5">
              {t('ניקוי הסינון', 'Clear filters')}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-3xl bg-brand-navy p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xl font-semibold">{t('אין כרגע מלאי בקטגוריה הזו', 'Nothing in stock in this category right now')}</p>
              <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-white/70">{t('אבל אנחנו יכולים להשיג. שלחו לנו בקשה ונבדוק.', "But we can get it. Send us a request and we'll check.")}</p>
            </div>
            <Link to="/request-shirt" className="shop-btn flex-shrink-0">
              <PackageSearch className="h-5 w-5" aria-hidden="true" />
              {t('בקשת חולצה', 'Request a shirt')}
            </Link>
          </div>
        )}

        {/* Prose and questions, for the collections big enough to deserve them.
            Most carry none: the same paragraphs on thirty pages with a name
            swapped in is the thin content these pages exist to avoid. */}
        {copy.sections?.length > 0 && (
          <section aria-labelledby="about-collection" className="mt-16 border-t border-brand-line pt-10">
            <h2 id="about-collection" className="text-xl font-semibold text-brand-navy">
              {t(`על ${copy.name}`, `About ${copy.name}`)}
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {copy.sections.map(section => (
                <div key={section.heading}>
                  <h3 className="text-[16px] font-semibold text-brand-navy">{section.heading}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-brand-navy/70">{section.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {copy.faq?.length > 0 && (
          <section aria-labelledby="collection-faq" className="mt-12">
            <h2 id="collection-faq" className="text-xl font-semibold text-brand-navy">{t('שאלות נפוצות', 'Common questions')}</h2>
            <dl className="mt-4 divide-y divide-brand-line border-y border-brand-line">
              {copy.faq.map(item => (
                <div key={item.q} className="py-4">
                  <dt className="text-[16px] font-semibold text-brand-navy">{item.q}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-brand-navy/70">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Internal links between collections: they give crawlers a path from any
            one landing page to the rest, instead of each sitting isolated. */}
        <nav aria-labelledby="more-collections" className="mt-16 border-t border-brand-line pt-10">
          <h2 id="more-collections" className="text-xl font-semibold text-brand-navy">{t('קטגוריות נוספות', 'More categories')}</h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {others.map(c => (
              <li key={c.slug}>
                <Link to={c.href} className="shop-chip px-5">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
