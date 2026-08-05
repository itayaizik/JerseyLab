import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasLocalStock } from '@/components/ShippingBadge';

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const kidsSizeOptions = ['6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y'];

export default function AddShirt() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', club: '', national_team: '', league: '', season: '', player_name: '',
    gender_category: 'men', sport_category: 'football',
    price: '', sale_price: '',
    condition: 'new', description: '', tags: [],
    status: 'available', featured: false, is_new: true, is_rare: false, is_retro: false, best_seller: false, limited_stock: false,
    local_stock_player_version: false, local_stock_custom_name: '',
  });
  const [sizes, setSizes] = useState({});
  const [localStockSizes, setLocalStockSizes] = useState({});
  const [mainImage, setMainImage] = useState(null);
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [mainImageUrlInput, setMainImageUrlInput] = useState('');
  const [extraImages, setExtraImages] = useState([]);
  const [extraImageUrls, setExtraImageUrls] = useState([]);
  const [extraImageUrlInput, setExtraImageUrlInput] = useState('');
  const [useUrlMode, setUseUrlMode] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  const handleSizeChange = (size, qty) => {
    setSizes(p => ({ ...p, [size]: Math.max(0, parseInt(qty) || 0) }));
  };

  const handleLocalStockChange = (size, qty) => {
    setLocalStockSizes(p => ({ ...p, [size]: Math.max(0, parseInt(qty) || 0) }));
  };

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
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setExtraImageUrls(p => [...p, ...urls]);
    setUploading(false);
  };

  const handleExtraImageUrl = () => {
    if (extraImageUrlInput.trim()) {
      setExtraImageUrls(p => [...p, extraImageUrlInput.trim()]);
      setExtraImageUrlInput('');
    }
  };

  const removeExtraImage = (idx) => {
    setExtraImageUrls(p => p.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      handleChange('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    handleChange('tags', form.tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'שדה חובה';
    if (!form.price || isNaN(form.price)) errs.price = 'שדה חובה';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    const shirt = await base44.entities.Shirt.create({
      ...form,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      local_stock_sizes: localStockSizes,
      in_stock_local: hasLocalStock({ local_stock_sizes: localStockSizes }),
      main_image: mainImageUrl,
      extra_images: extraImageUrls,
      sizes,
      views_count: 0,
      interest_count: 0,
    });

    // Log activity
    const user = await base44.auth.me();
    await base44.entities.AdminLog.create({
      action: 'הוסיף חולצה',
      entity_type: 'Shirt',
      entity_id: shirt.id,
      details: form.name,
      admin_user_id: user.id,
    });

    setSubmitting(false);
    navigate('/admin/shirts');
  };

  const currentSizeOptions = form.gender_category === 'kids' ? kidsSizeOptions : sizeOptions;

  return (
    <div>
      <h1 className="font-heading font-black text-2xl mb-6 text-turf">הוסף חולצה חדשה</h1>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="font-heading font-bold text-sm text-turf">פרטי חולצה</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-varnish block mb-1">שם חולצה *</label>
              <input value={form.name} onChange={e => handleChange('name', e.target.value)}
                className={`w-full bg-white/5 border px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none ${errors.name ? 'border-redcard' : 'border-white/10'}`} />
              {errors.name && <p className="text-redcard text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">קבוצה</label>
              <input value={form.club} onChange={e => handleChange('club', e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">נבחרת</label>
              <input value={form.national_team} onChange={e => handleChange('national_team', e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">ליגה</label>
              <input value={form.league} onChange={e => handleChange('league', e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">עונה</label>
              <input value={form.season} onChange={e => handleChange('season', e.target.value)} placeholder="2023/24"
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">שחקן</label>
              <input value={form.player_name} onChange={e => handleChange('player_name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">קטגוריה</label>
              <select value={form.gender_category} onChange={e => handleChange('gender_category', e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none">
                <option value="men">גברים</option>
                <option value="kids">ילדים</option>
                <option value="unisex">יוניסקס</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">ענף</label>
              <select value={form.sport_category} onChange={e => handleChange('sport_category', e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none">
                <option value="football">כדורגל</option>
                <option value="basketball">כדורסל</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="font-heading font-bold text-sm text-turf">מחיר ומצב</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-varnish block mb-1">מחיר (₪) *</label>
              <input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)} dir="ltr"
                className={`w-full bg-white/5 border px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none ${errors.price ? 'border-redcard' : 'border-white/10'}`} />
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">מחיר מבצע (₪)</label>
              <input type="number" value={form.sale_price} onChange={e => handleChange('sale_price', e.target.value)} dir="ltr"
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-varnish block mb-1">מצב</label>
              <select value={form.condition} onChange={e => handleChange('condition', e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none">
                <option value="new">חדש</option>
                <option value="like_new">כמו חדש</option>
                <option value="used">משומש</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sizes */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="font-heading font-bold text-sm text-turf">מידות ומלאי</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {currentSizeOptions.map(size => (
              <div key={size} className="flex items-center gap-2">
                <span className="text-sm text-chalk font-mono w-12">{size}</span>
                <input type="number" min="0" value={sizes[size] || ''} onChange={e => handleSizeChange(size, e.target.value)} dir="ltr"
                  placeholder="0" className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-chalk focus:border-turf focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading font-bold text-sm text-turf">תמונות</h2>
            <label className="flex items-center gap-2 text-xs text-varnish cursor-pointer">
              <input type="checkbox" checked={useUrlMode} onChange={e => setUseUrlMode(e.target.checked)} className="accent-turf" />
              השתמש בקישורי תמונות
            </label>
          </div>
          {!useUrlMode && (
            <p className="text-xs bg-redcard/10 text-redcard border border-redcard/30 p-2 rounded">
              העלאת קבצים משתמשת בקרדיטי אינטגרציה של Base44. כדי לא לבזבז קרדיטים, מומלץ להשתמש בקישורי תמונה במקום.
            </p>
          )}

          {/* Main Image */}
          <div>
            <label className="text-sm text-varnish block mb-2">תמונה ראשית</label>
            {mainImageUrl ? (
              <div className="relative w-32 h-32">
                <img src={mainImageUrl} className="w-full h-full object-cover border border-white/10" onError={e => { e.target.src = 'https://placehold.co/128x128'; }} />
                <button type="button" onClick={() => setMainImageUrl('')} className="absolute -top-2 -right-2 w-5 h-5 bg-redcard text-white flex items-center justify-center text-xs">×</button>
              </div>
            ) : useUrlMode ? (
              <div className="flex gap-2">
                <input value={mainImageUrlInput} onChange={e => setMainImageUrlInput(e.target.value)} placeholder="https://..." dir="ltr"
                  className="flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
                <button type="button" onClick={handleMainImageUrl} className="px-4 py-2.5 bg-turf/10 text-turf text-sm font-bold">הוסף</button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-32 h-32 border border-dashed border-white/20 cursor-pointer hover:border-turf transition-colors">
                <Upload className="w-6 h-6 text-varnish" />
                <input type="file" accept="image/*" onChange={handleMainImage} className="hidden" />
              </label>
            )}
          </div>

          {/* Extra Images */}
          <div>
            <label className="text-sm text-varnish block mb-2">תמונות נוספות</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {extraImageUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={url} className="w-full h-full object-cover border border-white/10" onError={e => { e.target.src = 'https://placehold.co/80x80'; }} />
                  <button type="button" onClick={() => removeExtraImage(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-redcard text-white flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
            {useUrlMode ? (
              <div className="flex gap-2">
                <input value={extraImageUrlInput} onChange={e => setExtraImageUrlInput(e.target.value)} placeholder="https://..." dir="ltr"
                  className="flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
                <button type="button" onClick={handleExtraImageUrl} className="px-4 py-2.5 bg-turf/10 text-turf text-sm font-bold">הוסף</button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-20 h-20 border border-dashed border-white/20 cursor-pointer hover:border-turf transition-colors">
                <Plus className="w-5 h-5 text-varnish" />
                <input type="file" accept="image/*" multiple onChange={handleExtraImages} className="hidden" />
              </label>
            )}
          </div>
          {uploading && <p className="text-xs text-turf flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> מעלה תמונות...</p>}
        </div>

        {/* Local Stock by Size */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="font-heading font-bold text-sm text-turf">מלאי בארץ לפי מידה</h2>
          <p className="text-xs text-varnish">סמן כמות זמינה במלאי בארץ לכל מידה. מידה עם כמות גדולה מ-0 תוצג כ"מלאי בארץ" (הגעה עד שבוע או איסוף עצמי). שאר המידות — "משלוח מהיר" (עד 3 שבועות).</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
              <div key={size} className="flex items-center gap-2">
                <span className="text-sm text-chalk font-mono w-12">{size}</span>
                <input type="number" min="0" value={localStockSizes[size] || ''} onChange={e => handleLocalStockChange(size, e.target.value)} dir="ltr" placeholder="0"
                  className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-chalk focus:border-turf focus:outline-none" />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-varnish mb-3">מה בדיוק מודפס על הפריט הספציפי שבמלאי? זה יוצג ללקוח כאפשרות "קנה בדיוק את זו" לעומת הזמנה בהתאמה אישית.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 text-sm text-chalk cursor-pointer flex-shrink-0">
                <input type="checkbox" checked={form.local_stock_player_version} onChange={e => handleChange('local_stock_player_version', e.target.checked)} className="accent-turf" />
                גרסת שחקן
              </label>
              <input value={form.local_stock_custom_name} onChange={e => handleChange('local_stock_custom_name', e.target.value)} placeholder="שם ומספר על הגב (אם יש) — למשל Ronaldo 7"
                className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Tags & Flags */}
        <div className="border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="font-heading font-bold text-sm text-turf">תגיות ודגלים</h2>
          <div>
            <label className="text-sm text-varnish block mb-1">תיאור</label>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none resize-none" />
          </div>
          <div>
            <label className="text-sm text-varnish block mb-1">תגיות</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.tags.map(t => (
                <span key={t} className="text-xs bg-turf/10 text-turf px-2 py-1 flex items-center gap-1">
                  {t} <button type="button" onClick={() => removeTag(t)} className="hover:text-redcard">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="הוסף תגית..." className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />
              <button type="button" onClick={addTag} className="px-3 py-2 bg-turf/10 text-turf text-sm font-bold hover:bg-turf/20">+</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="text-sm text-varnish block mb-1">סטטוס</label>
            <select value={form.status} onChange={e => handleChange('status', e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none md:col-span-2">
              <option value="available">זמין</option>
              <option value="reserved">שמור</option>
              <option value="sold">נמכר</option>
              <option value="hidden">מוסתר</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-4">
            {[
              { key: 'featured', label: 'מומלץ' },
              { key: 'is_new', label: 'חדש' },
              { key: 'is_rare', label: 'נדיר' },
              { key: 'is_retro', label: 'רטרו' },
              { key: 'best_seller', label: 'נמכר ביותר' },
              { key: 'limited_stock', label: 'מלאי מוגבל' },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-2 text-sm text-chalk cursor-pointer">
                <input type="checkbox" checked={form[f.key]} onChange={e => handleChange(f.key, e.target.checked)}
                  className="accent-turf" />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting || uploading}
          className="w-full bg-turf text-pitch py-3 font-heading font-bold text-sm hover:bg-turf/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'שומר...' : 'הוסף חולצה'}
        </button>
      </form>
    </div>
  );
}