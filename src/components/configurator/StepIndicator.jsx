import React from 'react';

export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5" dir="ltr">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-[#E8622A]' : i < current ? 'w-4 bg-[#1B2A4A]' : 'w-4 bg-[#1B2A4A]/20'
            }`}
          />
          {i === current && (
            <span className="text-[10px] font-heading font-bold text-[#E8622A] uppercase tracking-wide">{label}</span>
          )}
        </div>
      ))}
    </div>
  );
}