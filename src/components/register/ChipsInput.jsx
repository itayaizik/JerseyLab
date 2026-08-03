import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function ChipsInput({ values = [], onChange, placeholder }) {
  const [text, setText] = useState('');

  const add = () => {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText('');
  };

  const remove = (v) => onChange(values.filter(x => x !== v));

  return (
    <div>
      {values.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {values.map(v => (
            <span key={v} className="inline-flex items-center gap-1 bg-[#1B2A4A] text-white text-xs px-2 py-1 font-body">
              {v}
              <button type="button" onClick={() => remove(v)} className="opacity-70 hover:opacity-100" aria-label="הסר">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-body" />
        <button type="button" onClick={add}
          className="px-3 border-2 border-[#1B2A4A] bg-[#F2ECD9] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white transition-colors"
          aria-label="הוסף">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}