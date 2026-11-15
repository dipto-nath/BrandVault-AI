'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Search, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { NotificationPopover } from './notification-popover';
import { SearchDialog } from './search-dialog';

export function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut (⌘K or Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K opens search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      // '/' opens search when not inside an input/textarea
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get current page title from pathname
  const getPageTitle = () => {
    const paths: Record<string, string> = {
      '/overview': 'Overview',
      '/reviews': 'Content Reviews',
      '/reviews/new': 'Review Studio',
      '/findings': 'Findings Registry',
      '/guidelines': 'Brand Guidelines',
      '/knowledge': 'Approved Knowledge',
      '/passports': 'Evidence Passports',
      '/insights': 'Governance Insights',
      '/settings': 'Workspace Settings',
    };

    for (const [path, title] of Object.entries(paths)) {
      if (pathname === path || (path !== '/overview' && pathname.startsWith(path + '/'))) {
        return title;
      }
    }
    return 'Dashboard';
  };

  const currentTitle = getPageTitle();

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-sand-dark/40 px-6 py-3 transition-colors duration-200">
        <div className="max-w-full mx-auto flex items-center justify-between gap-4">
          {/* Left: Mobile Menu & Breadcrumbs */}
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 rounded-lg text-ink-secondary hover:text-ink-dark hover:bg-sand/60 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-medium" aria-label="Breadcrumb">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-ink-secondary bg-surface-subtle px-2.5 py-1 rounded-md border border-sand-dark/40 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-brand shrink-0" />
                <span>NexTech</span>
              </span>
              <span className="hidden sm:inline text-sand-dark font-light">/</span>
              <span className="text-ink-dark font-semibold text-sm">
                {currentTitle}
              </span>
            </nav>
          </div>

          {/* Right: Actions, Search, User */}
          <div className="flex items-center gap-3">
            {/* Quick Search Button (Desktop) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="relative hidden md:flex items-center justify-between w-64 lg:w-76 pl-9 pr-2.5 py-1.5 text-xs bg-surface-subtle/80 hover:bg-surface border border-sand-dark/50 hover:border-sand-dark rounded-xl text-ink-muted hover:text-ink-secondary transition-all text-left shadow-2xs group"
              aria-label="Search facts, rules, submissions"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted group-hover:text-brand transition-colors" />
              <span className="truncate">Search facts, rules, submissions...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sand/70 border border-sand-dark/40 text-[10px] font-mono font-semibold text-ink-muted">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-ink-secondary hover:text-ink-dark hover:bg-sand/60 transition-colors"
              aria-label="Open search dialog"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Live Engine Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-evidence-supported/10 border border-evidence-supported/20 text-[11px] font-medium text-evidence-supported transition-all"
              title="Real-time multi-stage verification against approved specifications and brand guidelines"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-evidence-supported animate-pulse" />
              <span>AI checks: on</span>
            </div>

            {/* Interactive Notifications Popover */}
            <NotificationPopover />

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-sand-dark/40">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-brand/10 border border-brand/20 text-brand font-semibold text-xs shadow-2xs">
                DR
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-ink-dark leading-none">Demo Reviewer</div>
                <div className="text-[10px] text-ink-muted leading-tight mt-0.5">Reviewer</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Interactive Search & Command Palette */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
