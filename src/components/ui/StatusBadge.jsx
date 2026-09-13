import React from 'react';

const statusConfig = {
  available: { label: 'זמין', className: 'bg-emerald-50 text-emerald-700' },
  reserved: { label: 'שמור', className: 'bg-amber-100 text-amber-900' },
  sold: { label: 'נמכר', className: 'bg-brand-navy text-white' },
  hidden: { label: 'מוסתר', className: 'bg-brand-navy/50 text-white' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || statusConfig.available;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold leading-none ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
