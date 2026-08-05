import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SearchAnalytics() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30); // days

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.SearchLog.list('-created_date', 1000);
    setLogs(data);
    setLoading(false);
  }

  // Filter by period
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - period);
  const filtered = logs.filter(l => new Date(l.created_date) >= cutoff);

  // Aggregate counts
  const counts = {};
  filtered.forEach(l => {
    const term = l.search_term?.trim().toLowerCase();
    if (!term) return;
    counts[term] = (counts[term] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a);

  const top = sorted.slice(0, 30);

  // Daily breakdown for last 14 days
  const dailyCounts = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
    dailyCounts[key] = 0;
  }
  filtered.forEach(l => {
    const d = new Date(l.created_date);
    const key = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
    if (key in dailyCounts) dailyCounts[key]++;
  });

  const dailyEntries = Object.entries(dailyCounts);
  const maxDay = Math.max(...dailyEntries.map(([, v]) => v), 1);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-black text-2xl text-turf">אנליטיקת חיפושים</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`text-xs px-3 py-1.5 font-bold font-heading uppercase transition-colors ${period === d ? 'bg-turf text-pitch' : 'border border-white/20 text-varnish hover:text-chalk'}`}>
              {d} ימים
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-varnish font-heading uppercase mb-1">סה"כ חיפושים</p>
          <p className="font-mono font-bold text-2xl text-chalk">{filtered.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-varnish font-heading uppercase mb-1">מונחים ייחודיים</p>
          <p className="font-mono font-bold text-2xl text-chalk">{Object.keys(counts).length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-varnish font-heading uppercase mb-1">הכי מבוקש</p>
          <p className="font-mono font-bold text-lg text-turf truncate">{top[0]?.[0] || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top searches */}
        <div className="bg-white/5 border border-white/10 p-5">
          <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-turf" /> חיפושים פופולריים
          </h2>
          {top.length === 0 ? (
            <p className="text-varnish text-sm">אין חיפושים בתקופה זו</p>
          ) : (
            <div className="space-y-2">
              {top.map(([term, count], i) => (
                <div key={term} className="flex items-center gap-3">
                  <span className="text-xs text-varnish font-mono w-5 text-left">{i + 1}</span>
                  <div className="flex-1 bg-white/5 rounded-sm overflow-hidden h-6 relative">
                    <div
                      className="absolute inset-y-0 right-0 bg-turf/30"
                      style={{ width: `${(count / (top[0]?.[1] || 1)) * 100}%` }}
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-xs text-chalk font-body">{term}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-turf w-6 text-left">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily chart */}
        <div className="bg-white/5 border border-white/10 p-5">
          <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-turf" /> חיפושים לפי יום (14 ימים אחרונים)
          </h2>
          <div className="flex items-end gap-1 h-32">
            {dailyEntries.map(([date, count]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-turf/80 rounded-sm" style={{ height: `${(count / maxDay) * 100}%`, minHeight: count > 0 ? '4px' : '0' }} />
                <span className="text-[9px] text-varnish font-mono" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '8px' }}>{date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full log */}
      <div className="mt-6 bg-white/5 border border-white/10 p-5">
        <h2 className="font-heading font-bold text-sm text-chalk uppercase mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-turf" /> לוג חיפושים אחרונים
        </h2>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filtered.slice(0, 100).map(l => (
            <div key={l.id} className="flex items-center justify-between text-sm py-1 border-b border-white/5">
              <span className="text-chalk font-body">{l.search_term}</span>
              <span className="text-varnish text-xs font-mono">{new Date(l.created_date).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-varnish text-sm">אין חיפושים בתקופה זו</p>}
        </div>
      </div>
    </div>
  );
}