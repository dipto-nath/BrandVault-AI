'use client';

import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, ChevronDown, Shield } from 'lucide-react';
import Link from 'next/link';

export function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  
  // Get current page title from pathname
  const getPageTitle = () => {
    const paths: Record<string, { title: string; description: string }> = {
      '/overview': { title: 'Overview', description: 'Brand governance dashboard and key metrics' },
      '/reviews': { title: 'Content Reviews', description: 'Manage and review submitted content' },
      '/reviews/new': { title: 'New Review', description: 'Submit content for brand verification' },
      '/guidelines': { title: 'Brand Guidelines', description: 'Manage brand rules and enforcement policies' },
      '/knowledge': { title: 'Approved Knowledge', description: 'Verified facts and source documents' },
      '/passports': { title: 'Evidence Passports', description: 'Immutable verification records' },
      '/insights': { title: 'Governance Insights', description: 'Analytics and governance intelligence' },
      '/settings': { title: 'Settings', description: 'Workspace configuration and governance roles' },
    };
    
    // Find matching path (handle dynamic routes)
    for (const [path, info] of Object.entries(paths)) {
      if (pathname === path || (path !== '/overview' && pathname.startsWith(path + '/'))) {
        return info;
      }
    }
    return { title: 'Dashboard', description: 'Brand governance workspace' };
  };
  
  const pageInfo = getPageTitle();

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border px-6 py-4">
      <div className="max-w-full mx-auto">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                aria-label="Toggle navigation menu"
                className="lg:hidden btn-ghost btn-icon text-ink-secondary hover:text-ink-dark"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Workspace Selector */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
              <Shield className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-sm font-medium text-ink-dark">NexaTech</span>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="search"
                placeholder="Search submissions, guidelines, facts..."
                className="input pl-10 pr-10 w-64 md:w-80 bg-surface-subtle border-border"
                aria-label="Search"
              />
            </div>
            
            {/* Notifications */}
            <button className="btn-ghost btn-icon text-ink-secondary hover:text-ink-dark relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-critical" />
            </button>
            
            {/* User Menu */}
            <div className="relative hidden lg:flex">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors" aria-label="User menu">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-navy-100 border border-border">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-ink-dark">Demo Reviewer</span>
                <ChevronDown className="w-4 h-4 text-ink-muted" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Page Title & Breadcrumb ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <nav className="flex items-center gap-2 text-xs text-ink-muted mb-2" aria-label="Breadcrumb">
              <Link href="/overview" className="hover:text-ink-secondary transition-colors">Overview</Link>
              {pathname !== '/overview' && (
                <>
                  <span>/</span>
                  <span className="text-ink-dark font-medium capitalize">{pageInfo.title}</span>
                </>
              )}
            </nav>
            <h1 className="text-3xl font-semibold text-ink-dark tracking-tight">
              {pageInfo.title}
            </h1>
            <p className="text-sm text-ink-secondary mt-1">{pageInfo.description}</p>
          </div>
          
          {/* Date/Period indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-subtle border border-border text-sm text-ink-secondary">
            <span>Q4 2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}
