import React, { useState } from 'react';

// Finding one shirt in a catalogue of a few hundred, by name or club.
//
// Used wherever the admin has to say which shirt something is about: the
// shirts attached to a conversation screenshot, and the shirt a review is of.

export default function ShirtPicker({ shirts, onPick, placeholder = 'חפש חולצה בקטלוג', limit = 12 }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const matches = shirts
    .filter(s => !needle || `${s.name || ''} ${s.club || ''}`.toLowerCase().includes(needle))
    .slice(0, limit);

  return (
    <div className="mt-2 border border-white/10 bg-pitch/40 p-2">
      <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-chalk focus:border-turf focus:outline-none mb-2" />
      {matches.length === 0 ? (
        <p className="text-xs text-varnish py-2 text-center">לא נמצאה חולצה.</p>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {matches.map(s => (
            <li key={s.id}>
              <button type="button" onClick={() => onPick(s)}
                className="w-full flex items-center gap-2 text-right border border-white/10 hover:border-turf px-2 py-1.5 transition-colors">
                {s.main_image && <img src={s.main_image} alt="" className="w-7 h-7 object-cover flex-shrink-0" />}
                <span className="text-xs text-chalk truncate">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
