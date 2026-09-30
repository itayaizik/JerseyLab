import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, AlertTriangle, Users, ImagePlus, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadErrorMessage } from '@/lib/supabaseStorage';

// The Israelis abroad, as the home page shows them (supabase/legionnaires.sql).
//
// A player and his shirts are joined by one thing: the name here has to equal
// the שם שחקן on the shirt. That is a string match, and a string match is the
// kind of link that breaks quietly - a space, a spelling, a nickname - so this
// page counts the shirts behind each player and says so out loud. A player
// showing 0 is either one we have no stock for yet, which is fine and is half
// the point of the list, or a name that has drifted from the shirts.

export default function ManageLegionnaires() {
  const [players, setPlayers] = useState([]);
  const [shirts, setShirts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({ name: '', club: '' });
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [rows, allShirts] = await Promise.all([
        base44.entities.Legionnaire.list('sort_order', 100),
        base44.entities.Shirt.list('-created_date', 500).catch(() => []),
      ]);
      setPlayers(rows);
      setShirts(allShirts);
      setError('');
    } catch {
      setError('לא הצלחנו לטעון את הרשימה. אם זו הפעם הראשונה, צריך קודם להריץ את supabase/legionnaires.sql.');
    }
    setLoading(false);
  }

  // How many shirts carry each name, and which names the shirts use that no
  // player here claims - the two halves of a link that can drift.
  const { countFor, orphanNames } = useMemo(() => {
    const counts = new Map();
    for (const s of shirts) {
      const name = String(s.player_name || '').trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
    const known = new Set(players.map(p => p.name.trim()));
    return {
      countFor: (name) => counts.get(String(name || '').trim()) || 0,
      orphanNames: [...counts.keys()].filter(n => !known.has(n)),
    };
  }, [shirts, players]);

  const patch = async (player, changes) => {
    setPlayers(p => p.map(x => (x.id === player.id ? { ...x, ...changes } : x)));
    try {
      await base44.entities.Legionnaire.update(player.id, changes);
    } catch {
      alert('לא נשמר. נסו שוב.');
      await load();
    }
  };

  // Photos go to the shirt-images bucket, which is already admin-write and
  // public-read; a second bucket for eleven faces would be a second set of
  // policies to keep right.
  const uploadPhoto = async (player, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    setUploadingId(player.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await patch(player, { image_url: file_url });
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setUploadingId('');
    }
  };

  const add = async () => {
    const name = adding.name.trim();
    if (!name) return;
    const sort_order = players.reduce((max, p) => Math.max(max, p.sort_order || 0), 0) + 1;
    try {
      await base44.entities.Legionnaire.create({ name, club: adding.club.trim(), sort_order, active: true });
      setAdding({ name: '', club: '' });
      await load();
    } catch {
      alert('לא נוסף. נסו שוב.');
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= players.length) return;
    const next = [...players];
    [next[index], next[target]] = [next[target], next[index]];
    setPlayers(next);
    await Promise.all(next.map((p, i) => base44.entities.Legionnaire.update(p.id, { sort_order: i + 1 })));
  };

  const remove = async (player) => {
    if (!window.confirm(`למחוק את ${player.name} מהרשימה? החולצות שלו יישארו בקטלוג.`)) return;
    await base44.entities.Legionnaire.delete(player.id);
    setPlayers(p => p.filter(x => x.id !== player.id));
  };

  const liveCount = players.filter(p => p.active).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl text-turf mb-1">לגיונרים</h1>
        <p className="text-sm text-varnish font-body">
          השחקנים שמופיעים בקטע "הלגיונרים" בדף הבית.
          {players.length > 0 && ` ${liveCount} מוצגים מתוך ${players.length}.`}
        </p>
      </div>

      <div className="rounded-2xl border-2 border-brand-orange/50 bg-brand-orange/10 p-4 mb-6">
        <p className="text-sm text-chalk font-body leading-relaxed">
          <strong>איך זה מתחבר:</strong> השם כאן צריך להיות זהה לשדה "שם שחקן" שבחולצה.
          המספר ליד כל שחקן הוא כמה חולצות נמצאו לו. שחקן עם 0 יופיע באתר עם הודעה
          שעוד אין חולצות שלו וכפתור לבקשת חולצה — זה בסדר גמור, אבל אם אתם בטוחים
          שיש לו חולצות, כנראה השם לא זהה.
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg mb-6 border border-redcard/40 bg-redcard/10 p-3 text-sm text-redcard">{error}</p>}

      {/* Add */}
      <div className="rounded-2xl border border-brand-line bg-white p-4 mb-6 shadow-card">
        <div className="flex flex-wrap gap-2">
          <input value={adding.name} onChange={e => setAdding(a => ({ ...a, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
            placeholder="שם השחקן, כמו שהוא כתוב בחולצה" maxLength={60}
            className="rounded-xl flex-1 min-w-[220px] bg-brand-mist border border-brand-line px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
          <input value={adding.club} onChange={e => setAdding(a => ({ ...a, club: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
            placeholder="המועדון שלו היום (לא חובה)" maxLength={60}
            className="rounded-xl flex-1 min-w-[180px] bg-brand-mist border border-brand-line px-3 py-2.5 text-sm text-chalk focus:border-turf focus:outline-none" />
          <button onClick={add} disabled={!adding.name.trim()}
            className="rounded-2xl flex items-center gap-1 bg-turf text-pitch px-4 py-2 text-sm font-bold disabled:opacity-40">
            <Plus className="w-4 h-4" /> הוסף
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-brand-line rounded-2xl">
          <Users className="w-10 h-10 mx-auto mb-3 text-brand-navy/20" />
          <p className="text-varnish text-sm font-body">עוד לא הוספת שחקנים.</p>
          <p className="text-brand-navy/40 text-xs font-body mt-1">כל עוד הרשימה ריקה, הקטע לא מופיע באתר.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player, i) => {
            const count = countFor(player.name);
            return (
              <div key={player.id}
                className={`rounded-2xl flex flex-wrap items-center gap-2 border border-brand-line p-3 ${player.active ? 'bg-white' : 'bg-brand-mist opacity-70'}`}>
                <div className="flex gap-0.5 flex-shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="הזז למעלה"
                    className="text-varnish hover:text-turf disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === players.length - 1} aria-label="הזז למטה"
                    className="text-varnish hover:text-turf disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                </div>

                {/* The face. Clicking it picks a file, so the picture is both
                    the preview and the button - there is nothing else a photo
                    in this row could be for. */}
                <label className="relative flex-shrink-0 cursor-pointer group" title={player.image_url ? 'החלפת התמונה' : 'העלאת תמונה'}>
                  {player.image_url ? (
                    <img src={player.image_url} alt="" className="h-11 w-11 rounded-full border border-brand-line object-cover object-top group-hover:opacity-75 transition-opacity" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-brand-line bg-brand-mist text-brand-navy/40 group-hover:border-turf group-hover:text-turf transition-colors">
                      {uploadingId === player.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    </span>
                  )}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingId === player.id}
                    onChange={e => { uploadPhoto(player, e.target.files?.[0]); e.target.value = ''; }} />
                </label>
                {player.image_url && (
                  <button onClick={() => patch(player, { image_url: '' })} title="הסרת התמונה"
                    className="rounded-lg px-1.5 py-1.5 text-brand-navy/30 hover:text-redcard transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <input defaultValue={player.name} maxLength={60}
                  onBlur={e => { const v = e.target.value.trim(); if (v && v !== player.name) patch(player, { name: v }); }}
                  className="rounded-xl flex-1 min-w-[180px] bg-brand-mist border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />

                <input defaultValue={player.club || ''} maxLength={60} placeholder="מועדון"
                  onBlur={e => { const v = e.target.value.trim(); if (v !== (player.club || '')) patch(player, { club: v }); }}
                  className="rounded-xl flex-1 min-w-[140px] bg-brand-mist border border-brand-line px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none" />

                <span className={`rounded-lg text-xs px-2.5 py-1.5 font-bold flex-shrink-0 ${count > 0 ? 'bg-turf/10 text-turf' : 'bg-amber-500/15 text-amber-600'}`}>
                  {count > 0 ? `${count} חולצות` : 'אין חולצות'}
                </span>

                <button onClick={() => patch(player, { active: !player.active })}
                  className="rounded-lg inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-brand-line text-brand-navy/70 hover:border-turf hover:text-turf transition-colors">
                  {player.active ? <><Eye className="w-3 h-3" /> מוצג</> : <><EyeOff className="w-3 h-3" /> מוסתר</>}
                </button>

                <button onClick={() => remove(player)} aria-label="מחק"
                  className="rounded-lg px-2 py-1.5 text-brand-navy/30 hover:text-redcard transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Names the shirts use that nobody here claims: the drift, named. */}
      {!loading && orphanNames.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 mt-6">
          <p className="text-sm text-chalk font-body flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              יש חולצות עם שם שחקן שלא מופיע ברשימה: <strong>{orphanNames.join(', ')}</strong>.
              הן לא יופיעו בקטע הלגיונרים עד שתוסיפו את השם בדיוק ככה, או תתקנו אותו ב
              <Link to="/admin/shirts" className="text-turf hover:underline mx-1">עריכת המוצרים</Link>.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
