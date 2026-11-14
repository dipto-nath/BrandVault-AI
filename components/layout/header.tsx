'use client';

import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, ChevronDown, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();

  // Get current page title from pathname
  const getPageTitle = () => {
    const paths: Record<string, string> = {
      '/overview': 'Overview',
      '/reviews': 'Content Reviews',
      '/reviews/new': 'New Review Studio',
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
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-3 transition-colors duration-200">
      <div className="max-w-full mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg text-ink-secondary hover:text-ink-dark hover:bg-surface-hover transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-medium" aria-label="Breadcrumb">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-ink-secondary bg-surface-subtle px-2.5 py-1 rounded-md border border-border">
              <Shield className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>NexTech</span>
            </span>
            <span className="hidden sm:inline text-border-strong font-light">/</span>
            <span className="text-ink-dark font-semibold text-sm">
              {currentTitle}
            </span>
          </nav>
        </div>

        {/* Right: Actions, Search, User */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
            <input
              type="search"
              placeholder="Search facts, rules, submissions..."
              className="w-64 lg:w-72 pl-9 pr-3 py-1.5 text-xs bg-surface-subtle/80 border border-border rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              aria-label="Search"
            />
          </div>

          {/* Live Engine Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-soft/70 border border-success/20 text-[11px] font-medium text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>Audit Engine Active</span>
          </div>

          {/* Notifications */}
          <button
            className="p-2 rounded-lg text-ink-secondary hover:text-ink-dark hover:bg-surface-hover relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-critical" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-border">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-tr from-accent/20 to-amber-100 border border-accent/30 text-accent font-semibold text-xs">
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
  );
}
