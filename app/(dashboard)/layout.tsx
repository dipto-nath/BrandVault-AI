'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { X } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const workspaceName = 'Tech';
  const userName = 'No Reviewer';

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: '#0F1A2E' }}
    >
      {/* ── Desktop Sticky Sidebar ── */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-30">
        <Sidebar workspaceName={workspaceName} userName={userName} />
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full flex flex-col z-10 shadow-2xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 z-20"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              workspaceName={workspaceName}
              userName={userName}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Main Dashboard Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* ── Upper Atmospheric Cloudscape Header ── */}
        <div className="relative overflow-hidden shrink-0">
          {/* Cloud image asset */}
          <div
            className="absolute inset-0 bg-cover bg-top pointer-events-none"
            style={{
              backgroundImage: "url('/clouds.jpg')",
              filter: 'brightness(0.88) contrast(1.15)',
            }}
          />

          {/* Deep navy & sunset gold atmospheric overlays */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(15, 26, 46, 0.45) 0%, rgba(15, 26, 46, 0.75) 60%, #0F1A2E 100%), linear-gradient(90deg, rgba(15, 26, 46, 0.85) 0%, rgba(15, 26, 46, 0.25) 50%, rgba(15, 26, 46, 0.7) 100%)',
            }}
          />

          {/* Celestial crescent & radiant golden atmosphere on top-right */}
          <div
            className="pointer-events-none absolute -top-10 right-10 w-[480px] h-[480px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 220, 140, 0.2) 0%, rgba(198, 166, 107, 0.08) 40%, transparent 70%)',
              filter: 'blur(36px)',
            }}
          />
          <div
            className="pointer-events-none absolute -top-20 right-16 w-[400px] h-[400px] rounded-full border border-white/20"
            style={{
              boxShadow: '0 0 50px rgba(198, 166, 107, 0.35)',
              maskImage: 'linear-gradient(to bottom left, black 25%, transparent 60%)',
              WebkitMaskImage: 'linear-gradient(to bottom left, black 25%, transparent 60%)',
            }}
          />

          {/* Header Bar + Title */}
          <Header onMenuClick={() => setMobileMenuOpen(true)} />
        </div>

        {/* ── Central Content Workspace: Warm Off-White / Soft Cream (#F5F2EB) ── */}
        <div
          className="flex-1 w-full rounded-t-[2.25rem] shadow-[0_-8px_30px_rgba(0,0,0,0.25)] relative z-10"
          style={{
            background: '#F5F2EB',
            borderTop: '1px solid #E5E0D6',
          }}
        >
          <main className="px-5 sm:px-8 lg:px-10 py-7 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
