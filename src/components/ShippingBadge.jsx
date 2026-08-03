import React from 'react';
import { Zap, Truck } from 'lucide-react';

export function hasLocalStock(shirt) {
  const sizes = shirt?.local_stock_sizes;
  if (!sizes || typeof sizes !== 'object') return false;
  return Object.values(sizes).some(q => Number(q) > 0);
}

export function hasLocalStockForSize(shirt, size) {
  if (!size) return hasLocalStock(shirt);
  const sizes = shirt?.local_stock_sizes;
  return !!(sizes && Number(sizes[size]) > 0);
}

export function getShippingInfo(shirt, size) {
  if (hasLocalStockForSize(shirt, size)) {
    return { type: 'local', label: 'מלאי בארץ', eta: 'הגעה עד שבוע או איסוף עצמי מקריית אונו', color: '#1B2A4A', Icon: Truck };
  }
  return { type: 'fast', label: 'משלוח מהיר', eta: 'הגעה עד 3 שבועות', color: '#E8622A', Icon: Zap };
}

export default function ShippingBadge({ shirt, size, compact }) {
  const info = getShippingInfo(shirt, size);
  const { Icon, label, eta, color } = info;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 px-1.5 py-0.5" style={{ background: color, color: 'white' }}>
        <Icon className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="text-[9px] font-heading font-bold uppercase tracking-wide leading-none">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: color, color: 'white', border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}>
      <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-heading font-bold uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-[11px] leading-tight opacity-90 font-body">{eta}</p>
      </div>
    </div>
  );
}