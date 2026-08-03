import React from 'react';

export default function NameNumberInput({ customName, customNumber, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-500 font-body block mb-1.5">שם להדפסה</label>
        <input value={customName} onChange={e => onChange('customName', e.target.value.slice(0, 20).replace(/[^a-zA-Z0-9 \-]/g, ''))}
          placeholder="RONALDO" dir="ltr" maxLength={20} autoComplete="off"
          className="w-full border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-mono" />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-body block mb-1.5">מספר</label>
        <input value={customNumber} onChange={e => onChange('customNumber', e.target.value.slice(0, 3).replace(/[^0-9]/g, ''))}
          placeholder="7" type="text" inputMode="numeric" dir="ltr" maxLength={3} autoComplete="off"
          className="w-full border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-mono" />
      </div>
    </div>
  );
}