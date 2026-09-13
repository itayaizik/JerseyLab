import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SORT_OPTIONS } from '@/lib/sortShirts';

// A native select dressed as a line of accent text: the phone's own picker on
// touch, the keyboard behaviour everyone already knows everywhere else.
export default function SortSelect({ value, onChange }) {
  return (
    <label className="relative inline-flex items-center gap-1.5 text-[15px] text-brand-orange-ink sm:text-base">
      <span className="hidden sm:inline">מיון:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="מיון החולצות"
        className="cursor-pointer appearance-none rounded-xl bg-transparent py-2 pe-8 ps-1 font-semibold text-brand-orange-ink focus:outline-none"
      >
        {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute end-1 h-5 w-5" aria-hidden="true" />
    </label>
  );
}
