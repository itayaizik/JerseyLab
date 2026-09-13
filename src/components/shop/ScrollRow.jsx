import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// A row of cards that scrolls sideways: swiped on a phone, stepped with round
// arrow buttons on a desktop. Used for product rows, clubs and the customer
// chat screenshots.
//
// The page is right-to-left, where the browser counts scrollLeft from zero at
// the start down into negative numbers towards the end, so positions are read
// as distances and "next" scrolls towards the left.

function ArrowButton({ direction, onClick }) {
  const next = direction === 'next';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={next ? 'הבא' : 'הקודם'}
      className={`absolute top-[40%] z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-navy shadow-lift transition hover:scale-105 lg:flex ${next ? '-left-6' : '-right-6'}`}
    >
      {next ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}

export default function ScrollRow({ label, itemClassName = '', children }) {
  const scroller = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const count = React.Children.count(children);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const position = Math.abs(el.scrollLeft);
    setCanPrev(position > 8);
    setCanNext(position < max - 8);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => { el.removeEventListener('scroll', update); observer.disconnect(); };
  }, [update, count]);

  const step = (direction) => {
    const el = scroller.current;
    if (!el) return;
    const distance = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === 'next' ? -distance : distance, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <ul
        ref={scroller}
        aria-label={label}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-6 pt-1 sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 lg:-mx-3 lg:scroll-px-3 lg:px-3"
      >
        {React.Children.map(children, child => (
          <li className={`flex-shrink-0 snap-start ${itemClassName}`}>{child}</li>
        ))}
      </ul>
      {canPrev && <ArrowButton direction="prev" onClick={() => step('prev')} />}
      {canNext && <ArrowButton direction="next" onClick={() => step('next')} />}
    </div>
  );
}
