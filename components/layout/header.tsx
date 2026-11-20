'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, Shield, Sparkles, LogOut, ChevronDown, Check, Building2, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { NotificationPopover } from './notification-popover';
import { SearchDialog } from './search-dialog';

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  is_demo: boolean;
}

export function Header({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch current user and org
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
          setOrg(data.organization);
          setIsDemo(Boolean(data.isDemo || data.organization?.is_demo));
        } else {
          // Default demo fallback
          setUser({
            id: '22222222-2222-2222-2222-222222222222',
            email: 'demo@nexatech.example',
            full_name: 'Demo Reviewer',
            role: 'ADMIN',
          });
          setOrg({
            id: '11111111-1111-1111-1111-111111111111',
            name: 'NexaTech',
            slug: 'nexatech',
            is_demo: true,
          });
          setIsDemo(true);
        }
      })
      .catch(() => {
        setIsDemo(true);
      });
  }, []);

  // Fetch AI status
  useEffect(() => {
    fetch('/api/workspaces/current/ai')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.enabled !== undefined) {
          setAiEnabled(data.enabled);
        } else {
          // Fallback to checking environment
          setAiEnabled(!!process.env.GEMINI_API_KEY);
        }
      })
      .catch(() => {
        setAiEnabled(!!process.env.GEMINI_API_KEY);
      });
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut (⌘K or Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

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
  const displayName = user?.full_name || 'Reviewer';
  const displayRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()) : 'Reviewer';
  const orgName = org?.name || 'NexaTech';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
                <span className="font-semibold text-ink-dark">{orgName}</span>
                {isDemo && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-[#9A6B12]/15 text-[#9A6B12]">
                    Demo
                  </span>
                )}
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
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all"
              title={aiEnabled ? "AI-assisted verification active" : "Deterministic-only mode — AI verification disabled"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${aiEnabled ? 'bg-evidence-supported animate-pulse' : 'bg-sand-dark animate-none'}`} />
              <span className="text-[11px] font-medium">
                {aiEnabled ? 'AI checks: on' : 'AI checks: limited'}
              </span>
            </div>

            {/* Interactive Notifications Popover */}
            <NotificationPopover />

            {/* User Profile & Workspace Dropdown */}
            <div className="relative pl-2 border-l border-sand-dark/40" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-sand/60 transition-colors text-left"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-brand/10 border border-brand/20 text-brand font-semibold text-xs shadow-2xs">
                  {initials || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-ink-dark leading-none flex items-center gap-1">
                    <span>{displayName}</span>
                    <ChevronDown className="w-3 h-3 text-ink-muted" />
                  </div>
                  <div className="text-[10px] text-ink-muted leading-tight mt-0.5">{displayRole}</div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#FFFDF9] border border-[#E6DCC8] rounded-2xl shadow-lg p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-[#E6DCC8]/60">
                    <p className="font-semibold text-[#1E2540] truncate">{displayName}</p>
                    <p className="text-[11px] text-[#4C5470] truncate mt-0.5">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#E3EAFA] text-[#2F4FB3] font-medium text-[10px]">
                        {displayRole}
                      </span>
                      {isDemo && (
                        <span className="px-2 py-0.5 rounded-full bg-[#9A6B12]/15 text-[#9A6B12] font-medium text-[10px]">
                          Sandbox mode
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-[#4C5470]/80">
                      Active Workspace
                    </div>
                    <div className="px-3 py-1.5 flex items-center justify-between rounded-lg bg-[#F4EEE1]/60">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#2F4FB3]" />
                        <span className="font-medium text-[#1E2540]">{orgName}</span>
                      </div>
                      <Check className="w-3.5 h-3.5 text-[#2F4FB3]" />
                    </div>
                  </div>

                  <div className="pt-1 mt-1 border-t border-[#E6DCC8]/60 space-y-0.5">
                    {isDemo ? (
                      <Link
                        href="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#2F4FB3] hover:bg-[#E3EAFA]/50 font-medium transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Create your own workspace</span>
                      </Link>
                    ) : (
                      <Link
                        href="/demo"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#4C5470] hover:bg-sand/60 hover:text-[#1E2540] transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Switch to NexaTech demo</span>
                      </Link>
                    )}

                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#4C5470] hover:bg-sand/60 hover:text-[#1E2540] transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span>Workspace Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B24A4A] hover:bg-[#B24A4A]/10 font-medium transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
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
