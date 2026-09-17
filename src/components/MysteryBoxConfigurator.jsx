import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gift, Check, ShoppingBag, Ban, MessageSquare,
  Plus, Copy, Trash2, ChevronDown, CheckCircle2, Share2, Link2, Users, Loader2, RefreshCw, X,
} from 'lucide-react';
import { addToCart, openCart, EXTRA_PRICES, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { NAME_PRICE, PATCHES_PRICE, MYSTERY_BOX_ID, EXCLUDE_COLORS as COLORS } from '@/lib/mysteryBox';
import { newBox, newBoxId, typeOf, wantsShorts, boxPrice, boxSummary, isBlank, cleanBox } from '@/lib/mysteryBoxes';
import {
  MAX_GROUP_BOXES, loadDraft, saveDraft, createGroup, fetchGroup, closeGroup, joinLink,
} from '@/lib/mysteryGroup';
import MysteryBoxFields from '@/components/mystery/MysteryBoxFields';
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
// and price. What to leave out (teams, colours, notes) is asked once, for the
// whole order, with a note per box for anything personal.
//
// What goes into the cart stays in Hebrew, since it becomes the order the
// owner reads; the English words travel beside it (labelEn) for the cart to
// show. Each box is its own cart item.
//
// The shirt is a surprise until the box is opened, so nothing here promises to
// say what came out.

const MAX_BOXES = MAX_GROUP_BOXES;
const POLL_MS = 15000;

const colorName = (label) => t(label, COLORS.find(c => c.label === label)?.en);

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
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [excludeClubs, setExcludeClubs] = useState(draft?.excludeClubs || '');
  const [excludeColors, setExcludeColors] = useState(draft?.excludeColors || []);
  const [notes, setNotes] = useState(draft?.notes || '');
  const [group, setGroup] = useState(draft?.group || null);
  const [error, setError] = useState('');
  const [missingSize, setMissingSize] = useState([]);
  // What the last press of the button put in the cart, shown until the next
  // change so it is clear the boxes went in and more can follow.
  const [lastAdded, setLastAdded] = useState(null);
  // Boxes friends added or changed since the organiser last looked.
  const [arrivals, setArrivals] = useState([]);

  // Remembered on every change: a refresh brings all of it back.
  useEffect(() => {
    saveDraft({ boxes, excludeClubs, excludeColors, notes, group });
  }, [boxes, excludeClubs, excludeColors, notes, group]);

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

  const toggleColor = (label) => {
    touched();
    setExcludeColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
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
    setGroup({ id: result.id, ownerToken: result.owner_token, ownerName, seenVersions: {} });
    setGroupClosed(false);
    return result;
  };

  const endGroup = async () => {
    if (!group) return;
    if (!window.confirm(t('לסגור את הקבוצה? חברים לא יוכלו להוסיף עוד בוקסים דרך הקישור.', "Close the group? Friends won't be able to add more boxes through the link."))) return;
    await closeGroup(group);
    setGroup(null);
    setArrivals([]);
  };

  // --- adding to the cart ------------------------------------------------------

  const total = boxes.reduce((sum, b) => sum + boxPrice(b), 0);
  const count = boxes.length;

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

    // Preferences for the whole order, carried by every box: they carry no
    // price, but they have to reach the order, or asking was theatre.
    const shared = [];
    if (excludeClubs.trim()) shared.push({ label: 'לא לשלוח קבוצות', labelEn: "Don't send teams", value: excludeClubs.trim() });
    if (excludeColors.length) {
      shared.push({
        label: 'לא לשלוח צבעים', labelEn: "Don't send colours",
        value: excludeColors.join(', '),
        valueEn: excludeColors.map(c => COLORS.find(x => x.label === c)?.en || c).join(', '),
      });
    }
    if (notes.trim()) shared.push({ label: 'הערות', labelEn: 'Notes', value: notes.trim() });

    boxes.forEach(box => {
      const type = typeOf(box);
      const extras = [];
      if (box.addName) extras.push({ label: 'שם ומספר מאחורה (לבחירתנו)', labelEn: 'Name and number on the back (our pick)', price: NAME_PRICE });
      if (box.patches) extras.push({ label: 'כל הפאצ\'ים', labelEn: 'All patches', price: PATCHES_PRICE });
      // The same words a catalogue shirt uses, so the supplier text reads them.
      if (box.longSleeve) extras.push({ label: LONG_SLEEVE_LABEL, labelEn: 'Long sleeve', price: EXTRA_PRICES.longSleeve });
      if (wantsShorts(box)) extras.push({ label: `${SHORTS_LABEL} במידה ${box.size}`, labelEn: `Shorts, size ${box.size}`, price: EXTRA_PRICES.shorts });

      const details = [];
      if (box.forWhom.trim()) details.push({ label: 'עבור', labelEn: 'For', value: box.forWhom.trim() });
      if (box.note.trim()) details.push({ label: 'הערה לבוקס', labelEn: 'Note for this box', value: box.note.trim() });

      addToCart({
        shirtId: MYSTERY_BOX_ID,
        shirtName: `מיסטרי בוקס — ${type.label}`,
        shirtNameEn: `Mystery Box — ${type.labelEn}`,
        size: box.size,
        basePrice: type.price,
        unitPrice: boxPrice(box),
        extras,
        details: [...details, ...shared],
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
  };

  const pad = lg ? 'px-5 sm:px-8' : 'px-5';

  return (
    <div className={`shop-card overflow-hidden ${className}`}>
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
                  <span className="flex-shrink-0 text-[15px] font-semibold tabular-nums text-brand-navy">₪{boxPrice(box)}</span>
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

      <div className={`pb-5 ${pad}`}>
        <GroupPanel group={group} closed={groupClosed} syncing={syncing} fid={fid}
          onStart={startGroup} onRefresh={sync} onEnd={endGroup} />
      </div>

      {/* What to leave out - once, for the whole order. */}
      <div className={`pb-5 ${pad}`}>
        <div className="overflow-hidden rounded-2xl border border-brand-line">
          <button type="button" onClick={() => setPrefsOpen(o => !o)} aria-expanded={prefsOpen}
            className="flex min-h-[3.5rem] w-full items-center gap-3 bg-brand-mist px-4 text-start">
            <Ban className="h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-brand-navy">{t('מה לא לשלוח', 'What not to send')}</span>
              <span className="block text-[12px] text-brand-navy/55">{t('לכל הבוקסים · לא חובה', 'For all the boxes · optional')}</span>
            </span>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 text-brand-navy/40 transition-transform ${prefsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {prefsOpen && (
            <div className="bg-white px-4 pb-4 pt-3">
              <p className="mb-4 text-[13px] leading-relaxed text-brand-navy/55">
                {t('ההפתעה נשארת הפתעה, אבל אנחנו נמנע ממה שתסמנו כאן.', "The surprise stays a surprise, but we'll avoid whatever you mark here.")}
              </p>

              <label htmlFor={fid('clubs')} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
                {t('קבוצות שלא תרצו לקבל', "Teams you don't want")}
              </label>
              <input id={fid('clubs')} value={excludeClubs} maxLength={200}
                onChange={e => { setExcludeClubs(e.target.value); touched(); }}
                placeholder={t('למשל: ברצלונה, מכבי תל אביב', 'For example: Barcelona, Maccabi Tel Aviv')}
                className="shop-field" />

              <p className="mb-2 mt-5 text-sm font-medium text-brand-navy/70">{t('צבעים שלא תרצו לקבל', "Colours you don't want")}</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => {
                  const off = excludeColors.includes(c.label);
                  return (
                    <button key={c.label} type="button" onClick={() => toggleColor(c.label)}
                      aria-pressed={off}
                      className={`shop-chip px-3.5 ${off ? 'border-brand-navy bg-brand-navy text-white line-through hover:border-brand-navy hover:text-white' : ''}`}>
                      <span className="h-4 w-4 flex-shrink-0 rounded-full ring-1 ring-brand-navy/20" style={{ background: c.hex }} aria-hidden="true" />
                      {t(c.label, c.en)}
                    </button>
                  );
                })}
              </div>
              {excludeColors.length > 0 && (
                <p className="mt-2 text-[13px] text-brand-navy/60">
                  {t('לא נשלח:', "We won't send:")} <strong className="font-semibold text-brand-navy">{excludeColors.map(colorName).join(', ')}</strong>
                </p>
              )}

              <label htmlFor={fid('notes')} className="mb-1.5 mt-5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                <MessageSquare className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                {t('הערות', 'Notes')}
              </label>
              <textarea id={fid('notes')} value={notes} maxLength={500} rows={3}
                onChange={e => { setNotes(e.target.value); touched(); }}
                placeholder={t('ליגה שאתם מעדיפים, מתנה למישהו. כל דבר שחשוב לכם.', 'A league you prefer, a gift for someone. Anything that matters to you.')}
                className="shop-field resize-none py-3" />
            </div>
          )}
        </div>
      </div>

      {/* Total */}
      <div className={`border-t border-brand-line bg-brand-mist/60 py-6 ${pad}`}>
        <ul className="space-y-1.5 text-sm">
          {boxes.map((box, i) => (
            <li key={box.id} className="flex items-center justify-between gap-3 text-brand-navy/70">
              <span className="min-w-0 truncate">{boxTitle(box, i)} · {boxSummary(box)}</span>
              <span className="flex-shrink-0 font-semibold tabular-nums text-brand-navy">₪{boxPrice(box)}</span>
            </li>
          ))}
        </ul>

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
      </div>
    </div>
  );
}

// Starting a group, and once there is one, sharing its link.
function GroupPanel({ group, closed, syncing, fid, onStart, onRefresh, onEnd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const heading = (
    <p className="flex items-center gap-2 text-[15px] font-semibold text-brand-navy">
      <Share2 className="h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
      {t('שהחברים ימלאו בעצמם', 'Let your friends fill in their own')}
    </p>
  );

  if (!group) {
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
      <div className="rounded-2xl border border-brand-line p-4">
        {heading}
        <p className="mt-1 text-[13px] leading-relaxed text-brand-navy/60">
          {t('שולחים לחברים קישור, כל אחד ממלא את הבוקס שלו בדף משלו, והבוקסים מופיעים כאן אצלך.',
            'Send your friends a link; each fills in their own box on a page of their own, and the boxes show up here for you.')}
        </p>
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="shop-btn-secondary mt-3 min-h-[2.75rem] w-full text-sm">
            <Users className="h-4 w-4" aria-hidden="true" />
            {t('יצירת קישור לחברים', 'Create a link for friends')}
          </button>
        ) : (
          <form onSubmit={start} noValidate className="mt-3 space-y-3">
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
            <button type="submit" disabled={busy} className="shop-btn min-h-[2.75rem] w-full text-sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
              {t('יצירת הקישור', 'Create the link')}
            </button>
          </form>
        )}
      </div>
    );
  }

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
    <div className="rounded-2xl border border-brand-orange/40 bg-brand-orange-soft/40 p-4">
      {heading}
      <p className="mt-1 text-[13px] leading-relaxed text-brand-navy/65">
        {closed
          ? t('הקבוצה סגורה, אז אי אפשר להוסיף אליה עוד בוקסים.', 'The group is closed, so no more boxes can be added.')
          : t('שלחו את הקישור. כל בוקס שחבר שומר מופיע כאן אוטומטית, גם אם תצאו ותחזרו.', 'Send the link. Every box a friend saves appears here automatically, even if you leave and come back.')}
      </p>
      <p dir="ltr" className="mt-2 truncate rounded-xl bg-white px-3 py-2 text-start text-[13px] text-brand-navy/70">{link}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 min-[440px]:grid-cols-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(`${message}\n${link}`)}`} target="_blank" rel="noopener noreferrer"
          className="shop-btn min-h-[2.75rem] text-sm">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {t('שליחה בוואטסאפ', 'Send on WhatsApp')}
        </a>
        <button type="button" onClick={copy} className="shop-btn-secondary min-h-[2.75rem] text-sm">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? t('הקישור הועתק', 'Link copied') : t('העתקת קישור', 'Copy link')}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{copied ? t('הקישור הועתק', 'Link copied') : ''}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <button type="button" onClick={onRefresh} disabled={syncing} className="shop-link">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {t('בדיקת בוקסים חדשים', 'Check for new boxes')}
        </button>
        <button type="button" onClick={onEnd} className="text-brand-navy/55 underline underline-offset-2 hover:text-red-600">
          {t('סגירת הקבוצה', 'Close the group')}
        </button>
      </div>
    </div>
  );
}
