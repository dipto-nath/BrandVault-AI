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
    <header className="top-bar">
      <div className="max-w-full mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors focus-ring"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-medium" aria-label="Breadcrumb">
            <Link 
              href="/overview" 
              className="hidden sm:inline-flex items-center gap-1.5 text-ink-2 hover:text-ink bg-surface border border-line px-2.5 py-1 rounded-md transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>NexTech</span>
            </Link>
            <span className="hidden sm:inline text-line font-light">/</span>
            <span className="text-ink font-semibold text-sm">
              {currentTitle}
            </span>
          </nav>
        </div>

        {/* Right: Actions, Search, User */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
            <input
              type="search"
              placeholder="Search submissions, guidelines, facts..."
              className="input pl-10 pr-10 w-64 md:w-80 bg-surface border-line"
              aria-label="Search"
            />
          </div>

          {/* Notifications */}
          <button
            className="btn-ghost btn-icon text-ink-2 hover:text-ink relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-contradicted" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-line">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-brand-soft border border-brand/30 text-brand font-semibold text-xs">
              DR
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-ink leading-none">Demo Reviewer</div>
              <div className="text-[10px] text-ink-3 leading-tight mt-0.5">Brand Auditor</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
