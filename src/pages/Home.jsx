import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Camera, Ruler, Zap, Star, Sparkles, MessageCircle, Instagram, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductRail from '@/components/shop/ProductRail';
import SectionHeader from '@/components/shop/SectionHeader';
import Disclosure from '@/components/shop/Disclosure';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import PopularClubsSection from '@/components/PopularClubsSection';
import LeaguesSection from '@/components/LeaguesSection';
import CategoryCardsSection from '@/components/CategoryCardsSection';
import PromoBanner from '@/components/PromoBanner';
import InstagramSection from '@/components/InstagramSection';
import ChatProofsSection from '@/components/ChatProofsSection';
import MysteryBoxPromo from '@/components/MysteryBoxPromo';
import Seo from '@/components/Seo';
import ProductImage from '@/components/ui/ProductImage';
import { hasLocalStock } from '@/components/ShippingBadge';
import { toast } from '@/components/ui/use-toast';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { withStock } from '@/lib/catalogFacets';
import { shirtBasePrice } from '@/lib/cart';
import { WHATSAPP_URL, INSTAGRAM_URL } from '@/lib/contact';

// The hero shows four named home kits - two Israeli, two Spanish. They are
// matched by club rather than pinned by id so a re-import cannot empty the
// hero, and the newest season always wins.
const HERO_LINEUP = ['ביתר ירושלים', 'הפועל תל אביב', 'ברצלונה', 'ריאל מדריד'];

// Shortcuts under the hero. Shortcuts to an empty catalogue are worse than no
// shortcut at all, so the ones with nothing behind them drop out.
const STOCKED_SHORTCUTS = withStock([
  { label: 'מלאי בארץ', href: '/catalog?fast=true' },
  { label: 'נבחרות', href: '/collections/national-teams' },
  { label: 'רטרו', href: '/collections/retro' },
  { label: 'סייל', href: '/catalog?sale=true' },
  { label: 'ילדים', href: '/catalog?gender=kids' },
]);

// Shown when the matching setting is empty. Everything below is editable from
// ניהול > הגדרות אתר without touching code.
const DEFAULT_HERO_TITLE = 'חולצות כדורגל איכותיות,|נדירות ובמחירים טובים';
const DEFAULT_HERO_SUBTITLE = 'מצאו חולצות של קבוצות, נבחרות ושחקנים אהובים במקום אחד.';
const DEFAULT_ABOUT = `אנחנו אתר שמתמחה בחולצות כדורגל, נבחרות וחולצות מיוחדות לאוהדים ואספנים.
המטרה שלנו היא לתת מקום פשוט, נוח ואמין למצוא חולצות יפות בלי להסתבך.
אנחנו נגישים בוואטסאפ ובאינסטגרם ועונים מהר לכל שאלה.`;

const WHY_US = [
  { title: 'חולצות נבדקות', desc: 'כל חולצה נבדקת לפני שהיא יוצאת אליכם.', icon: ShieldCheck },
  { title: 'בדיקת זמינות', desc: 'אפשר לבדוק זמינות לפי מידה לפני שמזמינים.', icon: Ruler },
  { title: 'תמונות ברורות', desc: 'רואים בדיוק איך החולצה נראית.', icon: Camera },
  { title: 'מענה מהיר', desc: 'עונים בוואטסאפ ובאינסטגרם תוך זמן קצר.', icon: Zap },
  { title: 'מחירים הוגנים', desc: 'מחירים שווים לכל כיס.', icon: Star },
  { title: 'חולצות מיוחדות', desc: 'רטרו ודגמים שקשה למצוא.', icon: Sparkles },
];

function HeroTitle({ text }) {
  const lines = text.split('|').map(line => line.trim());
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i === lines.length - 1 && lines.length > 1 ? <span className="text-brand-orange-ink">{line}</span> : line}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

