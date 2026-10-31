import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// A page of site settings, grouped under headings.
//
// Settings are key/value rows, so a page of them is a list of fields and one
// save button - and that was the whole problem with ניהול > הגדרות אתר: every
// setting the shop had, twenty-eight of them, in one flat column with the top
// bar's colour between the WhatsApp link and the home page banner.
//
// Groups are the fix, and a second page using the same component is the rest
// of it: the things that interrupt a visitor - the strip, the banner, the
// popup - are their own job and now have their own page.
//
// `groups` is [{ title, help, fields }]. A field is
// { key, label, type, placeholder, help, options }, where type is 'text'
// (default), 'textarea', 'select' or 'color'.

const inputClass = 'rounded-lg w-full bg-white border border-brand-line px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none';

// A key that holds a URL is typed left to right whatever the page direction.
const isLtr = (key) => key.includes('link') || key.includes('href') || key === 'email';

export function SettingField({ field, value, onChange }) {
  const id = `setting-${field.key}`;
  return (
    <div>
      <label htmlFor={id} className="text-sm text-varnish block mb-1">{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea id={id} value={value} rows={4} onChange={e => onChange(e.target.value)}
          className={`${inputClass} resize-none`} />
      ) : field.type === 'select' ? (
        <select id={id} value={value} onChange={e => onChange(e.target.value)} className={inputClass}>
          {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : field.type === 'color' ? (
        // The swatch and the hex side by side: one to pick with, one to paste
        // a brand colour into.
        <div className="flex items-center gap-2">
          <input type="color" aria-label={field.label} value={value || field.placeholder || '#000000'}
            onChange={e => onChange(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded border border-brand-line bg-white p-1" />
          <input id={id} value={value} placeholder={field.placeholder || ''} dir="ltr"
            onChange={e => onChange(e.target.value)} className={inputClass} />
        </div>
      ) : (
        <input id={id} value={value} placeholder={field.placeholder || ''}
          onChange={e => onChange(e.target.value)}
          dir={isLtr(field.key) ? 'ltr' : 'rtl'} className={inputClass} />
      )}
      {/* Says where the value shows up, so a field can be changed with some
          idea of what it will do. */}
      {field.help && <p className="text-xs text-brand-navy/60 font-body mt-1 leading-relaxed">{field.help}</p>}
    </div>
  );
}

// Writes one setting, creating its row the first time. The new row is kept, so
// saving again updates it instead of adding a second one.
export async function writeSetting(key, value, known) {
  const existing = known.find(r => r.key === key);
  if (existing) {
    await base44.entities.SiteSetting.update(existing.id, { value });
    return known;
  }
  if (!value) return known;
  const created = await base44.entities.SiteSetting.create({ key, value });
  return created ? [...known, created] : known;
}

export default function SettingsForm({ title, intro, groups }) {
  const [settings, setSettings] = useState({});
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.SiteSetting.list('-created_date', 200).then(data => {
      setRecords(data);
      const obj = {};
      data.forEach(d => { obj[d.key] = d.value; });
      setSettings(obj);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let known = records;
      for (const group of groups) {
        for (const field of group.fields) {
          known = await writeSetting(field.key, settings[field.key] || '', known);
        }
      }
      setRecords(known);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('השמירה נכשלה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-black text-2xl text-turf">{title}</h1>
      {intro && <p className="text-sm text-brand-navy/60 mt-1 mb-6 leading-relaxed">{intro}</p>}

      <div className="space-y-6">
        {groups.map(group => (
          <section key={group.title} className="rounded-2xl border border-brand-line bg-white p-5">
            <h2 className="font-heading font-bold text-base text-chalk">{group.title}</h2>
            {group.help && <p className="text-xs text-brand-navy/55 mt-1 leading-relaxed">{group.help}</p>}
            {/* Some groups can show what they are about to make. A colour is
                hard to judge from a hex and easy to judge from the thing. */}
            {group.preview && <div className="mt-4">{group.preview(settings)}</div>}
            <div className="mt-4 space-y-4">
              {group.fields.map(field => (
                <SettingField key={field.key} field={field} value={settings[field.key] || ''}
                  onChange={value => setSettings(p => ({ ...p, [field.key]: value }))} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {error && <p className="text-redcard text-sm mt-4">{error}</p>}
      <button onClick={handleSave} disabled={saving}
        className="rounded-2xl bg-turf text-pitch px-6 py-3 font-heading font-bold text-sm hover:bg-turf/90 disabled:opacity-50 flex items-center gap-2 mt-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור'}
      </button>
    </div>
  );
}
