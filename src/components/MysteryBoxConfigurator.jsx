import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gift, Check, ShoppingBag,
  Plus, Minus, Copy, Trash2, ChevronDown, CheckCircle2, Share2, Link2, Users, Loader2, RefreshCw, X,
} from 'lucide-react';
import { addToCart, openCart, EXTRA_PRICES, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { NAME_PRICE, PATCHES_PRICE, MYSTERY_BOX_ID, EXCLUDE_COLORS as COLORS } from '@/lib/mysteryBox';
import { newBox, newBoxId, typeOf, kidsBox, wantsShorts, wantsName, wantsLongSleeve, boxPrice, boxesTotal, boxesSaving, boxSummary, isBlank, cleanBox } from '@/lib/mysteryBoxes';
import { fetchTiers, discountFor, hasLadder, nextTier } from '@/lib/mysteryTiers';
import {
  MAX_GROUP_BOXES, loadDraft, saveDraft, createGroup, fetchGroup, closeGroup, joinLink, findGroupByCode,
} from '@/lib/mysteryGroup';
import MysteryBoxFields from '@/components/mystery/MysteryBoxFields';
import Modal from '@/components/shop/Modal';
import { t } from '@/lib/i18n';

// Building mystery boxes - one, or a whole group's worth.
//
// Friends order together, and they do not all want the same thing: one wants
// shorts, another a name on the back, a third a retro shirt. So every box is
// its own card with its own style, size and extras, and a name saying who it
// is for, which travels with the order. A box can be copied, so ten boxes that
// differ only in size take ten taps rather than ten forms.
//
// Friends can also fill in their own box. The organiser starts a group and
// sends its link; each friend gets a page with just their box
// (pages/MysteryBoxJoin), and every box they save shows up here, with a note
// saying who added it. Everything here is remembered in the browser, so a
// refresh or a closed tab loses nothing (lib/mysteryGroup).
//
// One card is open at a time; the rest collapse to a line with their choices
// and price. What to leave out - teams, colours - is asked per box rather than
// per order: friends ordering together do not share a taste.
//
// What goes into the cart stays in Hebrew, since it becomes the order the
// owner reads; the English words travel beside it (labelEn) for the cart to
// show. Each box is its own cart item.
//
// The shirt is a surprise until the box is opened, so nothing here promises to
// say what came out.

const MAX_BOXES = MAX_GROUP_BOXES;

const STEPS = [
  // A short name too: at 375px the full ones truncate to 'כמות ומ…'.
  { id: 1, label: 'כמות ומחיר', labelEn: 'Quantity', short: 'כמות', shortEn: 'Quantity' },
  { id: 2, label: 'התאמה אישית', labelEn: 'Personalise', short: 'התאמה', shortEn: 'Details' },
  { id: 3, label: 'סיכום', labelEn: 'Summary', short: 'סיכום', shortEn: 'Summary' },
];
const POLL_MS = 15000;

const boxTitle = (box, i) => box.forWhom.trim() || t(`בוקס ${i + 1}`, `Box ${i + 1}`);
const boxesLabel = (n) => (n === 1 ? t('בוקס אחד', '1 box') : t(`${n} בוקסים`, `${n} boxes`));

// Tells the organiser about a friend's box when the tab is in the background,
// if they allowed notifications when they started the group.
function notify(text) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      new Notification('JerseyLab', { body: text, icon: '/icon-192.png' });
    }
  } catch { /* some browsers only allow this from a service worker */ }
}

