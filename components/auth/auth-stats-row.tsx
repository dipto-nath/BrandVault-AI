'use client';

import { useState, useEffect } from 'react';

interface StatItemProps {
  target: number;
  label: string;
}

function Counter({ target, label }: StatItemProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const stepTime = Math.max(Math.floor(duration / target), 80);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= target) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="flex flex-col min-w-[90px]">
      <span className="font-serif text-[26px] sm:text-[28px] font-bold text-[#16203A] tabular-nums leading-none">
        {count}
      </span>
      <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#5B6477] mt-1">
        {label}
      </span>
    </div>
  );
}

export function AuthStatsRow() {
  return (
    <div className="flex items-center gap-6 sm:gap-8 pt-3 pb-1 border-t border-[#16203A]/10 mt-3 select-none">
      <Counter target={4} label="Evidence states" />
      <div className="w-px h-8 bg-[#16203A]/12" aria-hidden="true" />
      <Counter target={5} label="Resolution actions" />
      <div className="w-px h-8 bg-[#16203A]/12" aria-hidden="true" />
      <Counter target={1} label="Passport per review" />
    </div>
  );
}
