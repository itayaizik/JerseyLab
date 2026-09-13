import React from 'react';

export default function StepIndicator({ steps, current }) {
  return (
    <div className="mb-5 flex items-center justify-center gap-1.5" dir="ltr">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-brand-orange' : i < current ? 'w-4 bg-brand-navy' : 'w-4 bg-brand-line'
            }`}
          />
          {i === current && (
            <span className="text-xs font-semibold text-brand-orange-ink">{label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
