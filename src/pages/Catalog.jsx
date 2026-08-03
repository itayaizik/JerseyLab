import { getAllShirts } from "@/api/shirts";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Seo from '@/components/Seo';
import { toast } from '@/components/ui/use-toast';

const SIZE_ORDER = ['XS','S','M','L','XL','2XL','3XL','4XL','6-7Y','8-9Y','10-11Y','12-13Y','14-15Y'];

const quickFilters = [
  { label: 'הכל', params: {} },
  { label: 'חדשים', params: { new: 'true' } },
  { label: 'רטרו', params: { tag: 'retro' } },
  { label: 'סייל 🔥', params: { sale: 'true' } },
  { label: 'נבחרות', params: { type: 'national' } },
  { label: 'שחקנים', params: { type: 'player' } },
  { label: 'NBA', params: { sport: 'basketball' } },
  { label: 'ילדים', params: { gender: 'kids' } },
  { label: 'משלוח מהיר', params: { fast: 'true' } },
];

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allShirtsRaw, setAllShirtsRaw] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [user, setUser] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    sport: searchParams.get('sport') || '',
    condition: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    league: '',
    national_team: '',
    size: '',
  });

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
    } catch (err) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setAllShirtsRaw(all.filter(s => s.status !== 'hidden'));
    setLoading(false);
  }

  // Recompute visible shirts whenever URL params, local filters, or the raw list change.
  useEffect(() => {
    let result = [...allShirtsRaw];

    const q = searchParams.get('q')?.toLowerCase();
    const gender = searchParams.get('gender');
    const sport = searchParams.get('sport');
    const sale = searchParams.get('sale');
    const isNew = searchParams.get('new');
    const tag = searchParams.get('tag');
    const type = searchParams.get('type');
    const fast = searchParams.get('fast');
    const best = searchParams.get('best');
    const league = searchParams.get('league');

    if (q) result = result.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.club?.toLowerCase().includes(q) ||
      s.national_team?.toLowerCase().includes(q) ||
      s.player_name?.toLowerCase().includes(q) ||
      s.league?.toLowerCase().includes(q) ||
      s.season?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.tags?.some(t => t.toLowerCase().includes(q))
    );
    if (gender) result = result.filter(s => s.gender_category === gender);
    if (sport) result = result.filter(s => s.sport_category === sport);
    if (sale === 'true') result = result.filter(s => s.sale_price && s.sale_price < s.price);
    if (isNew === 'true') result = result.filter(s => s.is_new);
    if (tag === 'retro') result = result.filter(s => s.is_retro);
    if (type === 'national') result = result.filter(s => s.national_team);
    if (type === 'player') result = result.filter(s => s.player_name);
    if (fast === 'true') result = result.filter(s => s.local_stock_sizes && Object.values(s.local_stock_sizes).some(q => Number(q) > 0));
    if (best === 'true') result = result.filter(s => s.best_seller === true);
    if (league) result = result.filter(s => s.league && s.league.toLowerCase().includes(league.toLowerCase()));

    if (filters.condition) result = result.filter(s => s.condition === filters.condition);
    if (filters.status) result = result.filter(s => s.status === filters.status);
    if (filters.minPrice) result = result.filter(s => s.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(s => s.price <= Number(filters.maxPrice));
    if (filters.league) result = result.filter(s => s.league === filters.league);
    if (filters.national_team) result = result.filter(s => s.national_team === filters.national_team);
    if (filters.size) result = result.filter(s => s.sizes && Object.keys(s.sizes).some(sz => (sz === 'XXL' ? '2XL' : sz) === filters.size));

    setShirts(result);
  }, [searchParams, filters, allShirtsRaw]);

  const { leagues, nationalTeams, allSizes } = useMemo(() => {
    const leagues = [...new Set(allShirtsRaw.map(s => s.league).filter(Boolean))].sort();
    const nationalTeams = [...new Set(allShirtsRaw.map(s => s.national_team).filter(Boolean))].sort();
    const allSizes = [...new Set(
      allShirtsRaw.flatMap(s => Object.keys(s.sizes || {}).map(sz => sz === 'XXL' ? '2XL' : sz))
    )].sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a), bi = SIZE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    });
    return { leagues, nationalTeams, allSizes };
  }, [allShirtsRaw]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) base44.entities.SearchLog.create({ search_term: searchTerm.trim() });
    navigate(`/catalog?q=${encodeURIComponent(searchTerm)}`);
  };

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
      toast({ title: 'הוסר ממועדפים' });
    } else {
      await base44.entities.Wishlist.create({ user_id: user.id, shirt_id: shirtId });
      setWishlistIds(p => [...p, shirtId]);
      toast({ title: 'נוסף למועדפים' });
    }
  }, [user, navigate]);

  const clearFilters = () => {
    const empty = { gender: '', sport: '', condition: '', status: '', minPrice: '', maxPrice: '', league: '', national_team: '', size: '' };
    setFilters(empty);
    setShowMoreFilters(false);
    setSearchTerm('');
    navigate('/catalog');
  };

  // Whether any of the "advanced" filters are active (so we auto-expand them)
  const hasAdvancedFilters = !!(filters.national_team || filters.size);

  const pageTitle = () => {
    const q = searchParams.get('q');
    if (q) return `תוצאות: "${q}"`;
    const gender = searchParams.get('gender');
    if (gender === 'men') return 'גברים';
    if (gender === 'kids') return 'ילדים';
    if (searchParams.get('sport') === 'basketball') return 'NBA';
    if (searchParams.get('sale') === 'true') return 'סייל';
    if (searchParams.get('new') === 'true') return 'חדשים';
    if (searchParams.get('tag') === 'retro') return 'רטרו';
    if (searchParams.get('type') === 'national') return 'נבחרות';
    if (searchParams.get('type') === 'player') return 'שחקנים';
    if (searchParams.get('fast') === 'true') return 'משלוח מהיר';
    if (searchParams.get('best') === 'true') return 'הנמכרים ביותר';
    return 'קטלוג';
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Detect active quick filter
  const activeQuickFilter = quickFilters.findIndex(qf => {
    const keys = Object.keys(qf.params);
    if (keys.length === 0) return !searchParams.get('new') && !searchParams.get('tag') && !searchParams.get('sale') && !searchParams.get('type') && !searchParams.get('sport') && !searchParams.get('gender') && !searchParams.get('fast') && !searchParams.get('q');
    return keys.every(k => searchParams.get(k) === qf.params[k]);
  });

  const seoTitle = `${pageTitle()} — JerseyLab`;
  const seoDesc = `קטלוג חולצות כדורגל: ${pageTitle()}. חולצות של קבוצות, נבחרות ושחקנים במחירים טובים.`;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://jerseylabil.base44.app";
  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: pageTitle(), description: seoDesc, url: origin + "/catalog", inLanguage: "he-IL" },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "דף הבית", item: origin + "/" },
        { "@type": "ListItem", position: 2, name: "קטלוג", item: origin + "/catalog" }
      ]}
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
      <Seo title={seoTitle} description={seoDesc} canonicalPath="/catalog" jsonLd={catalogJsonLd} />

      {/* Page header */}
      <div className="mb-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs text-[#1B2A4A]/40 font-heading uppercase tracking-widest mb-1">JerseyLab Archive</p>
            <h1 className="font-heading font-black text-3xl md:text-4xl text-[#1B2A4A] uppercase">{pageTitle()}</h1>
            {!loading && !loadError && (
              <p className="text-sm text-[#1B2A4A]/50 mt-1 font-body">{shirts.length} חולצות נמצאו</p>
            )}
          </div>

          {/* Search + filter buttons */}
          <div className="flex gap-2">
            <form onSubmit={handleSearch} className="flex border-2 border-[#1B2A4A] bg-white flex-1 md:w-80" style={{ boxShadow: '2px 2px 0 #1B2A4A' }}>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} maxLength={100} autoComplete="off"
                placeholder="חפש לפי שחקן, קבוצה, עונה..." className="flex-1 px-3 py-2 text-sm focus:outline-none font-body" />
              {searchTerm && (
                <button type="button" onClick={() => { setSearchTerm(''); navigate('/catalog'); }} className="px-2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="submit" className="px-3 text-[#1B2A4A] hover:text-[#E8622A] border-r-2 border-[#1B2A4A]">
                <Search className="w-4 h-4" />
              </button>
            </form>
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 border-2 text-sm font-bold font-heading uppercase transition-colors ${filtersOpen || hasActiveFilters ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]' : 'border-[#1B2A4A] bg-white text-[#1B2A4A] hover:bg-[#F2ECD9]'}`}
              style={{ boxShadow: '2px 2px 0 #1B2A4A' }}>
              <SlidersHorizontal className="w-4 h-4" />
              <span>סינון{hasActiveFilters ? ' ●' : ''}</span>
            </button>
          </div>
        </div>

        {/* Quick filter pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {quickFilters.map((qf, i) => {
            const params = new URLSearchParams(qf.params).toString();
            const href = params ? `/catalog?${params}` : '/catalog';
            return (
              <Link key={i} to={href}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wide border-2 transition-colors whitespace-nowrap ${activeQuickFilter === i ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]' : 'border-[#1B2A4A]/30 text-[#1B2A4A] bg-white hover:border-[#1B2A4A] hover:bg-[#F2ECD9]'}`}>
                {qf.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters panel */}
      {filtersOpen && (
        <div className="border-2 border-[#1B2A4A] bg-white p-5 mb-6" style={{ boxShadow: '4px 4px 0 #1B2A4A' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide">סינון מתקדם</h3>
            <button onClick={clearFilters} className="text-xs text-[#E8622A] font-bold font-heading uppercase hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> נקה סינון
            </button>
          </div>
          {/* Primary filters — always visible */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1.5">מצב</label>
              <select value={filters.condition} onChange={e => handleFilterChange('condition', e.target.value)}
                className="w-full border-2 border-[#1B2A4A] px-3 py-2 text-sm focus:outline-none bg-white font-body">
                <option value="">הכל</option>
                <option value="new">חדש</option>
                <option value="like_new">כמו חדש</option>
                <option value="used">משומש</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1.5">טווח מחיר</label>
              <div className="flex gap-2">
                <input type="number" value={filters.minPrice} onChange={e => handleFilterChange('minPrice', e.target.value)}
                  placeholder="מין" className="w-full border-2 border-[#1B2A4A] px-2 py-2 text-sm focus:outline-none font-body" dir="ltr" />
                <input type="number" value={filters.maxPrice} onChange={e => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="מקס" className="w-full border-2 border-[#1B2A4A] px-2 py-2 text-sm focus:outline-none font-body" dir="ltr" />
              </div>
            </div>

            {leagues.length > 0 && (
              <div>
                <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1.5">ליגה</label>
                <select value={filters.league} onChange={e => handleFilterChange('league', e.target.value)}
                  className="w-full border-2 border-[#1B2A4A] px-3 py-2 text-sm focus:outline-none bg-white font-body">
                  <option value="">הכל</option>
                  {leagues.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* More filters toggle — progressive disclosure */}
          <button type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-1.5 mt-4 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wide hover:text-[#E8622A] transition-colors">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreFilters || hasAdvancedFilters ? 'rotate-180' : ''}`} />
            {showMoreFilters || hasAdvancedFilters ? 'פחות מסננים' : 'מסננים נוספים'}
            {hasAdvancedFilters && <span className="w-1.5 h-1.5 bg-[#E8622A] rounded-full" />}
          </button>

          {/* Advanced filters — revealed on demand */}
          {(showMoreFilters || hasAdvancedFilters) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#1B2A4A]/10">
              {nationalTeams.length > 0 && (
                <div>
                  <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1.5">נבחרת</label>
                  <select value={filters.national_team} onChange={e => handleFilterChange('national_team', e.target.value)}
                    className="w-full border-2 border-[#1B2A4A] px-3 py-2 text-sm focus:outline-none bg-white font-body">
                    <option value="">הכל</option>
                    {nationalTeams.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}

              {allSizes.length > 0 && (
                <div className="col-span-2 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1.5">מידה</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {allSizes.map(s => (
                      <button key={s} type="button"
                        onClick={() => handleFilterChange('size', filters.size === s ? '' : s)}
                        className={`text-xs px-3 py-1.5 border-2 font-mono transition-colors ${filters.size === s ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]' : 'border-[#1B2A4A]/40 text-[#1B2A4A] bg-transparent hover:border-[#1B2A4A] hover:bg-[#F2ECD9]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {loadError ? (
        <div className="text-center py-20 border-2 border-dashed border-[#1B2A4A]/20">
          <p className="font-heading font-bold text-xl text-[#1B2A4A]/40 mb-2 uppercase">לא הצלחנו לטעון את הקטלוג</p>
          <p className="text-sm text-[#1B2A4A]/30 font-body mb-4">בדוק את החיבור לאינטרנט ונסה שוב</p>
          <button onClick={loadShirts} className="px-4 py-2 bg-[#E8622A] text-white text-sm font-bold font-heading uppercase hover:bg-[#D0551F] transition-colors">
            נסה שוב
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          {Array.from({ length: 8 }).map((_, i) => <ShirtCardSkeleton key={i} />)}
        </div>
      ) : shirts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          {shirts.map((s, idx) => (
            <ShirtCard key={s.id} shirt={s} user={user} eager={idx < 8} isWishlisted={wishlistIds.includes(s.id)} onToggleWishlist={toggleWishlist} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="לא נמצאו חולצות"
          description="נסה לחפש משהו אחר או שנה את הסינון."
          actionLabel="נקה סינון"
          onAction={clearFilters}
        />
      )}
    </div>
  );
}