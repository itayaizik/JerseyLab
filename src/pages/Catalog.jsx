import { getAllShirts } from "@/api/shirts";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import CollectionHero from '@/components/catalog/CollectionHero';
import FilterDrawer from '@/components/catalog/FilterDrawer';
import SortSelect from '@/components/catalog/SortSelect';
import Seo from '@/components/Seo';
import { hasLocalStock } from '@/components/ShippingBadge';
import { toast } from '@/components/ui/use-toast';
import { shirtSizes, sortSizes } from '@/lib/sizes';
import { searchShirts, formatEra, toDisplay } from '@/lib/search';
import { sortShirts } from '@/lib/sortShirts';
import { COLLECTIONS, localizeCollection } from '@/lib/collections';
import { withStock } from '@/lib/catalogFacets';
import { SITE_ORIGIN } from '@/lib/siteUrl';
import { t, isEn } from '@/lib/i18n';
import { term } from '@/lib/english';

// "2004–2021", or "2023–present" for a player still at the club.
const era = (team) => (isEn && team.to == null ? `${team.from}–present` : formatEra(team));

// Says how a search was read, so results that do not literally contain the
// words typed do not look like a mistake. Someone who typed "מסי" and gets a
// page of Barcelona and Argentina shirts needs to be told why.
function SearchExplanation({ info }) {
  const notes = [];
  if (info.player) {
    // The player list is written in Hebrew; the English site names the player
    // the way the customer typed them.
    const player = isEn ? info.player.typed : info.player.label;
    notes.push(
      <p key="player">
        {info.eraFallback
          ? t(
            <>לא מצאנו חולצה מהעונות ש<strong className="font-semibold text-brand-navy">{player}</strong> שיחק בהן, אז אלה חולצות של הקבוצות שלו מתקופות אחרות.</>,
            <>We found no shirt from the seasons <strong className="font-semibold text-brand-navy">{player}</strong> played, so these are shirts of his teams from other years.</>,
          )
          : t(
            <>חולצות מהקבוצות ומהעונות של <strong className="font-semibold text-brand-navy">{player}</strong>:</>,
            <>Shirts from <strong className="font-semibold text-brand-navy">{player}</strong>&apos;s teams and seasons:</>,
          )}
        {' '}
        <span className="text-brand-navy/60">{info.player.teams.map(team => `${term(team.team)} ${era(team)}`).join(' · ')}</span>
      </p>
    );
  }
  if (info.corrections.length) {
    notes.push(
      <p key="fix">
        {t('מציג תוצאות עבור', 'Showing results for')}{' '}
        {info.corrections.map((c, i) => (
          <span key={c.from}>{i > 0 && ', '}<strong className="font-semibold text-brand-navy">{toDisplay(c.to)}</strong></span>
        ))}
        {' '}({t('חיפשת:', 'you searched:')} {info.corrections.map(c => toDisplay(c.from)).join(', ')})
      </p>
    );
  }
  if (info.relaxed) notes.push(<p key="relaxed">{t('אין חולצה שמתאימה לכל המילים שחיפשת, אז אלה הקרובות ביותר.', 'No shirt matches every word you searched, so these are the closest.')}</p>);
  if (!notes.length) return null;
  return (
    <div className="mt-5 max-w-2xl space-y-1.5 rounded-2xl bg-brand-mist px-4 py-3 text-[15px] leading-relaxed text-brand-navy/75">
      {notes}
    </div>
  );
}

