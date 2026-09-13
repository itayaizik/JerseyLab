import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, MessageCircle, LogOut, Package, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductImage from '@/components/ui/ProductImage';
import EmptyState from '@/components/ui/EmptyState';
import Breadcrumb from '@/components/shop/Breadcrumb';
import { WHATSAPP_URL, INSTAGRAM_URL } from '@/lib/contact';
import { formatDate } from '@/lib/dates';
import { shirtBasePrice } from '@/lib/cart';

// An order moves through these three states; the badge alone did not tell a
// customer whether anything was still going to happen.
const STATUS_STEPS = ['נשלחה', 'יצרנו קשר', 'הושלמה'];
const STATUS_STEP = { new: 0, contacted: 1, closed: 2 };
const STATUS_STYLE = {
  new: 'bg-brand-orange-soft text-brand-orange-ink',
  contacted: 'bg-amber-100 text-amber-900',
  closed: 'bg-emerald-50 text-emerald-700',
};
const STATUS_LABELS = { new: 'חדשה', contacted: 'נוצר קשר', closed: 'הושלמה' };

// Short, readable handle for an order - what a customer quotes to us in chat.
function orderRef(request) {
  return `#${String(request.order_id || request.id).slice(-6).toUpperCase()}`;
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [shirtsById, setShirtsById] = useState({});
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [reqs, wl] = await Promise.all([
          base44.entities.InterestRequest.filter({ user_id: me.id }, '-created_date', 20),
          base44.entities.Wishlist.filter({ user_id: me.id }),
        ]);
        setRequests(reqs);
        setWishlistCount(wl.length);
        const shirtIds = [...new Set(reqs.map(r => r.shirt_id).filter(Boolean))];
        if (shirtIds.length) {
          const shirts = await Promise.all(shirtIds.map(id => base44.entities.Shirt.get(id).catch(() => null)));
          setShirtsById(Object.fromEntries(shirts.filter(Boolean).map(s => [s.id, s])));
        }
      } catch {
        if (!navigator.onLine) setError(true);
        else navigate('/login');
      }
      setLoading(false);
    }
    load();
  }, []);

  // Items from the same cart checkout share an order_id - group them so a
  // multi-shirt order shows as one card instead of N disconnected ones.
  const requestGroups = useMemo(() => {
    const map = new Map();
    for (const r of requests) {
      const key = r.order_id || r.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return Array.from(map.values());
  }, [requests]);

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  if (error) {
    return (
      <div className="shop-container py-16">
        <EmptyState
          icon={Package}
          title="לא הצלחנו לטעון את החשבון"
          description="בדקו את החיבור לאינטרנט ונסו שוב."
          actionLabel="לנסות שוב"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shop-container py-8 lg:py-12" aria-busy="true">
        <div className="h-32 rounded-3xl skeleton" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-3xl skeleton" />)}
        </div>
      </div>
    );
  }

  const newRequests = requests.filter(r => r.status === 'new').length;

  return (
    <div className="shop-container py-8 lg:py-12">
      <Breadcrumb trail={[{ label: 'החשבון שלי' }]} />

      <div className="shop-card flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-navy text-2xl font-bold text-white">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-brand-navy sm:text-3xl">{user?.full_name || 'החשבון שלי'}</h1>
            <p dir="ltr" className="truncate text-right text-[15px] text-brand-navy/55">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="shop-btn-secondary">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          התנתקות
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Link to="/wishlist" className="group rounded-3xl bg-brand-mist p-6 transition hover:bg-brand-mist-dark">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-navy/55">מועדפים</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-brand-navy">{wishlistCount}</p>
            </div>
            <Heart className="h-6 w-6 text-brand-orange-ink transition-transform group-hover:scale-110" aria-hidden="true" />
          </div>
        </Link>

        <a href="#requests" className="group rounded-3xl bg-brand-mist p-6 transition hover:bg-brand-mist-dark">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-navy/55">הזמנות ובקשות</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-brand-navy">{requests.length}</p>
            </div>
            <MessageCircle className="h-6 w-6 text-brand-navy transition-transform group-hover:scale-110" aria-hidden="true" />
          </div>
          {newRequests > 0 && (
            <span className="mt-3 inline-flex rounded-full bg-brand-orange px-2.5 py-1 text-xs font-semibold text-white">
              {newRequests} חדשות
            </span>
          )}
        </a>

        <Link to="/catalog" className="group rounded-3xl bg-brand-navy p-6 text-white transition hover:bg-brand-navy-light">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/60">מחפשים עוד?</p>
              <p className="mt-2 text-lg font-semibold">לכל החולצות</p>
            </div>
            <Package className="h-6 w-6 text-brand-gold transition-transform group-hover:scale-110" aria-hidden="true" />
          </div>
        </Link>
      </div>

      <section id="requests" className="mt-12 scroll-mt-28" aria-labelledby="requests-heading">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="requests-heading" className="text-2xl font-bold text-brand-navy sm:text-[1.75rem]">ההזמנות שלי</h2>
          {requestGroups.length > 0 && (
            <span className="text-sm text-brand-navy/55">סה״כ {requestGroups.length}</span>
          )}
        </div>

        {requestGroups.length > 0 ? (
          <div className="space-y-4">
            {requestGroups.map(group => {
              const first = group[0];
              const step = STATUS_STEP[first.status] ?? 0;
              const ref = orderRef(first);
              const channel = first.contact_channel === 'instagram' ? 'instagram' : 'whatsapp';
              const askUrl = channel === 'instagram'
                ? INSTAGRAM_URL
                : `${WHATSAPP_URL}?text=${encodeURIComponent(`היי, לגבי הזמנה ${ref}`)}`;

              return (
                <article key={first.order_id || first.id} className="overflow-hidden rounded-3xl border border-brand-line bg-white">
                  {/* Order header - the reference number is what a customer
                      actually needs when they message us about this order. */}
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p dir="ltr" className="text-right text-base font-semibold tabular-nums text-brand-navy">{ref}</p>
                      <p className="mt-0.5 text-[13px] text-brand-navy/55">
                        {formatDate(first.created_date, 'ללא תאריך')}
                        {group.length > 1 && ` · ${group.length} פריטים`}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[first.status] || 'bg-brand-mist text-brand-navy'}`}>
                      {STATUS_LABELS[first.status] || first.status}
                    </span>
                  </div>

                  {/* Where the order stands. Without this the status word alone
                      left people unsure whether anything happens next. */}
                  <ol className="flex items-center gap-2 border-y border-brand-line px-5 py-3">
                    {STATUS_STEPS.map((label, i) => (
                      <React.Fragment key={label}>
                        <li className="flex min-w-0 items-center gap-2">
                          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= step ? 'bg-brand-orange text-white' : 'bg-brand-mist text-brand-navy/40'}`}>
                            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </span>
                          <span className={`truncate text-[13px] ${i <= step ? 'font-medium text-brand-navy' : 'text-brand-navy/40'}`}>{label}</span>
                        </li>
                        {i < STATUS_STEPS.length - 1 && (
                          <span aria-hidden="true" className={`h-0.5 flex-1 rounded-full ${i < step ? 'bg-brand-orange' : 'bg-brand-line'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </ol>

                  <ul className="divide-y divide-brand-line px-5">
                    {group.map(r => {
                      const shirt = shirtsById[r.shirt_id];
                      // A mystery box has no catalogue page to link to, so the
                      // row stays plain text rather than pointing at a 404.
                      const Thumb = shirt ? Link : 'div';
                      const thumbProps = shirt ? { to: `/shirt/${r.shirt_id}` } : {};
                      return (
                        <li key={r.id} className="flex items-center gap-4 py-4">
                          <Thumb {...thumbProps} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-brand-mist">
                            <ProductImage src={shirt?.main_image} alt="" sizes="64px" className="h-full w-full object-cover" />
                          </Thumb>
                          <div className="min-w-0 flex-1">
                            <Thumb {...thumbProps}
                              className={`line-clamp-2 text-[15px] font-semibold text-brand-navy ${shirt ? 'transition hover:text-brand-orange-ink' : ''}`}>
                              {r.shirt_name || 'חולצה'}
                            </Thumb>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {r.wanted_size && (
                                <span dir="ltr" className="rounded-full bg-brand-mist px-2.5 py-0.5 text-xs font-semibold text-brand-navy">{r.wanted_size}</span>
                              )}
                              {r.message?.includes('גרסת שחקן') && (
                                <span className="rounded-full bg-brand-orange-soft px-2.5 py-0.5 text-xs font-semibold text-brand-orange-ink">גרסת שחקן</span>
                              )}
                            </div>
                          </div>
                          {shirt && (
                            <span className="flex-shrink-0 text-[15px] font-semibold tabular-nums text-brand-navy">₪{shirtBasePrice(shirt)}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {first.message && !first.message.includes('סל קניות') && (
                    <div className="mx-5 mb-4 rounded-2xl bg-brand-mist p-4">
                      <p className="text-xs text-brand-navy/50">הערה שצירפתם</p>
                      <p className="mt-1 text-sm text-brand-navy">{first.message}</p>
                    </div>
                  )}

                  {/* Nothing is paid on the site, so the only real next action is
                      to talk to us - make it one tap, with the order already
                      named in the message. */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-mist/70 px-5 py-3">
                    <p className="text-[13px] text-brand-navy/60">
                      {first.status === 'closed' ? 'ההזמנה הושלמה.' : `נחזור אליכם ב${channel === 'instagram' ? 'אינסטגרם' : 'וואטסאפ'}.`}
                    </p>
                    <a href={askUrl} target="_blank" rel="noopener noreferrer" className="shop-btn-dark min-h-[2.75rem] px-4 text-sm">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      שאלה על ההזמנה
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="עדיין לא שלחתם הזמנות"
            description="כשתשלחו הזמנה היא תופיע כאן, עם מספר סימוכין ומעקב אחרי הסטטוס."
            actionLabel="לכל החולצות"
            actionTo="/catalog"
            secondaryLabel="בקשת חולצה שאין באתר"
            secondaryTo="/request-shirt"
          />
        )}
      </section>
    </div>
  );
}
