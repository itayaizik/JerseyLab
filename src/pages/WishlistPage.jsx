import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Trash2, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Breadcrumb from '@/components/shop/Breadcrumb';
import { toast } from '@/components/ui/use-toast';

export default function WishlistPage() {
  const [shirts, setShirts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const wl = await base44.entities.Wishlist.filter({ user_id: me.id });
        if (wl.length) {
          const results = await Promise.all(wl.map(w => base44.entities.Shirt.get(w.shirt_id)));
          setShirts(results.filter(Boolean));
        }
      } catch {
        if (!navigator.onLine) setError(true);
        else navigate('/login');
      }
      setLoading(false);
    }
    load();
  }, []);

  const clearAll = async () => {
    if (!window.confirm(`להסיר את כל ${shirts.length} החולצות מהמועדפים?`)) return;
    const items = await base44.entities.Wishlist.filter({ user_id: user.id });
    await Promise.all(items.map(i => base44.entities.Wishlist.delete(i.id).catch(() => {})));
    setShirts([]);
    toast({ title: 'המועדפים נוקו' });
  };

  const toggleWishlist = async (shirtId) => {
    const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: shirtId });
    if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
    setShirts(p => p.filter(s => s.id !== shirtId));
    toast({ title: 'הוסרה מהמועדפים' });
  };

  return (
    <div className="shop-container py-8 lg:py-12">
      <Breadcrumb trail={[{ label: 'מועדפים' }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="shop-title">המועדפים שלי</h1>
          <p className="mt-2 text-[15px] text-brand-navy/55">
            {loading ? 'טוען…' : shirts.length > 0 ? `${shirts.length} חולצות שמורות` : 'עדיין ריק'}
          </p>
        </div>

        {!loading && !error && shirts.length > 0 && (
          <div className="flex items-center gap-2">
            <Link to="/catalog" className="shop-btn-secondary">להמשיך לחפש</Link>
            <button type="button" onClick={clearAll} className="inline-flex min-h-[3.25rem] items-center gap-1.5 rounded-2xl px-4 text-[15px] font-medium text-brand-navy/60 transition hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              ניקוי הכל
            </button>
          </div>
        )}
      </div>

      {/* Nothing is bought on the site, so say what the heart actually does. */}
      {!loading && !error && shirts.length > 0 && (
        <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-brand-mist px-4 py-3 text-[13px] leading-relaxed text-brand-navy/65">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          המועדפים נשמרים לחשבון שלכם בלבד. כדי להזמין, היכנסו לחולצה והוסיפו אותה לסל.
        </p>
      )}

      <div className="mt-6">
        {error ? (
          <EmptyState
            icon={Heart}
            title="לא הצלחנו לטעון את המועדפים"
            description="בדקו את החיבור לאינטרנט ונסו שוב."
            actionLabel="לנסות שוב"
            onAction={() => window.location.reload()}
          />
        ) : loading ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => <li key={i}><ShirtCardSkeleton /></li>)}
          </ul>
        ) : shirts.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {shirts.map(s => (
              <li key={s.id}>
                <ShirtCard shirt={s} user={user} isWishlisted onToggleWishlist={toggleWishlist} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Heart}
            title="אין חולצות במועדפים"
            description="לחצו על הלב בחולצה שאהבתם והיא תישמר כאן, כדי לחזור אליה מתי שתרצו."
            actionLabel="לכל החולצות"
            actionTo="/catalog"
            secondaryLabel="בקשת חולצה שאין באתר"
            secondaryTo="/request-shirt"
          />
        )}
      </div>
    </div>
  );
}
