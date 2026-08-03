import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Loader2, Plus, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasLocalStock } from '@/components/ShippingBadge';

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const kidsSizeOptions = ['6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y'];

export default function EditShirt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [sizes, setSizes] = useState({});
  const [localStockSizes, setLocalStockSizes] = useState({});
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [mainImageUrlInput, setMainImageUrlInput] = useState('');
  const [extraImageUrls, setExtraImageUrls] = useState([]);
  const [extraImageUrlInput, setExtraImageUrlInput] = useState('');
  const [useUrlMode, setUseUrlMode] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const s = await base44.entities.Shirt.get(id);
      setForm({
        name: s.name || '', club: s.club || '', national_team: s.national_team || '',
        league: s.league || '', season: s.season || '', player_name: s.player_name || '',
        gender_category: s.gender_category || 'men', sport_category: s.sport_category || 'football',
        price: s.price || '', sale_price: s.sale_price || '',
        condition: s.condition || 'new', description: s.description || '',
        tags: s.tags || [], status: s.status || 'available',
        featured: s.featured || false, is_new: s.is_new || false,
        is_rare: s.is_rare || false, is_retro: s.is_retro || false, best_seller: s.best_seller || false,
        limited_stock: s.limited_stock || false,
      });
      setSizes(s.sizes || {});
      setLocalStockSizes(s.local_stock_sizes || {});
      setMainImageUrl(s.main_image || '');
      setExtraImageUrls(s.extra_images || []);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleChange = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const handleSizeChange = (size, qty) => setSizes(p => ({ ...p, [size]: Math.max(0, parseInt(qty) || 0) }));
  const handleLocalStockChange = (size, qty) => setLocalStockSizes(p => ({ ...p, [size]: Math.max(0, parseInt(qty) || 0) }));

  const handleMainImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMainImageUrl(file_url);
    setUploading(false);
  };

  const handleMainImageUrl = () => {
    if (mainImageUrlInput.trim()) {
      setMainImageUrl(mainImageUrlInput.trim());
      setMainImageUrlInput('');
    }
  };

  const handleExtraImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setExtraImageUrls(p => [...p, file_url]);
    }
    setUploading(false);
  };

  const handleExtraImageUrl = () => {
    if (extraImageUrlInput.trim()) {
      setExtraImageUrls(p => [...p, extraImageUrlInput.trim()]);
      setExtraImageUrlInput('');
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { handleChange('tags', [...form.tags, t]); setTagInput(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSubmitting(true);
    await base44.entities.Shirt.update(id, {
      ...form, price: Number(form.price), sale_price: form.sale_price ? Number(form.sale_price) : null,
      local_stock_sizes: localStockSizes,
      in_stock_local: hasLocalStock({ local_stock_sizes: localStockSizes }),
      main_image: mainImageUrl, extra_images: extraImageUrls, sizes,
    });
    const user = await base44.auth.me();
    await base44.entities.AdminLog.create({ action: 'עדכן חולצה', entity_type: 'Shirt', entity_id: id, details: form.name, admin_user_id: user.id });
    setSubmitting(false);
    navigate('/admin/shirts');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;

  const currentSizeOptions = form.gender_category === 'kids' ? kidsSizeOptions : sizeOptions;

  return (
    <div>
      <button onClick={() => navigate('/admin/shirts')} className="flex items-center gap-1 text-sm text-varnish hover:text-turf mb-4">
        <ArrowRight className="w-4 h-4" /> חזרה לרשימה
      </button>
      <h1 className="font-heading font-black text-2xl mb-6 text-turf">עריכת חולצה</h1>
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="font-heading font-bold text-sm text-turf">פרטי חולצה</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-varnish block mb-1">שם *</label>
              <input value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
            <div><label className="text-sm text-varnish block mb-1">קבוצה</label><input value={form.club} onChange={e => handleChange('club', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
            <div><label className="text-sm text-varnish block mb-1">נבחרת</label><input value={form.national_team} onChange={e => handleChange('national_team', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
            <div><label className="text-sm text-varnish block mb-1">ליגה</label><input value={form.league} onChange={e => handleChange('league', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
            <div><label className="text-sm text-varnish block mb-1">עונה</label><input value={form.season} onChange={e => handleChange('season', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
            <div><label className="text-sm text-varnish block mb-1">שחקן</label><input value={form.player_name} onChange={e => handleChange('player_name', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
            <div>
              <label className="text-sm text-varnish block mb-1">קטגוריה</label>
              <select value={form.gender_category} onChange={e => handleChange('gender_category', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none">
                <option value="men">גברים</option><option value="kids">ילדים</option><option value="unisex">יוניסקס</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="border border-white/10 bg-white/5 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="text-sm text-varnish block mb-1">מחיר *</label><input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)} dir="ltr" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
          <div><label className="text-sm text-varnish block mb-1">מחיר מבצע</label><input type="number" value={form.sale_price} onChange={e => handleChange('sale_price', e.target.value)} dir="ltr" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" /></div>
          <div><label className="text-sm text-varnish block mb-1">מצב</label><select value={form.condition} onChange={e => handleChange('condition', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none"><option value="new">חדש</option><option value="like_new">כמו חדש</option><option value="used">משומש</option></select></div>
        </div>

        {/* Sizes */}
        <div className="border border-white/10 bg-white/5 p-4">
          <h2 className="font-heading font-bold text-sm text-turf mb-3">מידות</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {currentSizeOptions.map(size => (
              <div key={size} className="flex items-center gap-2">
                <span className="text-sm text-chalk font-mono w-12">{size}</span>
                <input type="number" min="0" value={sizes[size] || ''} onChange={e => handleSizeChange(size, e.target.value)} dir="ltr" placeholder="0" className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-chalk focus:border-turf focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm text-turf">תמונות</h2>
            <label className="flex items-center gap-2 text-xs text-varnish cursor-pointer">
              <input type="checkbox" checked={useUrlMode} onChange={e => setUseUrlMode(e.target.checked)} className="accent-turf" />
              קישורים
            </label>
          </div>
          {!useUrlMode && (
            <p className="text-xs bg-redcard/10 text-redcard border border-redcard/30 p-2 rounded">
              העלאת קבצים משתמשת בקרדיטי אינטגרציה של Base44. כדי לא לבזבז קרדיטים, מומלץ להשתמש בקישורי תמונה במקום.
            </p>
          )}
          <div>
            <label className="text-xs text-varnish">ראשית</label>
            {mainImageUrl ? (
              <div className="relative w-32 h-32 mt-1"><img src={mainImageUrl} className="w-full h-full object-cover border border-white/10" onError={e => { e.target.src = 'https://placehold.co/128x128'; }} /><button type="button" onClick={() => setMainImageUrl('')} className="absolute -top-2 -right-2 w-5 h-5 bg-redcard text-white flex items-center justify-center text-xs">×</button></div>
            ) : useUrlMode ? (
              <div className="flex gap-2 mt-1"><input value={mainImageUrlInput} onChange={e => setMainImageUrlInput(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={handleMainImageUrl} className="px-3 py-2 bg-turf/10 text-turf text-sm font-bold">הוסף</button></div>
            ) : (
              <label className="flex items-center justify-center w-32 h-32 border border-dashed border-white/20 cursor-pointer hover:border-turf mt-1"><Upload className="w-6 h-6 text-varnish" /><input type="file" accept="image/*" onChange={handleMainImage} className="hidden" /></label>
            )}
          </div>
          <div>
            <label className="text-xs text-varnish">נוספות</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {extraImageUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20"><img src={url} className="w-full h-full object-cover border border-white/10" onError={e => { e.target.src = 'https://placehold.co/80x80'; }} /><button type="button" onClick={() => setExtraImageUrls(p => p.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-5 h-5 bg-redcard text-white flex items-center justify-center text-xs">×</button></div>
              ))}
            </div>
            {useUrlMode ? (
              <div className="flex gap-2 mt-2"><input value={extraImageUrlInput} onChange={e => setExtraImageUrlInput(e.target.value)} placeholder="https://..." dir="ltr" className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={handleExtraImageUrl} className="px-3 py-2 bg-turf/10 text-turf text-sm font-bold">הוסף</button></div>
            ) : (
              <label className="flex items-center justify-center w-20 h-20 border border-dashed border-white/20 cursor-pointer hover:border-turf mt-2"><Plus className="w-5 h-5 text-varnish" /><input type="file" accept="image/*" multiple onChange={handleExtraImages} className="hidden" /></label>
            )}
          </div>
          {uploading && <p className="text-xs text-turf"><Loader2 className="w-3 h-3 animate-spin inline" /> מעלה...</p>}
        </div>

        {/* Local Stock by Size */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="font-heading font-bold text-sm text-turf">מלאי בארץ לפי מידה</h2>
          <p className="text-xs text-varnish">סמן כמות זמינה במלאי בארץ לכל מידה. מידה עם כמות גדולה מ-0 תוצג כ"מלאי בארץ" (הגעה עד שבוע או איסוף עצמי). שאר המידות — "משלוח מהיר" (עד 3 שבועות).</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
              <div key={size} className="flex items-center gap-2">
                <span className="text-sm text-chalk font-mono w-12">{size}</span>
                <input type="number" min="0" value={localStockSizes[size] || ''} onChange={e => handleLocalStockChange(size, e.target.value)} dir="ltr" placeholder="0" className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-chalk focus:border-turf focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Status & Flags */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-varnish block mb-1">סטטוס</label><select value={form.status} onChange={e => handleChange('status', e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none"><option value="available">זמין</option><option value="reserved">שמור</option><option value="sold">נמכר</option><option value="hidden">מוסתר</option></select></div>
          </div>
          <div><label className="text-sm text-varnish block mb-1">תיאור</label><textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none resize-none" /></div>
          <div>
            <label className="text-sm text-varnish block mb-1">תגיות</label>
            <div className="flex gap-1 flex-wrap mb-2">{form.tags.map(t => (<span key={t} className="text-xs bg-turf/10 text-turf px-2 py-1 flex items-center gap-1">{t}<button type="button" onClick={() => handleChange('tags', form.tags.filter(x => x !== t))} className="hover:text-redcard">×</button></span>))}</div>
            <div className="flex gap-2"><input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="הוסף..." className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" /><button type="button" onClick={addTag} className="px-3 bg-turf/10 text-turf text-sm">+</button></div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[{ key: 'featured', label: 'מומלץ' },{ key: 'is_new', label: 'חדש' },{ key: 'is_rare', label: 'נדיר' },{ key: 'is_retro', label: 'רטרו' },{ key: 'best_seller', label: 'נמכר ביותר' },{ key: 'limited_stock', label: 'מלאי מוגבל' }].map(f => (
              <label key={f.key} className="flex items-center gap-2 text-sm text-chalk cursor-pointer"><input type="checkbox" checked={form[f.key]} onChange={e => handleChange(f.key, e.target.checked)} className="accent-turf" />{f.label}</label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting || uploading} className="w-full bg-turf text-pitch py-3 font-heading font-bold text-sm hover:bg-turf/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'שומר...' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  );
}