export default function MysteryBoxConfigurator({ idPrefix = 'mb', className = '', headerAction = null, size: scale = 'md' }) {
  const lg = scale === 'lg';

  const [draft] = useState(() => loadDraft());
  const [boxes, setBoxes] = useState(() => draft?.boxes || [newBox()]);
  const [openId, setOpenId] = useState(() => null);
  const [group, setGroup] = useState(draft?.group || null);
  const [error, setError] = useState('');
  const [missingSize, setMissingSize] = useState([]);
  // What the last press of the button put in the cart, shown until the next
  // change so it is clear the boxes went in and more can follow.
  const [lastAdded, setLastAdded] = useState(null);
  // Boxes friends added or changed since the organiser last looked.
  const [arrivals, setArrivals] = useState([]);
  // The quantity ladder, if the shop has one (lib/mysteryTiers). Until it
  // loads, and forever if there is none, every box costs what its style costs.
  const [tiers, setTiers] = useState([]);
  // Which of the three steps is on screen. The whole order lives in state the
  // whole time; a step only decides what is drawn.
  const [step, setStep] = useState(1);
  const rootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchTiers().then(rows => { if (!cancelled) setTiers(rows); });
    return () => { cancelled = true; };
  }, []);

  // Remembered on every change: a refresh brings all of it back.
  useEffect(() => {
    saveDraft({ boxes, group });
  }, [boxes, group]);

  // The first box starts open.
  const currentOpen = openId ?? boxes[0]?.id;

  // Two of these can be on the page at once, so field ids are per instance.
  const fid = (name) => `${idPrefix}-${name}`;

  const touched = () => { setLastAdded(null); setError(''); };

  const update = (id, patch) => {
    touched();
    setBoxes(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
    if (patch.size) setMissingSize(prev => prev.filter(x => x !== id));
  };

  const addBox = (copyOf) => {
    if (boxes.length >= MAX_BOXES) return;
    touched();
    const last = boxes[boxes.length - 1];
    const box = copyOf ? { ...copyOf, id: newBoxId(), remoteId: undefined, forWhom: '', note: '' } : newBox(last);
    setBoxes(prev => {
      if (!copyOf) return [...prev, box];
      const at = prev.findIndex(b => b.id === copyOf.id);
      return [...prev.slice(0, at + 1), box, ...prev.slice(at + 1)];
    });
    setOpenId(box.id);
  };

  const removeBox = (id) => {
    touched();
    setBoxes(prev => {
      if (prev.length > 1) return prev.filter(b => b.id !== id);
      return [newBox(prev[0])];
    });
    if (currentOpen === id) setOpenId(null);
  };

  // --- the group -------------------------------------------------------------

  const groupRef = useRef(group);
  groupRef.current = group;
  const [syncing, setSyncing] = useState(false);
  const [groupClosed, setGroupClosed] = useState(false);
  const syncBusy = useRef(false);

  // Brings in boxes friends saved, and changes to ones already brought in.
  // `seen` remembers each box's last version, so a box the organiser removed
  // does not come back, and an edited one is updated rather than added twice.
  const sync = useCallback(async () => {
    const g = groupRef.current;
    if (!g || syncBusy.current) return;
    syncBusy.current = true;
    setSyncing(true);
    const result = await fetchGroup(g.id);
    setSyncing(false);
    syncBusy.current = false;
    if (!result.ok) return;
    setGroupClosed(result.closed);
    const seen = { ...(g.seenVersions || {}) };
    const fresh = [];
    const changed = [];
    for (const remote of result.boxes) {
      const version = remote.updatedDate || remote.createdDate || '1';
      if (!(remote.remoteId in seen)) fresh.push(remote);
      else if (seen[remote.remoteId] !== version) changed.push(remote);
      seen[remote.remoteId] = version;
    }
    if (!fresh.length && !changed.length) return;
    // Marked at once, so a second check running alongside does not add them again.
    groupRef.current = { ...g, seenVersions: seen };

    setBoxes(prev => {
      let next = prev.map(b => {
        const c = changed.find(r => r.remoteId === b.remoteId);
        return c ? { ...cleanBox(c), id: b.id } : b;
      });
      // A blank box left at the end makes way for the friends' boxes.
      if (fresh.length && next.length && isBlank(next[next.length - 1]) && !next[next.length - 1].remoteId) {
        next = next.slice(0, -1);
      }
      return [...next, ...fresh.map(cleanBox)].slice(0, MAX_BOXES);
    });
    const lines = [
      ...fresh.map(r => t(`${r.forWhom} הוסיף/ה בוקס (${boxSummary(r)})`, `${r.forWhom} added a box (${boxSummary(r)})`)),
      ...changed.map(r => t(`${r.forWhom} עדכן/ה את הבוקס (${boxSummary(r)})`, `${r.forWhom} updated their box (${boxSummary(r)})`)),
    ];
    setArrivals(prev => [...prev, ...lines].slice(-6));
    setLastAdded(null);
    lines.forEach(notify);
    setGroup(prevGroup => (prevGroup && prevGroup.id === g.id ? { ...prevGroup, seenVersions: { ...seen } } : prevGroup));
  }, []);

  useEffect(() => {
    if (!group?.id) return undefined;
    sync();
    // Keeps checking in the background too, so a notification can say a box arrived.
    const timer = setInterval(sync, POLL_MS);
    const onVisible = () => { if (!document.hidden) sync(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [group?.id, sync]);

  const startGroup = async (ownerName, ownerPhone) => {
    // Asked here, while the organiser is pressing a button, which is when
    // browsers allow the question.
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
    } catch { /* not supported */ }
    const result = await createGroup(ownerName, ownerPhone);
    if (!result.ok) return result;
    setGroup({ id: result.id, ownerToken: result.owner_token, ownerName, code: result.code || '', seenVersions: {} });
    setGroupClosed(false);
    return result;
  };

  // Taking a group over again from its code, on a phone that never had the
  // link. The boxes themselves arrive through the usual sync.
  const resumeGroup = (found) => {
    setGroup({
      id: found.id, ownerToken: found.owner_token, ownerName: found.owner_name || '',
      code: found.code || '', seenVersions: {},
    });
    setGroupClosed(!!found.closed);
    setArrivals([]);
  };

  const endGroup = async () => {
    if (!group) return;
    if (!window.confirm(t('לסגור את הקבוצה? חברים לא יוכלו להוסיף עוד בוקסים דרך הקישור.', "Close the group? Friends won't be able to add more boxes through the link."))) return;
    await closeGroup(group);
    setGroup(null);
    setArrivals([]);
  };

  // --- adding to the cart ------------------------------------------------------

  const count = boxes.length;
  const discount = discountFor(tiers, count);
  const total = boxesTotal(boxes, discount);
  const saving = boxesSaving(boxes, discount);
  const ladder = hasLadder(tiers);
  const upsell = ladder ? nextTier(tiers, count) : null;

  // The summary is never reached with a box that has no size: it would show a
  // price for something that cannot be ordered.
  const goToStep = (next) => {
    if (next === 3) {
      const noSize = boxes.filter(b => !b.size).map(b => b.id);
      if (noSize.length) {
        setStep(2);
        setMissingSize(noSize);
        setOpenId(noSize[0]);
        setError(noSize.length === 1
          ? t('חסרה מידה לאחד הבוקסים', 'One of the boxes has no size')
          : t(`חסרה מידה ל-${noSize.length} בוקסים`, `${noSize.length} boxes have no size`));
        return;
      }
    }
    setError('');
    setStep(Math.min(3, Math.max(1, next)));
    // A new step starts at its own top rather than wherever the last one ended.
    try { window.scrollTo({ top: Math.max(0, (rootRef.current?.getBoundingClientRect().top || 0) + window.scrollY - 80), behavior: 'smooth' }); } catch { /* older browsers */ }
  };

  const handleAdd = () => {
    const noSize = boxes.filter(b => !b.size).map(b => b.id);
    if (noSize.length) {
      setMissingSize(noSize);
      setOpenId(noSize[0]);
      setError(noSize.length === 1
        ? t('חסרה מידה לאחד הבוקסים', 'One of the boxes has no size')
        : t(`חסרה מידה ל-${noSize.length} בוקסים`, `${noSize.length} boxes have no size`));
      return;
    }
    setError('');

    boxes.forEach(box => {
      const type = typeOf(box);
      const kids = kidsBox(box);
      const extras = [];
      // A kids box carries its shorts and its printing at ₪0: the packer has to
      // see them on the line, and the price must not move.
      if (wantsName(box)) extras.push({ label: 'שם ומספר מאחורה (לבחירתנו)', labelEn: 'Name and number on the back (our pick)', price: kids ? 0 : NAME_PRICE });
      if (box.patches) extras.push({ label: 'כל הפאצ\'ים', labelEn: 'All patches', price: PATCHES_PRICE });
      // The same words a catalogue shirt uses, so the supplier text reads them.
      if (wantsLongSleeve(box)) extras.push({ label: LONG_SLEEVE_LABEL, labelEn: 'Long sleeve', price: EXTRA_PRICES.longSleeve });
      if (wantsShorts(box)) extras.push({ label: `${SHORTS_LABEL} במידה ${box.size}`, labelEn: `Shorts, size ${box.size}`, price: kids ? 0 : EXTRA_PRICES.shorts });

      const details = [];
      if (box.forWhom.trim()) details.push({ label: 'עבור', labelEn: 'For', value: box.forWhom.trim() });
      if (box.note.trim()) details.push({ label: 'הערה לבוקס', labelEn: 'Note for this box', value: box.note.trim() });
      // What to leave out carries no price, but it has to reach the order or
      // asking was theatre.
      if (box.excludeClubs.trim()) details.push({ label: 'לא לשלוח קבוצות', labelEn: "Don't send teams", value: box.excludeClubs.trim() });
      if (box.excludeColors.length) {
        details.push({
          label: 'לא לשלוח צבעים', labelEn: "Don't send colours",
          value: box.excludeColors.join(', '),
          valueEn: box.excludeColors.map(c => COLORS.find(x => x.label === c)?.en || c).join(', '),
        });
      }

      addToCart({
        shirtId: MYSTERY_BOX_ID,
        shirtName: `מיסטרי בוקס — ${type.label}`,
        shirtNameEn: `Mystery Box — ${type.labelEn}`,
        size: box.size,
        basePrice: type.price,
        unitPrice: boxPrice(box, discount),
        extras,
        details,
        deliveryNote: 'מיסטרי בוקס — הפתעה עד הפתיחה',
        deliveryNoteEn: 'Mystery Box — a surprise until you open it',
      });
    });

    // A fresh start for the next round, in the style used last; the order-wide
    // preferences and the group stay, since friends may still be adding.
    const fresh = newBox(boxes[boxes.length - 1]);
    setLastAdded({ count, names: boxes.map(b => b.forWhom.trim()).filter(Boolean) });
    setArrivals([]);
    setBoxes([fresh]);
    setOpenId(fresh.id);
    setMissingSize([]);
    setStep(1);
  };

  const pad = lg ? 'px-5 sm:px-8' : 'px-5';

  return (
    <div ref={rootRef} className={`shop-card overflow-hidden ${className}`}>
      <div className={`flex items-center gap-3 pt-6 ${pad}`}>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={`font-semibold text-brand-navy ${lg ? 'text-xl' : 'text-lg'}`}>{t('בניית הבוקסים', 'Build your boxes')}</p>
          <p className="text-[13px] text-brand-navy/55">
            {t('מזמינים לכמה אנשים? לכל בוקס סגנון, מידה ותוספות משלו.', 'Ordering for a few people? Every box gets its own style, size and extras.')}
          </p>
        </div>
        {headerAction && <span className="ms-auto">{headerAction}</span>}
      </div>

      {/* Where you are, and a way back. Steps already passed are links; the one
          ahead is not, because it is reached by the button that checks the
          step you are on is finished. */}
      <nav aria-label={t('שלבי ההזמנה', 'Order steps')} className={`mt-5 ${pad}`}>
        <ol className="flex gap-1.5">
          {STEPS.map(({ id, label, labelEn, short, shortEn }) => {
            const done = step > id;
            const here = step === id;
            return (
              <li key={id} className="min-w-0 flex-1">
                <button type="button" disabled={!done && !here} onClick={() => setStep(id)}
                  aria-current={here ? 'step' : undefined}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold transition ${
                    here ? 'bg-brand-navy text-white'
                      : done ? 'bg-brand-mist text-brand-navy hover:bg-brand-mist-dark'
                        : 'bg-brand-mist/50 text-brand-navy/35'}`}>
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${
                    here ? 'bg-white/20' : done ? 'bg-brand-orange text-white' : 'bg-white/60'}`}>
                    {done ? <Check className="h-3 w-3" aria-hidden="true" /> : id}
                  </span>
                  <span className="truncate sm:hidden">{t(short, shortEn)}</span>
                  <span className="hidden truncate sm:inline">{t(label, labelEn)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* How many, before anything else - and what that quantity is worth.
          Only drawn when the shop has a ladder to show: a row of tiers that
          all take nothing off is an ornament, not an offer. */}
      {step === 1 && ladder && (
        <div className={`mt-5 ${pad}`}>
          <div className="rounded-2xl border border-brand-line bg-brand-mist/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-navy">{t('כמה בוקסים?', 'How many boxes?')}</p>
                <p className="text-[12px] text-brand-navy/55">
                  {t('ככל שיש יותר בוקסים בהזמנה, כל אחד עולה פחות.', 'The more boxes in one order, the less each one costs.')}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button type="button" onClick={() => removeBox(boxes[boxes.length - 1].id)} disabled={count <= 1}
                  aria-label={t('בוקס אחד פחות', 'One box fewer')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-white text-brand-navy transition hover:border-brand-navy/30 disabled:opacity-30">
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span aria-live="polite" className="w-10 text-center text-xl font-bold tabular-nums text-brand-navy">{count}</span>
                <button type="button" onClick={() => addBox()} disabled={count >= MAX_BOXES}
                  aria-label={t('בוקס אחד נוסף', 'One box more')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-white text-brand-navy transition hover:border-brand-navy/30 disabled:opacity-30">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <ul className="mt-3 grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-3">
              {tiers.map((tier, i) => {
                const upto = tiers[i + 1] ? tiers[i + 1].minBoxes - 1 : null;
                const here = count >= tier.minBoxes && (upto === null || count <= upto);
                return (
                  <li key={tier.minBoxes}
                    className={`rounded-xl border px-2 py-1.5 text-center transition ${
                      here ? 'border-brand-orange bg-brand-orange-soft' : 'border-brand-line bg-white'}`}>
                    <span className="block text-[11px] text-brand-navy/55">
                      {upto === null
                        ? t(`${tier.minBoxes}+ בוקסים`, `${tier.minBoxes}+ boxes`)
                        : tier.minBoxes === upto
                          ? t(`${tier.minBoxes} בוקסים`, `${tier.minBoxes} boxes`)
                          : `${tier.minBoxes}-${upto}`}
                    </span>
                    <span className={`block text-[13px] font-bold tabular-nums ${here ? 'text-brand-orange-ink' : 'text-brand-navy'}`}>
                      {tier.discount > 0 ? t(`₪${tier.discount}- לבוקס`, `₪${tier.discount} off each`) : t('מחיר מלא', 'Full price')}
                    </span>
                  </li>
                );
              })}
            </ul>

            {upsell && (
              <p className="mt-2.5 text-center text-[13px] font-medium text-brand-orange-ink">
                {t(`עוד ${upsell.boxesAway} בוקסים ותחסכו עוד ₪${upsell.extraPerBox} על כל אחד`,
                   `${upsell.boxesAway} more boxes and each one drops another ₪${upsell.extraPerBox}`)}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 1 && !ladder && (
        <div className={`mt-5 ${pad}`}>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-line bg-brand-mist/60 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-navy">{t('כמה בוקסים?', 'How many boxes?')}</p>
              <p className="text-[12px] text-brand-navy/55">{t('אפשר לשנות גם אחר כך.', 'You can change this later too.')}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button type="button" onClick={() => removeBox(boxes[boxes.length - 1].id)} disabled={count <= 1}
                aria-label={t('בוקס אחד פחות', 'One box fewer')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-white text-brand-navy transition hover:border-brand-navy/30 disabled:opacity-30">
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span aria-live="polite" className="w-10 text-center text-xl font-bold tabular-nums text-brand-navy">{count}</span>
              <button type="button" onClick={() => addBox()} disabled={count >= MAX_BOXES}
                aria-label={t('בוקס אחד נוסף', 'One box more')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-white text-brand-navy transition hover:border-brand-navy/30 disabled:opacity-30">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {arrivals.length > 0 && (
        <div role="status" className={`mt-4 ${pad}`}>
          <div className="flex items-start gap-3 rounded-2xl bg-brand-orange-soft px-4 py-3 text-[14px] leading-relaxed text-brand-navy">
            <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
            <ul className="min-w-0 flex-1 space-y-0.5">
              {arrivals.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
            <button type="button" onClick={() => setArrivals([])} aria-label={t('סגירה', 'Dismiss')}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-brand-navy/50 hover:bg-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {lastAdded && (
        <div role="status" className={`mt-4 ${pad}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              {t(`נוספו לסל ${boxesLabel(lastAdded.count)}`, `Added ${boxesLabel(lastAdded.count)} to your cart`)}
              {lastAdded.names.length > 0 && ` (${lastAdded.names.join(', ')})`}
              {t('. רוצים עוד? בנו כאן ותוסיפו.', '. Want more? Build them here and add.')}
            </span>
            <button type="button" onClick={openCart} className="font-semibold underline underline-offset-2">
              {t('לסל', 'View cart')}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
      <ol className={`space-y-2.5 py-5 ${pad}`}>
        {boxes.map((box, i) => {
          const open = box.id === currentOpen;
          const missing = missingSize.includes(box.id);
          return (
            <li key={box.id} className={`overflow-hidden rounded-2xl border transition ${open ? 'border-brand-line ring-1 ring-brand-line' : missing ? 'border-red-300' : 'border-transparent'}`}>
              {/* Collapsed line: who it is for, what it is, what it costs. */}
              <div className={`flex items-center gap-2 ${open ? 'bg-white' : 'bg-brand-mist'}`}>
                <button type="button" onClick={() => setOpenId(open ? -1 : box.id)} aria-expanded={open}
                  className="flex min-h-[3.75rem] min-w-0 flex-1 items-center gap-3 ps-4 text-start">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${open ? 'bg-brand-orange text-white' : 'bg-brand-navy text-white'}`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-brand-navy">
                      {boxTitle(box, i)}
                      {box.remoteId && (
                        <span className="rounded-full bg-brand-orange-soft px-2 py-0.5 text-[11px] font-medium text-brand-orange-ink">{t('מילא/ה בעצמו/ה', 'Filled in by them')}</span>
                      )}
                    </span>
                    <span className={`block truncate text-[12px] ${missing ? 'text-red-600' : 'text-brand-navy/55'}`}>{boxSummary(box)}</span>
                  </span>
                  <span className="flex-shrink-0 text-[15px] font-semibold tabular-nums text-brand-navy">
                    {discount > 0 && <span className="me-1.5 text-[13px] font-normal text-brand-navy/40 line-through">₪{boxPrice(box)}</span>}
                    ₪{boxPrice(box, discount)}
                  </span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-brand-navy/40 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <span className="flex flex-shrink-0 items-center pe-2">
                  <button type="button" onClick={() => addBox(box)} disabled={count >= MAX_BOXES}
                    aria-label={t(`שכפול ${boxTitle(box, i)}`, `Copy ${boxTitle(box, i)}`)} title={t('שכפול', 'Copy')}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy/55 transition hover:bg-brand-mist-dark hover:text-brand-navy disabled:opacity-30">
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {(count > 1 || !isBlank(box)) && (
                    <button type="button" onClick={() => removeBox(box.id)}
                      aria-label={t(`הסרת ${boxTitle(box, i)}`, `Remove ${boxTitle(box, i)}`)} title={t('הסרה', 'Remove')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy/55 transition hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </span>
              </div>

              {open && (
                <div className="space-y-5 bg-white px-4 pb-5 pt-2">
                  <MysteryBoxFields box={box} onChange={patch => update(box.id, patch)}
                    fid={name => fid(`${name}-${box.id}`)} missingSize={missing} />
                  <button type="button" onClick={() => setOpenId(-1)} className="shop-btn-dark min-h-[2.75rem] w-full text-sm">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t('הבוקס מוכן', 'Box done')}
                  </button>
                </div>
              )}
            </li>
          );
        })}

        <li>
          <button type="button" onClick={() => addBox()} disabled={count >= MAX_BOXES}
            className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-orange/50 text-[15px] font-semibold text-brand-orange-ink transition hover:border-brand-orange hover:bg-brand-orange-soft disabled:opacity-40">
            <Plus className="h-5 w-5" aria-hidden="true" />
            {t('הוספת בוקס לחבר', 'Add a box for a friend')}
          </button>
        </li>
      </ol>
      )}

      {/* Total */}
      {step === 3 && (
      <div className={`border-t border-brand-line bg-brand-mist/60 py-6 ${pad}`}>
        <ul className="space-y-1.5 text-sm">
          {boxes.map((box, i) => (
            <li key={box.id} className="flex items-center justify-between gap-3 text-brand-navy/70">
              <span className="min-w-0 truncate">{boxTitle(box, i)} · {boxSummary(box)}</span>
              <span className="flex-shrink-0 font-semibold tabular-nums text-brand-navy">₪{boxPrice(box, discount)}</span>
            </li>
          ))}
        </ul>

        {saving > 0 && (
          <div className="mt-3 flex items-baseline justify-between text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <span>{t(`הנחת כמות · ${boxesLabel(count)}`, `Quantity discount · ${boxesLabel(count)}`)}</span>
            <span className="tabular-nums">{t(`חסכתם ₪${saving}`, `You save ₪${saving}`)}</span>
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between border-t border-brand-line pt-3">
          <span className={`font-semibold text-brand-navy ${lg ? 'text-lg' : ''}`}>
            {t('סה״כ', 'Total')} <span className="text-sm font-normal text-brand-navy/55">({boxesLabel(count)})</span>
          </span>
          <span className={`font-bold tabular-nums text-brand-navy ${lg ? 'text-3xl' : 'text-2xl'}`}>₪{total}</span>
        </div>

        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

        <button type="button" onClick={handleAdd} className={`shop-btn mt-4 w-full ${lg ? 'min-h-[3.75rem] text-base' : ''}`}>
          <ShoppingBag className={lg ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
          {count === 1 ? t('הוספה לסל', 'Add to cart') : t(`הוספת ${count} בוקסים לסל`, `Add ${count} boxes to cart`)}
        </button>
        <p className="mt-2 text-center text-xs text-brand-navy/50">
          {t('בלי תשלום באתר, שליחת בקשה בלבד.', 'No payment on the site - you only send a request.')}
        </p>
        <button type="button" onClick={() => setStep(2)} className="mt-3 w-full text-center text-[13px] text-brand-navy/55 underline underline-offset-2 hover:text-brand-navy">
          {t('חזרה לעריכת הבוקסים', 'Back to editing the boxes')}
        </button>
      </div>
      )}

      {/* Getting from one step to the next. On the middle step the bar carries
          the running total, so the price is on screen while the choices that
          move it are being made - and the rule that holds it off the boxes
          scrolling under it. Step 1 has nothing above the bar to hold off, so
          there the rule would just be a line sitting in the open. */}
      {step < 3 && (
        <div className={`sticky bottom-0 bg-white/95 py-4 backdrop-blur ${pad} ${step === 2 ? 'border-t border-brand-line' : ''}`}>
          {step === 2 && (
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] text-brand-navy/60">
                {boxesLabel(count)}{saving > 0 && <span className="ms-1.5 font-semibold text-emerald-700 dark:text-emerald-400">{t(`· חסכתם ₪${saving}`, `· saving ₪${saving}`)}</span>}
              </span>
              <span className="text-xl font-bold tabular-nums text-brand-navy">₪{total}</span>
            </div>
          )}
          {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="shop-btn-secondary min-h-[3.25rem] flex-shrink-0 px-5 text-sm">
                {t('חזרה', 'Back')}
              </button>
            )}
            <button type="button" onClick={() => goToStep(step + 1)} className="shop-btn min-h-[3.25rem] flex-1 text-[15px]">
              {step === 1 ? t('המשך להתאמה אישית', 'Continue to personalising') : t('המשך לסיכום', 'Continue to the summary')}
            </button>
          </div>
        </div>
      )}

      {/* Ordering with friends is the alternative to carrying on alone, so it
          reads after the button that carries on alone rather than before it. */}
      {step === 1 && (
        <div className={`pb-5 pt-5 ${pad}`}>
          <GroupPanel group={group} closed={groupClosed} syncing={syncing} fid={fid}
            onStart={startGroup} onResume={resumeGroup} onRefresh={sync} onEnd={endGroup}
            filled={boxes.filter(b => b.remoteId).length} count={count} />
        </div>
      )}
    </div>
  );
}

// Coming back to a group started somewhere else. The five digits are not a
// password - they open the organiser's own view of a box he started, and the
// worst a guessed code reaches is somebody else's shirt sizes - so this asks
// for nothing but the code.
function ReturnByCode({ fid, onFound }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 5) { setError(t('צריך קוד של חמש ספרות', 'The code is five digits')); return; }
    setBusy(true);
    setError('');
    const result = await findGroupByCode(digits);
    setBusy(false);
    if (!result.ok) { setError(t('לא מצאנו קבוצה עם הקוד הזה.', "We couldn't find a group with that code.")); return; }
    onFound(result);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor={fid('group-code')} className="block text-sm font-medium text-brand-navy/70">
        {t('קוד הניהול', 'Your organiser code')}
      </label>
      <div className="flex gap-2">
        <input id={fid('group-code')} value={code} onChange={e => { setCode(e.target.value); setError(''); }}
          inputMode="numeric" maxLength={7} dir="ltr" placeholder="12345"
          className="shop-field flex-1 text-center text-lg tracking-[0.3em] tabular-nums" />
        <button type="submit" disabled={busy} className="shop-btn min-h-[3.25rem] flex-shrink-0 px-5 text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('כניסה', 'Enter')}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
// Starting a group, and once there is one, sharing its link.
//
// The card here says only where things stand; the work itself - the name, the
// code, the link, the share buttons - happens in a panel of its own. Inline it
// buried the order it was supposed to serve.
function GroupPanel({ group, closed, syncing, fid, onStart, onResume, onRefresh, onEnd, filled = 0, count = 0 }) {
  const [open, setOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  const heading = (
    <p className="flex items-center gap-2 text-[15px] font-semibold text-brand-navy">
      <Share2 className="h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
      {t('שהחברים ימלאו בעצמם', 'Let your friends fill in their own')}
    </p>
  );

  if (!group) {
    return (
      <>
        <div className="rounded-2xl border border-brand-line p-4">
          {heading}
          <p className="mt-1 text-[13px] leading-relaxed text-brand-navy/60">
            {t('שולחים לחברים קישור, כל אחד ממלא את הבוקס שלו בדף משלו, והבוקסים מופיעים כאן אצלך.',
              'Send your friends a link; each fills in their own box on a page of their own, and the boxes show up here for you.')}
          </p>
          <button type="button" onClick={() => setOpen(true)} className="shop-btn-secondary mt-3 min-h-[2.75rem] w-full text-sm">
            <Users className="h-4 w-4" aria-hidden="true" />
            {t('יצירת קישור לחברים', 'Create a link for friends')}
          </button>
          <button type="button" onClick={() => setCodeOpen(true)} className="shop-link mt-3 w-full justify-center text-[13px]">
            {t('כבר יצרתם קבוצה? כניסה עם קוד', 'Already started a group? Enter your code')}
          </button>
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title={t('קישור לחברים', 'A link for friends')}>
          <StartGroupForm fid={fid} onStart={onStart} />
        </Modal>
        <Modal open={codeOpen} onClose={() => setCodeOpen(false)} title={t('כניסה עם קוד', 'Enter your code')}>
          <ReturnByCode fid={fid} onFound={(result) => { setCodeOpen(false); onResume(result); }} />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-brand-line bg-brand-mist/50 p-4">
        {heading}
        <p className="mt-1 text-[13px] leading-relaxed text-brand-navy/65">
          {closed
            ? t('הקבוצה סגורה, אז אי אפשר להוסיף אליה עוד בוקסים.', 'The group is closed, so no more boxes can be added.')
            : filled > 0
              ? t(`${filled} מתוך ${count} מילאו את הבוקס שלהם.`, `${filled} of ${count} have filled in their box.`)
              : t('הקבוצה פתוחה. שלחו את הקישור ונחכה שימלאו.', 'The group is open. Send the link and wait for them to fill in.')}
        </p>

        {filled > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" role="presentation">
            <div className="h-full rounded-full bg-brand-orange transition-all" style={{ width: `${Math.round((filled / Math.max(count, 1)) * 100)}%` }} />
          </div>
        )}

        {/* Secondary, like its twin before a group exists: the orange button on
            this page is the one that carries the order forward, and two of them
            one above the other say neither. */}
        <button type="button" onClick={() => setOpen(true)} className="shop-btn-secondary mt-3 min-h-[2.75rem] w-full text-sm">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {t('הקישור והקוד', 'The link and the code')}
        </button>
        <button type="button" onClick={onRefresh} disabled={syncing} className="shop-link mt-3 w-full justify-center text-[13px]">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {t('בדיקת בוקסים חדשים', 'Check for new boxes')}
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('הקישור והקוד', 'The link and the code')}>
        <GroupShare group={group} closed={closed} filled={filled} count={count}
          onEnd={() => { setOpen(false); onEnd(); }} />
      </Modal>
    </>
  );
}

// Who is organising, which is all we need before a group can exist.
function StartGroupForm({ fid, onStart }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const start = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError(t('צריך למלא את השם שלך', 'Please fill in your name')); return; }
    setBusy(true);
    setError('');
    const result = await onStart(name.trim(), phone.trim());
    setBusy(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <form onSubmit={start} noValidate className="space-y-4">
      <p className="text-[13px] leading-relaxed text-brand-navy/60">
        {t('אחרי שתמלאו, נייצר קישור שאפשר לשלוח לחברים. כל אחד ימלא את הבוקס שלו והוא יופיע אצלכם.',
          "Once you're done we'll make a link to send your friends. Each fills in their own box and it shows up here.")}
      </p>
      <div>
        <label htmlFor={fid('owner-name')} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
          {t('השם שלך', 'Your name')} <span className="text-brand-orange-ink">*</span>
        </label>
        <input id={fid('owner-name')} value={name} onChange={e => { setName(e.target.value); setError(''); }} maxLength={40}
          autoComplete="given-name" placeholder={t('החברים יראו מי הזמין אותם', 'Your friends will see who invited them')} className="shop-field" />
      </div>
      <div>
        <label htmlFor={fid('owner-phone')} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
          {t('הטלפון שלך', 'Your phone')} <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
        </label>
        <input id={fid('owner-phone')} value={phone} onChange={e => setPhone(e.target.value)} type="tel" dir="ltr" maxLength={20}
          autoComplete="tel" className="shop-field text-start" />
        <p className="mt-1 text-[12px] text-brand-navy/50">{t('כדי שחבר שסיים יוכל לעדכן אותך בוואטסאפ בלחיצה.', 'So a friend who is done can let you know on WhatsApp in one tap.')}</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="shop-btn min-h-[3rem] w-full text-sm">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        {t('יצירת הקישור', 'Create the link')}
      </button>
    </form>
  );
}

// The group once it exists: the code to come back with, the link to send, and
// the way to stop taking boxes.
function GroupShare({ group, closed, filled, count, onEnd }) {
  const [copied, setCopied] = useState(false);
  const link = joinLink(group.id);
  const message = t(
    `${group.ownerName} מזמין מיסטרי בוקס 🎁 מלאו כאן את הבוקס שלכם (שם, מידה ותוספות):`,
    `${group.ownerName} is ordering Mystery Boxes 🎁 Fill in your box here (name, size and extras):`,
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* no clipboard - the WhatsApp button still works */ }
  };

  return (
    <div>
      {/* The code, before the link. A link is something you have to still
          have; five digits are something you can read off this screen and
          type into another phone a week later. */}
      {group.code && (
        <div className="rounded-2xl bg-brand-mist p-4 text-center">
          <p className="text-[12px] text-brand-navy/55">{t('קוד הניהול שלכם', 'Your organiser code')}</p>
          <p dir="ltr" className="mt-0.5 text-4xl font-bold tracking-[0.3em] tabular-nums text-brand-navy">{group.code}</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-brand-navy/55">
            {t('שמרו אותו. אם תאבדו את הקישור, הקוד מחזיר אתכם לקבוצה מכל מכשיר.',
               'Keep it. If you lose the link, the code brings you back to this group from any device.')}
          </p>
        </div>
      )}

      {filled > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-medium text-brand-navy">{t(`${filled} מתוך ${count} מילאו`, `${filled} of ${count} filled in`)}</span>
            {filled < count && <span className="text-brand-navy/55">{t(`${count - filled} ממתינים`, `${count - filled} waiting`)}</span>}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-mist" role="presentation">
            <div className="h-full rounded-full bg-brand-orange transition-all" style={{ width: `${Math.round((filled / Math.max(count, 1)) * 100)}%` }} />
          </div>
        </div>
      )}

      {closed && (
        <p className="mt-4 rounded-xl bg-brand-mist p-3 text-[13px] text-brand-navy/70">
          {t('הקבוצה סגורה, אז אי אפשר להוסיף אליה עוד בוקסים.', 'The group is closed, so no more boxes can be added.')}
        </p>
      )}

      <p className="mt-4 mb-1.5 text-sm font-medium text-brand-navy/70">{t('הקישור לחברים', 'The link for your friends')}</p>
      <p dir="ltr" className="truncate rounded-xl border border-brand-line bg-brand-mist px-3 py-2.5 text-start text-[13px] text-brand-navy/70">{link}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(`${message}\n${link}`)}`} target="_blank" rel="noopener noreferrer"
          className="shop-btn min-h-[3rem] text-sm">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {t('שליחה בוואטסאפ', 'Send on WhatsApp')}
        </a>
        <button type="button" onClick={copy} className="shop-btn-secondary min-h-[3rem] text-sm">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? t('הקישור הועתק', 'Link copied') : t('העתקת קישור', 'Copy link')}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{copied ? t('הקישור הועתק', 'Link copied') : ''}</p>

      {!closed && (
        <button type="button" onClick={onEnd}
          className="mt-5 w-full text-center text-[13px] text-brand-navy/55 underline underline-offset-2 hover:text-red-600">
          {t('סגירת הקבוצה', 'Close the group')}
        </button>
      )}
    </div>
  );
}
