'use client';

import { motion } from 'framer-motion';

export function AuthHeroHeadline() {
  return (
    <div className="relative z-10 w-full max-w-[540px]">
      {/* Quiet eyebrow line */}
      <div className="inline-flex items-center gap-2 mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3B4BC8]" />
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#5B6477]">
          Evidence-first brand governance
        </span>
      </div>

      {/* Main Title with Display Serif */}
      <h1 className="auth-hero-title font-serif font-bold text-[#16203A] leading-[1.08] tracking-tight">
        <span>Every claim, </span>
        <span className="relative inline-block text-[#3B4BC8]">
          checked
          <span
            className="absolute inset-x-0 bottom-0.5 h-[3px] bg-[#3B4BC8]/25 rounded-full"
            aria-hidden="true"
          />
        </span>
        <span> before it goes live.</span>
      </h1>
    </div>
  );
}
