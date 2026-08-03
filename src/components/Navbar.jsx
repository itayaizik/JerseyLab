import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Heart, User, ChevronDown, Shield, LogOut, ShoppingCart } from 'lucide-react';
import { CartModal } from '@/components/InterestModal';
import { base44 } from '@/api/base44Client';

const categories = [
  { label: 'גברים', href: '/catalog?gender=men' },
  { label: 'ילדים', href: '/catalog?gender=kids' },
  { label: 'נבחרות', href: '/catalog?type=national' },
  { label: 'רטרו', href: '/catalog?tag=retro' },
  { label: 'שחקנים', href: '/catalog?type=player' },
  { label: 'סייל', href: '/catalog?sale=true' },
  { label: 'חדשים', href: '/catalog?new=true' },
];

const navLinks = [
  { label: 'דף הבית', href: '/' },
  { label: 'שאלות ותשובות', href: '/faq' },
  { label: 'צור קשר', href: '/contact' },
  { label: 'מדריך מידות', href: '/size-guide' },
];

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
    try { setCartCount(JSON.parse(sessionStorage.getItem('jerseylab_cart') || '[]').length); } catch {}
    const handler = () => { try { setCartCount(JSON.parse(sessionStorage.getItem('jerseylab_cart') || '[]').length); } catch {} };
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

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); setCatOpen(false); }, [location.pathname]);

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
        background: 'rgba(27, 42, 74, 0.92)',
        backdropFilter: 'blur(8px)',
        boxShadow: lastScrollY > 16 ? '0 8px 32px rgba(0, 0, 0, 0.15)' : 'none',
        borderRadius: lastScrollY > 16 ? '8px' : '0px',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transform: isVisible ? 'translateY(0)' : 'translateY(-20px)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center mr-6" aria-label="JerseyLab — דף הבית">
              <img
                src="https://media.base44.com/images/public/6a42e762005950f7dc39df84/f2c515307_image-removebg-preview2.png"
                alt="JerseyLab — ONE PASSION. ONE LAB."
                className="h-16 w-auto object-contain"
                style={{ mixBlendMode: 'screen', filter: 'saturate(2)' }}
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.slice(0, 1).map(l => (
                <Link key={l.href} to={l.href}
                  className={`px-3 py-2 text-sm font-heading tracking-wide transition-colors ${isActive(l.href) ? 'text-[#E8622A]' : 'text-white/80 hover:text-white'}`}>
                  {l.label}
                </Link>
              ))}

              {/* Catalog dropdown */}
              <div ref={catRef} className="relative">
                <button onClick={() => setCatOpen(!catOpen)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-heading tracking-wide transition-colors ${catOpen || location.pathname === '/catalog' ? 'text-[#E8622A]' : 'text-white/80 hover:text-white'}`}>
                  קטלוג <ChevronDown className={`w-3 h-3 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                </button>
                {catOpen && (
                   <div className="absolute top-full right-0 mt-1 bg-[#0f1d38] border border-[#E8622A]/40 shadow-2xl min-w-44 z-40 max-h-96 overflow-y-auto">
                    <div className="py-1">
                      <Link to="/catalog" onClick={() => setCatOpen(false)}
                        className="block px-4 py-2 text-xs text-[#E8622A] font-heading uppercase tracking-wider border-b border-white/10 hover:bg-[#E8622A]/10">
                        כל הקטלוג →
                      </Link>
                      {categories.map(c => (
                        <Link key={c.href} to={c.href} onClick={() => setCatOpen(false)}
                          className="block px-4 py-2.5 text-sm hover:bg-[#E8622A] hover:text-white transition-colors font-body">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {navLinks.slice(1).map(l => (
                <Link key={l.href} to={l.href}
                  className={`px-3 py-2 text-sm font-heading tracking-wide transition-colors ${isActive(l.href) ? 'text-[#E8622A]' : 'text-white/80 hover:text-white'}`}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2.5 rounded transition-colors ${searchOpen ? 'text-[#E8622A]' : 'text-white/70 hover:text-white'}`} aria-label="חיפוש">
                <Search className="w-4 h-4" />
              </button>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)}
                className="relative p-2.5 text-white/70 hover:text-white transition-colors" aria-label="סל">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute top-1 left-1 w-4 h-4 bg-[#E8622A] text-white text-[9px] flex items-center justify-center font-mono font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <>
                  <Link to="/wishlist" className="p-2.5 text-white/70 hover:text-white transition-colors hidden sm:flex" aria-label="מועדפים">
                    <Heart className="w-4 h-4" />
                  </Link>
                  <Link to="/profile" className="p-2.5 text-white/70 hover:text-white transition-colors hidden sm:flex" aria-label="פרופיל">
                    <User className="w-4 h-4" />
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
                            { to: '/admin/requests', label: 'בקשות לקוחות' },
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

                  <button onClick={handleLogout} className="hidden lg:flex p-2.5 text-white/70 hover:text-white transition-colors" aria-label="התנתקות">
                    <LogOut className="w-4 h-4" />
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
          <div className="lg:hidden border-t-2 border-[#E8622A]/30 bg-[#0f1d38] max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              <Link to="/" className="block py-2.5 text-sm font-heading hover:text-[#E8622A] border-b border-white/5">דף הבית</Link>

              <div className="pt-2">
                <p className="text-[10px] text-[#E8622A] font-heading uppercase tracking-widest mb-2">קטגוריות</p>
                <div className="grid grid-cols-2 gap-1">
                  {categories.map(c => (
                    <Link key={c.href} to={c.href}
                      className="block py-2 px-3 text-sm text-white/80 hover:text-[#E8622A] hover:bg-white/5 font-body transition-colors">
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1">
                {navLinks.slice(1).map(l => (
                  <Link key={l.href} to={l.href} className="block py-2.5 text-sm font-body text-white/70 hover:text-[#E8622A]">{l.label}</Link>
                ))}
              </div>

              {user ? (
                <div className="border-t border-white/10 pt-3 space-y-1">
                  <Link to="/profile" className="block py-2.5 text-sm font-body text-white/70 hover:text-[#E8622A]">פרופיל</Link>
                  <Link to="/wishlist" className="block py-2.5 text-sm font-body text-white/70 hover:text-[#E8622A]">מועדפים</Link>
                  {isAdmin && (
                    <>
                      <div className="border-t border-[#E8622A]/30 pt-2 mt-2">
                        <p className="text-[10px] text-[#E8622A] font-heading uppercase tracking-widest mb-2">ניהול</p>
                        <Link to="/admin" className="block py-2 pr-2 text-sm font-body text-white/70 hover:text-[#E8622A]">דשבורד</Link>
                        <Link to="/admin/shirts" className="block py-2 pr-2 text-sm font-body text-white/70 hover:text-[#E8622A]">ערוך מוצרים</Link>
                        <Link to="/admin/requests" className="block py-2 pr-2 text-sm font-body text-white/70 hover:text-[#E8622A]">בקשות לקוחות</Link>
                      </div>
                    </>
                  )}
                  <button onClick={handleLogout} className="block py-2.5 text-sm text-red-400 hover:text-red-300 font-body w-full text-right">התנתקות</button>
                </div>
              ) : (
                <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2">
                  <Link to="/login" className="block py-2.5 text-sm bg-[#E8622A] text-white text-center font-bold font-heading">כניסה</Link>
                  <Link to="/register" className="block py-2.5 text-sm text-center border border-white/20 hover:border-[#E8622A] text-white/70 font-body">הרשמה</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}