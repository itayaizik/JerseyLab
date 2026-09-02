import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Heart, User, ChevronDown, Shield, LogOut, ShoppingCart, Home, LayoutGrid, HelpCircle, Mail, Ruler, Baby, Flag, History, Star, Percent, Sparkles, Zap, ArrowLeft, Gift, PackageSearch } from 'lucide-react';
import { CartModal } from '@/components/InterestModal';
import { base44 } from '@/api/base44Client';
import { getCart } from '@/lib/cart';
import { withStock } from '@/lib/catalogFacets';

const categories = [
  { label: 'גברים', href: '/catalog?gender=men', icon: User },
  { label: 'ילדים', href: '/catalog?gender=kids', icon: Baby },
  { label: 'נבחרות', href: '/catalog?type=national', icon: Flag },
  { label: 'רטרו', href: '/catalog?tag=retro', icon: History },
  { label: 'שחקנים', href: '/catalog?type=player', icon: Star },
  { label: 'סייל', href: '/catalog?sale=true', icon: Percent },
  { label: 'חדשים', href: '/catalog?new=true', icon: Sparkles },
  { label: 'מלאי בארץ', href: '/catalog?fast=true', icon: Zap },
];

// Desktop nav is icon-only, so every entry carries the icon it is shown as and
// the label it is announced/tooltipped with — an icon with no accessible name
// is just a mystery glyph. The mobile menu still renders the labels as text.
const navLinks = [
  { label: 'דף הבית', href: '/', icon: Home },
  { label: 'שאלות ותשובות', href: '/faq', icon: HelpCircle },
  { label: 'צור קשר', href: '/contact', icon: Mail },
  { label: 'מדריך מידות', href: '/size-guide', icon: Ruler },
];

// Mobile menu building blocks. Every group gets the same labelled header and
// every tappable row the same 44px minimum, so the panel reads as one list
// instead of the four differently-styled ones it grew into.
function MobileSection({ title, children }) {
  return (
    <div>
      <p className="text-[10px] text-[#E8622A] font-heading uppercase tracking-[0.2em] mb-2">{title}</p>
      {children}
    </div>
  );
}

