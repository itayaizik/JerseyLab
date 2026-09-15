import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Accessibility, X, RotateCcw, Contrast, Link2, ALargeSmall, MoveHorizontal, Pause, ImageOff, BookOpenText,
  MousePointer2, MessageSquareText, UnfoldVertical, AlignJustify, Droplet, Heading, EyeOff, PanelLeft, PanelRight,
} from 'lucide-react';
import {
  loadPrefs, savePrefs, applyPrefs, pageIsDefault, resetPage, LEVELS, A11Y_HIDDEN_KEY, OPEN_A11Y_EVENT,
} from '@/lib/accessibilityPrefs';
import { t, isEn } from '@/lib/i18n';

// The accessibility menu: a tab at the edge of every shop page that opens a
// panel of display adjustments. It is an addition to the site's own
// accessibility (semantic markup, keyboard use, contrast, alt text), not a
// replacement for it - the statement at /legal/accessibility says as much.
//
// Tiles with levels step through them on each press and back to off. The
// reading guide, the reading mask and the descriptions follow the pointer, so
// they are drawn here; everything else is CSS on <html>.
//
// Opens from the tab, from Ctrl+U, and from the footer link, so hiding the tab
// never leaves a visitor without a way back in.

const TILES = [
  { key: 'contrast', label: t('ניגודיות', 'Contrast'), icon: Contrast },
  { key: 'links', label: t('הדגשת קישורים', 'Highlight links'), icon: Link2 },
  { key: 'text', label: t('טקסט גדול', 'Bigger text'), icon: ALargeSmall },
  { key: 'spacing', label: t('ריווח טקסט', 'Text spacing'), icon: MoveHorizontal },
  { key: 'noMotion', label: t('ביטול הנפשות', 'Stop animations'), icon: Pause },
  { key: 'hideImages', label: t('הסתרת תמונות', 'Hide images'), icon: ImageOff },
  { key: 'dyslexia', label: t('תמיכה בדיסלקציה', 'Dyslexia friendly'), icon: BookOpenText },
  { key: 'cursor', label: t('סמן', 'Cursor'), icon: MousePointer2 },
  { key: 'tooltips', label: t('תיאורים', 'Tooltips'), icon: MessageSquareText },
  { key: 'lineHeight', label: t('גובה שורה', 'Line height'), icon: UnfoldVertical },
  { key: 'align', label: t('יישור טקסט', 'Text align'), icon: AlignJustify },
  { key: 'saturation', label: t('רוויה', 'Saturation'), icon: Droplet },
  { key: 'headings', label: t('הדגשת כותרות', 'Highlight headings'), icon: Heading },
];

function readHidden() {
  try { return sessionStorage.getItem(A11Y_HIDDEN_KEY) === '1'; } catch { return false; }
}

