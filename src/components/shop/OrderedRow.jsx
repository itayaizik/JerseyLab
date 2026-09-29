import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import ProductImage from '@/components/ui/ProductImage';
import { t } from '@/lib/i18n';
import { MYSTERY_BOX_ID } from '@/lib/mysteryBox';

// What the customer bought, under a review or a conversation screenshot.
//
// A review and a WhatsApp screenshot say the same thing from two directions -
// someone bought here and was happy - and both are worth far more with the
// shirt attached: it turns a nice sentence into a way into the catalogue.
// One component so the two never drift apart.
//
// `items` are `{ id, href, label, image }`. An order of several shirts shows
// them all, stacked, because "he ordered three" is itself the point.

export default function OrderedRow({ items, className = '' }) {
  const shown = (items || []).filter(item => item && item.href && item.label);
  if (!shown.length) return null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {shown.map((item, i) => (
        <Link key={item.id || item.href} to={item.href}
          className="flex items-center gap-2.5 rounded-2xl bg-brand-mist p-2 transition hover:bg-brand-mist-dark">
          {/* Relative: ProductImage lays a skeleton at inset-0 behind the
              picture, and it needs this wrapper to sit against or it escapes
              to the page. */}
          <span className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-white">
            {item.image && <ProductImage src={item.image} alt="" sizes="44px" className="h-full w-full object-cover" />}
          </span>
          <span className="min-w-0 flex-1 text-start">
            {/* The label above the first one only: repeating "ההזמנה" down a
                list of three shirts reads as three separate orders. */}
            {i === 0 && (
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-navy/45">
                {shown.length > 1 ? t(`ההזמנה · ${shown.length} פריטים`, `Ordered · ${shown.length} items`) : t('ההזמנה', 'Ordered')}
              </span>
            )}
            <span className="block truncate text-[13px] font-semibold text-brand-navy">{item.label}</span>
          </span>
          <ChevronLeft className="h-4 w-4 flex-shrink-0 text-brand-navy/40 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

// The items for a review: the one shirt it is about, or the mystery box,
// which has no product page of its own beyond the page that sells it.
export function reviewItems(review, shirts) {
  const id = review?.shirt_id;
  if (!id) return [];
  if (id === MYSTERY_BOX_ID) return [{ id, href: '/mystery-box', label: t('מיסטרי בוקס', 'Mystery box'), image: '' }];
  const shirt = shirts[id];
  return shirt ? [{ id, href: `/shirt/${id}`, label: shirt.name, image: shirt.main_image }] : [];
}

// The items for a conversation screenshot: whatever the admin attached to it,
// in the order they listed them.
export function proofItems(proof, shirts) {
  return (proof?.shirt_ids || [])
    .map(id => shirts[id])
    .filter(Boolean)
    .map(shirt => ({ id: shirt.id, href: `/shirt/${shirt.id}`, label: shirt.name, image: shirt.main_image }));
}
