import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, Shirt, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductGallery from '@/components/product/ProductGallery';
import PurchasePanel from '@/components/product/PurchasePanel';
import SizeGuideDrawer from '@/components/product/SizeGuideDrawer';
import ProductRail from '@/components/shop/ProductRail';
import Disclosure from '@/components/shop/Disclosure';
import ShirtReviews from '@/components/ShirtReviews';
import Seo from '@/components/Seo';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/use-toast';
import { shirtSizes } from '@/lib/sizes';
import { shirtBasePrice } from '@/lib/cart';
import { BUSINESS, detail } from '@/lib/business';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { t, isEn } from '@/lib/i18n';
import { term, shirtName, shirtDescription } from '@/lib/english';

const conditionLabels = { new: t('חדש', 'New'), like_new: t('כמו חדש', 'Like new'), used: t('משומש', 'Used') };

function ProductDescription({ shirt }) {
  const description = shirtDescription(shirt);
  const facts = [
    [shirt.national_team && !shirt.club ? t('נבחרת', 'National team') : t('קבוצה', 'Team'), term(shirt.club || shirt.national_team)],
    [t('ליגה', 'League'), term(shirt.league)],
    [t('עונה', 'Season'), shirt.season],
    [t('שחקן', 'Player'), shirt.player_name],
    [t('מצב', 'Condition'), conditionLabels[shirt.condition]],
    [t('מידות', 'Sizes'), shirtSizes(shirt).join(', ')],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-brand-navy/75">
      {description && <p className="whitespace-pre-line">{description}</p>}
      {facts.length > 0 && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
          {facts.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className="text-brand-navy/50">{label}</dt>
              <dd className="font-medium text-brand-navy">{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
      {/* The tags are Hebrew search words; the English site leaves them out. */}
      {!isEn && shirt.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shirt.tags.map(tag => (
            <Link key={tag} to={`/catalog?q=${encodeURIComponent(tag)}`} className="shop-chip min-h-[2.25rem] px-3.5 text-[13px]">
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// The shipping terms as the business has set them in lib/business, so this row
// and the shipping policy page always say the same thing. Those values are
// written in Hebrew, so the English site says the same terms in its own words.
function ShippingDetails() {
  const s = BUSINESS.shipping;
  if (isEn) {
    return (
      <ul className="space-y-3 text-[15px] leading-relaxed text-brand-navy/75">
        <li><span className="font-semibold text-brand-navy">Delivery: </span>within 3 weeks of confirming your order.</li>
        <li><span className="font-semibold text-brand-navy">Shipping: </span>the cost is confirmed with you together with the order.</li>
        <li>
          Cancellations and returns under Israeli consumer protection law.{' '}
          <Link to="/legal/shipping" className="shop-link">Full details</Link>
        </li>
      </ul>
    );
  }
  return (
    <ul className="space-y-3 text-[15px] leading-relaxed text-brand-navy/75">
      <li>
        <span className="font-semibold text-brand-navy">זמן אספקה: </span>
        {detail(s.specialOrderWeeks)}.
      </li>
      {s.carrier && s.price && (
        <li>
          <span className="font-semibold text-brand-navy">משלוח: </span>
          {detail(s.carrier)}, {detail(s.price)}{s.freeAbove ? `, וחינם בהזמנה מעל ${detail(s.freeAbove)}` : ''}.
        </li>
      )}
      <li>
        ביטול עסקה והחזרות לפי חוק הגנת הצרכן.{' '}
        <Link to="/legal/shipping" className="shop-link">כל הפרטים</Link>
      </li>
    </ul>
  );
}

export default function ShirtDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [shirt, setShirt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [user, setUser] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [related, setRelated] = useState([]);
  const [sizeGuide, setSizeGuide] = useState({ open: false, tab: 'fan' });
  const [reviewSummary, setReviewSummary] = useState(null);
  const [attention, setAttention] = useState(0);
  const [ctaPosition, setCtaPosition] = useState('below');
  const ctaRef = useRef(null);

  useEffect(() => {
    loadShirt();
    loadUser();
  }, [id]);

  async function loadShirt() {
    setLoading(true);
    setError(false);
    setSiblings([]);
    setRelated([]);
    setReviewSummary(null);
    try {
      // Direct single-shirt fetch - never loads the whole catalog
      const s = await base44.entities.Shirt.get(id);
      setShirt(s);
      setLoading(false);

      // Fire-and-forget view increment - never block the UI
      base44.entities.Shirt.update(id, { views_count: (s.views_count || 0) + 1 }).catch(() => {});

      // Related shirts load in the background, after the shirt is visible.
      loadRelated(s);
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  // Other shirts of the same club or national team, shown as small swatches in
  // the purchase card; and a longer row for the foot of the page, topped up
  // from the same league and then the newest shirts when the team alone has
  // too few to fill it.
  async function loadRelated(s) {
    try {
      const team = s.club ? { club: s.club } : s.national_team ? { national_team: s.national_team } : null;
      const sameTeam = team
        ? (await base44.entities.Shirt.filter({ ...team, status: 'available' }, '-created_date', 12)).filter(r => r.id !== s.id)
        : [];
      setSiblings(sameTeam.slice(0, 5));

      let rail = sameTeam.slice(0, 10);
      if (rail.length < 8) {
        const pool = s.league
          ? await base44.entities.Shirt.filter({ league: s.league, status: 'available' }, '-created_date', 20)
          : await base44.entities.Shirt.filter({ status: 'available' }, '-created_date', 20);
        const seen = new Set([s.id, ...rail.map(r => r.id)]);
        rail = [...rail, ...pool.filter(r => !seen.has(r.id))].slice(0, 10);
      }
      setRelated(rail);
    } catch { /* related products are non-critical */ }
  }

  async function loadUser() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const wl = await base44.entities.Wishlist.filter({ user_id: me.id, shirt_id: id });
      setIsWishlisted(wl.length > 0);
    } catch { /* not logged in */ }
  }

  // A link that arrives with ?interest=true (older cards and shared links)
  // lands on the size choice rather than on a window that no longer exists.
  useEffect(() => {
    if (shirt && searchParams.get('interest') === 'true') setAttention(a => a + 1);
  }, [shirt?.id]);

  // The phone's sticky bar shows only while the real button is still further
  // down the page. Once the customer has scrolled to it or past it, the bar
  // would only cover the footer.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setCtaPosition('visible');
      else setCtaPosition(entry.boundingClientRect.top > 0 ? 'below' : 'above');
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [shirt?.id, loading]);

  const toggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    if (isWishlisted) {
      const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: id });
      if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
      setIsWishlisted(false);
      toast({ title: t('הוסרה מהמועדפים', 'Removed from your wishlist') });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: id });
      setIsWishlisted(true);
      toast({ title: t('נוספה למועדפים', 'Added to your wishlist') });
    }
  };

  // The phone's own share sheet where there is one; elsewhere, the link is
  // copied.
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: shirtName(shirt), url }); } catch { /* dismissed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t('הקישור הועתק', 'Link copied') });
    } catch { /* clipboard unavailable */ }
  };

  const allImages = useMemo(() =>
    shirt ? [shirt.main_image, ...(shirt.extra_images || [])].filter(Boolean) : [],
    [shirt]
  );

  const productJsonLd = useMemo(() => {
    if (!shirt) return null;
    const origin = SITE_ORIGIN;
    const desc = shirt.description
      ? shirt.description.slice(0, 155)
      : `${shirt.name} - ${shirt.club || shirt.national_team || ''} ${shirt.season || ''} ${shirt.player_name || ''}`.trim();
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          name: shirt.name,
          description: desc,
          url: origin + "/shirt/" + shirt.id,
          ...(shirt.main_image ? { image: [shirt.main_image] } : {}),
          sku: shirt.id,
          brand: { "@type": "Brand", name: shirt.club || shirt.national_team || "JerseyLab" },
          offers: {
            "@type": "Offer",
            url: origin + "/shirt/" + shirt.id,
            price: shirtBasePrice(shirt),
            priceCurrency: "ILS",
            availability: shirt.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            ...(shirt.condition && shirt.condition !== "new" ? { itemCondition: "https://schema.org/UsedCondition" } : {}),
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "דף הבית", item: origin + "/" },
            { "@type": "ListItem", position: 2, name: "קטלוג", item: origin + "/catalog" },
            { "@type": "ListItem", position: 3, name: shirt.name, item: origin + "/shirt/" + shirt.id },
          ],
        },
      ],
    };
  }, [shirt]);

  if (loading) {
    return (
      <div className="shop-container pb-16 pt-6 lg:pt-10" aria-busy="true">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] xl:gap-16">
          <div className="aspect-square rounded-[1.75rem] skeleton" />
          <div className="shop-card space-y-4 p-6 sm:p-8">
            <div className="h-8 w-3/4 rounded-full skeleton" />
            <div className="h-5 w-1/3 rounded-full skeleton" />
            <div className="h-8 w-24 rounded-full skeleton" />
            <div className="h-px bg-brand-line" />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-11 w-14 rounded-full skeleton" />)}
            </div>
            <div className="h-14 rounded-2xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-container py-10">
        <EmptyState
          icon={Shirt}
          title={t('לא הצלחנו לטעון את החולצה', "We couldn't load this shirt")}
          description={t('בדקו את החיבור לאינטרנט ונסו שוב, או חזרו לקטלוג.', 'Check your internet connection and try again, or go back to the catalog.')}
          actionLabel={t('לנסות שוב', 'Try again')}
          onAction={() => window.location.reload()}
          secondaryLabel={t('לקטלוג', 'To the catalog')}
          secondaryTo="/catalog"
        />
      </div>
    );
  }

  if (!shirt) {
    return (
      <div className="shop-container py-10">
        <EmptyState
          icon={Shirt}
          title={t('החולצה לא נמצאה', 'Shirt not found')}
          description={t('ייתכן שהחולצה כבר לא זמינה או שהקישור אינו תקין.', 'The shirt may no longer be available, or the link may be broken.')}
          actionLabel={t('לקטלוג', 'To the catalog')}
          actionTo="/catalog"
        />
      </div>
    );
  }

  const name = shirtName(shirt);
  const seoTitle = `${name} - JerseyLab`;
  const seoDesc = shirt.description
    ? shirt.description.slice(0, 155)
    : `${shirt.name} - ${shirt.club || shirt.national_team || ''} ${shirt.season || ''} ${shirt.player_name || ''}`.trim();

  const roundButton = 'flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand-navy shadow-card backdrop-blur transition hover:scale-105';
  const reviewsMeta = reviewSummary?.count
    ? `${reviewSummary.average.toFixed(1)} ★ (${reviewSummary.count})`
    : undefined;

  return (
    <div>
      <Seo title={seoTitle} description={seoDesc} image={shirt.main_image} type="product" canonicalPath={`/shirt/${shirt.id}`} jsonLd={productJsonLd} />

      <div className="shop-container pb-12 pt-5 lg:pb-16 lg:pt-8">
        <nav aria-label={t('נתיב ניווט', 'Breadcrumb')} className="mb-5 flex min-w-0 items-center gap-1.5 text-sm text-brand-navy/50 lg:mb-8">
          <Link to="/" className="flex-shrink-0 transition hover:text-brand-navy">{t('דף הבית', 'Home')}</Link>
          <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <Link to="/catalog" className="flex-shrink-0 transition hover:text-brand-navy">{t('קטלוג', 'Catalog')}</Link>
          <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate text-brand-navy/75">{name}</span>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] xl:gap-16">
          <div className="lg:sticky lg:top-28">
            <ProductGallery
              shirt={shirt}
              images={allImages}
              overlay={(
                <div className="absolute end-4 top-4 flex flex-col gap-2">
                  <button type="button" onClick={toggleWishlist} aria-pressed={isWishlisted}
                    aria-label={isWishlisted ? t('הסרה מהמועדפים', 'Remove from wishlist') : t('הוספה למועדפים', 'Add to wishlist')} className={roundButton}>
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-brand-orange text-brand-orange' : ''}`} />
                  </button>
                  <button type="button" onClick={handleShare} aria-label={t('שיתוף החולצה', 'Share this shirt')} className={roundButton}>
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            />
          </div>

          <div>
            <PurchasePanel
              shirt={shirt}
              siblings={siblings}
              attention={attention}
              ctaRef={ctaRef}
              onOpenSizeGuide={(tab) => setSizeGuide({ open: true, tab: tab || (shirt.gender_category === 'kids' ? 'kids' : 'fan') })}
            />

            <div className="mt-4 space-y-2.5">
              <Disclosure title={t('תיאור המוצר', 'Product description')}>
                <ProductDescription shirt={shirt} />
              </Disclosure>
              <Disclosure title={t('משלוחים והחזרות', 'Shipping & returns')}>
                <ShippingDetails />
              </Disclosure>
              <Disclosure title={t('ביקורות', 'Reviews')} meta={reviewsMeta}>
                <ShirtReviews shirtId={id} user={user} onSummary={setReviewSummary} />
              </Disclosure>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="shop-container" aria-labelledby="related-heading">
          <div className="rounded-[2rem] bg-gradient-to-b from-brand-mist to-white px-4 pb-2 pt-10 sm:px-8 sm:pt-14 lg:px-12">
            <h2 id="related-heading" className="shop-title text-center">{t('אולי יעניין אתכם גם', 'You might also like')}</h2>
            <div className="mt-8 sm:mt-10">
              <ProductRail shirts={related} user={user} label={t('חולצות נוספות', 'More shirts')} />
            </div>
          </div>
        </section>
      )}

      <SizeGuideDrawer
        open={sizeGuide.open}
        onOpenChange={(open) => setSizeGuide(g => ({ ...g, open }))}
        shirtName={name}
        defaultTab={sizeGuide.tab}
      />

      {/* Keeps the way to order in reach on a phone, where the purchase card
          sits below the photo. */}
      {shirt.status === 'available' && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 lg:hidden ${ctaPosition === 'below' ? 'translate-y-0' : 'translate-y-full'}`}
          aria-hidden={ctaPosition !== 'below'}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-navy">{name}</p>
              <p className="text-sm font-semibold tabular-nums text-brand-navy/65">₪{shirtBasePrice(shirt)}</p>
            </div>
            <button type="button" tabIndex={ctaPosition === 'below' ? 0 : -1} onClick={() => setAttention(a => a + 1)} className="shop-btn min-h-[3rem] px-6">
              {t('להזמנה', 'Order')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
