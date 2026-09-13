import React from 'react';

// The shape of a product card while it loads, so the grid does not jump when
// the real cards arrive.
export default function ShirtCardSkeleton({ featured = false }) {
  return (
    <div className={`shop-card h-full ${featured ? 'p-3 sm:p-4' : 'p-2.5 sm:p-3'}`} aria-hidden="true">
      <div className="aspect-square rounded-[1.125rem] skeleton" />
      <div className="px-2 pb-2 pt-4">
        <div className="h-4 w-4/5 rounded-full skeleton" />
        <div className="mt-2 h-4 w-1/2 rounded-full skeleton" />
        <div className="my-3.5 h-px bg-brand-line" />
        <div className="h-4 w-16 rounded-full skeleton" />
      </div>
    </div>
  );
}
