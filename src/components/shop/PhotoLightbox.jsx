import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { t } from '@/lib/i18n';
import { resized } from '@/lib/imageUrl';

// A photo at its full size, over the page.
//
// Every place a customer's photo appears on the site shows it cropped to a
// tidy rectangle, which is the right call for a row of cards and the wrong one
// for the photo itself: a shirt laid out on a bed loses its sleeves to a 220px
// box. So the crop stays, and the whole picture is one tap away.
//
// `photo` is `{ image, caption }`, or null when nothing is open.

export default function PhotoLightbox({ photo, onClose }) {
  useEffect(() => {
    if (!photo) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [photo, onClose]);

  if (!photo) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t('תמונה מוגדלת', 'Enlarged photo')}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex cursor-zoom-out items-center justify-center bg-brand-navy-dark/85 p-4">
      <button type="button" onClick={onClose} aria-label={t('סגירה', 'Close')}
        className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-navy shadow-lift transition hover:bg-brand-orange hover:text-white">
        <X className="h-5 w-5" />
      </button>
      <figure className="flex max-h-full flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        <img src={resized(photo.image, 1280)} alt={photo.caption || ''}
          className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
        {photo.caption && (
          <figcaption className="max-w-lg text-center text-sm text-white/85">{photo.caption}</figcaption>
        )}
      </figure>
    </div>,
    document.body,
  );
}
