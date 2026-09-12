import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import TagBadge from '@/components/ui/TagBadge';
import QuickAddModal from '@/components/QuickAddModal';
import ShippingBadge, { hasLocalStock } from '@/components/ShippingBadge';
import ProductImage from '@/components/ui/ProductImage';
import { shirtSizes, isSizeAvailable } from '@/lib/sizes';

function ShirtCard({ shirt, isWishlisted, onToggleWishlist, user, eager = false }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const conditionLabel = { new: 'חדש', like_new: 'כמו חדש', used: 'משומש' };
  const displayTags = [];
  if (shirt.is_rare) displayTags.push('נדיר');
  if (shirt.is_retro) displayTags.push('רטרו');
  if (shirt.is_new) displayTags.push('חדש');
  if (shirt.limited_stock) displayTags.push('מלאי מוגבל');
  if (shirt.sale_price && shirt.sale_price < shirt.price) displayTags.push('סייל');

  // The sizes this shirt actually comes in and can be ordered in right now.
  // This used to be a fixed XS-3XL row on every card, so an Israeli league
  // shirt that does not come in XS still advertised it, and a shirt with no
  // sizes at all showed seven. Labels come from lib/sizes, so a card never says
  // XXL where the rest of the site says 2XL.
  const displayedSizes = shirtSizes(shirt).filter(size => isSizeAvailable(shirt, size));

  return (
    <div className="relative bg-white flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-200" style={{ boxShadow: '3px 3px 0px var(--brand-navy)', border: '2px solid var(--brand-navy)' }}>
      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <StatusBadge status={shirt.status} />
      </div>

      {/* Wishlist - larger touch target on mobile */}
      {user && onToggleWishlist && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(shirt.id); }}
          className="absolute top-2 left-2 z-10 w-9 h-9 flex items-center justify-center bg-white border-2 border-brand-navy hover:bg-brand-orange hover:border-brand-orange hover:scale-110 active:bg-brand-orange active:border-brand-orange transition-all duration-200"
          aria-label="הוסף למועדפים"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-brand-orange text-brand-orange' : 'text-brand-navy'}`} />
        </button>
      )}

      <Link to={`/shirt/${shirt.id}`} className="flex-1">
        {/* Image */}
        <div className="bg-brand-cream p-2 pb-0">
          <div className="aspect-square overflow-hidden bg-white relative">
            <ProductImage
              src={shirt.main_image}
              alt={shirt.name}
              eager={eager}
              className="w-full h-full object-cover transition-transform duration-300"
            />
          </div>
        </div>

        {/* Info - fixed-height rows so every card aligns */}
        <div className="p-2.5 flex flex-col flex-1 gap-1">
          {/* Tags + shipping - reserved area */}
          <div className="min-h-[1.25rem] flex gap-1 flex-wrap items-center">
            {displayTags.map(t => <TagBadge key={t} tag={t} />)}
            {hasLocalStock(shirt) && <ShippingBadge shirt={shirt} compact />}
          </div>

          {/* Title - fixed 2-line height */}
          <h3 className="font-heading font-bold text-xs md:text-sm text-brand-navy leading-tight line-clamp-2 uppercase tracking-wide min-h-[2.5rem]">{shirt.name}</h3>

          {/* Subtitle - fixed 1-line height (always rendered) */}
          <p className="text-[11px] text-gray-500 font-body truncate min-h-[1rem]">{shirt.club || shirt.national_team}{shirt.season ? ` • ${shirt.season}` : ''}</p>

          {/* Player - fixed 1-line height (always rendered) */}
          <p className="text-[11px] text-brand-orange font-medium font-body truncate min-h-[1rem]">{shirt.player_name || '\u00A0'}</p>

          {/* Price + sizes - pushed to bottom */}
          <div className="mt-auto pt-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {shirt.sale_price && shirt.sale_price < shirt.price ? (
                  <>
                    <span className="font-mono font-bold text-brand-orange text-sm">₪{shirt.sale_price}</span>
                    <span className="font-mono text-gray-400 line-through text-[10px]">₪{shirt.price}</span>
                  </>
                ) : (
                  <span className="font-mono font-bold text-brand-navy text-sm">₪{shirt.price}</span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 uppercase font-body hidden sm:inline">{conditionLabel[shirt.condition] || shirt.condition}</span>
            </div>

            <div className="flex gap-1 flex-wrap">
              {displayedSizes.map(size => (
                <span key={size} className="text-[9px] px-1 py-0.5 border border-brand-navy text-brand-navy bg-white font-mono">
                  {size}
                </span>
              ))}
              {/* A literal "+4" used to follow this row on every card. It
                  counted nothing. */}
            </div>
          </div>
        </div>
      </Link>

      {/* Action buttons - always visible */}
      {shirt.status === 'available' && (
        <div className="grid grid-cols-2 gap-0 transition-opacity duration-200">
          <Link
            to={`/shirt/${shirt.id}?interest=true`}
            className="block bg-brand-navy text-white text-center py-3 text-xs font-bold font-heading uppercase tracking-wider hover:bg-brand-navy-light hover:brightness-110 active:bg-brand-navy-light transition-all duration-150"
          >
            מעוניין
          </Link>
          <button
            onClick={(e) => { e.preventDefault(); setQuickAddOpen(true); }}
            className="flex items-center justify-center gap-1 bg-brand-orange text-white py-3 text-xs font-bold font-heading uppercase tracking-wider hover:bg-brand-orange-dark hover:brightness-110 active:bg-brand-orange-dark transition-all duration-150"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            לסל
          </button>
        </div>
      )}

      <QuickAddModal shirt={shirt} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

export default memo(ShirtCard);