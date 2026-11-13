'use client';

import { usePathname } from 'next/navigation';
import { Menu, Server } from 'lucide-react';

export function Header({
  onMenuClick,
}: {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="relative z-20 px-6 sm:px-10 pt-5 pb-6 text-white select-none">
      {/* ── Top Bar: URL pill + Bell + User Avatar ── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* URL address pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono backdrop-blur-md min-w-0 max-w-full"
            style={{
              background: 'rgba(15, 26, 46, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#D1DBE8',
            }}
          >
            <Server className="w-3.5 h-3.5 text-[#C6A66B] shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-none">
              localhost:3000{pathname}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] ml-0.5 shrink-0" />
          </div>
        </div>


      </div>

      {/* ── Headline Row: BrandVault AI + Taglines ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1 pb-2">
        <div>
          <h1
            className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-normal tracking-tight text-white leading-none"
            style={{ textShadow: '0 2px 14px rgba(0, 0, 0, 0.4)' }}
          >
            BrandVault AI
          </h1>
          <p
            className="text-xs sm:text-sm font-sans tracking-wide mt-2"
            style={{ color: '#A5B4CB' }}
          >
            Evidence. Integrity. Governance.
          </p>
        </div>

        {/* Far-right gold decorative slogan */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-10 h-[1px] bg-[#C6A66B]/60" />
          <span
            className="font-serif italic text-xs tracking-wider"
            style={{ color: '#C6A66B' }}
          >
            Build Trust. Ensure Integrity.
          </span>
        </div>
      </div>
    </header>
  );
}
