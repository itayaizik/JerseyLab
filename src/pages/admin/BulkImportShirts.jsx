import React, { useState } from 'react';
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { decodeCsvBytes, rowsToObjects, validateDecoded } from '@/lib/csvImport';

export default function BulkImportShirts() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [encoding, setEncoding] = useState('');
  const [hebrewDetected, setHebrewDetected] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrors([]);
    setResults(null);
    setEncoding('');
    setHebrewDetected(false);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setErrors(['בחר קובץ CSV']); return; }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const { text, encoding: enc } = decodeCsvBytes(evt.target.result);
        const validation = validateDecoded(text);
        if (!validation.ok) {
          setErrors(validation.issues);
          setUploading(false);
          return;
        }
        const { records: rows } = rowsToObjects(text);
        setEncoding(enc);
        setHebrewDetected(validation.hasHebrew);
        setPreview(rows[0] || null);
        if (!rows.length) { setErrors(['אין שורות בקובץ']); setUploading(false); return; }

        const user = await base44.auth.me();
        const success = [];
        const failed = [];

        for (const row of rows) {
          try {
            const shirt = await base44.entities.Shirt.create({
              name: row.name,
              club: row.club || '',
              national_team: row.national_team || '',
              league: row.league || '',
              season: row.season || '',
              player_name: row.player_name || '',
              gender_category: row.gender_category || 'men',
              sport_category: row.sport_category || 'football',
              price: Number(row.price) || 0,
              sale_price: row.sale_price ? Number(row.sale_price) : null,
              condition: row.condition || 'new',
              description: row.description || '',
              tags: row.tags ? row.tags.split(';').map(t => t.trim()) : [],
              status: ['available','reserved','sold','hidden'].includes(row.status) ? row.status : 'available',
              featured: row.featured === 'true' || row.featured === '1',
              is_new: row.is_new === 'true' || row.is_new === '1',
              is_rare: row.is_rare === 'true' || row.is_rare === '1',
              is_retro: row.is_retro === 'true' || row.is_retro === '1',
              best_seller: row.best_seller === 'true' || row.best_seller === '1',
              main_image: row.main_image || '',
              extra_images: row.extra_images ? row.extra_images.split(';') : [],
              sizes: {},
              views_count: 0,
              interest_count: 0,
            });

            // Log activity
            await base44.entities.AdminLog.create({
              action: 'הוסיף חולצה (bulk)',
              entity_type: 'Shirt',
              entity_id: shirt.id,
              details: row.name,
              admin_user_id: user.id,
            });

            success.push(row.name);
          } catch (err) {
            failed.push({ name: row.name, error: err.message });
          }
        }

        setResults({ success: success.length, failed: failed.length });
        if (failed.length) setErrors(failed.map(f => `${f.name}: ${f.error}`));
        setFile(null);
      } catch (err) {
        setErrors([err.message]);
      }
      setUploading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h1 className="font-heading font-black text-2xl mb-2 text-turf">ייבוא מסיבי של חולצות</h1>
      <p className="text-varnish text-sm mb-6">העלה קובץ CSV כדי להוסיף מלא חולצות בפעם אחת</p>

      <div className="max-w-2xl bg-white/5 border border-white/10 p-6 rounded">
        {/* Template Download */}
        <div className="mb-6 pb-6 border-b border-white/10">
          <p className="text-sm text-varnish mb-2">דוגמת CSV:</p>
          <code className="block bg-pitch/50 p-3 text-xs text-chalk overflow-x-auto rounded mb-3">
            name,club,national_team,league,season,player_name,gender_category,sport_category,price,sale_price,condition,description,tags,status,featured,is_new,is_rare,is_retro,best_seller,main_image,extra_images{'\n'}
            Manchester United 1999,Manchester United,,Premier League,1998/99,Beckham,men,football,150,120,new,Treble winning shirt,retro;iconic,,true,true,true,false,false,https://...,https://...;https://...
          </code>
          <p className="text-xs text-white/50">
            • <strong>name</strong> - חובה | <strong>price</strong> - חובה | <strong>tags</strong> - בנקודה-פסיק
            {' '} | <strong>featured,is_new,is_rare,is_retro,best_seller</strong> - true/false
            {' '} | <strong>extra_images</strong> - קישורים מופרדים בנקודה-פסיק
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded cursor-pointer hover:border-turf transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-varnish mb-2" />
                <p className="text-sm text-varnish">{file ? file.name : 'בחר קובץ CSV או גרור לכאן'}</p>
              </div>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <button type="submit" disabled={!file || uploading}
            className="w-full bg-turf text-pitch py-3 font-heading font-bold text-sm hover:bg-turf/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'מייבא...' : 'ייבא חולצות'}
          </button>
        </form>

        {/* Encoding + pre-import validation preview */}
        {preview && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded text-xs text-white/70 space-y-1">
            <p>
              קידוד זוהה: <span className="text-chalk font-mono">{encoding}</span>
              {' '}·{' '}
              עברית:{' '}
              <span className={hebrewDetected ? 'text-green-400' : 'text-white/40'}>
                {hebrewDetected ? 'זוהתה ✓' : 'לא זוהתה'}
              </span>
            </p>
            <p>
              תצוגה מקדימה — שם: <span className="text-chalk">{preview.name}</span>
              {preview.club ? <>{' '}· קבוצה: <span className="text-chalk">{preview.club}</span></> : null}
              {preview.league ? <>{' '}· ליגה: <span className="text-chalk">{preview.league}</span></> : null}
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded">
            <div className="flex gap-2 items-start mb-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-500">הייבוא הסתיים!</p>
                <p className="text-xs text-green-400">{results.success} חולצות הוספו בהצלחה</p>
                {results.failed > 0 && <p className="text-xs text-yellow-400">{results.failed} נכשלו</p>}
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded space-y-1 max-h-48 overflow-y-auto">
            {errors.map((err, i) => (
              <div key={i} className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{err}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}