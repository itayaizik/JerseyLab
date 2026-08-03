import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS = {
  'זמינות': '#E8622A',
  'שמורות': '#F59E0B',
  'נמכרות': '#FF3B30',
  'מוסתרות': '#8E8E8E',
};

export function StatusPieChart({ stats }) {
  const data = [
    { name: 'זמינות', value: stats.available },
    { name: 'שמורות', value: stats.reserved },
    { name: 'נמכרות', value: stats.sold },
    { name: 'מוסתרות', value: stats.hidden },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 4, color: '#fff' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopViewedBarChart({ shirts }) {
  const data = [...shirts]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 6)
    .map((s) => ({
      name: s.name?.length > 14 ? s.name.slice(0, 14) + '…' : s.name,
      צפיות: s.views_count || 0,
    }));

  if (data.every((d) => d.צפיות === 0)) {
    return <p className="text-sm text-varnish text-center py-8">אין נתוני צפיות עדיין</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" tick={{ fill: '#8E8E8E', fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#8E8E8E', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 4, color: '#fff' }} cursor={{ fill: 'rgba(232,98,42,0.1)' }} />
        <Bar dataKey="צפיות" fill="#E8622A" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}