import React from 'react';
import { Link } from 'react-router-dom';

// The one empty state for the whole site.
//
// Every screen that could be empty had grown its own version: the cart, the
// wishlist and the account each rendered a bare white box with a line of grey
// text, which reads as something failing to load rather than as a place that is
// simply empty yet. They now share this, so an empty wishlist looks as
// deliberate as a full one - and always offers one clear next action, because
// an empty state with no way out is a dead end.

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  secondaryTo,
  compact = false,
  // Kept for the callers that passed it; it no longer changes anything.
  bordered = false, // eslint-disable-line no-unused-vars
  className = '',
  tone = 'light',
}) {
  const dark = tone === 'dark';

  return (
    <div className={`rounded-3xl text-center ${dark ? 'bg-brand-navy' : 'bg-brand-mist'} ${compact ? 'px-5 py-8' : 'px-6 py-14'} ${className}`}>
      {Icon && (
        <div className={`mx-auto mb-4 flex items-center justify-center rounded-full ${compact ? 'h-12 w-12' : 'h-16 w-16'} ${dark ? 'bg-white/10' : 'bg-white shadow-card'}`}>
          <Icon
            className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} ${dark ? 'text-brand-orange' : 'text-brand-orange-ink'}`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>
      )}

      <h3 className={`mb-2 font-semibold ${compact ? 'text-lg' : 'text-2xl'} ${dark ? 'text-white' : 'text-brand-navy'}`}>
        {title}
      </h3>

      {description && (
        <p className={`mx-auto max-w-sm text-[15px] leading-relaxed ${dark ? 'text-white/70' : 'text-brand-navy/60'}`}>
          {description}
        </p>
      )}

      {(actionLabel || secondaryLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && actionTo && (
            <Link to={actionTo} className="shop-btn">{actionLabel}</Link>
          )}
          {actionLabel && onAction && !actionTo && (
            <button type="button" onClick={onAction} className="shop-btn">{actionLabel}</button>
          )}
          {secondaryLabel && secondaryTo && (
            <Link to={secondaryTo} className={dark ? 'shop-btn-secondary border-white/20 bg-transparent text-white hover:bg-white/10' : 'shop-btn-secondary'}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
