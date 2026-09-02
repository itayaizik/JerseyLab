import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MessageCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { StatusPieChart, TopViewedBarChart } from '@/components/admin/DashboardCharts';
import { formatDate } from '@/lib/dates';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [newRequests, setNewRequests] = useState([]);
  const [shirtsData, setShirtsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [shirts, requests, logs, searches, pendingReviews] = await Promise.all([
        base44.entities.Shirt.list('-created_date', 500),
        base44.entities.InterestRequest.filter({ status: 'new' }, '-created_date', 10),
        base44.entities.AdminLog.list('-created_date', 10),
        base44.entities.SearchLog.list('-created_date', 100),
        base44.entities.Review.filter({ approved: false }, '-created_date', 10),
      ]);

      setShirtsData(shirts);

      const available = shirts.filter(s => s.status === 'available').length;
      const reserved = shirts.filter(s => s.status === 'reserved').length;
      const sold = shirts.filter(s => s.status === 'sold').length;
      const hidden = shirts.filter(s => s.status === 'hidden').length;

      // Low stock
      const lowStock = shirts.filter(s => {
        if (!s.sizes) return false;
        const total = Object.values(s.sizes).reduce((a, b) => a + b, 0);
        return total > 0 && total <= 2 && s.status === 'available';
      });

      // Most viewed
      const mostViewed = [...shirts].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);

      // Search term frequency
      const termCounts = {};
      searches.forEach(s => {
        const t = s.search_term?.toLowerCase();
        if (t) termCounts[t] = (termCounts[t] || 0) + 1;
      });
      const topTerms = Object.entries(termCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

      setStats({ total: shirts.length, available, reserved, sold, hidden, lowStock, mostViewed, pendingReviews: pendingReviews.length });
      setNewRequests(requests);
      setRecentLogs(logs);
      setTopSearches(topTerms);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;
  }

  const statCards = [
    { label: 'סה"כ חולצות', value: stats.total, color: 'border-white/20' },
    { label: 'זמינות', value: stats.available, color: 'border-turf' },
    { label: 'שמורות', value: stats.reserved, color: 'border-amber-400' },
    { label: 'נמכרו', value: stats.sold, color: 'border-redcard' },
    { label: 'מוסתרות', value: stats.hidden, color: 'border-varnish' },
    { label: 'בקשות חדשות', value: newRequests.length, color: 'border-turf' },
    { label: 'ביקורות ממתינות', value: stats.pendingReviews, color: 'border-amber-400' },
  ];

  return (
    <div>
      <h1 className="font-heading font-black text-2xl mb-6 text-turf">דשבורד מנהל</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map(s => (
          <div key={s.label} className={`border-r-2 ${s.color} bg-white/5 p-4`}>
            <p className="font-mono font-bold text-2xl text-chalk">{s.value}</p>
            <p className="text-xs text-varnish">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <div className="border border-white/10 bg-white/5 p-4">
          <h2 className="font-heading font-bold text-sm text-turf mb-4">פילוח סטטוס חולצות</h2>
          <StatusPieChart stats={stats} />
        </div>

        {/* Top Viewed Chart */}
        <div className="border border-white/10 bg-white/5 p-4">
          <h2 className="font-heading font-bold text-sm text-turf mb-4">חולצות — מובילות צפיות</h2>
          <TopViewedBarChart shirts={shirtsData} />
        </div>

        {/* New Requests */}
        <div className="border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-sm text-turf flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              בקשות חדשות
            </h2>
            <Link to="/admin/requests" className="text-xs text-varnish hover:text-chalk">הצג הכל ←</Link>
          </div>
          {newRequests.length > 0 ? (
            <div className="space-y-2">
              {newRequests.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.full_name}</p>
                    <p className="text-xs text-varnish">{r.shirt_name} • {r.wanted_size || '—'}</p>
                  </div>
                  <span className="text-xs bg-turf text-pitch px-2 py-1 font-bold">חדש</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-varnish py-4 text-center">אין בקשות חדשות</p>
          )}
        </div>

        {/* Most Viewed */}
        <div className="border border-white/10 bg-white/5 p-4">
          <h2 className="font-heading font-bold text-sm text-turf flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4" />
            הנצפות ביותר
          </h2>
          <div className="space-y-2">
            {stats.mostViewed.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-varnish font-mono w-5">{i + 1}.</span>
                  <Link to={`/shirt/${s.id}`} className="text-sm hover:text-turf transition-colors">{s.name}</Link>
                </div>
                <span className="text-xs text-varnish font-mono">{s.views_count || 0} צפיות</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        {stats.lowStock.length > 0 && (
          <div className="border border-amber-500/30 bg-amber-500/5 p-4">
            <h2 className="font-heading font-bold text-sm text-amber-400 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" />
              מלאי נמוך
            </h2>
            <div className="space-y-2">
              {stats.lowStock.map(s => (
                <Link key={s.id} to={`/admin/edit-shirt/${s.id}`} className="flex items-center justify-between py-2 border-b border-amber-500/10 last:border-0 hover:text-turf transition-colors">
                  <span className="text-sm">{s.name}</span>
                  <span className="text-xs text-amber-400 font-mono">
                    {Object.values(s.sizes).reduce((a, b) => a + b, 0)} יח'
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top Searches */}
        {topSearches.length > 0 && (
          <div className="border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-sm text-turf flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                חיפושים פופולריים
              </h2>
              <Link to="/admin/search-analytics" className="text-xs text-varnish hover:text-turf transition-colors font-heading uppercase">כל האנליטיקות ←</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {topSearches.map(([term, count]) => (
                <span key={term} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5">
                  {term} <span className="text-varnish">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <h2 className="font-heading font-bold text-sm text-turf flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              פעילות אחרונה
            </h2>
            <div className="space-y-2">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-varnish font-mono">
                    {formatDate(log.created_date)}
                  </span>
                  <span className="text-sm">{log.action} — {log.details || log.entity_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}