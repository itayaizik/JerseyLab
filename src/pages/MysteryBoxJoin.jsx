import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gift, CheckCircle2, Loader2, Pencil, Users, MessageCircle, AlertCircle } from 'lucide-react';
import Seo from '@/components/Seo';
import MysteryBoxFields from '@/components/mystery/MysteryBoxFields';
import { newBox, boxPrice, boxSummary } from '@/lib/mysteryBoxes';
import {
  fetchGroup, saveGroupBox, loadMember, saveMember, ensureMemberToken, whatsappNumber,
} from '@/lib/mysteryGroup';
import { t } from '@/lib/i18n';

// The page a friend opens from a group link: just their own mystery box.
//
// They fill it in and save it, and it shows up in the organiser's builder.
// What they typed is kept in this browser as they go, so leaving or
// refreshing loses nothing, and coming back later opens their saved box to
// change. Ordering and payment stay with the organiser.

export default function MysteryBoxJoin() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [member, setMember] = useState(() => {
    const saved = loadMember(groupId);
    return {
      token: saved?.token || ensureMemberToken(groupId),
      boxId: saved?.boxId || null,
      box: saved?.box || newBox(),
      savedAt: saved?.savedAt || null,
      // A box that was saved opens as the saved summary, not the form.
      editing: !saved?.boxId,
    };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState({ name: false, size: false });

  useEffect(() => {
    let cancelled = false;
    fetchGroup(groupId).then(result => {
      if (cancelled) return;
      if (result.ok) setGroup(result);
      else setLoadError(result.message);
    });
    return () => { cancelled = true; };
  }, [groupId]);

  // Remembered as it is typed.
  useEffect(() => {
    const { box, ...rest } = member;
    const { id, ...fields } = box; // eslint-disable-line no-unused-vars
    saveMember(groupId, { ...rest, box: fields });
  }, [groupId, member]);

  const box = member.box;
  const update = (patch) => {
    setError('');
    if ('forWhom' in patch) setMissing(m => ({ ...m, name: false }));
    if (patch.size) setMissing(m => ({ ...m, size: false }));
    setMember(m => ({ ...m, box: { ...m.box, ...patch } }));
  };

  const save = async () => {
    const need = { name: !box.forWhom.trim(), size: !box.size };
    if (need.name || need.size) {
      setMissing(need);
      setError(need.name ? t('צריך למלא את השם שלך', 'Please fill in your name') : t('צריך לבחור מידה', 'Please choose a size'));
      return;
    }
    setBusy(true);
    setError('');
    const result = await saveGroupBox(groupId, member);
    setBusy(false);
    if (!result.ok) { setError(result.message); return; }
    setMember(m => ({ ...m, boxId: result.id, savedAt: new Date().toISOString(), editing: false }));
    const refreshed = await fetchGroup(groupId);
    if (refreshed.ok) setGroup(refreshed);
  };

  const owner = group?.ownerName || t('החבר שלך', 'your friend');
  const others = (group?.boxes || []).filter(b => b.remoteId !== member.boxId);
  const phone = whatsappNumber(group?.ownerPhone);
  const doneMessage = t(
    `מילאתי את הבוקס שלי במיסטרי בוקס ✅ ${box.forWhom.trim()}: ${boxSummary(box)} (₪${boxPrice(box)})`,
    `I've filled in my Mystery Box ✅ ${box.forWhom.trim()}: ${boxSummary(box)} (₪${boxPrice(box)})`,
  );

  return (
    <div className="shop-container py-8 lg:py-14">
      <Seo title={t('מיסטרי בוקס עם חברים - JerseyLab', 'Mystery Box with friends - JerseyLab')}
        description={t('מלאו את הבוקס שלכם בהזמנה משותפת.', 'Fill in your box in a group order.')}
        canonicalPath="/mystery-box" noindex />

      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
            <Gift className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-brand-navy sm:text-3xl">
              {group ? t(`${owner} מזמין מיסטרי בוקס`, `${owner} is ordering Mystery Boxes`) : t('מיסטרי בוקס עם חברים', 'Mystery Box with friends')}
            </h1>
            <p className="mt-1 text-[15px] text-brand-navy/60">
              {t('מלאו את הבוקס שלכם, והוא יגיע ישר אליו.', 'Fill in your box and it goes straight to them.')}
            </p>
          </div>
        </div>

        {!group && !loadError && (
          <div className="mt-10 flex justify-center" aria-busy="true">
            <Loader2 className="h-7 w-7 animate-spin text-brand-navy/40" aria-label={t('טוען', 'Loading')} />
          </div>
        )}

        {loadError && (
          <div role="alert" className="mt-8 flex items-start gap-3 rounded-3xl bg-red-50 p-5 text-[15px] text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p>{loadError}</p>
              <Link to="/mystery-box" className="mt-2 inline-block font-semibold underline underline-offset-2">
                {t('לדף המיסטרי בוקס', 'Go to the Mystery Box page')}
              </Link>
            </div>
          </div>
        )}

        {group && (
          <>
            <ul className="mt-6 space-y-2 rounded-3xl bg-brand-mist p-5 text-[14px] leading-relaxed text-brand-navy/75">
              <li>{t('• אתם בוחרים סגנון, מידה ותוספות. החולצה עצמה הפתעה עד שפותחים את הבוקס.', '• You choose the style, size and extras. The shirt itself is a surprise until the box is opened.')}</li>
              <li>{t(`• ${owner} שולח/ת את ההזמנה, והתשלום מתואם מולו/ה.`, `• ${owner} sends the order, and payment is arranged with them.`)}</li>
              <li>{t('• אפשר לחזור לדף הזה ולשנות את הבוקס עד שההזמנה נשלחת.', '• You can come back to this page and change your box until the order is sent.')}</li>
            </ul>

            {others.length > 0 && (
              <div className="mt-5">
                <p className="flex items-center gap-2 text-sm font-medium text-brand-navy/70">
                  <Users className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                  {t(`כבר מילאו (${others.length})`, `Already filled in (${others.length})`)}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {others.map(b => (
                    <li key={b.remoteId} className="rounded-full bg-white px-3 py-1.5 text-[13px] text-brand-navy shadow-card">
                      {b.forWhom} · <span dir="ltr">{b.size}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {group.closed && !member.boxId ? (
              <div role="status" className="mt-6 rounded-3xl bg-brand-mist p-5 text-[15px] text-brand-navy">
                {t('הקבוצה נסגרה, אז אי אפשר להוסיף אליה בוקס. דברו עם', 'This group is closed, so no box can be added. Talk to')} {owner}.
              </div>
            ) : member.editing ? (
              <div className="shop-card mt-6 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-brand-navy">{t('הבוקס שלך', 'Your box')}</h2>
                <div className="mt-4">
                  <MysteryBoxFields box={box} onChange={update} fid={name => `join-${name}`}
                    nameRequired missingName={missing.name} missingSize={missing.size} />
                </div>
                <div className="mt-6 flex items-baseline justify-between border-t border-brand-line pt-4">
                  <span className="font-semibold text-brand-navy">{t('מחיר הבוקס', 'Box price')}</span>
                  <span className="text-2xl font-bold tabular-nums text-brand-navy">₪{boxPrice(box)}</span>
                </div>
                {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
                <button type="button" onClick={save} disabled={busy || group.closed} className="shop-btn mt-4 min-h-[3.25rem] w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                  {member.boxId ? t('שמירת השינויים', 'Save changes') : t(`שליחת הבוקס ל${owner}`, `Send my box to ${owner}`)}
                </button>
                <p className="mt-2 text-center text-xs text-brand-navy/50">{t('מה שמילאתם נשמר בדפדפן גם אם תצאו מהדף.', 'What you fill in is kept in this browser even if you leave the page.')}</p>
              </div>
            ) : (
              <div role="status" className="mt-6 rounded-3xl bg-emerald-50 p-5 sm:p-6 dark:bg-emerald-950/40">
                <p className="flex items-center gap-2 text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  {t(`הבוקס שלך אצל ${owner}`, `Your box is with ${owner}`)}
                </p>
                <p className="mt-2 text-[15px] text-brand-navy">
                  <strong className="font-semibold">{box.forWhom}</strong> · {boxSummary(box)} · <span className="tabular-nums">₪{boxPrice(box)}</span>
                </p>
                {box.note.trim() && <p className="mt-1 text-[13px] text-brand-navy/60">{box.note}</p>}
                <p className="mt-3 text-[13px] leading-relaxed text-brand-navy/60">
                  {t(`${owner} רואה אותו אצלו/ה ויוסיף/תוסיף אותו להזמנה.`, `${owner} can see it and will add it to the order.`)}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 min-[440px]:grid-cols-2">
                  {phone && (
                    <a href={`https://wa.me/${phone}?text=${encodeURIComponent(doneMessage)}`} target="_blank" rel="noopener noreferrer"
                      className="shop-btn min-h-[2.75rem] text-sm">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {t(`לעדכן את ${owner} בוואטסאפ`, `Tell ${owner} on WhatsApp`)}
                    </a>
                  )}
                  {!group.closed && (
                    <button type="button" onClick={() => setMember(m => ({ ...m, editing: true }))} className="shop-btn-secondary min-h-[2.75rem] text-sm">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {t('שינוי הבוקס', 'Change my box')}
                    </button>
                  )}
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-brand-navy/55">
              <Link to="/mystery-box" className="shop-link">{t('מה זה מיסטרי בוקס?', 'What is a Mystery Box?')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