export default function Home() {
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
  const [pickTab, setPickTab] = useState('new');
  const navigate = useNavigate();

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

  useEffect(() => {
    async function load() {
      setLoadError(false);
      let allShirts, revs, faqList, settingsData;
      try {
        [allShirts, revs, faqList, settingsData] = await Promise.all([
          base44.entities.Shirt.filter({ status: 'available' }, '-created_date', 200),
          base44.entities.Review.filter({ approved: true }, '-created_date', 6),
          base44.entities.FAQ.filter({ active: true }, 'sort_order', 5),
          base44.entities.SiteSetting.list('-created_date', 100),
        ]);
      } catch {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setCatalogShirts(allShirts);
      setNewShirts(allShirts.filter(s => s.is_new).slice(0, 12));
      setFeaturedShirts(allShirts.filter(s => s.featured).slice(0, 12));
      setBestSellers([...allShirts].filter(s => s.best_seller).sort((a, b) => (b.interest_count || 0) - (a.interest_count || 0)).slice(0, 12));
      setFastShippingShirts(allShirts.filter(hasLocalStock).slice(0, 12));
      setReviews(revs);
      setFaqs(faqList);
      const settingsObj = {};
      settingsData.forEach(d => { settingsObj[d.key] = d.value; });
      setSiteSettings(settingsObj);
      setLoading(false);

      // User/wishlist loads after content is visible - does not block the first paint.
      try {
        const me = await base44.auth.me();
        setUser(me);
        const wl = await base44.entities.Wishlist.filter({ user_id: me.id });
        setWishlistIds(wl.map((w) => w.shirt_id));
      } catch { /* not logged in */ }
    }
    load();
  }, []);

  const wishlistIdsRef = useRef(wishlistIds);
  useEffect(() => { wishlistIdsRef.current = wishlistIds; }, [wishlistIds]);

  const toggleWishlist = useCallback(async (shirtId) => {
    if (!user) { navigate('/login'); return; }
    if (wishlistIdsRef.current.includes(shirtId)) {
      const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: shirtId });
      if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
      setWishlistIds((p) => p.filter((id) => id !== shirtId));
      toast({ title: 'הוסרה מהמועדפים' });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: shirtId });
      setWishlistIds((p) => [...p, shirtId]);
      toast({ title: 'נוספה למועדפים' });
    }
  }, [user, navigate]);

  // The picks under the hero, one tab per list that has anything in it.
  const tabs = [
    { id: 'new', label: 'חדשים באתר', shirts: newShirts, href: '/catalog?new=true', more: 'לכל החדשים' },
    { id: 'best', label: 'הנמכרים ביותר', shirts: bestSellers.length ? bestSellers : featuredShirts, href: bestSellers.length ? '/catalog?best=true' : '/catalog', more: 'לכל החולצות' },
    { id: 'fast', label: 'מלאי בארץ', shirts: fastShippingShirts, href: '/catalog?fast=true', more: 'לכל המלאי בארץ' },
  ].filter(tab => tab.shirts.length > 0);
  if (!tabs.length && catalogShirts.length) {
    tabs.push({ id: 'all', label: 'החולצות שלנו', shirts: catalogShirts.slice(0, 12), href: '/catalog', more: 'לכל החולצות' });
  }
  const activeTab = tabs.find(tab => tab.id === pickTab) || tabs[0];

  const lowestPrice = catalogShirts.length ? Math.min(...catalogShirts.map(shirtBasePrice).filter(Boolean)) : null;

  return (
    <div>
      <Seo
        title="JerseyLab - חולצות כדורגל נדירות לאספנים ואוהדים"
        description="חולצות כדורגל איכותיות ונדירות לאספנים ואוהדים. מצא חולצות של קבוצות, נבחרות ושחקנים אהובים - חדשות, רטרו ומהדורות מיוחדות במחירים טובים."
        canonicalPath="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "JerseyLab",
              url: SITE_ORIGIN,
              logo: { "@type": "ImageObject", url: "https://www.jerseylab.co/icon-512.png", width: 512, height: 512 },
              description: "ארכיון בלעדי של חולצות כדורגל נדירות לאספנים ואוהדים.",
              sameAs: ["https://instagram.com/Jerseylabil"]
            },
            {
              "@type": "WebSite",
              name: "JerseyLab",
              url: SITE_ORIGIN,
              inLanguage: "he-IL",
              potentialAction: {
                "@type": "SearchAction",
                target: { "@type": "EntryPoint", urlTemplate: (SITE_ORIGIN) + "/catalog?q={search_term_string}" },
                "query-input": "required name=search_term_string"
              }
            }
          ]
        }}
      />

      {loadError ? (
        <div className="shop-container py-16">
          <div className="mx-auto max-w-lg rounded-3xl bg-brand-mist px-6 py-14 text-center">
            <p className="text-2xl font-semibold text-brand-navy">לא הצלחנו לטעון את הדף</p>
            <p className="mt-2 text-[15px] text-brand-navy/60">בדקו את החיבור לאינטרנט ונסו שוב.</p>
            <button type="button" onClick={() => window.location.reload()} className="shop-btn mt-6">לנסות שוב</button>
          </div>
        </div>
      ) : (
        <>
          {/* ===== HERO ===== */}
          <section className="shop-container pt-4 sm:pt-6">
            <div
              className="grid overflow-hidden rounded-[2rem] lg:min-h-[34rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
              style={{ background: 'radial-gradient(circle at 15% 25%, rgba(232, 98, 42, 0.32), transparent 55%), var(--brand-navy)' }}
            >
              <div className="order-2 m-2.5 flex flex-col justify-center rounded-[1.75rem] bg-white p-7 sm:m-4 sm:p-10 lg:order-1 lg:my-6 lg:me-0 lg:ms-6 lg:p-12">
                {lowestPrice > 0 && (
                  <span className="inline-flex w-fit items-center rounded-full bg-brand-orange-soft px-3.5 py-1.5 text-[13px] font-semibold text-brand-orange-ink">
                    חולצות כדורגל החל מ־₪{lowestPrice}
                  </span>
                )}
                <h1 className="mt-5 text-[2.25rem] font-bold leading-[1.08] tracking-[-0.03em] text-brand-navy sm:text-5xl xl:text-[3.25rem]">
                  <HeroTitle text={siteSettings.homepage_hero_title || DEFAULT_HERO_TITLE} />
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-navy/70 sm:text-lg">
                  {siteSettings.homepage_hero_subtitle || DEFAULT_HERO_SUBTITLE}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
                  <Link to="/catalog" className="shop-btn px-4 sm:px-8">לכל החולצות</Link>
                  <Link to="/mystery-box" className="shop-btn-secondary px-4 sm:px-6">מיסטרי בוקס</Link>
                </div>
                {STOCKED_SHORTCUTS.length > 0 && (
                  <nav aria-label="קיצורי דרך לקטלוג" className="mt-8">
                    <ul className="flex flex-wrap gap-2">
                      {STOCKED_SHORTCUTS.map(shortcut => (
                        <li key={shortcut.href}>
                          <Link to={shortcut.href} className="shop-chip min-h-[2.5rem] px-4">{shortcut.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>

              {/* Real shirts from the catalogue, each a way into its own page. */}
              <div className="order-1 grid grid-cols-4 gap-2 p-2.5 sm:gap-3 sm:p-4 lg:order-2 lg:grid-cols-2 lg:gap-4 lg:p-6">
                {(heroShirts.length ? heroShirts : Array.from({ length: 4 }, () => null)).map((shirt, i) => (
                  shirt ? (
                    <Link key={shirt.id} to={`/shirt/${shirt.id}`} aria-label={shirt.name}
                      className={`group relative aspect-square overflow-hidden rounded-2xl bg-brand-navy-light sm:rounded-3xl ${i % 2 === 1 ? 'lg:translate-y-8' : ''}`}>
                      <ProductImage src={shirt.main_image} alt="" eager sizes="(min-width: 1024px) 380px, 25vw" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    </Link>
                  ) : (
                    <div key={i} className={`aspect-square rounded-2xl bg-brand-navy-light/70 sm:rounded-3xl ${i % 2 === 1 ? 'lg:translate-y-8' : ''}`} />
                  )
                ))}
              </div>
            </div>
          </section>

          {/* ===== PICKS ===== */}
          {(loading || tabs.length > 0) && (
            <section className="mt-16 sm:mt-24" aria-labelledby="picks-heading">
              <div className="shop-container">
                <SectionHeader id="picks-heading" title="החולצות שלנו" />
                {tabs.length > 1 && (
                  <div role="tablist" aria-label="בחירת רשימה" className="mt-6 flex flex-wrap justify-center gap-2">
                    {tabs.map(tab => (
                      <button key={tab.id} type="button" role="tab" id={`pick-tab-${tab.id}`} aria-selected={activeTab?.id === tab.id} aria-controls="pick-panel"
                        onClick={() => setPickTab(tab.id)}
                        className={`shop-chip px-5 ${activeTab?.id === tab.id ? 'shop-chip-active' : ''}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
                <div id="pick-panel" role="tabpanel" aria-labelledby={activeTab ? `pick-tab-${activeTab.id}` : undefined} className="mt-8 sm:mt-10">
                  {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={i >= 3 ? 'hidden lg:block' : i >= 2 ? 'hidden sm:block' : ''}>
                          <ShirtCardSkeleton />
                        </div>
                      ))}
                    </div>
                  ) : activeTab && (
                    <>
                      <ProductRail shirts={activeTab.shirts} user={user} wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} label={activeTab.label} />
                      <div className="mt-2 text-center">
                        <Link to={activeTab.href} className="shop-btn-secondary rounded-full px-8">{activeTab.more}</Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          <PopularClubsSection title={siteSettings.popular_clubs_title} />

          <MysteryBoxPromo />

          <LeaguesSection title={siteSettings.leagues_title} />

          <CategoryCardsSection title={siteSettings.category_cards_title} />

          <PromoBanner
            active={siteSettings.promo_banner_active === 'yes'}
            title={siteSettings.promo_banner_title}
            subtitle={siteSettings.promo_banner_subtitle}
            buttonText={siteSettings.promo_banner_button_text}
            buttonLink={siteSettings.promo_banner_button_link}
            imageUrl={siteSettings.promo_banner_image}
          />

          <ChatProofsSection title={siteSettings.chat_proofs_title} />

          {/* ===== WHY US + ABOUT ===== */}
          <section className="shop-container mt-16 sm:mt-24" aria-labelledby="why-heading">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="rounded-[2rem] bg-brand-mist p-6 sm:p-10">
                <h2 id="why-heading" className="shop-title">למה לקנות אצלנו</h2>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {WHY_US.map(({ title, desc, icon: Icon }) => (
                    <li key={title} className="rounded-3xl bg-white p-5 shadow-card">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold text-brand-navy">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-brand-navy/60">{desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-between gap-8 rounded-[2rem] bg-brand-navy p-7 text-white sm:p-10">
                <div>
                  <p className="text-sm font-semibold text-brand-gold">מי אנחנו</p>
                  <p className="mt-4 whitespace-pre-line text-[15px] leading-loose text-white/80">
                    {siteSettings.about_us_text || DEFAULT_ABOUT}
                  </p>
                </div>
                <Link to="/contact" className="inline-flex items-center gap-2 self-start text-[15px] font-semibold text-white underline-offset-4 hover:underline">
                  דברו איתנו
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* ===== REVIEWS ===== */}
          {reviews.length > 0 && (
            <section className="shop-container mt-16 sm:mt-24" aria-labelledby="reviews-heading">
              <SectionHeader id="reviews-heading" title="מה אומרים עלינו" />
              <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map(r => (
                  <li key={r.id} className="shop-card p-6">
                    <div className="flex gap-0.5" aria-label={`${r.rating} מתוך 5`}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-brand-orange text-brand-orange' : 'text-brand-line'}`} aria-hidden="true" />
                      ))}
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-brand-navy/80">"{r.comment}"</p>
                    <p className="mt-4 text-sm font-semibold text-brand-navy/60">{r.is_anonymous ? 'אנונימי' : (r.reviewer_name || r.name)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ===== FAQ ===== */}
          {faqs.length > 0 && (
            <section className="shop-container mt-16 sm:mt-24" aria-labelledby="faq-heading">
              <div className="mx-auto max-w-3xl">
                <SectionHeader id="faq-heading" title="שאלות נפוצות" />
                <div className="mt-10 space-y-2.5">
                  {faqs.map(f => (
                    <Disclosure key={f.id} title={f.question}>
                      <p className="whitespace-pre-line text-[15px] leading-relaxed text-brand-navy/75">{f.answer}</p>
                    </Disclosure>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link to="/faq" className="shop-link">
                    לכל השאלות והתשובות
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <InstagramSection title={siteSettings.instagram_section_title} instagramHandle={siteSettings.instagram_handle || 'Jerseylabil'} />

          {/* ===== CONTACT ===== */}
          <section className="shop-container mt-16 sm:mt-24" aria-labelledby="contact-heading">
            <div className="rounded-[2rem] bg-brand-mist px-6 py-12 text-center sm:py-16">
              <h2 id="contact-heading" className="shop-title">רוצים לדבר איתנו?</h2>
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-brand-navy/60 sm:text-lg">
                שאלות על מידות, זמינות או הזמנה מיוחדת. עונים מהר בוואטסאפ ובאינסטגרם.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href={siteSettings.whatsapp_link || WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="shop-btn px-8">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  וואטסאפ
                </a>
                <a href={siteSettings.instagram_link || INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="shop-btn-secondary px-8">
                  <Instagram className="h-5 w-5" aria-hidden="true" />
                  אינסטגרם
                </a>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
