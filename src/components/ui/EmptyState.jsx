import React from 'react';
import { Link } from 'react-router-dom';

// Unified empty-state component: icon + title + short description + CTA.
// Matches the site's design language (navy/orange, Oswald headings, bracket shadow).
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  compact = false,
  bordered = false,
  className = '',
}) {
  return (
    <div
      className={`text-center ${
        bordered
          ? 'bg-white border-2 border-dashed border-[#1B2A4A]/30 rounded-lg p-12'
          : compact
          ? 'py-8 px-4'
          : 'py-16 px-4'
      } ${className}`}
    >
      {Icon && (
        <div
          className={`inline-flex items-center justify-center ${
            compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'
          } text-[#1B2A4A]/25`}
        >
          <Icon className={compact ? 'w-9 h-9' : 'w-14 h-14'} strokeWidth={1.5} />
        </div>
      )}
      <h3
        className={`font-heading font-bold ${
          compact ? 'text-base' : 'text-xl'
        } text-[#1B2A4A] uppercase mb-2`}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#1B2A4A]/50 font-body mb-6 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 bg-[#E8622A] text-white px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-[#E8622A] text-white px-6 py-3 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}