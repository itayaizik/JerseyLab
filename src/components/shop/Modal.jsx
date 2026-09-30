import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { t } from '@/lib/i18n';

// A panel over the page, for a job that deserves the whole screen.
//
// Some flows are too big to sit inline next to everything else - the group
// link, with its code, its progress bar and its share buttons, crowded out the
// order it belongs to. Here they get a page of their own without actually
// leaving the page, so nothing half-built is lost on the way back.
//
// On a phone it fills the screen; on a wider one it is a centred card.

export default function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Hold the page still behind the panel, so a scroll here does not scroll it.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div onClick={onClose}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-brand-navy-dark/60 sm:items-center sm:p-4">
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        onClick={e => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-lift outline-none sm:max-w-lg sm:rounded-3xl">
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-brand-line px-4 py-3.5">
          <h2 className="min-w-0 flex-1 truncate text-[17px] font-bold text-brand-navy">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('סגירה', 'Close')}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-brand-navy/50 transition hover:bg-brand-mist hover:text-brand-navy">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
