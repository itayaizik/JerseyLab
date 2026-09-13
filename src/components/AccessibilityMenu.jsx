import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Accessibility, X, RotateCcw, Contrast, Palette, Link2, Heading, Type, AlignJustify, Pause, MousePointer2,
} from 'lucide-react';
import { loadPrefs, savePrefs, applyPrefs, isDefault, DEFAULT_PREFS } from '@/lib/accessibilityPrefs';

// The accessibility menu: a tab on the left edge of every shop page that opens
// a panel of display adjustments. It is an addition to the site's own
// accessibility (semantic markup, keyboard use, contrast, alt text), not a
// replacement for it - the statement at /legal/accessibility says as much.
//
// The tab sits half way down the edge so it never covers the product page's
// sticky bar at the bottom or the notices, and it is not shown in the admin.

const TEXT_LABELS = ['רגיל', 'גדול', 'גדול מאוד'];

const OPTIONS = [
  { key: 'contrast', label: 'ניגודיות גבוהה', icon: Contrast },
  { key: 'grayscale', label: 'גווני אפור', icon: Palette },
  { key: 'links', label: 'הדגשת קישורים', icon: Link2 },
  { key: 'headings', label: 'הדגשת כותרות', icon: Heading },
  { key: 'readableFont', label: 'גופן קריא', icon: Type },
  { key: 'spacing', label: 'ריווח טקסט', icon: AlignJustify },
  { key: 'noMotion', label: 'עצירת אנימציות', icon: Pause },
  { key: 'bigCursor', label: 'סמן גדול', icon: MousePointer2 },
];

export default function AccessibilityMenu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    applyPrefs(prefs);
    savePrefs(prefs);
  }, [prefs]);

  // Moving to another page closes the panel; the choices stay.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.querySelector('button')?.focus();
    const close = (returnFocus) => {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(true); };
    const onPointer = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  if (pathname.startsWith('/admin')) return null;

  const set = (key, value) => setPrefs(p => ({ ...p, [key]: value }));
  const changed = !isDefault(prefs);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="תפריט נגישות"
        title="תפריט נגישות"
        className="fixed end-0 top-1/2 z-[90] flex h-12 w-11 -translate-y-1/2 items-center justify-center rounded-s-2xl bg-brand-navy text-white shadow-float transition-[width,background-color] hover:w-12 hover:bg-brand-navy-light focus-visible:w-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange"
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
        {changed && <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-orange" aria-hidden="true" />}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="a11y-title"
          dir="rtl"
          className="fixed end-3 top-1/2 z-[95] max-h-[88vh] w-[min(22rem,calc(100vw-1.5rem))] -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 text-brand-navy shadow-lift ring-1 ring-brand-line"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="a11y-title" className="flex items-center gap-2 text-lg font-semibold">
              <Accessibility className="h-5 w-5 text-brand-orange-ink" aria-hidden="true" />
              תפריט נגישות
            </h2>
            <button type="button" onClick={() => { setOpen(false); buttonRef.current?.focus(); }} aria-label="סגירת תפריט הנגישות"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-navy/55 transition hover:bg-brand-mist hover:text-brand-navy">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div role="group" aria-labelledby="a11y-text-label" className="mt-4">
            <p id="a11y-text-label" className="mb-2 text-sm font-medium text-brand-navy/70">גודל טקסט</p>
            <div className="grid grid-cols-3 gap-2">
              {TEXT_LABELS.map((label, step) => (
                <button key={label} type="button" aria-pressed={prefs.text === step} onClick={() => set('text', step)}
                  className={`rounded-xl border px-2 py-2.5 font-medium transition ${prefs.text === step ? 'border-brand-orange bg-brand-orange-soft text-brand-navy' : 'border-brand-line text-brand-navy/75 hover:border-brand-navy/30'}`}
                  style={{ fontSize: `${13 + step * 2}px` }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {OPTIONS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" aria-pressed={!!prefs[key]} onClick={() => set(key, !prefs[key])}
                className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-[13px] font-medium transition ${prefs[key] ? 'border-brand-orange bg-brand-orange-soft text-brand-navy' : 'border-brand-line text-brand-navy/75 hover:border-brand-navy/30'}`}>
                <Icon className={`h-5 w-5 ${prefs[key] ? 'text-brand-orange-ink' : ''}`} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-line pt-4">
            <button type="button" onClick={() => setPrefs({ ...DEFAULT_PREFS })} disabled={!changed}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-navy transition hover:bg-brand-mist disabled:opacity-40">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              איפוס
            </button>
            <Link to="/legal/accessibility" className="shop-link text-sm">הצהרת נגישות</Link>
          </div>
          <p className="mt-2 text-xs text-brand-navy/50">ההגדרות נשמרות בדפדפן הזה.</p>
        </div>
      )}
    </>
  );
}
