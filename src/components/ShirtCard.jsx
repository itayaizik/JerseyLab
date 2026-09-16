import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import QuickAddModal from '@/components/QuickAddModal';
import { showsLocalStock } from '@/components/ShippingBadge';
import ProductImage, { IMAGE_SIZES } from '@/components/ui/ProductImage';
import { shirtSizes, isSizeAvailable } from '@/lib/sizes';
import { shirtBasePrice } from '@/lib/cart';
import { t } from '@/lib/i18n';
import { shirtName } from '@/lib/english';

// One badge at most, the one that matters most. A card carrying "חדש", "רטרו"
// and a shipping label at once says nothing louder than any of them alone,
// and nearly every shirt is new, so that one is not a badge at all.
function cardBadge(shirt) {
  if (shirt.status === 'sold') return { label: t('נמכר', 'Sold'), className: 'bg-brand-navy text-white' };
  if (shirt.status === 'reserved') return { label: t('שמור', 'Reserved'), className: 'bg-amber-100 text-amber-900' };
  if (shirt.sale_price && shirt.sale_price < shirt.price) return { label: t('סייל', 'Sale'), className: 'bg-red-600 text-white' };
  if (showsLocalStock(shirt)) return { label: t('במלאי בארץ', 'In stock in Israel'), className: 'bg-brand-gold text-brand-navy' };
  if (shirt.limited_stock) return { label: t('מלאי מוגבל', 'Limited stock'), className: 'bg-white text-red-700' };
  if (shirt.is_retro) return { label: t('רטרו', 'Retro'), className: 'bg-white text-brand-navy' };
  if (shirt.is_rare) return { label: t('נדיר', 'Rare'), className: 'bg-white text-brand-navy' };
  return null;
}

// The sizes a shirt can be ordered in right now, as a range. Labels come from
// lib/sizes, so a card never says XXL where the rest of the site says 2XL.
function sizeRange(shirt) {
  const sizes = shirtSizes(shirt).filter(size => isSizeAvailable(shirt, size));
  if (!sizes.length) return '';
  return sizes.length === 1 ? sizes[0] : `${sizes[0]}–${sizes[sizes.length - 1]}`;
}

// The whole card is one link, stretched from the title over the card, so the
// wishlist and quick-add buttons can sit on top of it without nesting a button
// inside a link - which is invalid markup and unpredictable to press.
function ShirtCard({ shirt, isWishlisted, onToggleWishlist, user, eager = false, featured = false }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const badge = cardBadge(shirt);
  const price = shirtBasePrice(shirt);
  const onSale = shirt.sale_price && shirt.sale_price < shirt.price;
  const local = showsLocalStock(shirt);
  const range = sizeRange(shirt);
  const name = shirtName(shirt);

  return (
    <article className={`group relative flex h-full flex-col rounded-3xl bg-white shadow-card transition-shadow duration-300 hover:shadow-lift ${featured ? 'p-3 sm:p-4' : 'p-2.5 sm:p-3'}`}>
      <div className="relative aspect-square overflow-hidden rounded-[1.125rem] bg-brand-mist">
        <ProductImage
          src={shirt.main_image}
          alt=""
          eager={eager}
          sizes={featured ? IMAGE_SIZES.featured : IMAGE_SIZES.card}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />

        {badge && (
          <span className={`absolute start-3 top-3 z-10 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.className}`}>
            {badge.label}
          </span>
        )}

        {user && onToggleWishlist && (
          <button
            type="button"
            onClick={() => onToggleWishlist(shirt.id)}
            aria-label={isWishlisted
              ? t(`הסרת ${name} מהמועדפים`, `Remove ${name} from your wishlist`)
              : t(`הוספת ${name} למועדפים`, `Add ${name} to your wishlist`)}
            aria-pressed={!!isWishlisted}
            className="absolute end-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brand-navy shadow-sm backdrop-blur transition hover:scale-105"
          >
            <Heart className={`h-[1.1rem] w-[1.1rem] ${isWishlisted ? 'fill-brand-orange text-brand-orange' : ''}`} />
          </button>
        )}

        {shirt.status === 'available' && (
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            aria-label={t(`הוספה מהירה לסל: ${name}`, `Quick add to cart: ${name}`)}
            className="absolute bottom-3 end-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-navy shadow-card transition hover:bg-brand-orange hover:text-white focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className={`flex flex-1 flex-col px-1.5 sm:px-2 ${featured ? 'pb-2 pt-5 sm:pt-6' : 'pb-1.5 pt-4'}`}>
        <h3 className={`font-semibold leading-snug tracking-[-0.01em] text-brand-navy ${featured ? 'line-clamp-2 text-lg sm:text-2xl' : 'line-clamp-2 min-h-[2.75em] text-[15px] sm:text-base'}`}>
          <Link
            to={`/shirt/${shirt.id}`}
            className="before:absolute before:inset-0 before:rounded-3xl before:content-[''] focus-visible:!outline-none focus-visible:before:ring-2 focus-visible:before:ring-brand-orange"
          >
            {name}
          </Link>
        </h3>

        <div className="mt-auto">
          <div className="my-3 h-px bg-brand-line" />
          <p className="flex items-baseline gap-2">
            <span className={`font-semibold tabular-nums text-brand-navy ${featured ? 'text-lg' : 'text-[15px] sm:text-base'}`}>₪{price}</span>
            {onSale && <span className="text-sm tabular-nums text-brand-navy/40 line-through">₪{shirt.price}</span>}
          </p>
          <p className={`mt-1 truncate text-[13px] ${local ? 'font-medium text-emerald-700' : 'text-brand-navy/50'}`}>
            {local
              ? t('במלאי בארץ · מגיעה עד שבוע', 'In stock in Israel · arrives within a week')
              : range ? <>{t('מידות', 'Sizes')} <span dir="ltr">{range}</span></> : ' '}
          </p>
        </div>
      </div>

      <QuickAddModal shirt={shirt} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </article>
  );
}

export default memo(ShirtCard);
