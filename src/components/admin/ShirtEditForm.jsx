import React, { useState } from 'react';
import { Upload, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const kidsSizeOptions = ['6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y'];

/**
 * Presentational shirt editor. Receives a `draft` object and reports every
 * change via `onChange(nextDraft)`. Owns only transient UI state (uploads,
 * tag input, url mode). No persistence — the parent decides when to save.
 *
 * draft shape: { form, sizes, localStockSizes, mainImageUrl, extraImageUrls }
 */
export default function ShirtEditForm({ draft, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [useUrlMode, setUseUrlMode] = useState(true);
  const [mainUrlInput, setMainUrlInput] = useState('');
  const [extraUrlInput, setExtraUrlInput] = useState('');

  const setForm = (field, value) => onChange({ ...draft, form: { ...draft.form, [field]: value } });
  const setSizes = (size, qty) => onChange({ ...draft, sizes: { ...draft.sizes, [size]: Math.max(0, parseInt(qty) || 0) } });
  const setLocal = (size, qty) => onChange({ ...draft, localStockSizes: { ...draft.localStockSizes, [size]: Math.max(0, parseInt(qty) || 0) } });
  const setMain = (url) => onChange({ ...draft, mainImageUrl: url });
  const addExtra = (url) => onChange({ ...draft, extraImageUrls: [...draft.extraImageUrls, url] });
  const removeExtra = (i) => onChange({ ...draft, extraImageUrls: draft.extraImageUrls.filter((_, idx) => idx !== i) });

  const uploadMain = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setMain(file_url); }
    finally { setUploading(false); }
  };
  const uploadExtras = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      let next = [...draft.extraImageUrls];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        next = [...next, file_url];
      }
      onChange({ ...draft, extraImageUrls: next });
    } finally { setUploading(false); }
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

      {/* Sizes */}
      <div className="border border-white/10 bg-white/5 p-4">
        <h3 className="font-heading font-bold text-sm text-turf mb-3">מידות</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {currentSizeOptions.map(size => (
            <div key={size} className="flex items-center gap-2">
              <span className="text-sm text-chalk font-mono w-12">{size}</span>
              <input type="number" min="0" value={draft.sizes[size] || ''} onChange={e => setSizes(size, e.target.value)} dir="ltr" placeholder="0" className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
          ))}
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
            <div className="flex gap-2 mt-1"><input value={mainUrlInput} onChange={e => setMainUrlInput(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={() => { if (mainUrlInput.trim()) { setMain(mainUrlInput.trim()); setMainUrlInput(''); } }} className="px-3 py-2 bg-turf/10 text-turf text-sm font-bold">הוסף</button></div>
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
            <div className="flex gap-2 mt-2"><input value={extraUrlInput} onChange={e => setExtraUrlInput(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={() => { if (extraUrlInput.trim()) { addExtra(extraUrlInput.trim()); setExtraUrlInput(''); } }} className="px-3 py-2 bg-turf/10 text-turf text-sm font-bold">הוסף</button></div>
          ) : (
            <label className="flex items-center justify-center w-20 h-20 border border-dashed border-white/20 cursor-pointer hover:border-turf mt-2"><Plus className="w-5 h-5 text-varnish" /><input type="file" accept="image/*" multiple onChange={uploadExtras} className="hidden" /></label>
          )}
        </div>
        {uploading && <p className="text-xs text-turf"><Loader2 className="w-3 h-3 animate-spin inline" /> מעלה...</p>}
      </div>

      {/* Local Stock by Size */}
      <div className="border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="font-heading font-bold text-sm text-turf">מלאי בארץ לפי מידה</h3>
        <p className="text-xs text-varnish">סמן כמות זמינה במלאי בארץ לכל מידה. מידה עם כמות גדולה מ-0 תוצג כ"מלאי בארץ". שאר המידות — "משלוח מהיר".</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
            <div key={size} className="flex items-center gap-2">
              <span className="text-sm text-chalk font-mono w-12">{size}</span>
              <input type="number" min="0" value={draft.localStockSizes[size] || ''} onChange={e => setLocal(size, e.target.value)} dir="ltr" placeholder="0" className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-varnish mb-3">מה בדיוק מודפס על הפריט הספציפי שבמלאי? זה יוצג ללקוח כאפשרות "קנה בדיוק את זו" לעומת הזמנה בהתאמה אישית.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 text-sm text-chalk cursor-pointer flex-shrink-0">
              <input type="checkbox" checked={draft.form.local_stock_player_version || false} onChange={e => setForm('local_stock_player_version', e.target.checked)} className="accent-turf" />
              גרסת שחקן
            </label>
            <input value={draft.form.local_stock_custom_name || ''} onChange={e => setForm('local_stock_custom_name', e.target.value)} placeholder="שם ומספר על הגב (אם יש) — למשל Ronaldo 7"
              className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
          </div>
        </div>
      </div>

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