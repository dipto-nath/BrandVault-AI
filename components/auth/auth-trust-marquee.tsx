'use client';

import { ShieldCheck, FileCheck, Users, Lock, Award, Sparkles } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, label: 'Evidence passports' },
  { icon: FileCheck, label: 'Citation-backed' },
  { icon: Users, label: 'Human-in-the-loop' },
  { icon: Lock, label: 'Audit trail' },
  { icon: Award, label: 'Approved sources only' },
  { icon: Sparkles, label: 'WCAG 2.2 compliant' },
];

export function AuthTrustMarquee() {
  return (
    <div
      className="relative w-full overflow-hidden py-2 select-none border-t border-[#16203A]/8 mt-auto"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-8 items-center">
        {/* First copy */}
        {BADGES.map((item, idx) => (
          <div
            key={`b1-${idx}`}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#5B6477] whitespace-nowrap bg-white/40 px-2.5 py-1 rounded-full border border-[#16203A]/6 shadow-2xs"
          >
            <item.icon className="w-3.5 h-3.5 text-[#3B4BC8]" />
            <span>{item.label}</span>
          </div>
        ))}
        {/* Second copy for seamless looping */}
        {BADGES.map((item, idx) => (
          <div
            key={`b2-${idx}`}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#5B6477] whitespace-nowrap bg-white/40 px-2.5 py-1 rounded-full border border-[#16203A]/6 shadow-2xs"
          >
            <item.icon className="w-3.5 h-3.5 text-[#3B4BC8]" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
