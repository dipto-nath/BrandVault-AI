'use client';

import React from 'react';

export function TableSkeletonRows({
  cols = 5,
  rows = 5,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <div className="divide-y divide-line/40 animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 rounded bg-[#E4DCCB]/45 ${
                cIdx === 0
                  ? 'w-20'
                  : cIdx === 1
                  ? 'flex-1 max-w-sm'
                  : cIdx === 2
                  ? 'w-24'
                  : 'w-28'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="proof-card animate-pulse space-y-6" aria-hidden="true">
      <div className="h-6 w-48 bg-[#E4DCCB]/50 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-[#E4DCCB]/40 rounded-lg" />
        <div className="h-10 bg-[#E4DCCB]/40 rounded-lg" />
      </div>
      <div className="h-44 bg-[#E4DCCB]/30 rounded-lg" />
      <div className="h-10 w-32 bg-[#E4DCCB]/60 rounded-lg" />
    </div>
  );
}
