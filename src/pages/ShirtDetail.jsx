import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, ChevronRight, Copy, Check, Info, Shirt } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/ui/StatusBadge';
import TagBadge from '@/components/ui/TagBadge';
import InterestModal, { CartModal } from '@/components/InterestModal';
import ShirtCard from '@/components/ShirtCard';
import ShirtReviews from '@/components/ShirtReviews';
import ShippingBadge, { hasLocalStock, hasLocalStockForSize } from '@/components/ShippingBadge';
import ShippingInfoModal from '@/components/ShippingInfoModal';
import ProductImage from '@/components/ui/ProductImage';
import Seo from '@/components/Seo';
import EmptyState from '@/components/ui/EmptyState';
import TrustBar from '@/components/TrustBar';
import { toast } from '@/components/ui/use-toast';

const conditionLabels = { new: 'חדש', like_new: 'כמו חדש', used: 'משומש' };

export default function ShirtDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [shirt, setShirt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [user, setUser] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [interestOpen, setInterestOpen] = useState(searchParams.get('interest') === 'true');
  const [cartOpen, setCartOpen] = useState(false);
  const [related, setRelated] = useState([]);
  const [copied, setCopied] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [shippingInfoOpen, setShippingInfoOpen] = useState(false);
  const [error, setError] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  useEffect(() => {
    loadShirt();
    loadUser();
  }, [id]);

  async function loadShirt() {
    setLoading(true);
    setError(false);
    setRelated([]);
    try {
      // Direct single-shirt fetch — never loads the whole catalog
      const s = await base44.entities.Shirt.get(id);
      setShirt(s);
      setLoading(false);

      // Analytics + fire-and-forget view increment — never block the UI
      base44.analytics.track({ eventName: 'product_view', properties: { shirt_id: s.id, club: s.club || s.national_team || '', status: s.status } });
      base44.entities.Shirt.update(id, { views_count: (s.views_count || 0) + 1 }).catch(() => {});

      // Load related products in the background AFTER the shirt is visible
      loadRelated(s);
    } catch (e) {
      setError(true);
      setLoading(false);
    }
  }

  // Background load of related shirts — does not block the main product rendering
  async function loadRelated(s) {
    try {
      if (!s.club && !s.national_team) return;
      let rel = [];
      if (s.club) {
        rel = await base44.entities.Shirt.filter({ club: s.club, status: 'available' }, '-created_date', 5);
      } else {
        rel = await base44.entities.Shirt.filter({ national_team: s.national_team, status: 'available' }, '-created_date', 5);
      }
      setRelated(rel.filter((r) => r.id !== s.id).slice(0, 4));
    } catch {/* related products are non-critical */}
  }

  async function loadUser() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const wl = await base44.entities.Wishlist.filter({ user_id: me.id, shirt_id: id });
      setIsWishlisted(wl.length > 0);
    } catch {/* not logged in */}
  }

  const toggleWishlist = async () => {
    if (!user) {navigate('/login');return;}
    if (isWishlisted) {
      const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: id });
      if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
      setIsWishlisted(false);
      toast({ title: 'הוסר ממועדפים' });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: id });
      setIsWishlisted(true);
      toast({ title: 'נוסף למועדפים' });
    }
  };

  const shareUrl = window.location.href;
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allImages = useMemo(() =>
    shirt ? [shirt.main_image, ...(shirt.extra_images || [])].filter(Boolean) : [],
    [shirt]
  );

  const sortedSizes = useMemo(() => {
    if (!shirt?.sizes) return [];
    const SIZE_ORDER = ['XS','S','M','L','XL','2XL','3XL','4XL','6-7Y','8-9Y','10-11Y','12-13Y','14-15Y'];
    return Object.keys(shirt.sizes)
      .map(s => (s === 'XXL' ? '2XL' : s))
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .sort((a, b) => {
        const ai = SIZE_ORDER.indexOf(a), bi = SIZE_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
  }, [shirt]);

  const displayTags = useMemo(() => {
    if (!shirt) return [];
    const t = [];
    if (shirt.is_rare) t.push('נדיר');
    if (shirt.is_retro) t.push('רטרו');
    if (shirt.is_new) t.push('חדש');
    if (shirt.sale_price && shirt.sale_price < shirt.price) t.push('סייל');
    return t;
  }, [shirt]);

  const productJsonLd = useMemo(() => {
    if (!shirt) return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jerseylabil.base44.app";
    const desc = shirt.description
      ? shirt.description.slice(0, 155)
      : `${shirt.name} — ${shirt.club || shirt.national_team || ''} ${shirt.season || ''} ${shirt.player_name || ''}`.trim();
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
            price: shirt.sale_price || shirt.price,
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square skeleton" />
          <div className="space-y-4">
            <div className="h-8 skeleton w-3/4" />
            <div className="h-4 skeleton w-1/2" />
            <div className="h-6 skeleton w-1/4" />
          </div>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <EmptyState
          icon={Shirt}
          title="לא הצלחנו לטעון את החולצה"
          description="בדוק את החיבור לאינטרנט ונסה שוב, או חזור לקטלוג."
          actionLabel="נסה שוב"
          onAction={() => window.location.reload()}
        />
        <div className="text-center -mt-2 mb-4">
          <Link to="/catalog" className="text-sm text-[#1B2A4A]/60 hover:text-[#E8622A] font-body">חזור לקטלוג ←</Link>
        </div>
      </div>
    );
  }

  if (!shirt) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <EmptyState
          icon={Shirt}
          title="חולצה לא נמצאה"
          description="ייתכן שהחולצה כבר לא זמינה או שהקישור אינו תקין."
          actionLabel="חזור לקטלוג"
          actionTo="/catalog"
        />
      </div>
    );
  }

  const visibleThumbs = showAllImages ? allImages : allImages.slice(0, 3);

  const seoTitle = `${shirt.name} — JerseyLab`;
  const seoDesc = shirt.description
    ? shirt.description.slice(0, 155)
    : `${shirt.name} — ${shirt.club || shirt.national_team || ''} ${shirt.season || ''} ${shirt.player_name || ''}`.trim();

  return (
    <div>
      <Seo title={seoTitle} description={seoDesc} image={shirt.main_image} type="product" canonicalPath={`/shirt/${shirt.id}`} jsonLd={productJsonLd} />
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-24 lg:pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-varnish mb-6">
          <Link to="/" className="hover:text-pitch">דף הבית</Link>
          <ChevronRight className="w-3 h-3 rotate-180" />
          <Link to="/catalog" className="hover:text-pitch">קטלוג</Link>
          <ChevronRight className="w-3 h-3 rotate-180" />
          <span className="text-pitch">{shirt.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Images */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="relative">
              <StatusBadge status={shirt.status} className="absolute top-3 right-3 z-10" />
              <div
                role="button"
                tabIndex={0}
                aria-label={zoomed ? 'הקטן תמונה' : 'הגדל תמונה'}
                aria-pressed={zoomed}
                className={`aspect-square bg-gray-50 overflow-hidden relative ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setZoomed(!zoomed)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoomed(z => !z); } }}>
                <ProductImage
                  eager
                  src={allImages[selectedImage]}
                  alt={shirt.name}
                  className={`w-full h-full object-cover transition-transform duration-300 ${zoomed ? 'scale-150' : ''}`}
                />
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 items-center">
                {visibleThumbs.map((img, i) => (
                  <button key={i} onClick={() => { setSelectedImage(i); setZoomed(false); }}
                    className={`relative w-16 h-16 flex-shrink-0 border-2 overflow-hidden touch-manipulation ${i === selectedImage ? 'border-pitch' : 'border-gray-200'}`}>
                    <ProductImage src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {!showAllImages && allImages.length > 3 && (
                  <button onClick={() => setShowAllImages(true)}
                    className="w-16 h-16 flex-shrink-0 border-2 border-[#1B2A4A] text-[#1B2A4A] text-xs font-heading font-bold hover:bg-[#F2ECD9]">
                    +{allImages.length - 3}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {/* Tags */}
            {displayTags.length > 0 &&
            <div className="flex gap-1 flex-wrap mb-3">
                {displayTags.map((t) => <TagBadge key={t} tag={t} />)}
              </div>
            }



            <h1 className="font-heading font-black text-2xl md:text-3xl mb-2">{shirt.name}</h1>

            <div className="flex flex-wrap gap-3 text-sm text-varnish mb-4">
              {shirt.club && <span>{shirt.club}</span>}
              {shirt.national_team && <span>{shirt.national_team}</span>}
              {shirt.league && <span>• {shirt.league}</span>}
              {shirt.season && <span>• {shirt.season}</span>}
              {shirt.player_name && <span>• {shirt.player_name}</span>}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              {shirt.sale_price && shirt.sale_price < shirt.price ?
              <>
                  <span className="font-mono font-bold text-3xl text-redcard">₪{shirt.sale_price}</span>
                  <span className="font-mono text-xl text-varnish line-through">₪{shirt.price}</span>
                </> :
              <span className="font-mono font-bold text-3xl text-pitch">₪{shirt.price}</span>
              }
            </div>

            {/* Sizes */}
            {shirt.sizes && Object.keys(shirt.sizes).length > 0 &&
            <div className="mb-6">
                <h3 className="font-heading font-bold text-sm mb-2">מידות זמינות:</h3>
                <div className="flex gap-2 flex-wrap">
                  {sortedSizes.map(size => {
                      const isLocal = hasLocalStockForSize(shirt, size);
                      const isSelected = selectedSize === size;
                      return (
                        <button key={size} type="button" onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                          className={`flex flex-col items-center justify-center min-h-[2.75rem] px-3 py-1 border-2 text-sm font-mono transition-all ${isSelected ? (isLocal ? 'border-green-700 bg-green-600 text-white' : 'bg-[#1B2A4A] text-white border-[#1B2A4A]') : isLocal ? 'border-green-600 text-green-700 bg-green-50 hover:bg-green-100' : 'border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#F2ECD9]'}`}>
                          <span>{size}</span>
                          {isLocal ? (
                            <span className="text-[8px] font-heading font-bold uppercase leading-none mt-0.5">מלאי בארץ</span>
                          ) : (
                            <span className="text-[8px] leading-none mt-0.5 opacity-0">מלאי</span>
                          )}
                        </button>
                      );
                    })}
                </div>
                {hasLocalStock(shirt) && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-green-700 font-body">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    מידות מסומנות זמינות במלאי בארץ
                  </div>
                )}
              </div>
            }

            {/* Shipping Info */}
            <div className="mb-6">
              <ShippingBadge shirt={shirt} size={selectedSize} />
              <button onClick={() => setShippingInfoOpen(true)} className="flex items-center gap-1 text-xs text-[#E8622A] font-bold font-heading uppercase mt-2 hover:underline">
                <Info className="w-3.5 h-3.5" />
                פרטים על משלוחים
              </button>
            </div>

            {/* Description */}
            {shirt.description &&
            <div className="mb-6">
                <h3 className="font-heading font-bold text-sm mb-2">תיאור:</h3>
                <p className="text-sm text-varnish leading-relaxed whitespace-pre-wrap">{shirt.description}</p>
              </div>
            }

            {/* Tags */}
            {shirt.tags && shirt.tags.length > 0 &&
            <div className="flex gap-1 flex-wrap mb-6">
                {shirt.tags.map((t) =>
              <Link key={t} to={`/catalog?q=${encodeURIComponent(t)}`} className="text-xs px-2 py-1 border-2 border-[#1B2A4A] text-[#1B2A4A] bg-transparent hover:bg-[#F2ECD9] transition-colors font-mono">
                    #{t}
                  </Link>
              )}
              </div>
            }

            {/* Trust signals — reassure right before the CTA */}
            <TrustBar />

            {/* Actions */}
            <div className="space-y-3 mb-6">
              {shirt.status === 'available' && (
                <>
                <button onClick={() => setInterestOpen(true)}
                  className="w-full py-4 font-heading font-black text-base bg-[#E8622A] text-white active:bg-[#D0551F] touch-manipulation"
                  style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
                  aria-label={`שלח בקשת התעניינות עבור ${shirt.name}`}>
                  אני מעוניין
                </button>
                <p className="text-center text-[11px] text-[#1B2A4A]/50 font-body">ללא התחייבות — נחזור אליך עם פרטי זמינות</p>
                </>
              )}
              <div className="flex gap-2">
                <button onClick={toggleWishlist}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 border-2 text-sm font-bold touch-manipulation transition-colors ${isWishlisted ? 'border-redcard text-redcard bg-red-50' : 'border-pitch text-pitch'}`}>
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-redcard' : ''}`} />
                  <span className="hidden sm:inline">{isWishlisted ? 'במועדפים' : 'הוסף למועדפים'}</span>
                  <span className="sm:hidden">{isWishlisted ? 'במועדפים' : 'מועדפים'}</span>
                </button>
                <button onClick={handleCopy}
                  aria-label={copied ? 'קישור הועתן' : 'העתק קישור לחולצה'}
                  className="flex items-center justify-center px-4 py-3.5 border-2 border-pitch text-pitch touch-manipulation">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(shirt.name + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer"
                  aria-label="שתף את החולצה בוואטסאפ"
                  className="flex items-center justify-center px-4 py-3.5 border-2 border-pitch text-pitch touch-manipulation">
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews & Trust Section */}
        <ShirtReviews shirtId={id} user={user} />

        {/* Related */}
        {related.length > 0 &&
        <div className="mt-16">
            <h2 className="font-heading font-black text-xl mb-6">חולצות דומות</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((s) => <ShirtCard key={s.id} shirt={s} user={user} />)}
            </div>
          </div>
        }
      </div>

      {/* Interest Modal */}
      {shirt &&
      <InterestModal shirt={shirt} open={interestOpen} onClose={() => setInterestOpen(false)} user={user} initialSize={selectedSize} />
      }
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} user={user} />
      <ShippingInfoModal open={shippingInfoOpen} onClose={() => setShippingInfoOpen(false)} />

      {/* Sticky mobile CTA — keeps the primary action reachable while scrolling */}
      {shirt.status === 'available' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#1B2A4A] px-3 py-2 flex items-center gap-3" style={{ boxShadow: '0 -3px 0 #E8622A' }}>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-xs text-[#1B2A4A] uppercase truncate">{shirt.name}</p>
            <p className="font-mono font-bold text-sm text-[#E8622A]">{shirt.sale_price && shirt.sale_price < shirt.price ? `₪${shirt.sale_price}` : `₪${shirt.price}`}</p>
          </div>
          <button onClick={() => setInterestOpen(true)} className="bg-[#E8622A] text-white px-6 py-3 font-heading font-black text-sm uppercase touch-manipulation active:bg-[#D0551F]" style={{ boxShadow: '2px 2px 0 #1B2A4A' }}>
            אני מעוניין
          </button>
        </div>
      )}
    </div>);

}