const quickFilters = [
  { label: t('הכל', 'All'), params: {} },
  { label: t('חדשים', 'New'), params: { new: 'true' }, title: t('חדשים באתר', 'New arrivals'), description: t('החולצות שהגיעו לאחרונה לאתר.', 'The shirts that most recently arrived on the site.') },
  { label: t('רטרו', 'Retro'), params: { tag: 'retro' }, title: t('רטרו', 'Retro'), description: t('עונות קלאסיות ודגמים שכבר לא מייצרים.', 'Classic seasons and designs no longer made.') },
  { label: t('סייל', 'Sale'), params: { sale: 'true' }, title: t('סייל', 'Sale'), description: t('חולצות במחיר מוזל, לזמן מוגבל.', 'Shirts at a reduced price, for a limited time.') },
  { label: t('נבחרות', 'National teams'), params: { type: 'national' }, title: t('נבחרות', 'National teams'), description: t('חולצות של נבחרות לאומיות, בית וחוץ.', 'National team shirts, home and away.') },
  { label: t('שחקנים', 'Players'), params: { type: 'player' }, title: t('שחקנים', 'Players'), description: t('חולצות עם שם ומספר של שחקן.', "Shirts with a player's name and number.") },
  { label: 'NBA', params: { sport: 'basketball' }, title: 'NBA', description: t('חולצות כדורסל מה-NBA.', 'Basketball jerseys from the NBA.') },
  { label: t('ילדים', 'Kids'), params: { gender: 'kids' }, title: t('ילדים', 'Kids'), description: t('חולצות במידות ילדים.', "Shirts in kids' sizes.") },
  { label: t('מלאי בארץ', 'In stock in Israel'), params: { fast: 'true' }, title: t('מלאי בארץ', 'In stock in Israel'), description: t('חולצות שכבר נמצאות בארץ ומגיעות עד שבוע.', 'Shirts already in Israel that arrive within a week.') },
];

// "הכל" has no query string and always stays; the rest are dropped when the
// catalogue has nothing behind them.
const stockedQuickFilters = withStock(quickFilters, qf => {
  const params = new URLSearchParams(qf.params).toString();
  return params ? `/catalog?${params}` : '/catalog';
});

const quickFilterHref = (qf) => {
  const params = new URLSearchParams(qf.params).toString();
  return params ? `/catalog?${params}` : '/catalog';
};

