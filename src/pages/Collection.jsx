import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { getAllShirts } from '@/api/shirts';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import Seo from '@/components/Seo';
import PageNotFound from '@/lib/PageNotFound';
import { toast } from '@/components/ui/use-toast';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { COLLECTIONS, findCollection, collectionShirts } from '@/lib/collections';

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
      toast({ title: 'הוסר ממועדפים' });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: shirtId });
      setWishlistIds(p => [...p, shirtId]);
      toast({ title: 'נוסף למועדפים' });
    }
  }, [user, navigate]);

  // An unknown slug is a genuine 404, not an empty collection page - otherwise
  // every typo becomes a thin page competing with the real ones.
  if (!collection) return <PageNotFound />;

  const url = `${SITE_ORIGIN}/collections/${collection.slug}`;
  const others = COLLECTIONS.filter(c => c.slug !== collection.slug).slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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

      <header className="mb-6 pb-5 border-b-2 border-[#1B2A4A]/15">
        <nav className="text-xs font-body text-[#1B2A4A]/50 mb-2" aria-label="נתיב ניווט">
          <Link to="/" className="hover:text-[#E8622A]">דף הבית</Link>
          {' · '}
          <Link to="/catalog" className="hover:text-[#E8622A]">קטלוג</Link>
        </nav>
        <h1 className="font-heading font-black text-3xl md:text-4xl text-[#1B2A4A] uppercase mb-3"
          style={{ textShadow: '2px 2px 6px rgba(27,42,74,0.15)' }}>
          {collection.h1}
        </h1>
        <p className="font-body text-sm text-[#1B2A4A]/70 leading-relaxed max-w-2xl">{collection.intro}</p>
        {!loading && (
          <p className="text-sm text-[#1B2A4A]/50 mt-2 font-body">{shirts.length} חולצות</p>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <ShirtCardSkeleton key={i} />)}
        </div>
      ) : shirts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {shirts.map(s => (
            <ShirtCard key={s.id} shirt={s} user={user}
              isWishlisted={wishlistIds.includes(s.id)} onToggleWishlist={toggleWishlist} />
          ))}
        </div>
      ) : (
        <div className="bg-[#1B2A4A] border-2 border-[#1B2A4A] p-6 text-center"
          style={{ boxShadow: '4px 4px 0 #E8622A' }}>
          <p className="font-heading font-bold text-white uppercase mb-1.5">אין כרגע מלאי בקטגוריה הזו</p>
          <p className="text-sm text-white/70 font-body mb-4">אבל אנחנו יכולים להשיג - שלח לנו בקשה ונבדוק.</p>
          <Link to="/request-shirt"
            className="inline-flex items-center gap-2 bg-[#FFD95A] text-[#1B2A4A] px-5 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-white transition-colors">
            <PackageSearch className="w-4 h-4" />
            בקש חולצה
          </Link>
        </div>
      )}

      {/* Internal links between collections: they give crawlers a path from any
          one landing page to the rest, instead of each sitting isolated. */}
      <nav className="mt-10 pt-6 border-t-2 border-[#1B2A4A]/15" aria-label="קטגוריות נוספות">
        <h2 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide mb-3">קטגוריות נוספות</h2>
        <div className="flex flex-wrap gap-2">
          {others.map(c => (
            <Link key={c.slug} to={`/collections/${c.slug}`}
              className="flex items-center min-h-[44px] px-3 text-xs font-heading font-bold uppercase tracking-wide border-2 border-[#1B2A4A]/30 text-[#1B2A4A] bg-white hover:border-[#1B2A4A] hover:bg-[#F2ECD9] transition-colors">
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
