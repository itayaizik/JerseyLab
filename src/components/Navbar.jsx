import React, { useState, useEffect, useRef, useId } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Heart, User, ShoppingBag, ChevronDown, ChevronLeft, LogOut, X, ArrowLeft, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CartDrawer from '@/components/cart/CartDrawer';
import SideDrawer from '@/components/shop/SideDrawer';
import Disclosure from '@/components/shop/Disclosure';
import PromoBar from '@/components/PromoBar';
import ProductImage from '@/components/ui/ProductImage';
import { getCart, shirtBasePrice } from '@/lib/cart';
import { searchShirts } from '@/lib/search';
import { facetImage } from '@/lib/catalogFacets';
import { NAV_ITEMS, SHIRTS_MENU, CLUBS_MENU, NATIONAL_MENU, SITE_LINKS } from '@/lib/navigation';

// ─── Search ─────────────────────────────────────────────────────────────────

// Fetched once, the first time anyone types, and shared by the desktop and the
// mobile search box. 500, not 100: with a cap of 100 the oldest shirts could
// never appear as a suggestion whatever was typed.
let catalogRequest = null;
function loadCatalog() {
  if (!catalogRequest) {
    catalogRequest = base44.entities.Shirt.filter({ status: 'available' }, '-created_date', 500)
      .catch(() => { catalogRequest = null; return []; });
  }
  return catalogRequest;
}