function MobileRow({ to, icon: Icon, active, children }) {
  return (
    <Link to={to}
      className={`flex items-center gap-2.5 min-h-[44px] px-3 text-sm font-body transition-colors ${active ? 'bg-[#E8622A] text-white' : 'text-white/75 active:bg-white/10'}`}>
      {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-[#E8622A]/80'}`} />}
      <span>{children}</span>
    </Link>
  );
}

// Hover/focus tooltip under an icon-only control.
function NavTip({ children }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute top-full right-1/2 translate-x-1/2 mt-1.5 whitespace-nowrap bg-[#0f1d38] border border-[#E8622A]/50 px-2 py-1 text-[10px] font-body text-white opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0">
      {children}
    </span>
  );
}

// Categories with nothing behind them are dropped rather than shown as links
// to an empty page. See lib/catalogFacets.
const stockedCategories = withStock(categories);

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const allShirtsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const catRef = useRef(null);
  const adminRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setCartCount(getCart().length);
    const handler = () => setCartCount(getCart().length);
    window.addEventListener('cart_updated', handler);
    return () => window.removeEventListener('cart_updated', handler);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        setIsAdmin(me.role === 'admin');
      } catch { /* not logged in */ }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Close the menus on navigation. Keyed on the query string too: picking a
  // category from the catalog menu while already on /catalog leaves the path
  // untouched, so on pathname alone the menu stayed open over the new results.
  useEffect(() => { setMobileOpen(false); setCatOpen(false); }, [location.pathname, location.search]);

  // Freeze the page behind the open mobile panel — otherwise a scroll that
  // starts on the panel carries on into the page underneath it.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  // Escape closes whichever menu is open.
  useEffect(() => {
    if (!catOpen && !adminOpen && !mobileOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setCatOpen(false);
      setAdminOpen(false);
      setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [catOpen, adminOpen, mobileOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  // Debounced autocomplete — fetches shirts once (cached), filters client-side
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) { setSuggestions([]); return; }

    const timer = setTimeout(async () => {
      if (!allShirtsRef.current) {
        try {
          allShirtsRef.current = await base44.entities.Shirt.filter({ status: 'available' }, '-created_date', 100);
        } catch { allShirtsRef.current = []; }
      }
      const matches = allShirtsRef.current
        .filter(s =>
          s.name?.toLowerCase().includes(term) ||
          s.club?.toLowerCase().includes(term) ||
          s.player_name?.toLowerCase().includes(term) ||
          s.national_team?.toLowerCase().includes(term) ||
          s.league?.toLowerCase().includes(term)
        )
        .slice(0, 5);
      setSuggestions(matches);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setLastScrollY(scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      base44.analytics.track({ eventName: 'search_performed', properties: { source: 'navbar' } });
      base44.entities.SearchLog.create({ search_term: searchTerm.trim() }).catch(() => {});
      navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setSuggestions([]);
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const selectSuggestion = (shirtId) => {
    setSearchTerm('');
    setSuggestions([]);
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(`/shirt/${shirtId}`);
  };

  const handleLogout = async () => { await base44.auth.logout('/'); };

  const isActive = (href) => location.pathname === href;
  const currentUrl = location.pathname + location.search;

  return (
    <>
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} user={user} />

      {/* Top accent bar */}
      <div className="bg-[#E8622A] text-white text-center py-1.5 text-xs font-heading tracking-widest uppercase hidden md:block">
        ⚽ ארכיון בלעדי של חולצות כדורגל נדירות — משלוח לכל הארץ
      </div>

      <nav className="fixed z-50 text-white transition-all duration-300" style={{ 
        top: lastScrollY > 16 ? '16px' : '0',
        left: lastScrollY > 16 ? '16px' : '0',
        right: lastScrollY > 16 ? '16px' : '0',
        background: '#1B2A4A',
        boxShadow: lastScrollY > 16 ? '0 8px 32px rgba(0, 0, 0, 0.15)' : 'none',
        borderRadius: lastScrollY > 16 ? '8px' : '0px',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transform: isVisible ? 'translateY(0)' : 'translateY(-20px)'
      }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            {/* No right margin below lg: at 375px the logo plus the action
                icons plus a 24px margin overflowed the row, which shoved the
                buttons out past the container padding to 3px from the edge. */}
            <Link to="/" className="flex-shrink-0 flex items-center lg:mr-6" aria-label="JerseyLab — דף הבית">
              <img
                src="https://media.base44.com/images/public/6a42e762005950f7dc39df84/f2c515307_image-removebg-preview2.png"
                alt="JerseyLab — ONE PASSION. ONE LAB."
                className="h-12 lg:h-16 w-auto object-contain"
                style={{ mixBlendMode: 'screen', filter: 'saturate(2)' }}
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.slice(0, 1).map(l => (
                <Link key={l.href} to={l.href} aria-label={l.label} title={l.label}
                  className={`group relative flex items-center justify-center w-10 h-10 transition-colors ${isActive(l.href) ? 'text-[#E8622A] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                  <l.icon className="w-[18px] h-[18px]" />
                  <NavTip>{l.label}</NavTip>
                </Link>
              ))}

              {/* Catalog dropdown */}
              <div ref={catRef} className="relative">
                <button onClick={() => setCatOpen(!catOpen)} aria-label="קטלוג" title="קטלוג"
                  aria-expanded={catOpen} aria-haspopup="true"
                  className={`group relative flex items-center justify-center gap-0.5 h-10 px-2.5 transition-colors ${catOpen || location.pathname === '/catalog' ? 'text-[#E8622A] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                  <LayoutGrid className="w-[18px] h-[18px]" />
                  <ChevronDown className={`w-3 h-3 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                  {!catOpen && <NavTip>קטלוג</NavTip>}
                </button>
                {catOpen && (
                  <div role="menu" aria-label="קטגוריות בקטלוג"
                    className="absolute top-full right-0 mt-2 w-[336px] bg-[#0f1d38] border-2 border-[#E8622A] z-40"
                    style={{ boxShadow: '5px 5px 0 rgba(15,29,56,0.55)' }}>
                    <p className="px-3 pt-3 pb-2 text-[10px] text-white/40 font-heading uppercase tracking-[0.2em]">
                      עיין לפי קטגוריה
                    </p>

                    {/* Two columns: eight categories as one scannable block
                        rather than a tall list the eye has to walk down. */}
                    <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                      {stockedCategories.map(c => {
                        const active = currentUrl === c.href;
                        return (
                          <Link key={c.href} to={c.href} role="menuitem" onClick={() => setCatOpen(false)}
                            className={`group/cat flex items-center gap-2 px-2.5 py-2.5 text-sm font-body transition-colors ${active ? 'bg-[#E8622A] text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
                            <c.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-[#E8622A]'}`} />
                            <span className="truncate">{c.label}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Its own strip above the catalog link — a mystery box is
                        not a filter over the catalogue, it is a product. */}
                    <Link to="/mystery-box" role="menuitem" onClick={() => setCatOpen(false)}
                      className={`flex items-center gap-2 mx-2 mb-2 px-2.5 py-2.5 text-sm font-body border-2 transition-colors ${currentUrl === '/mystery-box' ? 'bg-[#FFD95A] text-[#1B2A4A] border-[#FFD95A]' : 'text-[#FFD95A] border-[#FFD95A]/40 hover:bg-[#FFD95A] hover:text-[#1B2A4A]'}`}>
                      <Gift className="w-4 h-4 flex-shrink-0" />
                      <span className="font-bold">מיסטרי בוקס</span>
                      <span className="mr-auto font-mono text-xs opacity-80">מ-₪70</span>
                    </Link>

                    <Link to="/request-shirt" role="menuitem" onClick={() => setCatOpen(false)}
                      className={`flex items-center gap-2 mx-2 mb-2 px-2.5 py-2.5 text-sm font-body border-2 transition-colors ${currentUrl === '/request-shirt' ? 'bg-white text-[#1B2A4A] border-white' : 'text-white/80 border-white/25 hover:bg-white hover:text-[#1B2A4A]'}`}>
                      <PackageSearch className="w-4 h-4 flex-shrink-0" />
                      <span className="font-bold">לא מצאת? בקש חולצה</span>
                    </Link>

                    <Link to="/catalog" role="menuitem" onClick={() => setCatOpen(false)}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-heading font-bold uppercase tracking-wider border-t-2 transition-colors ${currentUrl === '/catalog' ? 'bg-[#E8622A] text-white border-[#E8622A]' : 'text-[#E8622A] border-[#E8622A]/30 hover:bg-[#E8622A] hover:text-white'}`}>
                      כל הקטלוג
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {navLinks.slice(1).map(l => (
                <Link key={l.href} to={l.href} aria-label={l.label} title={l.label}
                  className={`group relative flex items-center justify-center w-10 h-10 transition-colors ${isActive(l.href) ? 'text-[#E8622A] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                  <l.icon className="w-[18px] h-[18px]" />
                  <NavTip>{l.label}</NavTip>
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)} title="חיפוש"
                className={`group relative flex items-center justify-center w-10 h-10 transition-colors ${searchOpen ? 'text-[#E8622A] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`} aria-label="חיפוש">
                <Search className="w-[18px] h-[18px]" />
                {!searchOpen && <NavTip>חיפוש</NavTip>}
              </button>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)} title="סל"
                className="group relative flex items-center justify-center w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="סל">
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-1 left-1 w-4 h-4 bg-[#E8622A] text-white text-[9px] flex items-center justify-center font-mono font-bold">
                    {cartCount}
                  </span>
                )}
                <NavTip>סל</NavTip>
              </button>

              {user ? (
                <>
                  <Link to="/wishlist" title="מועדפים" className="group relative hidden sm:flex items-center justify-center w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="מועדפים">
                    <Heart className="w-[18px] h-[18px]" />
                    <NavTip>מועדפים</NavTip>
                  </Link>
                  <Link to="/profile" title="פרופיל" className="group relative hidden sm:flex items-center justify-center w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="פרופיל">
                    <User className="w-[18px] h-[18px]" />
                    <NavTip>פרופיל</NavTip>
                  </Link>

                  {isAdmin && (
                    <div ref={adminRef} className="relative hidden lg:block mr-1">
                      <button onClick={() => setAdminOpen(!adminOpen)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#E8622A] text-white font-bold font-heading tracking-wide hover:bg-[#D0551F] transition-colors">
                        <Shield className="w-3 h-3" /> מנהל <ChevronDown className="w-3 h-3" />
                      </button>
                      {adminOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-[#0f1d38] border border-[#E8622A]/40 py-1 min-w-48 shadow-2xl z-50">
                          {[
                            { to: '/admin', label: 'דשבורד' },
                            { to: '/admin/add-shirt', label: 'הוסף מוצר' },
                            { to: '/admin/shirts', label: 'ערוך מוצרים' },
                            { to: '/admin/requests', label: 'הזמנות' },
                            { to: '/admin/shirt-requests', label: 'בקשות לחולצות' },
                            { to: '/admin/categories', label: 'קטגוריות' },
                            { to: '/admin/reviews', label: 'ביקורות' },
                            { to: '/admin/faq', label: 'שאלות ותשובות' },
                            { to: '/admin/settings', label: 'הגדרות' },
                          ].map(item => (
                            <Link key={item.to} to={item.to} onClick={() => setAdminOpen(false)}
                              className="block px-4 py-2.5 text-sm hover:bg-[#E8622A] hover:text-white transition-colors font-body">
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={handleLogout} title="התנתקות" className="group relative hidden lg:flex items-center justify-center w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="התנתקות">
                    <LogOut className="w-[18px] h-[18px]" />
                    <NavTip>התנתקות</NavTip>
                  </button>
                </>
              ) : (
                <Link to="/login"
                  className="hidden lg:flex items-center gap-1 px-4 py-1.5 bg-[#E8622A] text-white text-xs font-bold font-heading tracking-wide hover:bg-[#D0551F] transition-colors mr-1"
                  style={{ boxShadow: '2px 2px 0 rgba(255,255,255,0.15)' }}>
                  כניסה
                </Link>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2.5 text-white/80" aria-label="תפריט">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="pb-3 pt-1">
              <form onSubmit={handleSearch} className="flex items-stretch" style={{ border: '2px solid #E8622A', boxShadow: '4px 4px 0 rgba(15,29,56,0.6)' }}>
                <div className="relative flex-1 bg-[#0f1d38]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8622A] pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="חפש שחקן, קבוצה, נבחרת, עונה..."
                    aria-label="חיפוש חולצות"
                    maxLength={100}
                    autoComplete="off"
                    className="w-full bg-transparent pr-10 pl-9 py-3 text-sm placeholder:text-white/40 text-white font-body focus:outline-none focus-visible:!outline-none"
                  />
                  {searchTerm && (
                    <button type="button" onClick={() => { setSearchTerm(''); setSuggestions([]); }} aria-label="נקה חיפוש" className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/50 hover:text-[#E8622A] transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button type="submit" className="px-6 bg-[#E8622A] text-white font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] transition-colors">חפש</button>
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="סגור חיפוש" className="px-3 bg-[#1B2A4A] text-white/60 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </form>

              {/* Autocomplete dropdown */}
              {suggestions.length > 0 && (
                <div className="bg-[#0f1d38] border-2 border-[#E8622A] mt-2 max-h-64 overflow-y-auto" style={{ boxShadow: '4px 4px 0 rgba(15,29,56,0.6)' }}>
                  {suggestions.map(s => (
                    <button key={s.id} type="button" onClick={() => selectSuggestion(s.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-[#E8622A]/10 transition-colors">
                      {s.main_image && <img src={s.main_image} alt="" className="w-10 h-10 object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-body truncate">{s.name}</p>
                        <p className="text-xs text-white/50 truncate">{s.club || s.national_team}{s.player_name ? ` • ${s.player_name}` : ''}</p>
                      </div>
                      <span className="text-xs text-[#E8622A] font-mono flex-shrink-0">₪{s.sale_price || s.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t-2 border-[#E8622A]/30 bg-[#0f1d38] max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
            <div className="px-4 py-4 space-y-5">

              <MobileSection title="עיין לפי קטגוריה">
                <div className="grid grid-cols-2 gap-1.5">
                  {stockedCategories.map(c => {
                    const active = currentUrl === c.href;
                    return (
                      <Link key={c.href} to={c.href}
                        className={`flex items-center gap-2 min-h-[44px] px-3 text-sm font-body transition-colors ${active ? 'bg-[#E8622A] text-white' : 'text-white/80 active:bg-white/10 hover:bg-white/5'}`}>
                        <c.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-[#E8622A]'}`} />
                        <span className="truncate">{c.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <Link to="/mystery-box"
                  className={`mt-1.5 flex items-center gap-2 min-h-[44px] px-3 text-sm font-body border-2 transition-colors ${currentUrl === '/mystery-box' ? 'bg-[#FFD95A] text-[#1B2A4A] border-[#FFD95A]' : 'text-[#FFD95A] border-[#FFD95A]/40'}`}>
                  <Gift className="w-4 h-4 flex-shrink-0" />
                  <span className="font-bold">מיסטרי בוקס</span>
                  <span className="mr-auto font-mono text-xs opacity-80">מ-₪70</span>
                </Link>
                <Link to="/request-shirt"
                  className={`mt-1.5 flex items-center gap-2 min-h-[44px] px-3 text-sm font-body border-2 transition-colors ${currentUrl === '/request-shirt' ? 'bg-white text-[#1B2A4A] border-white' : 'text-white/80 border-white/25'}`}>
                  <PackageSearch className="w-4 h-4 flex-shrink-0" />
                  <span className="font-bold">לא מצאת? בקש חולצה</span>
                </Link>
                <Link to="/catalog"
                  className={`mt-1.5 flex items-center justify-between min-h-[44px] px-3 text-xs font-heading font-bold uppercase tracking-wider border-2 transition-colors ${currentUrl === '/catalog' ? 'bg-[#E8622A] text-white border-[#E8622A]' : 'text-[#E8622A] border-[#E8622A]/40 active:bg-[#E8622A] active:text-white'}`}>
                  כל הקטלוג
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </MobileSection>

              <MobileSection title="באתר">
                {navLinks.map(l => (
                  <MobileRow key={l.href} to={l.href} icon={l.icon} active={currentUrl === l.href}>{l.label}</MobileRow>
                ))}
              </MobileSection>

              {user ? (
                <>
                  <MobileSection title="החשבון שלי">
                    <MobileRow to="/profile" icon={User} active={currentUrl === '/profile'}>פרופיל</MobileRow>
                    <MobileRow to="/wishlist" icon={Heart} active={currentUrl === '/wishlist'}>מועדפים</MobileRow>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 min-h-[44px] px-3 text-sm font-body text-red-400 active:bg-white/5 text-right">
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <span>התנתקות</span>
                    </button>
                  </MobileSection>

                  {isAdmin && (
                    <MobileSection title="ניהול">
                      <MobileRow to="/admin" icon={Shield} active={currentUrl === '/admin'}>דשבורד</MobileRow>
                      <MobileRow to="/admin/shirts" icon={LayoutGrid} active={currentUrl === '/admin/shirts'}>ערוך מוצרים</MobileRow>
                      <MobileRow to="/admin/requests" icon={ShoppingCart} active={currentUrl === '/admin/requests'}>הזמנות</MobileRow>
                      <MobileRow to="/admin/shirt-requests" icon={PackageSearch} active={currentUrl === '/admin/shirt-requests'}>בקשות לחולצות</MobileRow>
                    </MobileSection>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/login" className="flex items-center justify-center min-h-[44px] text-sm bg-[#E8622A] text-white font-bold font-heading">כניסה</Link>
                  <Link to="/register" className="flex items-center justify-center min-h-[44px] text-sm border-2 border-white/25 active:border-[#E8622A] text-white/80 font-body">הרשמה</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Tap anywhere outside to dismiss. Sits under the nav (z-50) so the bar
          and the open panel stay clickable. */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" aria-hidden="true" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}