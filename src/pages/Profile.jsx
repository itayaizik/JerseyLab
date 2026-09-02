import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, MessageCircle, LogOut, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductImage from '@/components/ui/ProductImage';
import { WHATSAPP_URL, INSTAGRAM_URL } from '@/lib/contact';
import { formatDate } from '@/lib/dates';

// An order moves through these three states; the badge alone did not tell a
// customer whether anything was still going to happen.
const STATUS_STEPS = ['נשלחה', 'יצרנו קשר', 'הושלמה'];
const STATUS_STEP = { new: 0, contacted: 1, closed: 2 };
const STATUS_STYLE = {
  new: 'bg-[#E8622A] text-white',
  contacted: 'bg-[#FFD95A] text-[#1B2A4A]',
  closed: 'bg-white text-[#1B2A4A]',
};

// Short, readable handle for an order — what a customer quotes to us in chat.
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
      } catch (err) {
        if (!navigator.onLine) { setError(true); }
        else { navigate('/login'); }
      }
      setLoading(false);
    }
    load();
  }, []);

  // Items from the same cart checkout share an order_id — group them so a
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

  const statusLabels = { new: 'חדשה', contacted: 'נוצר קשר', closed: 'הושלמה' };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="font-heading font-bold text-xl text-[#1B2A4A] mb-2 uppercase">לא הצלחנו לטעון את הפרופיל</p>
          <p className="text-sm text-[#1B2A4A]/50 font-body mb-4">בדוק את החיבור לאינטרנט ונסה שוב</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#E8622A] text-white text-sm font-bold font-heading uppercase hover:bg-[#D0551F] transition-colors">נסה שוב</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-varnish border-t-turf rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-varnish text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  const newRequests = requests.filter(r => r.status === 'new').length;

  return (
    <div className="bg-[#F2ECD9] min-h-screen">
      {/* Hero */}
      <section style={{ background: '#E8DFC8' }} className="border-b-2 border-[#1B2A4A]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-turf to-pitch flex items-center justify-center font-heading font-black text-2xl text-chalk border-2 border-[#1B2A4A]">
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="font-heading font-black text-2xl text-[#1B2A4A]">{user?.full_name || 'משתמש'}</h1>
                <p className="text-sm text-varnish font-body">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#1B2A4A] text-[#1B2A4A] font-heading font-bold text-sm hover:bg-[#F2ECD9] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              style={{ boxShadow: '2px 2px 0 #1B2A4A' }}
            >
              <LogOut className="w-4 h-4" />
              התנתקות
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/wishlist" 
            className="bg-white border-2 border-[#1B2A4A] p-5 hover:border-turf hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-varnish text-xs font-heading uppercase tracking-wide mb-2">מועדפים</p>
                <p className="font-heading font-black text-3xl text-turf">{wishlistCount}</p>
              </div>
              <Heart className="w-6 h-6 text-redcard group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link
            to="#requests"
            className="bg-white border-2 border-[#1B2A4A] p-5 hover:border-turf hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-varnish text-xs font-heading uppercase tracking-wide mb-2">בקשות התעניינות</p>
                <p className="font-heading font-black text-3xl text-[#1B2A4A]">{requests.length}</p>
              </div>
              <MessageCircle className="w-6 h-6 text-[#1B2A4A] group-hover:scale-110 transition-transform" />
            </div>
            {newRequests > 0 && (
              <div className="mt-3 inline-block bg-[#E8622A] text-white text-xs px-2 py-1 font-bold rounded-full">
                {newRequests} חדשה
              </div>
            )}
          </Link>

          <Link 
            to="/catalog" 
            className="bg-white border-2 border-[#1B2A4A] p-5 hover:border-turf hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-varnish text-xs font-heading uppercase tracking-wide mb-2">מחפש עוד?</p>
                <p className="font-heading font-bold text-sm text-[#1B2A4A]">גלה חולצות</p>
              </div>
              <Package className="w-6 h-6 text-turf group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Requests Section */}
      <div className="max-w-5xl mx-auto px-6 pb-12" id="requests">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-black text-2xl text-[#1B2A4A] uppercase tracking-wide">הבקשות שלי</h2>
          {requestGroups.length > 0 && (
            <span className="text-xs font-heading text-varnish uppercase">סה"כ {requestGroups.length}</span>
          )}
        </div>

        {requestGroups.length > 0 ? (
          <div className="space-y-5">
            {requestGroups.map(group => {
              const first = group[0];
              const step = STATUS_STEP[first.status] ?? 0;
              const ref = orderRef(first);
              const channel = first.contact_channel === 'instagram' ? 'instagram' : 'whatsapp';
              const askUrl = channel === 'instagram'
                ? INSTAGRAM_URL
                : `${WHATSAPP_URL}?text=${encodeURIComponent(`היי, לגבי הזמנה ${ref}`)}`;

              return (
              <div
                key={first.order_id || first.id}
                className="bg-white border-2 border-[#1B2A4A]"
                style={{ boxShadow: '4px 4px 0 #1B2A4A' }}
              >
                {/* Order header — the reference number is what a customer
                    actually needs when they message us about this order. */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#1B2A4A]">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[#FFD95A] font-bold tracking-wider">{ref}</p>
                    <p className="text-[11px] text-white/60 font-body mt-0.5">
                      {formatDate(first.created_date, 'ללא תאריך')}
                      {group.length > 1 && ` · ${group.length} פריטים`}
                    </p>
                  </div>
                  <span className={`${STATUS_STYLE[first.status] || 'bg-white text-[#1B2A4A]'} text-[11px] px-2.5 py-1 font-heading font-bold uppercase tracking-wide flex-shrink-0`}>
                    {statusLabels[first.status] || first.status}
                  </span>
                </div>

                {/* Where the order stands. Without this the status word alone
                    left people unsure whether anything happens next. */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b-2 border-[#1B2A4A]/10">
                  {STATUS_STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-4 h-4 flex-shrink-0 flex items-center justify-center font-mono text-[9px] font-bold ${i <= step ? 'bg-[#E8622A] text-white' : 'bg-[#1B2A4A]/10 text-[#1B2A4A]/40'}`}>
                          {i < step ? '✓' : i + 1}
                        </span>
                        <span className={`text-[10px] font-heading uppercase tracking-wide truncate ${i <= step ? 'text-[#1B2A4A]' : 'text-[#1B2A4A]/35'}`}>
                          {label}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <span className={`flex-1 h-0.5 ${i < step ? 'bg-[#E8622A]' : 'bg-[#1B2A4A]/10'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {group.map(r => {
                    const shirt = shirtsById[r.shirt_id];
                    // A mystery box has no catalogue page to link to, so the
                    // row stays plain text rather than pointing at a 404.
                    const Thumb = shirt ? Link : 'div';
                    const thumbProps = shirt ? { to: `/shirt/${r.shirt_id}` } : {};
                    return (
                      <div key={r.id} className="flex gap-3 items-start pb-3 border-b border-[#1B2A4A]/10 last:border-b-0 last:pb-0">
                        <Thumb {...thumbProps} className="w-16 h-16 flex-shrink-0 bg-[#F2ECD9] border-2 border-[#1B2A4A] overflow-hidden">
                          <ProductImage src={shirt?.main_image} alt="" className="w-full h-full object-cover" />
                        </Thumb>
                        <div className="flex-1 min-w-0">
                          <Thumb {...thumbProps}
                            className={`font-heading font-black text-sm text-[#1B2A4A] uppercase line-clamp-2 ${shirt ? 'hover:text-[#E8622A] transition-colors' : ''}`}
                          >
                            {r.shirt_name || 'חולצה'}
                          </Thumb>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {r.wanted_size && (
                              <span className="text-[11px] font-mono font-bold text-[#1B2A4A] bg-[#F2ECD9] border border-[#1B2A4A]/20 px-1.5 py-0.5">
                                {r.wanted_size}
                              </span>
                            )}
                            {r.message?.includes('גרסת שחקן') && (
                              <span className="text-[11px] font-body font-bold text-[#E8622A] bg-[#E8622A]/10 border border-[#E8622A]/30 px-1.5 py-0.5">
                                גרסת שחקן
                              </span>
                            )}
                          </div>
                        </div>
                        {shirt && (
                          <span className="font-mono text-sm font-bold text-[#1B2A4A] flex-shrink-0">
                            ₪{shirt.sale_price || shirt.price}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {first.message && !first.message.includes('סל קניות') && (
                  <div className="mx-4 mb-4 bg-[#F2ECD9] border-r-2 border-[#E8622A] p-3">
                    <p className="text-[10px] text-[#1B2A4A]/50 uppercase font-heading tracking-wider mb-1">הערה שצירפת</p>
                    <p className="text-sm text-[#1B2A4A] font-body">{first.message}</p>
                  </div>
                )}

                {/* Nothing is paid on the site, so the only real next action is
                    to talk to us — make it one tap, with the order already
                    named in the message. */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t-2 border-[#1B2A4A]/10 bg-[#F2ECD9]/60">
                  <p className="text-[11px] text-[#1B2A4A]/60 font-body">
                    {first.status === 'closed' ? 'ההזמנה הושלמה.' : `נחזור אליך ב${channel === 'instagram' ? 'אינסטגרם' : 'וואטסאפ'}.`}
                  </p>
                  <a href={askUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#1B2A4A] text-white px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide hover:bg-[#E8622A] transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    שאל על ההזמנה
                  </a>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-[#1B2A4A]/30 rounded-lg p-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#1B2A4A]/20" />
            <p className="text-varnish text-sm mb-4 font-body">עדיין לא שלחת בקשות התעניינות</p>
            <Link 
              to="/catalog" 
              className="inline-flex items-center gap-2 bg-[#E8622A] text-white px-6 py-3 font-heading font-bold text-sm uppercase hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              style={{ boxShadow: '2px 2px 0 #1B2A4A', textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}
            >
              <Package className="w-4 h-4" />
              לקטלוג
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}