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
        <div className="mb-2.5 flex flex-wrap gap-2">
          {values.map(v => (
            <span key={v} className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy py-1.5 pe-2 ps-3 text-[13px] text-white">
              {v}
              <button type="button" onClick={() => remove(v)} className="flex h-5 w-5 items-center justify-center rounded-full opacity-70 transition hover:bg-white/15 hover:opacity-100" aria-label={`הסרת ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="shop-field flex-1" />
        <button type="button" onClick={add} aria-label="הוספה"
          className="flex h-[3.25rem] w-[3.25rem] flex-shrink-0 items-center justify-center rounded-2xl bg-brand-mist text-brand-navy transition hover:bg-brand-navy hover:text-white">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
