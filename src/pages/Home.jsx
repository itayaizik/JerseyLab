import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Camera, Ruler, Zap, Star, ChevronDown, MessageCircle, Instagram, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import PopularClubsSection from '@/components/PopularClubsSection';
import LeaguesSection from '@/components/LeaguesSection';
import CategoryCardsSection from '@/components/CategoryCardsSection';
import PromoBanner from '@/components/PromoBanner';
import InstagramSection from '@/components/InstagramSection';
import Seo from '@/components/Seo';
import ProductImage from '@/components/ui/ProductImage';
import { toast } from '@/components/ui/use-toast';

// Hand-set so the fan reads as a scattered stack rather than a straight row.
const HERO_LINEUP = ['ביתר ירושלים', 'הפועל תל אביב', 'ברצלונה', 'ריאל מדריד'];
const HERO_TILT = [-7, 4, -3, 6];
const HERO_LIFT = [6, -10, 12, -4];

// Shortcuts under the hero search. This list already existed in the file but
// nothing rendered it; the fast-shipping entry is new, since local stock is the
// thing customers most want to filter for.
const HERO_SHORTCUTS = [
  { label: 'מלאי בארץ', href: '/catalog?fast=true', emoji: '⚡' },
  { label: 'נבחרות', href: '/catalog?type=national', emoji: '🏆' },
  { label: 'רטרו', href: '/catalog?tag=retro', emoji: '🕰️' },
  { label: 'סייל', href: '/catalog?sale=true', emoji: '🔥' },
  { label: 'ילדים', href: '/catalog?gender=kids', emoji: '👦' },
];


const whyUsCards = [
{ title: 'חולצות נבדקות', desc: 'כל חולצה נבדקת לפני העלאה לאתר', icon: ShieldCheck },
{ title: 'בדיקת זמינות', desc: 'אפשר לבדוק זמינות לפי מידה', icon: Ruler },
{ title: 'תמונות אמיתיות', desc: 'תמונות מקוריות ברורות של כל פריט', icon: Camera },
{ title: 'מענה מהיר', desc: 'מענה בוואטסאפ / אינסטגרם תוך זמן קצר', icon: Zap },
{ title: 'מחירים נוחים', desc: "\u05DE\u05D7\u05D9\u05E8\u05D9\u05DD \u05E9\u05D5\u05D5\u05D9\u05DD \u05D5\u05D4\u05D5\u05D2\u05E0\u05D9\u05DD \u05DC\u05DB\u05DC \u05DB\u05D9\u05E1", icon: Star },
{ title: 'חולצות מיוחדות', desc: 'רטרו ושחקנים שקשה למצוא', icon: ShieldCheck }];


