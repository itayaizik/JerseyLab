import React from 'react';

export default function ShirtCardSkeleton() {
  return (
    <div className="border border-gray-200 bg-white">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 skeleton rounded w-16" />
          <div className="h-3 skeleton rounded w-20" />
        </div>
      </div>
    </div>
  );
}