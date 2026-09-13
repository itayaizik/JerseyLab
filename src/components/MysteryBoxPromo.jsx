import React from 'react';
import { Link } from 'react-router-dom';
import { BOX_TYPES } from '@/lib/mysteryBox';

// The mystery box on the home page: the offer on a navy panel, and beside it a
// photo of the JerseyLab bag the shirt arrives in.
//
// It sits after the shirts rather than under the hero: a side product placed
// above the catalogue reads as an interruption, here it reads as a discovery.

export default function MysteryBoxPromo() {
  return (
    <section className="shop-container mt-16 sm:mt-24" aria-labelledby="mystery-heading">
      <div className="grid overflow-hidden rounded-[2rem] bg-brand-navy lg:grid-cols-2">
        <div className="flex flex-col justify-center p-7 text-white sm:p-12">
          <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-brand-gold">
            חדש באתר
          </span>
          <h2 id="mystery-heading" className="mt-5 text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">מיסטרי בוקס</h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            אתם בוחרים סגנון ומידה, אנחנו בוחרים את החולצה. אותה איכות כמו בקטלוג, במחיר נמוך יותר.
          </p>
          <ul className="mt-6 max-w-sm divide-y divide-white/10 border-y border-white/10">
            {BOX_TYPES.map(box => (
              <li key={box.id} className="flex items-center justify-between py-2.5">
                <span className="text-[15px] text-white/75">{box.label}</span>
                <span className="text-base font-semibold tabular-nums text-white">₪{box.price}</span>
              </li>
            ))}
          </ul>
          <Link to="/mystery-box" className="shop-btn mt-8 self-start px-8">לבניית הבוקס</Link>
        </div>

        {/* The bag the box arrives in. The questions it used to sit beside are
            answered in full on the mystery box page. */}
        <Link to="/mystery-box" tabIndex={-1} aria-hidden="true" className="block p-2.5 sm:p-4 lg:ps-0">
          <img src="/mystery-box.jpg" alt="" loading="lazy" width="1200" height="1104"
            className="aspect-[4/3] h-full w-full rounded-3xl object-cover lg:aspect-auto" />
        </Link>
      </div>
    </section>
  );
}