export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogShirts, setCatalogShirts] = useState([]);
  const [newShirts, setNewShirts] = useState([]);
  const [featuredShirts, setFeaturedShirts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [fastShippingShirts, setFastShippingShirts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [user, setUser] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Four named home kits for the hero collage — two Israeli, two Spanish. They
  // are matched by club rather than pinned by id so a re-import cannot empty
  // the hero, and the newest season always wins. Any slot that finds nothing
  // falls back to the featured/new/best pool, so the collage is never short.
  const heroShirts = useMemo(() => {
    const withPhoto = catalogShirts.filter(s => s?.main_image);
    // The club name is stripped before testing for the kit: "ביתר ירושלים"
    // contains "בית", so matching the raw name picks the away shirt too.
    const newestHomeKit = (club) => withPhoto
      .filter(s => s.club === club && (s.name || '').replace(club, '').includes('בית'))
      .sort((a, b) => String(b.season || '').localeCompare(String(a.season || '')))[0];

    const seen = new Set();
    const picked = [];
    const take = (shirt) => {
      if (!shirt || seen.has(shirt.id)) return;
      seen.add(shirt.id);
      picked.push(shirt);
    };

    HERO_LINEUP.forEach(club => take(newestHomeKit(club)));
    [...featuredShirts, ...newShirts, ...bestSellers, ...withPhoto].forEach(s => {
      if (picked.length < 4) take(s?.main_image ? s : null);
    });
    return picked.slice(0, 4);
  }, [catalogShirts, featuredShirts, newShirts, bestSellers]);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoadError(false);
      let allShirts, revs, faqList, settingsData;
      try {
        [allShirts, revs, faqList, settingsData] = await Promise.all([
        base44.entities.Shirt.filter({ status: 'available' }, '-created_date', 200),
        base44.entities.Review.filter({ approved: true }, '-created_date', 6),
        base44.entities.FAQ.filter({ active: true }, 'sort_order', 5),
        base44.entities.SiteSetting.list('-created_date', 100)]
        );
      } catch (err) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setCatalogShirts(allShirts);
      setNewShirts(allShirts.filter(s => s.is_new).slice(0, 8));
      setFeaturedShirts(allShirts.filter(s => s.featured).slice(0, 8));
      setBestSellers([...allShirts].filter(s => s.best_seller).sort((a,b) => (b.interest_count||0)-(a.interest_count||0)).slice(0, 8));
      setFastShippingShirts(allShirts.filter(s => s.local_stock_sizes && Object.values(s.local_stock_sizes).some(q => Number(q) > 0)).slice(0, 8));
      setReviews(revs);
      setFaqs(faqList);
      const settingsObj = {};
      settingsData.forEach(d => { settingsObj[d.key] = d.value; });
      setSiteSettings(settingsObj);
      setLoading(false);

      // User/wishlist loads after content is visible — does not block the first paint.
      try {
        const me = await base44.auth.me();
        setUser(me);
        const wl = await base44.entities.Wishlist.filter({ user_id: me.id });
        setWishlistIds(wl.map((w) => w.shirt_id));
      } catch {/* not logged in */}
    }
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      base44.analytics.track({ eventName: 'search_performed', properties: { source: 'home' } });
      base44.entities.SearchLog.create({ search_term: searchTerm.trim() }).catch(() => {});
      navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const wishlistIdsRef = useRef(wishlistIds);
  useEffect(() => { wishlistIdsRef.current = wishlistIds; }, [wishlistIds]);

  const toggleWishlist = useCallback(async (shirtId) => {
    if (!user) {navigate('/login');return;}
    if (wishlistIdsRef.current.includes(shirtId)) {
      const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: shirtId });
      if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
      setWishlistIds((p) => p.filter((id) => id !== shirtId));
      toast({ title: 'הוסר ממועדפים' });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: shirtId });
      setWishlistIds((p) => [...p, shirtId]);
      toast({ title: 'נוסף למועדפים' });
    }
  }, [user, navigate]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
  <div style={{ background: 'transparent' }}>
    <Seo
      title="JerseyLab — חולצות כדורגל נדירות לאספנים ואוהדים"
      description="חולצות כדורגל איכותיות ונדירות לאספנים ואוהדים. מצא חולצות של קבוצות, נבחרות ושחקנים אהובים — חדשות, רטרו ומהדורות מיוחדות במחירים טובים."
      canonicalPath="/"
      jsonLd={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            name: "JerseyLab",
            url: typeof window !== "undefined" ? window.location.origin : "https://jerseylabil.base44.app",
            logo: { "@type": "ImageObject", url: "https://media.base44.com/images/public/6a42e762005950f7dc39df84/de8c45ac1_ChatGPTImageJul31202602_56_05AM.png", width: 512, height: 512 },
            description: "ארכיון בלעדי של חולצות כדורגל נדירות לאספנים ואוהדים.",
            sameAs: ["https://instagram.com/Jerseylabil"]
          },
          {
            "@type": "WebSite",
            name: "JerseyLab",
            url: typeof window !== "undefined" ? window.location.origin : "https://jerseylabil.base44.app",
            inLanguage: "he-IL",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: (typeof window !== "undefined" ? window.location.origin : "https://jerseylabil.base44.app") + "/catalog?q={search_term_string}" },
              "query-input": "required name=search_term_string"
            }
          }
        ]
      }}
    />

    {loadError ? (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <p className="font-heading font-black text-2xl text-[#1B2A4A] uppercase mb-2">לא הצלחנו לטעון את הדף</p>
        <p className="text-[#1B2A4A]/60 font-body text-sm mb-6">בדוק את החיבור לאינטרנט ונסה שוב</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#E8622A] text-white font-heading font-bold text-sm uppercase hover:bg-[#D0551F] transition-colors" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
          נסה שוב
        </button>
      </div>
    ) : (
      <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden" style={{ background: '#E8DFC8', minHeight: 340 }}>
        {/* grid pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(27,42,74,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(27,42,74,0.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />

        <div className="relative max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div>
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-[#1B2A4A] leading-tight mb-4 uppercase">
                חולצות כדורגל איכותיות,
                <br />
                <span className="text-[#E8622A]">נדירות ובמחירים טובים</span>
              </h1>
              <p className="font-body text-[#1B2A4A]/70 text-base mb-6">
                מצא חולצות של קבוצות, נבחרות ושחקנים אהובים במקום אחד.
              </p>

              {/* Search + the shortcuts under it. An empty search box gives no
                  hint what is worth typing, so the quick filters carry the
                  browsing intent and the box handles the specific one. */}
              <form onSubmit={handleSearch} className="mb-3 max-w-md">
                <div className="flex border-2 border-[#1B2A4A] bg-white" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="חפש שחקן, קבוצה, עונה..."
                    aria-label="חיפוש חולצות"
                    maxLength={100}
                    autoComplete="off"
                    className="flex-1 bg-transparent px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none text-[#1B2A4A] font-body" />

                  <button type="submit" aria-label="חיפוש" className="px-5 bg-[#1B2A4A] text-white font-heading font-bold text-sm">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <nav aria-label="קיצורי דרך לקטלוג" className="flex flex-wrap gap-2 mb-6 max-w-md">
                {HERO_SHORTCUTS.map(c => (
                  <Link key={c.href} to={c.href}
                    className="inline-flex items-center gap-1.5 bg-white border-2 border-[#1B2A4A] px-3 py-1.5 text-xs font-heading font-bold text-[#1B2A4A] uppercase hover:bg-[#1B2A4A] hover:text-white transition-colors">
                    <span aria-hidden="true">{c.emoji}</span>
                    {c.label}
                  </Link>
                ))}
              </nav>

              {/* One CTA. The cart button that used to sit here duplicated the
                  navbar's — same action, same badge, both on screen at once. */}
              <Link to="/catalog"
                className="inline-block bg-[#E8622A] text-white font-heading font-bold px-8 py-3 uppercase tracking-wider text-sm hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                style={{ boxShadow: '3px 3px 0 #1B2A4A', textShadow: '1px 1px 4px rgba(0,0,0,0.25)' }}>
                מצא חולצות
              </Link>
            </div>

            {/* Right: real shirts as a polaroid fan.
                Previously four Unsplash stock photos — a stadium, a ball, boots,
                a pitch — with no jersey among them, absolutely positioned at
                percentages that left a hole through the middle. Now it shows
                actual stock, each photo linking to its product page, and fills
                the caption strip `.polaroid` already reserves (padding-bottom:28px)
                but nothing was using. A centred flex fan can't leave gaps the way
                the hand-tuned percentages did. */}
            <div className="relative h-64 md:h-80 hidden md:flex items-center justify-center" dir="ltr">
              {heroShirts.map((shirt, i) => (
                <Link
                  key={shirt.id}
                  to={`/shirt/${shirt.id}`}
                  aria-label={shirt.name}
                  className="polaroid relative block flex-shrink-0 transition-all duration-200 hover:-translate-y-2 hover:shadow-xl hover:!z-20"
                  style={{
                    // Proportional to the column, not fixed px and not vw: the
                    // collage appears from `md` up, where this column is only
                    // ~340px wide, so four fixed-width cards ran straight out of
                    // it. 4x26% minus 3x4% of overlap is 92% of the container, so
                    // the fan fits at any width by construction.
                    width: '26%',
                    marginLeft: i === 0 ? 0 : '-4%',
                    transform: `rotate(${HERO_TILT[i]}deg) translateY(${HERO_LIFT[i]}px)`,
                    zIndex: i + 1,
                  }}
                >
                  <div className="relative w-full aspect-square bg-[#F2ECD9] overflow-hidden">
                    <ProductImage src={shirt.main_image} alt={shirt.name} eager={i < 2} className="w-full h-full object-cover" />
                  </div>
                  <p dir="rtl" className="absolute bottom-1.5 inset-x-2 text-[10px] leading-tight text-[#1B2A4A]/70 font-body text-center truncate">
                    {shirt.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Orange tear divider */}
      <div className="w-full h-5 bg-[#E8622A]" style={{
        clipPath: 'polygon(0 0,2% 60%,5% 10%,8% 80%,11% 20%,14% 70%,17% 10%,20% 65%,23% 20%,26% 75%,29% 15%,32% 60%,35% 10%,38% 70%,41% 20%,44% 65%,47% 10%,50% 60%,53% 20%,56% 70%,59% 15%,62% 65%,65% 10%,68% 70%,71% 20%,74% 60%,77% 15%,80% 70%,83% 20%,86% 65%,89% 10%,92% 60%,95% 15%,98% 65%,100% 0,100% 100%,0 100%)'
      }} />

      {/* ===== MYSTERY BOX ===== */}
      {/* Sits directly under the hero: it is the cheapest way into the shop
          and has no catalogue row to be discovered through. */}
      {/* One wide banner, not a second storefront: the home page teases the
          box and the product page does the explaining and the selling. */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <Link to="/mystery-box"
          className="group block bg-[#1B2A4A] border-2 border-[#1B2A4A] overflow-hidden hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: '5px 5px 0 #E8622A' }}>
          <div className="flex flex-col sm:flex-row items-stretch">
            <div className="flex items-center justify-center bg-[#E8622A] px-6 py-5 sm:py-0 sm:w-32 flex-shrink-0">
              <Gift className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 min-w-0 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-heading uppercase tracking-[0.2em] text-[#FFD95A] mb-1">חדש</p>
                <h2 className="font-heading font-black text-2xl text-white uppercase leading-none mb-2">מיסטרי בוקס</h2>
                <p className="font-body text-sm text-white/70 leading-relaxed">
                  בוחר סגנון ומידה, אנחנו בוחרים את החולצה. רגיל ומונדיאל ₪70, רטרו ₪90.
                </p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 bg-[#FFD95A] text-[#1B2A4A] px-5 py-3 font-heading font-bold text-sm uppercase tracking-wider group-hover:bg-white transition-colors">
                בנה את הבוקס
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* ===== SHIRT SECTIONS SPLIT ===== */}
      {(loading || newShirts.length > 0 || bestSellers.length > 0 || featuredShirts.length > 0) && (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* New Arrivals */}
          <div>
            <h2 className="font-heading font-bold text-lg text-[#1B2A4A] uppercase tracking-wide mb-3 border-b-2 border-[#E8622A] pb-1 inline-block">✨ חדשים באתר</h2>
            <div className="grid grid-cols-2 gap-3 mt-0">
              {loading ?
              Array.from({ length: 4 }).map((_, i) => <ShirtCardSkeleton key={i} />) :
              newShirts.slice(0, 4).map((s) =>
              <ShirtCard key={s.id} shirt={s} user={user} eager isWishlisted={wishlistIds.includes(s.id)} onToggleWishlist={toggleWishlist} />
              )}
            </div>
            {newShirts.length > 4 &&
            <div className="text-center mt-4">
                <Link to="/catalog?new=true" className="inline-block px-6 py-2 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wider border-2 border-[#1B2A4A] bg-white hover:bg-[#F2ECD9] transition-colors" style={{ boxShadow: '2px 2px 0 #E8622A' }}>הצג הכל ←</Link>
              </div>
            }
          </div>

          {/* Best Sellers */}
          <div>
            <h2 className="font-heading font-bold text-lg text-[#1B2A4A] uppercase tracking-wide mb-3 border-b-2 border-[#E8622A] pb-1 inline-block">🔥 הנמכרים ביותר</h2>
            <div className="grid grid-cols-2 gap-3 mt-0">
              {loading ?
              Array.from({ length: 4 }).map((_, i) => <ShirtCardSkeleton key={i} />) :
              (bestSellers.length > 0 ? bestSellers : featuredShirts).slice(0, 4).map((s) =>
              <ShirtCard key={s.id} shirt={s} user={user} eager isWishlisted={wishlistIds.includes(s.id)} onToggleWishlist={toggleWishlist} />
              )}
            </div>
            <div className="text-center mt-4">
              <Link to="/catalog?best=true" className="inline-block px-6 py-2 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wider border-2 border-[#1B2A4A] bg-white hover:bg-[#F2ECD9] transition-colors" style={{ boxShadow: '2px 2px 0 #E8622A' }}>הצג הכל ←</Link>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ===== FAST SHIPPING ===== */}
      {fastShippingShirts.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[#E8622A]" />
              <h2 className="font-heading font-black text-xl text-[#1B2A4A] uppercase tracking-wide">זמין למשלוח מהיר</h2>
            </div>
            <p className="text-sm text-[#1B2A4A]/60 font-body">חולצות שקיימות במלאי בארץ ויכולות להגיע מהר יותר</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {fastShippingShirts.map((s) => (
              <ShirtCard key={s.id} shirt={s} user={user} isWishlisted={wishlistIds.includes(s.id)} onToggleWishlist={toggleWishlist} />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/catalog?fast=true" className="inline-block px-6 py-2 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wider border-2 border-[#1B2A4A] bg-white hover:bg-[#F2ECD9] transition-colors" style={{ boxShadow: '2px 2px 0 #E8622A' }}>הצג הכל ←</Link>
          </div>
        </section>
      )}

      {/* ===== PROMO BANNER ===== */}
      <PromoBanner
        active={siteSettings.promo_banner_active === 'yes'}
        title={siteSettings.promo_banner_title}
        subtitle={siteSettings.promo_banner_subtitle}
        buttonText={siteSettings.promo_banner_button_text}
        buttonLink={siteSettings.promo_banner_button_link}
        imageUrl={siteSettings.promo_banner_image}
      />

      {/* ===== POPULAR CLUBS ===== */}
      <PopularClubsSection title={siteSettings.popular_clubs_title} />

      {/* ===== LEAGUES & TOURNAMENTS ===== */}
      <LeaguesSection title={siteSettings.leagues_title} />

      {/* ===== CATEGORY CARDS ===== */}
      <CategoryCardsSection title={siteSettings.category_cards_title} />

      {/* ===== WHY US + ABOUT ===== */}
      <div className="w-full h-5 bg-[#1B2A4A]" style={{
        clipPath: 'polygon(0 100%,2% 40%,5% 90%,8% 20%,11% 80%,14% 30%,17% 90%,20% 35%,23% 80%,26% 25%,29% 85%,32% 40%,35% 90%,38% 30%,41% 80%,44% 35%,47% 90%,50% 40%,53% 80%,56% 30%,59% 85%,62% 35%,65% 90%,68% 30%,71% 80%,74% 40%,77% 85%,80% 30%,83% 80%,86% 35%,89% 90%,92% 40%,95% 85%,98% 35%,100% 100%,100% 0,0 0)'
      }} />
      <div className="bg-[#F2ECD9] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Why Us */}
            <div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {whyUsCards.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={i} className="bg-white p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #E8622A' }}>
                      <Icon className="w-5 h-5 text-[#E8622A] mb-2" />
                      <h3 className="font-heading font-bold text-sm text-[#1B2A4A] mb-1 uppercase">{c.title}</h3>
                      <p className="text-xs text-gray-500 font-body leading-relaxed">{c.desc}</p>
                    </div>);

                })}
              </div>
            </div>

            {/* About */}
            <div>
              <div className="mt-5 bg-white p-6" style={{ border: '2px solid #1B2A4A', boxShadow: '4px 4px 0 #E8622A' }}>
                {/* Pushpin */}
                <div className="flex justify-center mb-3">
                  <div className="w-4 h-4 rounded-full bg-[#E8622A] border-2 border-[#1B2A4A]" />
                </div>
                <p className="font-body text-[#1B2A4A]/80 text-sm leading-loose">
                  אנחנו אתר שמתמחה בחולצות כדורגל, נבחרות וחולצות מיוחדות לאוהדים ואספנים.
                  המטרה שלנו היא לתת מקום פשוט, נוח ואמין למצוא חולצות יפות בלי להסתבך.
                  כל חולצה נבדקת, מצולמת ומתוארת בכנות — מה שרואים זה מה שמקבלים.
                  אנחנו נגישים בוואטסאפ ואינסטגרם ועונים מהר לכל שאלה.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== REVIEWS ===== */}
      {reviews.length > 0 &&
      <section className="bg-[#E8DFC8] py-12">
          <div className="max-w-7xl mx-auto px-6">
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {reviews.map((r, idx) =>
            <div key={r.id} className="bg-white p-5 hover:shadow-xl transition-all duration-200 hover:z-10 relative"
            style={{
              border: '2px solid #1B2A4A',
              boxShadow: '3px 3px 0 #1B2A4A',
              transform: idx % 3 === 0 ? 'rotate(-1deg)' : idx % 3 === 1 ? 'rotate(0.5deg)' : 'rotate(-0.5deg)'
            }}>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) =>
                <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-[#E8622A] text-[#E8622A]' : 'text-gray-200'}`} />
                )}
                  </div>
                  <p className="text-sm text-[#1B2A4A] font-body leading-relaxed mb-3">"{r.comment}"</p>
                  <p className="text-xs text-[#E8622A] font-heading uppercase tracking-wide">{r.name}</p>
                </div>
            )}
            </div>
          </div>
        </section>
      }

      {/* ===== FAQ ===== */}
      {faqs.length > 0 &&
      <section className="bg-[#F2ECD9] py-12">
          <div className="max-w-3xl mx-auto px-6">

            <div className="space-y-2 mt-6">
              {faqs.map((f, i) =>
            <div key={f.id} className="bg-white" style={{ border: '2px solid #1B2A4A' }}>
                  <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="w-full flex items-center justify-between px-5 py-4 text-right font-body font-semibold text-sm text-[#1B2A4A] hover:bg-[#F2ECD9] transition-colors">
                
                    {f.question}
                    <ChevronDown className={`w-4 h-4 text-[#E8622A] transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i &&
              <div className="px-5 pb-4 text-sm text-gray-600 border-t border-[#1B2A4A]/10 pt-3 font-body">
                      {f.answer}
                    </div>
              }
                </div>
            )}
            </div>
          </div>
        </section>
      }

      {/* ===== INSTAGRAM ===== */}
      <InstagramSection title={siteSettings.instagram_section_title} instagramHandle={siteSettings.instagram_handle || 'Jerseylabil'} />

      {/* ===== CONTACT ===== */}
      <section className="bg-[#1B2A4A] py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading font-bold text-2xl text-white uppercase mb-2">רוצה לדבר איתנו?</h2>
          <p className="text-white/80 text-sm font-body mb-8">אפשר לפנות אלינו בכל עניין</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={siteSettings.whatsapp_link || '#'} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#E8622A] text-white px-7 py-3 text-sm font-bold font-heading uppercase hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            style={{ boxShadow: '3px 3px 0 rgba(255,255,255,0.2)', textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <a href="https://instagram.com/Jerseylabil" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border-2 border-white/30 text-white px-7 py-3 text-sm font-bold font-heading uppercase hover:border-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          </div>
        </div>
      </section>
      </>
      )}
      </div>);

      }