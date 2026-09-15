import React, { useState, useEffect } from 'react';
import ProductImage, { IMAGE_SIZES } from '@/components/ui/ProductImage';
import { t } from '@/lib/i18n';
import { shirtName } from '@/lib/english';

// The product photos: one large image that zooms under the pointer, and a row
// of thumbnails when there is more than one photo. Most shirts have a single
// photo, so the thumbnails only appear when they have something to switch to.

export default function ProductGallery({ shirt, images, overlay }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  useEffect(() => { setSelected(0); setZoomed(false); }, [shirt?.id]);

  const current = images[selected] || images[0];

  return (
    <div>
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          aria-label={zoomed ? t('הקטנת התמונה', 'Zoom out') : t('הגדלת התמונה', 'Zoom in')}
          aria-pressed={zoomed}
          className={`relative aspect-square overflow-hidden rounded-[1.75rem] bg-brand-mist ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => { setZoomed(z => !z); setOrigin('50% 50%'); }}
          onMouseMove={(e) => {
            if (!zoomed) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`);
          }}
          onMouseLeave={() => setOrigin('50% 50%')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoomed(z => !z); } }}
        >
          <ProductImage
            eager
            sizes={IMAGE_SIZES.hero}
            src={current}
            alt={shirtName(shirt)}
            className={`h-full w-full object-cover transition-transform duration-300 ${zoomed ? 'scale-[1.8]' : ''}`}
            style={{ transformOrigin: origin }}
          />
        </div>
        {overlay}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => { setSelected(i); setZoomed(false); }}
              aria-label={t(`תמונה ${i + 1} מתוך ${images.length}`, `Photo ${i + 1} of ${images.length}`)}
              aria-pressed={i === selected}
              className={`relative aspect-square overflow-hidden rounded-2xl bg-brand-mist transition ${i === selected ? 'ring-2 ring-brand-orange ring-offset-2' : 'opacity-75 hover:opacity-100'}`}
            >
              <ProductImage src={img} alt="" sizes="140px" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
