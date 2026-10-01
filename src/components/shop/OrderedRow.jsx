import React, { useState, useEffect } from 'react';
import { shirtPath } from '@/lib/shirtSlug';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
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
// `items` are `{ id, href, label, image }`. One item is one row. Several are
// one row too: an order of five listed in full is taller than the screenshot
// it belongs to, and it pushes every card in the row out of line. So a
// multi-item order collapses to a single card with the others stacked behind
// it - the shape says "there are more" without spending the height saying it -
// and opens the full list when tapped.

export default function OrderedRow({ items, className = '' }) {
  const shown = (items || []).filter(item => item && item.label);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!shown.length) return null;

  // The common case: one thing bought, one row, nothing to open.
  if (shown.length === 1) {
    return <div className={className}><ItemRow item={shown[0]} label={t('ההזמנה', 'Ordered')} /></div>;
  }

  const first = shown[0];


  return (
    <div className={`relative pb-2 ${className}`}>
      {/* The cards behind. Inset from the sides and nudged down, so the front
          card reads as the top of a pile rather than as a box with a shadow.
          Two of them at most: a third adds nothing the count does not say. */}
      {shown.length > 2 && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 inset-y-0 translate-y-[7px] rounded-2xl border border-brand-line bg-brand-mist/60" />
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-2.5 inset-y-0 translate-y-[3.5px] rounded-2xl border border-brand-line bg-brand-mist/80" />

      <button type="button" onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="relative flex w-full items-center gap-2.5 rounded-2xl bg-brand-mist p-2 text-start transition hover:bg-brand-mist-dark">
        <Thumb image={first.image} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-navy/45">
            {t(`ההזמנה · ${shown.length} פריטים`, `Ordered · ${shown.length} items`)}
          </span>
          {/* The first shirt's name, and nothing after it: a "+4 more" tacked
              on the end is the part that gets truncated away, and the count
              above has already said it. */}
          <span className="block truncate text-[13px] font-semibold text-brand-navy">{first.label}</span>
        </span>
        <ChevronLeft className="h-4 w-4 flex-shrink-0 text-brand-navy/40 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
      </button>

      {open && createPortal(
        <div role="dialog" aria-modal="true" aria-label={t('הפריטים בהזמנה', 'The items in this order')}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-brand-navy-dark/70 p-4 sm:items-center">
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-lift">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-bold text-brand-navy">
                {t(`ההזמנה · ${shown.length} פריטים`, `Ordered · ${shown.length} items`)}
              </h3>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('סגירה', 'Close')}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-mist text-brand-navy transition hover:bg-brand-orange hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto">
              {shown.map(item => (
                <ItemRow key={item.id || item.label} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// A thumbnail box. Relative because ProductImage lays a skeleton at inset-0
// behind the picture, and it needs this wrapper to sit against or it escapes
// to the page.
function Thumb({ image }) {
  return (
    <span className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-white">
      {image && <ProductImage src={image} alt="" sizes="44px" className="h-full w-full object-cover" />}
    </span>
  );
}

// One item. An item with nowhere to go is still worth naming: a customer who
// typed what they bought rather than picking it from the catalogue said
// something true, and dropping it for want of a link would throw away the only
// answer we have.
function ItemRow({ item, label, onNavigate }) {
  const inner = (
    <>
      <Thumb image={item.image} />
      <span className="min-w-0 flex-1 text-start">
        {label && (
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-navy/45">{label}</span>
        )}
        <span className="block truncate text-[13px] font-semibold text-brand-navy">{item.label}</span>
      </span>
      {item.href && <ChevronLeft className="h-4 w-4 flex-shrink-0 text-brand-navy/40 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />}
    </>
  );

  if (!item.href) {
    return <div className="flex items-center gap-2.5 rounded-2xl bg-brand-mist p-2">{inner}</div>;
  }
  return (
    <Link to={item.href} onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-2xl bg-brand-mist p-2 transition hover:bg-brand-mist-dark">
      {inner}
    </Link>
  );
}

// The items for a review: the one shirt it is about, or the mystery box,
// which has no product page of its own beyond the page that sells it, or -
// when neither - whatever the customer typed into "what did you order", which
// is the only thing an open review has to go on.
export function reviewItems(review, shirts) {
  const id = review?.shirt_id;
  const typed = (review?.title || '').trim();
  if (!id) return typed ? [{ id: `typed-${review.id}`, href: '', label: typed, image: '' }] : [];
  if (id === MYSTERY_BOX_ID) return [{ id, href: '/mystery-box', label: t('מיסטרי בוקס', 'Mystery box'), image: '' }];
  const shirt = shirts[id];
  if (shirt) return [{ id, href: shirtPath(shirt), label: shirt.name, image: shirt.main_image }];
  return typed ? [{ id: `typed-${review.id}`, href: '', label: typed, image: '' }] : [];
}

// The items for a conversation screenshot: whatever the admin attached to it,
// in the order they listed them.
export function proofItems(proof, shirts) {
  return (proof?.shirt_ids || [])
    .map(id => shirts[id])
    .filter(Boolean)
    .map(shirt => ({ id: shirt.id, href: shirtPath(shirt), label: shirt.name, image: shirt.main_image }));
}
