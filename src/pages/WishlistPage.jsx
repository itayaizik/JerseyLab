import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Trash2, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShirtCard from '@/components/ShirtCard';
import ShirtCardSkeleton from '@/components/ui/ShirtCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Breadcrumb from '@/components/shop/Breadcrumb';
import { toast } from '@/components/ui/use-toast';
import { t } from '@/lib/i18n';

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
    if (!window.confirm(t(`להסיר את כל ${shirts.length} החולצות מהמועדפים?`, `Remove all ${shirts.length} shirts from your wishlist?`))) return;
    const items = await base44.entities.Wishlist.filter({ user_id: user.id });
    await Promise.all(items.map(i => base44.entities.Wishlist.delete(i.id).catch(() => {})));
    setShirts([]);
    toast({ title: t('המועדפים נוקו', 'Wishlist cleared') });
  };

  const toggleWishlist = async (shirtId) => {
    const items = await base44.entities.Wishlist.filter({ user_id: user.id, shirt_id: shirtId });
    if (items[0]) await base44.entities.Wishlist.delete(items[0].id);
    setShirts(p => p.filter(s => s.id !== shirtId));
    toast({ title: t('הוסרה מהמועדפים', 'Removed from your wishlist') });
  };

  return (
    <div className="shop-container py-8 lg:py-12">
      <Breadcrumb trail={[{ label: t('מועדפים', 'Wishlist') }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="shop-title">{t('המועדפים שלי', 'My wishlist')}</h1>
          <p className="mt-2 text-[15px] text-brand-navy/55">
            {loading
              ? t('טוען…', 'Loading…')
              : shirts.length > 0 ? t(`${shirts.length} חולצות שמורות`, `${shirts.length} saved shirts`) : t('עדיין ריק', 'Empty for now')}
          </p>
        </div>

        {!loading && !error && shirts.length > 0 && (
          <div className="flex items-center gap-2">
            <Link to="/catalog" className="shop-btn-secondary">{t('להמשיך לחפש', 'Keep browsing')}</Link>
            <button type="button" onClick={clearAll} className="inline-flex min-h-[3.25rem] items-center gap-1.5 rounded-2xl px-4 text-[15px] font-medium text-brand-navy/60 transition hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('ניקוי הכל', 'Clear all')}
            </button>
          </div>
        )}
      </div>

      {/* Nothing is bought on the site, so say what the heart actually does. */}
      {!loading && !error && shirts.length > 0 && (
        <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-brand-mist px-4 py-3 text-[13px] leading-relaxed text-brand-navy/65">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {t('המועדפים נשמרים לחשבון שלכם בלבד. כדי להזמין, היכנסו לחולצה והוסיפו אותה לסל.', 'Your wishlist is saved to your account only. To order, open a shirt and add it to your cart.')}
        </p>
      )}

      <div className="mt-6">
        {error ? (
          <EmptyState
            icon={Heart}
            title={t('לא הצלחנו לטעון את המועדפים', "We couldn't load your wishlist")}
            description={t('בדקו את החיבור לאינטרנט ונסו שוב.', 'Check your internet connection and try again.')}
            actionLabel={t('לנסות שוב', 'Try again')}
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
            title={t('אין חולצות במועדפים', 'No shirts in your wishlist')}
            description={t('לחצו על הלב בחולצה שאהבתם והיא תישמר כאן, כדי לחזור אליה מתי שתרצו.', 'Tap the heart on a shirt you like and it will be saved here, to come back to whenever you want.')}
            actionLabel={t('לכל החולצות', 'All shirts')}
            actionTo="/catalog"
            secondaryLabel={t('בקשת חולצה שאין באתר', "Request a shirt we don't have")}
            secondaryTo="/request-shirt"
          />
        )}
      </div>
    </div>
  );
}
