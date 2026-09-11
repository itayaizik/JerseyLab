import React from 'react';
import { Link } from 'react-router-dom';

// The one empty state for the whole site.
//
// Every screen that could be empty had grown its own version: the cart, the
// wishlist and the account each rendered a bare white box with a line of grey
// text, which reads as something failing to load rather than as a place that is
// simply empty yet. They now share this, so an empty wishlist looks as
// deliberate as a full one.
//
// The shape follows the rest of the site — a bordered card with the offset
// shadow, an icon in a solid tile, and one clear next action, because an empty
// state with no way out is a dead end.

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
  // Kept for the callers that passed it; the card treatment is now the default,
  // so this no longer changes anything.
  bordered = false, // eslint-disable-line no-unused-vars
  className = '',
  tone = 'light',
}) {
  const dark = tone === 'dark';

  return (
    <div
      className={`text-center border-2 ${
        dark ? 'bg-[#1B2A4A] border-[#1B2A4A]' : 'bg-white border-[#1B2A4A]'
      } ${compact ? 'px-5 py-8' : 'px-6 py-12'} ${className}`}
      style={{ boxShadow: dark ? '4px 4px 0 #E8622A' : '4px 4px 0 #1B2A4A' }}
    >
      {Icon && (
        <div
          className={`inline-flex items-center justify-center mb-4 ${compact ? 'w-12 h-12' : 'w-14 h-14'} ${
            dark ? 'bg-[#E8622A]' : 'bg-[#F2ECD9] border-2 border-[#1B2A4A]'
          }`}
        >
          <Icon
            className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} ${dark ? 'text-white' : 'text-[#1B2A4A]'}`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>
      )}

      <h3
        className={`font-heading font-black uppercase ${compact ? 'text-base' : 'text-xl'} ${
          dark ? 'text-white' : 'text-[#1B2A4A]'
        } mb-2`}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`font-body text-sm max-w-sm mx-auto leading-relaxed ${
            dark ? 'text-white/70' : 'text-[#1B2A4A]/60'
          }`}
        >
          {description}
        </p>
      )}

      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          {actionLabel && actionTo && (
            <Link to={actionTo} className={primaryClass(dark)} style={primaryShadow(dark)}>
              {actionLabel}
            </Link>
          )}
          {actionLabel && onAction && !actionTo && (
            <button type="button" onClick={onAction} className={primaryClass(dark)} style={primaryShadow(dark)}>
              {actionLabel}
            </button>
          )}
          {secondaryLabel && secondaryTo && (
            <Link
              to={secondaryTo}
              className={`inline-flex items-center justify-center min-h-[44px] px-5 font-heading font-bold text-sm uppercase tracking-wide border-2 transition-colors ${
                dark
                  ? 'border-white/30 text-white hover:bg-white hover:text-[#1B2A4A]'
                  : 'border-[#1B2A4A]/30 text-[#1B2A4A] hover:border-[#1B2A4A] hover:bg-[#F2ECD9]'
              }`}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function primaryClass(dark) {
  return `inline-flex items-center justify-center gap-2 min-h-[44px] px-6 font-heading font-bold text-sm uppercase tracking-wide transition-colors ${
    dark ? 'bg-[#FFD95A] text-[#1B2A4A] hover:bg-white' : 'bg-[#E8622A] text-white hover:bg-[#D0551F]'
  }`;
}

function primaryShadow(dark) {
  return { boxShadow: dark ? '3px 3px 0 rgba(0,0,0,0.25)' : '3px 3px 0 #1B2A4A' };
}
