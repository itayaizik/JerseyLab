import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Seo from '@/components/Seo';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname;

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    }
  });

  return (
    <div className="shop-container flex min-h-[65vh] items-center justify-center py-16">
      {/* Reached by client-side navigation, a 404 was keeping the previous
          page's title and canonical - so a URL that does not exist claimed
          to be a real page. `noindex` also keeps mistyped URLs out of the
          index entirely. */}
      <Seo
        title="הדף לא נמצא - JerseyLab"
        description="הדף שחיפשת לא קיים באתר JerseyLab."
        canonicalPath={location.pathname}
        noindex
      />
      <div className="w-full max-w-lg rounded-[2rem] bg-brand-mist px-6 py-14 text-center sm:px-10">
        <p className="text-7xl font-bold tracking-tight text-brand-orange-ink">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-brand-navy">הדף לא נמצא</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-navy/60">
          הדף <span dir="ltr" className="font-medium text-brand-navy">{pageName}</span> לא קיים באתר. אולי הקישור שגוי, או שהחולצה כבר לא זמינה.
        </p>

        {isFetched && authData?.isAuthenticated && authData.user?.role === 'admin' && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-start">
            <p className="text-sm font-semibold text-brand-navy">הערה למנהל</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-navy/60">ייתכן שהדף עדיין לא מומש.</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="shop-btn">לדף הבית</Link>
          <Link to="/catalog" className="shop-btn-secondary">לכל החולצות</Link>
        </div>
      </div>
    </div>
  );
}
