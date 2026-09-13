import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { getAllShirts } from '@/api/shirts';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import CollectionHero from '@/components/catalog/CollectionHero';
import SortSelect from '@/components/catalog/SortSelect';
import Seo from '@/components/Seo';
import PageNotFound from '@/lib/PageNotFound';
import { toast } from '@/components/ui/use-toast';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { COLLECTIONS, findCollection, collectionShirts } from '@/lib/collections';
import { sortShirts } from '@/lib/sortShirts';
import { withStock } from '@/lib/catalogFacets';

// A landing page per subject - "חולצות רטרו", "חולצות ברצלונה" - rather than a
// query string on /catalog. Same grid as the catalogue, but with a title, an
// intro, and a URL that is about one thing, which is what a search engine can
// rank and a person can share.

export default function Collection() {
  const { slug } = useParams();
  const collection = findCollection(slug);

  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [sort, setSort] = useState('featured');
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
      toast({ title: 'הוסרה מהמועדפים' });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: shirtId });
      setWishlistIds(p => [...p, shirtId]);
      toast({ title: 'נוספה למועדפים' });
    }
  }, [user, navigate]);

  // A collection already arrives newest season first, which is what
  // "recommended" means here.
  const sorted = useMemo(() => sortShirts(shirts, sort, { keepOrder: true }), [shirts, sort]);

  // An unknown slug is a genuine 404, not an empty collection page - otherwise
  // every typo becomes a thin page competing with the real ones.
  if (!collection) return <PageNotFound />;

  const url = `${SITE_ORIGIN}/collections/${collection.slug}`;
  const others = withStock(
    COLLECTIONS.filter(c => c.slug !== collection.slug).map(c => ({ ...c, href: `/collections/${c.slug}` })),
  );
  const featureFirst = sort === 'featured' && sorted.length >= 7;

  return (
    <div>
      <Seo
        title={collection.title}
        description={collection.description}
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
          <nav aria-label="נתיב ניווט" className="shop-eyebrow mb-3">
            <Link to="/" className="transition hover:text-brand-navy">דף הבית</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link to="/catalog" className="transition hover:text-brand-navy">קטלוג</Link>
          </nav>
        )}
        title={collection.h1}
        description={collection.intro}
        chips={others.slice(0, 6).map(c => ({ label: c.name, href: c.href }))}
        images={sorted.filter(s => s.main_image).slice(0, 3).map(s => s.main_image)}
        loading={loading}
      />

      <div className="shop-container">
        <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
          <h2 className="text-2xl font-bold text-brand-navy sm:text-[1.75rem]" aria-live="polite">
            {loading ? ' ' : sorted.length === 1 ? 'חולצה אחת' : `${sorted.length} חולצות`}
          </h2>
          {sorted.length > 1 && <SortSelect value={sort} onChange={setSort} />}
        </div>

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
        ) : (
          <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-3xl bg-brand-navy p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xl font-semibold">אין כרגע מלאי בקטגוריה הזו</p>
              <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-white/70">אבל אנחנו יכולים להשיג. שלחו לנו בקשה ונבדוק.</p>
            </div>
            <Link to="/request-shirt" className="shop-btn flex-shrink-0">
              <PackageSearch className="h-5 w-5" aria-hidden="true" />
              בקשת חולצה
            </Link>
          </div>
        )}

        {/* Internal links between collections: they give crawlers a path from any
            one landing page to the rest, instead of each sitting isolated. */}
        <nav aria-labelledby="more-collections" className="mt-16 border-t border-brand-line pt-10">
          <h2 id="more-collections" className="text-xl font-semibold text-brand-navy">קטגוריות נוספות</h2>
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