function SearchBox({ className = '', onNavigate }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [player, setPlayer] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);
  const navigate = useNavigate();
  const listId = useId();

  // The same search the catalogue runs, so what the dropdown suggests and what
  // pressing Enter shows can never disagree.
  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) { setResults([]); setPlayer(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const all = await loadCatalog();
      if (cancelled) return;
      const found = searchShirts(all, query);
      setResults(found.results.slice(0, 6));
      setPlayer(found.player);
      setActive(-1);
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [term]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const finish = () => { setTerm(''); setResults([]); setOpen(false); onNavigate?.(); };

  const submit = (e) => {
    e?.preventDefault();
    const query = term.trim();
    if (!query) return;
    // Logged on the catalogue page, where the number of results is known.
    navigate(`/catalog?q=${encodeURIComponent(query)}`);
    finish();
  };

  const go = (shirt) => { navigate(`/shirt/${shirt.id}`); finish(); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => (i + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i <= 0 ? results.length - 1 : i - 1)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); go(results[active]); }
  };

  const showList = open && term.trim().length >= 2 && results.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <label className="flex h-12 items-center gap-3 rounded-xl bg-brand-mist px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-navy/15">
          <Search className="h-5 w-5 flex-shrink-0 text-brand-navy/55" aria-hidden="true" />
          <input
            type="text"
            enterKeyHint="search"
            value={term}
            onChange={e => { setTerm(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="חיפוש חולצה, קבוצה או שחקן"
            aria-label="חיפוש חולצות"
            maxLength={100}
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-brand-navy placeholder:text-brand-navy/45 focus:outline-none focus-visible:!outline-none"
          />
          {term && (
            <button type="button" onClick={() => { setTerm(''); setResults([]); }} aria-label="ניקוי החיפוש"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-brand-navy/50 transition hover:bg-brand-mist-dark hover:text-brand-navy">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </form>

      {showList && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-lift">
          {player && <p className="px-4 pt-3 text-[13px] text-brand-orange-ink">חולצות מהתקופה של {player.label}</p>}
          <ul id={listId} role="listbox" aria-label="הצעות" className="max-h-[22rem] overflow-y-auto p-2">
            {results.map((s, i) => (
              <li key={s.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button type="button" tabIndex={-1} onMouseDown={e => e.preventDefault()} onClick={() => go(s)} onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-start transition ${i === active ? 'bg-brand-mist' : ''}`}>
                  <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-brand-mist">
                    <ProductImage src={s.main_image} alt="" sizes="48px" className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-brand-navy">{s.name}</span>
                    <span className="block truncate text-[13px] text-brand-navy/50">{[s.club || s.national_team, s.season].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-brand-navy">₪{shirtBasePrice(s)}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={submit}
            className="flex w-full items-center justify-between gap-3 border-t border-brand-line px-4 py-3 text-sm font-semibold text-brand-orange-ink transition hover:bg-brand-mist">
            <span className="truncate">כל התוצאות עבור "{term.trim()}"</span>
            <ArrowLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Menus ──────────────────────────────────────────────────────────────────

// A shirt photographed behind a menu link, picked at build time. With no
// catalogue data at build, a navy tile stands in rather than a broken image.
function MenuImage({ imageKey, sizes }) {
  const src = imageKey ? facetImage(imageKey) : null;
  return (
    <span className="relative block aspect-square overflow-hidden rounded-3xl bg-brand-mist">
      {src
        ? <ProductImage src={src} alt="" sizes={sizes} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        : <span className="absolute inset-0 bg-gradient-to-br from-brand-navy to-brand-navy-light" />}
    </span>
  );
}

function MenuColumn({ item, onNavigate }) {
  return (
    <div className="min-w-0">
      <Link to={item.href} onClick={onNavigate} className="group block rounded-3xl">
        <MenuImage imageKey={item.image} sizes="260px" />
        <span className="mt-4 block text-[15px] font-medium text-brand-navy transition group-hover:text-brand-orange-ink">{item.label}</span>
      </Link>
      {item.links?.length > 0 && (
        <>
          <span className="mt-3 block h-px bg-brand-line" aria-hidden="true" />
          <ul className="mt-3 space-y-1">
            {item.links.map(link => (
              <li key={link.href}>
                <Link to={link.href} onClick={onNavigate}
                  className="block rounded-lg px-3 py-1.5 text-[15px] text-brand-navy/65 transition hover:bg-brand-mist hover:text-brand-navy">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function MegaPanel({ menu, onNavigate }) {
  if (menu === 'shirts') {
    return (
      <div className="grid grid-cols-6 gap-6">
        {SHIRTS_MENU.cards.map(card => <MenuColumn key={card.href} item={card} onNavigate={onNavigate} />)}
        <div className="col-start-6 row-start-1 border-s border-brand-line ps-6">
          <p className="text-[15px] font-semibold text-brand-navy">עוד בחנות</p>
          <ul className="mt-4 space-y-1">
            {SHIRTS_MENU.links.map(link => (
              <li key={link.href}>
                <Link to={link.href} onClick={onNavigate}
                  className="block rounded-lg px-3 py-2 text-[15px] text-brand-navy/65 transition hover:bg-brand-mist hover:text-brand-navy">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  if (menu === 'clubs') {
    return (
      <div className="grid grid-cols-5 gap-6">
        {CLUBS_MENU.map(group => <MenuColumn key={group.label} item={group} onNavigate={onNavigate} />)}
      </div>
    );
  }
  if (menu === 'national') {
    return (
      <div className="grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] gap-10">
        <MenuColumn item={NATIONAL_MENU.card} onNavigate={onNavigate} />
        <div>
          <p className="text-[15px] font-semibold text-brand-navy">לפי נבחרת</p>
          <ul className="mt-4 grid grid-cols-4 gap-2.5">
            {NATIONAL_MENU.links.map(link => (
              <li key={link.href}>
                <Link to={link.href} onClick={onNavigate} className="shop-chip w-full justify-start px-4">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return null;
}

function AccountMenuLink({ to, icon: Icon, onNavigate, children }) {
  return (
    <Link role="menuitem" to={to} onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] text-brand-navy transition hover:bg-brand-mist">
      <Icon className="h-4 w-4 text-brand-navy/55" aria-hidden="true" />
      {children}
    </Link>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [floating, setFloating] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  const accountRef = useRef(null);
  const floatingRef = useRef(false);
  const hoverTimer = useRef(null);
  const location = useLocation();

  // Reserves the header's height, so the fixed bar does not cover the top of
  // the page. Measured rather than hardcoded, because the promo strip, the
  // mobile search row and the breakpoint all change it.
  //
  // Measured only at rest. Once the page scrolls, the header lifts into a
  // floating card and drops its second row; if the spacer followed it down,
  // the page would jump by that row's height mid-scroll.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => { if (!floatingRef.current) setHeaderHeight(el.getBoundingClientRect().height); };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    window.addEventListener('resize', sync);
    return () => { observer.disconnect(); window.removeEventListener('resize', sync); };
  }, []);

  // Once the page has scrolled, the header lifts off the edges and becomes a
  // floating card. Someone who has asked their system for less motion keeps a
  // plain bar that does not move under them.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const onScroll = () => {
      const next = window.scrollY > 24;
      if (next !== floatingRef.current) {
        floatingRef.current = next;
        setFloating(next);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The cart badge follows the cart, and any page can ask for the drawer.
  useEffect(() => {
    const syncCount = () => setCartCount(getCart().length);
    const openDrawer = () => setCartOpen(true);
    syncCount();
    window.addEventListener('cart_updated', syncCount);
    window.addEventListener('open_cart', openDrawer);
    return () => {
      window.removeEventListener('cart_updated', syncCount);
      window.removeEventListener('open_cart', openDrawer);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        setIsAdmin(me.role === 'admin');
      } catch { /* not logged in */ }
    })();
  }, []);

  // Close everything on navigation. Keyed on the query string too: choosing a
  // category while already on /catalog leaves the path untouched.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setAccountOpen(false);
    setCartOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => { if (floating) setOpenMenu(null); }, [floating]);

  useEffect(() => {
    if (!openMenu && !accountOpen) return;
    const onDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpenMenu(null);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpenMenu(null);
      setAccountOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu, accountOpen]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // A short delay before a panel opens on hover, so moving the pointer across
  // the row on the way somewhere else does not flash every panel in turn. Once
  // one is open, the next opens at once.
  const hoverMenu = (menu) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(menu), openMenu ? 0 : 120);
  };
  const leaveHeader = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(null), 200);
  };
  const stayOpen = () => clearTimeout(hoverTimer.current);

  const closeAll = () => { setOpenMenu(null); setMobileOpen(false); setAccountOpen(false); };
  const handleLogout = async () => { await base44.auth.logout('/'); };

  const cartLabel = cartCount === 1 ? 'סל הקניות, פריט אחד' : `סל הקניות, ${cartCount} פריטים`;
  const iconClass = 'h-[1.35rem] w-[1.35rem]';

  return (
    <>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} user={user} />

      <div aria-hidden="true" style={{ height: headerHeight }} />

      <div
        ref={headerRef}
        onPointerEnter={stayOpen}
        onPointerLeave={e => { if (e.pointerType === 'mouse') leaveHeader(); }}
        className="fixed z-50 transition-[top,left,right] duration-300 ease-out"
        style={{ top: floating ? 12 : 0, left: floating ? 12 : 0, right: floating ? 12 : 0 }}
      >
        {/* Hidden rather than unmounted while floating, so it does not fetch its
            settings again every time the page returns to the top. */}
        <div className={floating ? 'hidden' : ''}>
          <PromoBar />
        </div>

        <header className={`relative bg-white transition-[border-radius,box-shadow] duration-300 ${floating ? 'rounded-[1.375rem] shadow-float' : 'border-b border-brand-line'}`}>
          <div className="shop-container">
            <div className="flex h-16 items-center justify-between gap-3 lg:grid lg:h-[5.25rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:gap-8">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setMobileOpen(true)} aria-label="פתיחת התפריט" className="shop-icon-btn -ms-2 lg:hidden">
                  <Menu className="h-6 w-6" />
                </button>
                <Link to="/" aria-label="JerseyLab - דף הבית" className="flex items-center rounded-lg">
                  <img src="/logo-navbar-dark.png" alt="JerseyLab" width="391" height="128" className="h-9 w-auto lg:h-11" />
                </Link>
              </div>

              <SearchBox className="hidden lg:block" />

              <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                {user ? (
                  <div ref={accountRef} className="relative">
                    <button type="button" onClick={() => setAccountOpen(o => !o)} aria-expanded={accountOpen} aria-haspopup="menu" aria-label="החשבון שלי" className="shop-icon-btn">
                      <User className={iconClass} />
                    </button>
                    {accountOpen && (
                      <div role="menu" className="absolute end-0 top-full z-50 mt-2 w-60 rounded-2xl border border-brand-line bg-white p-2 shadow-lift">
                        <p className="truncate px-3 pb-2 pt-1 text-[13px] text-brand-navy/50">{user.full_name || user.email}</p>
                        <AccountMenuLink to="/profile" icon={User} onNavigate={closeAll}>החשבון שלי</AccountMenuLink>
                        <AccountMenuLink to="/wishlist" icon={Heart} onNavigate={closeAll}>מועדפים</AccountMenuLink>
                        {isAdmin && <AccountMenuLink to="/admin" icon={Shield} onNavigate={closeAll}>ניהול האתר</AccountMenuLink>}
                        <button role="menuitem" type="button" onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] text-red-600 transition hover:bg-red-50">
                          <LogOut className="h-4 w-4" aria-hidden="true" />
                          התנתקות
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" aria-label="התחברות" className="shop-icon-btn">
                    <User className={iconClass} />
                  </Link>
                )}

                {user && (
                  <Link to="/wishlist" aria-label="מועדפים" className="shop-icon-btn hidden sm:inline-flex">
                    <Heart className={iconClass} />
                  </Link>
                )}

                <button type="button" onClick={() => setCartOpen(true)} aria-label={cartLabel} className="shop-icon-btn relative -me-2 sm:me-0">
                  <ShoppingBag className={iconClass} />
                  {cartCount > 0 && (
                    <span aria-hidden="true" className="absolute end-1 top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand-orange px-1 text-[0.6875rem] font-bold leading-none text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {!floating && (
              <div className="pb-3 lg:hidden">
                <SearchBox />
              </div>
            )}

            {!floating && (
              <nav aria-label="תפריט ראשי" className="hidden lg:block">
                <ul className="-mt-1 flex items-center justify-center gap-1 xl:gap-3">
                  {NAV_ITEMS.map(item => {
                    if (item.menu) {
                      const isOpen = openMenu === item.menu;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={`mega-${item.menu}`}
                            onPointerEnter={e => { if (e.pointerType === 'mouse') hoverMenu(item.menu); }}
                            onClick={() => setOpenMenu(m => (m === item.menu ? null : item.menu))}
                            className={`relative flex h-12 items-center gap-1.5 px-4 text-[15px] transition ${isOpen ? 'text-brand-orange-ink' : 'text-brand-navy/75 hover:text-brand-navy'}`}
                          >
                            {item.label}
                            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            <span aria-hidden="true" className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-orange transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
                          </button>
                        </li>
                      );
                    }
                    const current = location.pathname + location.search === item.href;
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.href}
                          aria-current={current ? 'page' : undefined}
                          onPointerEnter={e => { if (e.pointerType === 'mouse') hoverMenu(null); }}
                          className={`relative flex h-12 items-center px-4 text-[15px] transition ${current ? 'text-brand-orange-ink' : 'text-brand-navy/75 hover:text-brand-navy'}`}
                        >
                          {item.label}
                          <span aria-hidden="true" className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-orange ${current ? 'opacity-100' : 'opacity-0'}`} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>

          {openMenu && !floating && (
            <div id={`mega-${openMenu}`} className="absolute inset-x-0 top-full hidden rounded-b-[1.75rem] border-t border-brand-line bg-white shadow-lift lg:block">
              <div className="shop-container py-8 xl:py-10">
                <MegaPanel menu={openMenu} onNavigate={closeAll} />
              </div>
            </div>
          )}
        </header>
      </div>

      <SideDrawer
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        side="start"
        label="תפריט"
        bodyClassName="space-y-2.5"
        footer={user ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/profile" onClick={closeAll} className="shop-btn-secondary">החשבון שלי</Link>
            <button type="button" onClick={handleLogout} className="shop-btn-secondary text-red-600">התנתקות</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/login" onClick={closeAll} className="shop-btn-dark">התחברות</Link>
            <Link to="/register" onClick={closeAll} className="shop-btn-secondary">הרשמה</Link>
          </div>
        )}
      >
        <Disclosure title="חולצות" defaultOpen>
          <ul className="grid grid-cols-2 gap-3">
            {SHIRTS_MENU.cards.map(card => (
              <li key={card.href}>
                <Link to={card.href} onClick={closeAll} className="group block rounded-3xl">
                  <MenuImage imageKey={card.image} sizes="180px" />
                  <span className="mt-2 block text-sm font-medium text-brand-navy">{card.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Disclosure>

        <Disclosure title="קבוצות">
          <div className="space-y-5">
            {CLUBS_MENU.map(group => (
              <div key={group.label}>
                <Link to={group.href} onClick={closeAll} className="text-sm font-semibold text-brand-navy">{group.label}</Link>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link to={link.href} onClick={closeAll} className="shop-chip min-h-[2.5rem] px-3.5">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Disclosure>

        <Disclosure title="נבחרות">
          <ul className="flex flex-wrap gap-2">
            {NATIONAL_MENU.links.map(link => (
              <li key={link.href}>
                <Link to={link.href} onClick={closeAll} className="shop-chip min-h-[2.5rem] px-3.5">{link.label}</Link>
              </li>
            ))}
          </ul>
          <Link to={NATIONAL_MENU.card.href} onClick={closeAll} className="shop-link mt-4 text-sm">
            כל הנבחרות
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Disclosure>

        <ul className="pt-2">
          {SITE_LINKS.map(link => (
            <li key={link.href}>
              <Link to={link.href} onClick={closeAll} className="flex min-h-[3.25rem] items-center justify-between border-b border-brand-line text-[15px] text-brand-navy">
                {link.label}
                <ChevronLeft className="h-4 w-4 text-brand-navy/35" aria-hidden="true" />
              </Link>
            </li>
          ))}
          {isAdmin && (
            <li>
              <Link to="/admin" onClick={closeAll} className="flex min-h-[3.25rem] items-center justify-between border-b border-brand-line text-[15px] font-medium text-brand-orange-ink">
                ניהול האתר
                <Shield className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          )}
        </ul>
      </SideDrawer>
    </>
  );
}
