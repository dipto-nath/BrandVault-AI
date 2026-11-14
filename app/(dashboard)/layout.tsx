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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* ── Desktop Sticky Sidebar ── */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-30">
        <Sidebar workspaceName={workspaceName} userName={userName} />
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full flex flex-col z-10 shadow-xl">
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
        {/* ── Clean Header ── */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* ── Central Content Workspace ── */}
        <main className="flex-1 w-full">
          <div className="layout-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