const DEFAULT_DESCRIPTION = t(
  'כל החולצות באתר במקום אחד: קבוצות, נבחרות ורטרו. אפשר לסנן לפי מידה, ליגה ומחיר.',
  'Every shirt on the site in one place: clubs, national teams and retro. Filter by size, league and price.',
);
const EMPTY_FILTERS = { condition: '', minPrice: '', maxPrice: '', league: '', national_team: '', size: '' };
const CONDITION_LABELS = { new: t('חדש', 'New'), like_new: t('כמו חדש', 'Like new'), used: t('משומש', 'Used') };
const PAGE_SIZE = 24;

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allShirtsRaw, setAllShirtsRaw] = useState([]);
  const [searchInfo, setSearchInfo] = useState(null);
  const loggedQueryRef = useRef(null);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [user, setUser] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Fetch the full catalog once; URL + local filters are applied client-side (no refetch on navigation).
  useEffect(() => {
    loadShirts();
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const wl = await base44.entities.Wishlist.filter({ user_id: me.id });
      setWishlistIds(wl.map(w => w.shirt_id));
    } catch { /* not logged in */ }
  }

  async function loadShirts() {
    setLoading(true);
    setLoadError(false);
    let all;
    try {
      all = await getAllShirts();
    } catch {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setAllShirtsRaw(all.filter(s => s.status !== 'hidden'));
    setLoading(false);
  }

  // Recompute visible shirts whenever URL params, local filters, the sort or the raw list change.
  useEffect(() => {
    let result = [...allShirtsRaw];

    const q = searchParams.get('q');
    const gender = searchParams.get('gender');
    const sport = searchParams.get('sport');
    const sale = searchParams.get('sale');
    const isNew = searchParams.get('new');
    const tag = searchParams.get('tag');
    const type = searchParams.get('type');
    const fast = searchParams.get('fast');
    const best = searchParams.get('best');
    const league = searchParams.get('league');

    // Search narrows and ranks; every filter below only narrows, so the
    // best-match-first order survives them. See lib/search for what it handles.
    const searchResult = q ? searchShirts(result, q) : null;
    if (searchResult) result = searchResult.results;
    if (gender) result = result.filter(s => s.gender_category === gender);
    if (sport) result = result.filter(s => s.sport_category === sport);
    if (sale === 'true') result = result.filter(s => s.sale_price && s.sale_price < s.price);
    if (isNew === 'true') result = result.filter(s => s.is_new);
    if (tag === 'retro') result = result.filter(s => s.is_retro);
    if (type === 'national' || type === 'נבחרות') result = result.filter(s => s.national_team);
    if (type === 'player') result = result.filter(s => s.player_name);
    if (fast === 'true') result = result.filter(hasLocalStock);
    if (best === 'true') result = result.filter(s => s.best_seller === true);
    if (league) result = result.filter(s => s.league && s.league.toLowerCase().includes(league.toLowerCase()));

    if (filters.condition) result = result.filter(s => s.condition === filters.condition);
    if (filters.minPrice) result = result.filter(s => s.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(s => s.price <= Number(filters.maxPrice));
    if (filters.league) result = result.filter(s => s.league === filters.league);
    if (filters.national_team) result = result.filter(s => s.national_team === filters.national_team);
    if (filters.size) result = result.filter(s => shirtSizes(s).includes(filters.size));

    setShirts(sortShirts(result, sort, { keepOrder: !!q }));
    setVisibleCount(PAGE_SIZE);
    setSearchInfo(searchResult);

    // Logged here rather than when a search form is submitted: this is the one
    // place that knows how many shirts the search found, and it means a search
    // counts once whether it started in the header, on the home page or here.
    if (!q) loggedQueryRef.current = null;
    else if (allShirtsRaw.length && loggedQueryRef.current !== q) {
      loggedQueryRef.current = q;
      base44.entities.SearchLog.create({ search_term: q.trim(), results_count: searchResult.results.length }).catch(() => {});
    }
  }, [searchParams, filters, allShirtsRaw, sort]);

  const { leagues, nationalTeams, allSizes, conditions } = useMemo(() => {
    const leagues = [...new Set(allShirtsRaw.map(s => s.league).filter(Boolean))].sort();
    const nationalTeams = [...new Set(allShirtsRaw.map(s => s.national_team).filter(Boolean))].sort();
    const allSizes = sortSizes([...new Set(allShirtsRaw.flatMap(shirtSizes))]);
    const conditions = [...new Set(allShirtsRaw.map(s => s.condition).filter(Boolean))];
    return { leagues, nationalTeams, allSizes, conditions };
  }, [allShirtsRaw]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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

  // Everything: the drawer's filters, the search and the category in the URL.
  const clearEverything = () => {
    setFilters(EMPTY_FILTERS);
    navigate('/catalog');
  };

  const q = searchParams.get('q');

  // Which quick filter the current query string corresponds to.
  //
  // Held as the filter object rather than its position. It used to be an index
  // found in `quickFilters`, the full list, while the chips are rendered from
  // `stockedQuickFilters`, the subset that still has stock behind it; every
  // index after the first gap pointed at the wrong chip. Comparing the object
  // itself cannot drift that way again.
  const activeQuickFilter = stockedQuickFilters.find(qf => {
    const keys = Object.keys(qf.params);
    if (keys.length === 0) return !searchParams.get('new') && !searchParams.get('tag') && !searchParams.get('sale') && !searchParams.get('type') && !searchParams.get('sport') && !searchParams.get('gender') && !searchParams.get('fast') && !searchParams.get('q') && !searchParams.get('best');
    return keys.every(k => searchParams.get(k) === qf.params[k]);
  }) ?? null;

  const pageTitle = () => {
    if (q) return t(`תוצאות: "${q}"`, `Results: "${q}"`);
    if (searchParams.get('best') === 'true') return t('הנמכרים ביותר', 'Best sellers');
    if (searchParams.get('gender') === 'men') return t('גברים', 'Men');
    if (activeQuickFilter?.title) return activeQuickFilter.title;
    return t('כל החולצות', 'All shirts');
  };

  const heroDescription = searchParams.get('best') === 'true'
    ? t('החולצות המבוקשות ביותר אצלנו.', 'Our most wanted shirts.')
    : activeQuickFilter?.description || DEFAULT_DESCRIPTION;

  const heroChips = stockedQuickFilters.map(qf => ({
    label: qf.label,
    href: quickFilterHref(qf),
    active: activeQuickFilter === qf,
  }));

  const heroImages = shirts.filter(s => s.main_image).slice(0, 3).map(s => s.main_image);

  const activePills = [
    filters.size && { key: 'size', label: <>{t('מידה', 'Size')} <span dir="ltr">{filters.size}</span></> },
    filters.league && { key: 'league', label: term(filters.league) },
    filters.national_team && { key: 'national_team', label: term(filters.national_team) },
    filters.condition && { key: 'condition', label: CONDITION_LABELS[filters.condition] || filters.condition },
    (filters.minPrice || filters.maxPrice) && { key: 'price', label: `₪${filters.minPrice || 0}–${filters.maxPrice || '∞'}` },
  ].filter(Boolean);

  const removePill = (key) => {
    if (key === 'price') setFilters(f => ({ ...f, minPrice: '', maxPrice: '' }));
    else handleFilterChange(key, '');
  };

  // The first shirt of a browsing page gets a card twice the size, as the
  // collection pages of big club shops do. Not on a search, where the first
  // result is only the best guess, and not on a short list, where one large
  // card would leave the grid lopsided.
  const featureFirst = !q && sort === 'featured' && shirts.length >= 7;

  const seoTitle = `${pageTitle()} - JerseyLab`;
  const seoDesc = t(
    `קטלוג חולצות כדורגל: ${pageTitle()}. חולצות של קבוצות, נבחרות ושחקנים במחירים טובים.`,
    `Football shirt catalog: ${pageTitle()}. Club, national team and player shirts.`,
  );
  const origin = SITE_ORIGIN;
  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: pageTitle(), description: seoDesc, url: origin + "/catalog", inLanguage: isEn ? "en" : "he-IL" },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "דף הבית", item: origin + "/" },
        { "@type": "ListItem", position: 2, name: "קטלוג", item: origin + "/catalog" }
      ]}
    ]
  };

  return (
    <div>
      <Seo title={seoTitle} description={seoDesc} canonicalPath="/catalog" jsonLd={catalogJsonLd} />

      <CollectionHero
        breadcrumb={(
          <nav aria-label={t('נתיב ניווט', 'Breadcrumb')} className="shop-eyebrow mb-3">
            <Link to="/" className="transition hover:text-brand-navy">{t('דף הבית', 'Home')}</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-brand-navy/70">{t('קטלוג', 'Catalog')}</span>
          </nav>
        )}
        title={q ? <>{t('תוצאות עבור', 'Results for')} <span className="text-brand-orange-ink">"{q}"</span></> : pageTitle()}
        description={q ? null : heroDescription}
        chips={q ? [] : heroChips}
        images={heroImages}
        loading={loading}
      >
        {!loading && !loadError && searchInfo && <SearchExplanation info={searchInfo} />}
      </CollectionHero>

      <div className="shop-container">
        <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
          <button type="button" onClick={() => setFiltersOpen(true)}
            className="inline-flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl border border-brand-line bg-white px-5 text-[15px] font-medium text-brand-navy transition hover:border-brand-navy/30 sm:min-h-[3.5rem] sm:px-6 sm:text-base">
            <SlidersHorizontal className="h-5 w-5 text-brand-orange-ink" aria-hidden="true" />
            {t('סינון', 'Filter')}
            {activePills.length > 0 && (
              <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-orange px-1.5 text-xs font-bold text-white">
                {activePills.length}
              </span>
            )}
          </button>
          <SortSelect value={sort} onChange={setSort} />
        </div>

        {!loadError && (
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-8">
            <h2 className="text-2xl font-bold text-brand-navy sm:text-[1.75rem]" aria-live="polite">
              {loading ? ' ' : shirts.length === 1 ? t('חולצה אחת', '1 shirt') : t(`${shirts.length} חולצות`, `${shirts.length} shirts`)}
            </h2>
            {activePills.length > 0 && (
              <ul className="flex flex-wrap items-center gap-2">
                {activePills.map(pill => (
                  <li key={pill.key}>
                    <button type="button" onClick={() => removePill(pill.key)} className="shop-chip min-h-[2.25rem] gap-1.5 px-3.5 text-[13px]">
                      {pill.label}
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{t('הסרת הסינון', 'Remove filter')}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="shop-link px-2 text-[13px]">{t('ניקוי הכל', 'Clear all')}</button>
                </li>
              </ul>
            )}
          </div>
        )}

        {loadError ? (
          <EmptyState
            className="mt-6"
            icon={Search}
            title={t('לא הצלחנו לטעון את הקטלוג', "We couldn't load the catalog")}
            description={t('בדקו את החיבור לאינטרנט ונסו שוב.', 'Check your internet connection and try again.')}
            actionLabel={t('לנסות שוב', 'Try again')}
            onAction={loadShirts}
          />
        ) : loading ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className={i === 0 ? 'col-span-2 md:row-span-2' : ''}>
                <ShirtCardSkeleton featured={i === 0} />
              </li>
            ))}
          </ul>
        ) : shirts.length > 0 ? (
          <>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {shirts.slice(0, visibleCount).map((s, idx) => {
                const featured = featureFirst && idx === 0;
                return (
                  <li key={s.id} className={featured ? 'col-span-2 md:row-span-2' : ''}>
                    <ShirtCard shirt={s} user={user} eager={idx < 6} featured={featured}
                      isWishlisted={wishlistIds.includes(s.id)} onToggleWishlist={toggleWishlist} />
                  </li>
                );
              })}
            </ul>
            {visibleCount < shirts.length && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="text-sm text-brand-navy/55">{t(`מוצגות ${visibleCount} מתוך ${shirts.length} חולצות`, `Showing ${visibleCount} of ${shirts.length} shirts`)}</p>
                <button type="button" onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="shop-btn-secondary rounded-full px-8">
                  {t('הצגת עוד חולצות', 'Show more shirts')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 space-y-4">
            <EmptyState
              icon={Search}
              title={t('לא נמצאו חולצות', 'No shirts found')}
              description={t('נסו לחפש משהו אחר או לשנות את הסינון.', 'Try searching for something else or changing the filters.')}
              actionLabel={t('ניקוי הסינון', 'Clear filters')}
              onAction={clearEverything}
            />
            {/* The best moment on the whole site to offer this: someone just
                searched for a shirt and we did not have it. */}
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-brand-navy p-7 text-white sm:flex-row sm:items-center sm:p-9">
              <div>
                <p className="text-xl font-semibold">{t('אנחנו יכולים להשיג אותה', 'We can get it for you')}</p>
                <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-white/70">
                  {t('הקטלוג הוא לא הכל. שלחו לנו תמונה או תיאור של החולצה שחיפשתם, ונבדוק אם אפשר להביא אותה.',
                    "The catalog isn't everything. Send us a photo or a description of the shirt you were looking for, and we'll check whether we can bring it in.")}
                </p>
              </div>
              <Link to="/request-shirt" className="shop-btn flex-shrink-0">
                <PackageSearch className="h-5 w-5" aria-hidden="true" />
                {t('בקשת חולצה', 'Request a shirt')}
              </Link>
            </div>
          </div>
        )}

        {/* Collection landing pages. Unlike the quick filters above - which only
            change a query string - each of these is a real page about one
            subject, which is what search engines rank and people share. */}
        <nav aria-labelledby="catalog-collections" className="mt-16 border-t border-brand-line pt-10">
          <h2 id="catalog-collections" className="text-xl font-semibold text-brand-navy">{t('קטגוריות', 'Categories')}</h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {withStock(COLLECTIONS.map(c => ({ ...localizeCollection(c, isEn), href: `/collections/${c.slug}` }))).map(c => (
              <li key={c.slug}>
                <Link to={c.href} className="shop-chip px-5">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <FilterDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={handleFilterChange}
        onClear={() => setFilters(EMPTY_FILTERS)}
        resultCount={shirts.length}
        sizes={allSizes}
        leagues={leagues}
        nationalTeams={nationalTeams}
        conditions={conditions}
      />
    </div>
  );
}