// The text a screen reader would announce for the element under the pointer or
// focus: its label, its title, or an image's alt text.
function describe(target) {
  const el = target?.closest?.('[aria-label], [title], img[alt]');
  if (!el || el.closest('#a11y-panel')) return null;
  const text = (el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt') || '').trim();
  return text ? { el, text } : null;
}

function Tile({ tile, prefs, onPress, big }) {
  const { key, label, icon: Icon } = tile;
  const levels = LEVELS[key];
  const value = prefs[key];
  const active = levels ? value > 0 : !!value;
  const caption = levels && active ? levels[value - 1] : label;

  return (
    <button type="button" onClick={onPress} aria-pressed={active}
      aria-label={levels ? `${label}: ${active ? levels[value - 1] : t('כבוי', 'off')}` : label}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center font-medium transition ${big ? 'min-h-[6.5rem] text-[15px]' : 'min-h-[5.25rem] text-[13px]'} ${active ? 'border-brand-orange bg-brand-orange-soft text-brand-navy' : 'border-brand-line text-brand-navy/75 hover:border-brand-navy/30'}`}>
      <Icon className={`${big ? 'h-7 w-7' : 'h-5 w-5'} ${active ? 'text-brand-orange-ink' : ''}`} aria-hidden="true" />
      <span className="leading-tight">{caption}</span>
      {levels && (
        <span className="flex gap-1" aria-hidden="true">
          {levels.map((_, i) => (
            <span key={i} className={`h-1 w-4 rounded-full ${i < value ? 'bg-brand-orange' : 'bg-brand-line'}`} />
          ))}
        </span>
      )}
    </button>
  );
}

export default function AccessibilityMenu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [hidden, setHidden] = useState(readHidden);
  const [pointer, setPointer] = useState(null); // { x, y } for the reading guide and mask
  const [tip, setTip] = useState(null); // { text, x, y }
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    applyPrefs(prefs);
    savePrefs(prefs);
  }, [prefs]);

  // Moving to another page closes the panel; the choices stay.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Ctrl+U and the footer link open the menu from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_A11Y_EVENT, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_A11Y_EVENT, onOpen);
    };
  }, []);

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

  // Reading guide (cursor level 2) and reading mask (level 3) follow the pointer.
  const followPointer = prefs.cursor >= 2;
  useEffect(() => {
    if (!followPointer) { setPointer(null); return undefined; }
    const onMove = (e) => setPointer({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [followPointer]);

  // Descriptions: the label of whatever is under the pointer or has focus.
  useEffect(() => {
    if (!prefs.tooltips) { setTip(null); return undefined; }
    const onOver = (e) => {
      const found = describe(e.target);
      setTip(found ? { text: found.text, x: e.clientX, y: e.clientY } : null);
    };
    const onFocus = (e) => {
      const found = describe(e.target);
      if (!found) { setTip(null); return; }
      const r = found.el.getBoundingClientRect();
      setTip({ text: found.text, x: r.left + r.width / 2, y: r.bottom });
    };
    const onLeave = () => setTip(null);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [prefs.tooltips]);

  if (pathname.startsWith('/admin')) return null;

  const set = (key, value) => setPrefs(p => ({ ...p, [key]: value }));
  const press = (key) => setPrefs(p => {
    const levels = LEVELS[key];
    return { ...p, [key]: levels ? (p[key] + 1) % (levels.length + 1) : !p[key] };
  });
  const changed = !pageIsDefault(prefs);
  const onLeft = prefs.side === 'left';
  const big = prefs.bigWidget;

  const hideTab = () => {
    try { sessionStorage.setItem(A11Y_HIDDEN_KEY, '1'); } catch { /* the tab simply stays */ }
    setHidden(true);
    setOpen(false);
  };
  const showTab = () => {
    try { sessionStorage.removeItem(A11Y_HIDDEN_KEY); } catch { /* nothing to undo */ }
    setHidden(false);
  };

  // The side is a physical one - the visitor chose left or right - so it is
  // written as left and right rather than start and end, which swap with the
  // language.
  const edge = onLeft ? 'left-0 rounded-r-2xl' : 'right-0 rounded-l-2xl';
  const panelEdge = onLeft ? 'left-3' : 'right-3';
  const dir = isEn ? 'ltr' : 'rtl';

  return (
    <>
      {!hidden && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="a11y-panel"
          aria-label={t('תפריט נגישות (Ctrl+U)', 'Accessibility menu (Ctrl+U)')}
          title={t('תפריט נגישות (Ctrl+U)', 'Accessibility menu (Ctrl+U)')}
          className={`fixed top-1/2 z-[90] flex h-12 w-11 -translate-y-1/2 items-center justify-center bg-brand-navy text-white shadow-float transition-[width,background-color] hover:w-12 hover:bg-brand-navy-light focus-visible:w-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange ${edge}`}
        >
          <Accessibility className="h-6 w-6" aria-hidden="true" />
          {changed && <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-orange" aria-hidden="true" />}
        </button>
      )}

      {/* Reading guide: a bar under the line being read. */}
      {prefs.cursor === 2 && pointer && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 z-[88] h-2.5 rounded-full bg-brand-orange/70 shadow-float"
          style={{ top: pointer.y + 12 }} />
      )}

      {/* Reading mask: everything dimmed except a band around the pointer. */}
      {prefs.cursor === 3 && pointer && (
        <>
          <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[88] bg-brand-navy-dark/60" style={{ height: Math.max(pointer.y - 55, 0) }} />
          <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-[88] bg-brand-navy-dark/60" style={{ top: pointer.y + 55 }} />
        </>
      )}

      {/* Descriptions. */}
      {prefs.tooltips && tip && (
        <div role="tooltip" dir={dir}
          className="pointer-events-none fixed z-[96] max-w-[16rem] -translate-x-1/2 rounded-xl bg-brand-navy-dark px-3 py-2 text-sm font-medium text-white shadow-lift"
          style={{ left: Math.min(Math.max(tip.x, 140), window.innerWidth - 140), top: Math.min(tip.y + 18, window.innerHeight - 60) }}>
          {tip.text}
        </div>
      )}

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="a11y-title"
          dir={dir}
          className={`fixed top-1/2 z-[95] max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 text-brand-navy shadow-lift ring-1 ring-brand-line ${panelEdge} ${big ? 'w-[min(30rem,calc(100vw-1.5rem))]' : 'w-[min(23rem,calc(100vw-1.5rem))]'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="a11y-title" className={`flex items-center gap-2 font-semibold ${big ? 'text-xl' : 'text-lg'}`}>
              <Accessibility className="h-5 w-5 text-brand-orange-ink" aria-hidden="true" />
              {t('תפריט נגישות', 'Accessibility menu')}
              <span className="text-xs font-normal text-brand-navy/50" dir="ltr">(Ctrl+U)</span>
            </h2>
            <button type="button" onClick={() => { setOpen(false); buttonRef.current?.focus(); }} aria-label={t('סגירת תפריט הנגישות', 'Close the accessibility menu')}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-navy/55 transition hover:bg-brand-mist hover:text-brand-navy">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-brand-mist px-4 py-3">
            <span className="text-sm font-medium">{t('יישומון גדול', 'Large menu')}</span>
            <input type="checkbox" role="switch" checked={big} onChange={e => set('bigWidget', e.target.checked)}
              className="h-5 w-5 accent-brand-orange" />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {TILES.map(tile => (
              <Tile key={tile.key} tile={tile} prefs={prefs} big={big} onPress={() => press(tile.key)} />
            ))}
          </div>

          <button type="button" onClick={() => setPrefs(p => resetPage(p))} disabled={!changed}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-light disabled:opacity-40">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('איפוס כל הגדרות הנגישות', 'Reset all accessibility settings')}
          </button>

          <div className="mt-4 border-t border-brand-line pt-4">
            <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('מיקום הכפתור', 'Button position')}</p>
            <div className="grid grid-cols-3 gap-2 text-[13px]">
              <button type="button" aria-pressed={onLeft} onClick={() => set('side', 'left')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 font-medium ${onLeft ? 'border-brand-orange bg-brand-orange-soft' : 'border-brand-line text-brand-navy/75'}`}>
                <PanelLeft className="h-4 w-4" aria-hidden="true" /> {t('שמאל', 'Left')}
              </button>
              <button type="button" aria-pressed={!onLeft} onClick={() => set('side', 'right')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 font-medium ${!onLeft ? 'border-brand-orange bg-brand-orange-soft' : 'border-brand-line text-brand-navy/75'}`}>
                <PanelRight className="h-4 w-4" aria-hidden="true" /> {t('ימין', 'Right')}
              </button>
              {hidden ? (
                <button type="button" onClick={showTab}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-orange bg-brand-orange-soft px-2 py-2 font-medium">
                  <Accessibility className="h-4 w-4" aria-hidden="true" /> {t('הצגה', 'Show')}
                </button>
              ) : (
                <button type="button" onClick={hideTab}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-line px-2 py-2 font-medium text-brand-navy/75">
                  <EyeOff className="h-4 w-4" aria-hidden="true" /> {t('הסתרה', 'Hide')}
                </button>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-brand-navy/50">
              {t('הסתרה מסתירה את הכפתור עד שתסגרו את הדפדפן. אפשר לפתוח את התפריט תמיד ב-Ctrl+U או מהקישור בתחתית העמוד.',
                'Hiding removes the button until you close the browser. You can always open the menu with Ctrl+U or from the link at the bottom of the page.')}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-line pt-4">
            <Link to="/legal/accessibility" className="shop-link text-sm">{t('הצהרת נגישות', 'Accessibility statement')}</Link>
            <p className="text-xs text-brand-navy/50">{t('ההגדרות נשמרות בדפדפן הזה.', 'Settings are saved in this browser.')}</p>
          </div>
        </div>
      )}
    </>
  );
}
