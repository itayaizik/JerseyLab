import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// A row that opens to show more: the product description, the shipping terms,
// a filter group. A light grey bar with the title on one side and a chevron on
// the other; the content opens underneath on the page's own white.
//
// The panel animates its height through a grid row rather than measuring it, so
// content of any length opens smoothly without a layout pass. While closed it is
// `inert`, so a keyboard user does not tab into links they cannot see.

export default function Disclosure({ title, meta, children, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(o => !o)}
        className="flex min-h-[3.75rem] w-full items-center justify-between gap-3 rounded-2xl bg-brand-mist px-5 text-start text-[15px] font-medium text-brand-navy transition hover:bg-brand-mist-dark"
      >
        <span className="min-w-0 py-3.5 leading-snug">{title}</span>
        <span className="flex flex-shrink-0 items-center gap-2">
          {meta && <span className="text-sm font-normal text-brand-navy/50">{meta}</span>}
          <ChevronDown aria-hidden="true" className={`h-5 w-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        {...(open ? {} : { inert: '', 'aria-hidden': true })}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-3 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
