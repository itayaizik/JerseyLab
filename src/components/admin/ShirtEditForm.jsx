import React, { useState, useRef } from 'react';
import { Upload, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadErrorMessage } from '@/lib/supabaseStorage';
import { sizeAliases, normalizeSize } from '@/lib/sizes';
import LocalStockEditor from '@/components/admin/LocalStockEditor';

// '2XL', not 'XXL': the canonical spelling, so the label the owner sees matches
// the key that gets written. The legacy 'XXL' is still read, via sizeAliases.
// No XS: the shop does not sell it.
const sizeOptions = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
// Canonical spellings - see lib/sizes. Reads tolerate the legacy 'XXL' key,
// writes always land on '2XL', so stock can no longer be filed under a spelling
// the storefront then fails to find.
const LOCAL_STOCK_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const kidsSizeOptions = ['6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y'];

/**
 * Presentational shirt editor. Receives a `draft` object and reports every
 * change via `onChange(nextDraft)`. Owns only transient UI state (uploads,
 * tag input, url mode). No persistence - the parent decides when to save.
 *
 * draft shape: { form, sizes, localStockItems, mainImageUrl, extraImageUrls }
 */
export default function ShirtEditForm({ draft, onChange, onImageSaved }) {
  // Uploads take seconds; by the time one finishes the draft may have changed,
  // so they apply to the latest draft rather than the one from when they began.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [useUrlMode, setUseUrlMode] = useState(true);
  const [mainUrlInput, setMainUrlInput] = useState('');
  const [extraUrlInput, setExtraUrlInput] = useState('');

  const setForm = (field, value) => onChange({ ...draft, form: { ...draft.form, [field]: value } });
  // Three states, not a quantity: 1 orderable, 0 sold out but still shown,
  // absent means the shirt does not come in that size at all.
  //
  // Alias spellings are cleared on the way in, so a row that arrived from
  // Base44 carrying 'XXL' does not end up holding both that and '2XL' for the
  // same size - 17 shirts in production were in exactly that state.
  const setSizes = (size, value) => {
    const next = { ...draft.sizes };
    for (const key of sizeAliases(size)) delete next[key];
    if (value !== '') next[normalizeSize(size)] = Number(value) === 0 ? 0 : 1;
    onChange({ ...draft, sizes: next });
  };
  const setMain = (url) => onChange({ ...draftRef.current, mainImageUrl: url });
  const removeExtra = (i) => onChange({ ...draft, extraImageUrls: draft.extraImageUrls.filter((_, idx) => idx !== i) });

  // A photo is written to the shirt the moment it is added (onImageSaved), not
  // only into the draft. Uploads used to wait for "שמור הכל", so a crash before
  // it left the photos in storage attached to nothing - 86 of them in one
  // evening of work.
  const saveImages = async (patch) => {
    if (!onImageSaved) return;
    try {
      await onImageSaved(patch);
    } catch (err) {
      setUploadError(`התמונה עלתה אבל לא נשמרה בחולצה: ${uploadErrorMessage(err)}`);
    }
  };

  const addMainUrl = (url) => {
    setMain(url);
    saveImages({ main_image: url });
  };
  const addExtraUrl = (url) => {
    const next = [...draftRef.current.extraImageUrls, url];
    onChange({ ...draftRef.current, extraImageUrls: next });
    saveImages({ extra_images: next });
  };

  const uploadMain = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMain(file_url);
      await saveImages({ main_image: file_url });
    } catch (err) {
      setUploadError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };
  const uploadExtras = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setUploadError('');
    const urls = [];
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
    } catch (err) {
      setUploadError(uploadErrorMessage(err));
    }
    // Whatever did upload is kept, even if a later file failed.
    if (urls.length) {
      const next = [...draftRef.current.extraImageUrls, ...urls];
      onChange({ ...draftRef.current, extraImageUrls: next });
      await saveImages({ extra_images: next });
    }
    setUploading(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !draft.form.tags.includes(t)) { setForm('tags', [...draft.form.tags, t]); setTagInput(''); }
  };

  const currentSizeOptions = draft.form.gender_category === 'kids' ? kidsSizeOptions : sizeOptions;

  return (
    <div className="space-y-4 text-right">
      {/* Basic Info */}
      <div className="border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="font-heading font-bold text-sm text-turf">פרטי חולצה</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-varnish block mb-1">שם *</label>
            <input value={draft.form.name} onChange={e => setForm('name', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
          </div>
          <div><label className="text-sm text-varnish block mb-1">קבוצה</label><input value={draft.form.club} onChange={e => setForm('club', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
          <div><label className="text-sm text-varnish block mb-1">נבחרת</label><input value={draft.form.national_team} onChange={e => setForm('national_team', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
          <div><label className="text-sm text-varnish block mb-1">ליגה</label><input value={draft.form.league} onChange={e => setForm('league', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
          <div><label className="text-sm text-varnish block mb-1">עונה</label><input value={draft.form.season} onChange={e => setForm('season', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
          <div><label className="text-sm text-varnish block mb-1">שחקן</label><input value={draft.form.player_name} onChange={e => setForm('player_name', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
          <div>
            <label className="text-sm text-varnish block mb-1">קטגוריה</label>
            <select value={draft.form.gender_category} onChange={e => setForm('gender_category', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none">
              <option value="men">גברים</option><option value="kids">ילדים</option><option value="unisex">יוניסקס</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="border border-white/10 bg-white/5 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="text-sm text-varnish block mb-1">מחיר *</label><input type="number" value={draft.form.price} onChange={e => setForm('price', e.target.value)} dir="ltr" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
        <div><label className="text-sm text-varnish block mb-1">מחיר מבצע</label><input type="number" value={draft.form.sale_price} onChange={e => setForm('sale_price', e.target.value)} dir="ltr" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
        <div><label className="text-sm text-varnish block mb-1">מצב</label><select value={draft.form.condition} onChange={e => setForm('condition', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none"><option value="new">חדש</option><option value="like_new">כמו חדש</option><option value="used">משומש</option></select></div>
      </div>

      {/* Sizes.
          A special order has no stock to count - the shirt is brought in per
          order - so this used to ask for a quantity that meant nothing. The
          data shows it: almost every size held 100 or 1, and both meant "yes".
          Three states, no typing. "אזל" keeps the size on the product page with
          a line through it rather than removing it, so a customer can see the
          shirt comes in their size and is worth asking about later. */}
      <div className="border border-white/10 bg-white/5 p-4">
        <h3 className="font-heading font-bold text-sm text-turf mb-1">מידות להזמנה</h3>
        <p className="text-[11px] text-varnish mb-3">
          הזמנה מיוחדת היא ללא הגבלת כמות. סמן רק אם מידה לא זמינה כרגע.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {currentSizeOptions.map(size => {
            const raw = draft.sizes[size];
            const state = raw === undefined || raw === '' ? 'off' : Number(raw) === 0 ? 'out' : 'on';
            const btn = (label, value, active, activeClass) => (
              <button type="button" onClick={() => setSizes(size, value)}
                className={`flex-1 px-1.5 py-1 text-[11px] font-heading font-bold transition-colors ${active ? activeClass : 'bg-white/5 text-varnish hover:text-chalk'}`}>
                {label}
              </button>
            );
            return (
              <div key={size} className="border border-white/10">
                <div className="text-center text-sm text-chalk font-mono py-1 border-b border-white/10">{size}</div>
                <div className="flex">
                  {btn('זמין', 1, state === 'on', 'bg-turf text-pitch')}
                  {btn('אזל', 0, state === 'out', 'bg-redcard text-white')}
                  {btn('אין', '', state === 'off', 'bg-varnish/30 text-chalk')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Images */}
      <div className="border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-turf">תמונות</h3>
          <label className="flex items-center gap-2 text-xs text-varnish cursor-pointer">
            <input type="checkbox" checked={useUrlMode} onChange={e => setUseUrlMode(e.target.checked)} className="accent-turf" /> קישורים
          </label>
        </div>
        {!useUrlMode && (
          <p className="text-xs bg-redcard/10 text-redcard border border-redcard/30 p-2 rounded">
            העלאת קבצים משתמשת בקרדיטי אינטגרציה של Base44. כדי לא לבזבז קרדיטים, מומלץ להשתמש בקישורי תמונה במקום.
          </p>
        )}
        <div>
          <label className="text-xs text-varnish">ראשית</label>
          {draft.mainImageUrl ? (
            <div className="relative w-32 h-32 mt-1"><img src={draft.mainImageUrl} className="w-full h-full object-cover border border-white/10" onError={e => { e.target.src = 'https://placehold.co/128x128'; }} /><button type="button" onClick={() => setMain('')} className="absolute -top-2 -right-2 w-5 h-5 bg-redcard text-white flex items-center justify-center text-xs">×</button></div>
          ) : useUrlMode ? (
            <div className="flex gap-2 mt-1"><input value={mainUrlInput} onChange={e => setMainUrlInput(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={() => { if (mainUrlInput.trim()) { addMainUrl(mainUrlInput.trim()); setMainUrlInput(''); } }} className="px-3 py-2 bg-turf/10 text-turf text-sm font-bold">הוסף</button></div>
          ) : (
            <label className="flex items-center justify-center w-32 h-32 border border-dashed border-white/20 cursor-pointer hover:border-turf mt-1"><Upload className="w-6 h-6 text-varnish" /><input type="file" accept="image/*" onChange={uploadMain} className="hidden" /></label>
          )}
        </div>
        <div>
          <label className="text-xs text-varnish">נוספות</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {draft.extraImageUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20"><img src={url} className="w-full h-full object-cover border border-white/10" onError={e => { e.target.src = 'https://placehold.co/80x80'; }} /><button type="button" onClick={() => removeExtra(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-redcard text-white flex items-center justify-center text-xs">×</button></div>
            ))}
          </div>
          {useUrlMode ? (
            <div className="flex gap-2 mt-2"><input value={extraUrlInput} onChange={e => setExtraUrlInput(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={() => { if (extraUrlInput.trim()) { addExtraUrl(extraUrlInput.trim()); setExtraUrlInput(''); } }} className="px-3 py-2 bg-turf/10 text-turf text-sm font-bold">הוסף</button></div>
          ) : (
            <label className="flex items-center justify-center w-20 h-20 border border-dashed border-white/20 cursor-pointer hover:border-turf mt-2"><Plus className="w-5 h-5 text-varnish" /><input type="file" accept="image/*" multiple onChange={uploadExtras} className="hidden" /></label>
          )}
        </div>
        {uploading && <p className="text-xs text-turf"><Loader2 className="w-3 h-3 animate-spin inline" /> מעלה...</p>}
        {uploadError && <p className="text-xs text-redcard">{uploadError}</p>}
        {onImageSaved && <p className="text-[11px] text-white/40">תמונה שמוסיפים נשמרת בחולצה מיד, גם בלי ללחוץ על "שמור הכל".</p>}
      </div>

      <LocalStockEditor items={draft.localStockItems || []} onChange={items => onChange({ ...draft, localStockItems: items })} sizes={currentSizeOptions} />

      {/* Status & Flags */}
      <div className="border border-white/10 bg-white/5 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-varnish block mb-1">סטטוס</label><select value={draft.form.status} onChange={e => setForm('status', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none"><option value="available">זמין</option><option value="reserved">שמור</option><option value="sold">נמכר</option><option value="hidden">מוסתר</option></select></div>
        </div>
        <div><label className="text-sm text-varnish block mb-1">תיאור</label><textarea value={draft.form.description} onChange={e => setForm('description', e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none resize-none" /></div>
        <div>
          <label className="text-sm text-varnish block mb-1">תגיות</label>
          <div className="flex gap-1 flex-wrap mb-2">{draft.form.tags.map(t => (<span key={t} className="text-xs bg-turf/10 text-turf px-2 py-1 flex items-center gap-1">{t}<button type="button" onClick={() => setForm('tags', draft.form.tags.filter(x => x !== t))} className="hover:text-redcard">×</button></span>))}</div>
          <div className="flex gap-2"><input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="הוסף..." className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={addTag} className="px-3 bg-turf/10 text-turf text-sm">+</button></div>
        </div>
        <div className="flex flex-wrap gap-4">
          {[{ key: 'featured', label: 'מומלץ' },{ key: 'is_new', label: 'חדש' },{ key: 'is_rare', label: 'נדיר' },{ key: 'is_retro', label: 'רטרו' },{ key: 'best_seller', label: 'נמכר ביותר' },{ key: 'limited_stock', label: 'מלאי מוגבל' }].map(f => (
            <label key={f.key} className="flex items-center gap-2 text-sm text-chalk cursor-pointer"><input type="checkbox" checked={draft.form[f.key]} onChange={e => setForm(f.key, e.target.checked)} className="accent-turf" />{f.label}</label>
          ))}
        </div>
      </div>
    </div>
  );
}