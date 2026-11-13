'use client';

import Link from 'next/link';
import { Menu, Plus, ShieldCheck } from 'lucide-react';

export function Header({
  title,
  subtitle,
  onMenuClick,
}: {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}) {
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-20">
      <div className="flex items-center justify-between h-[var(--header-height)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-md text-ink-secondary hover:text-ink-dark hover:bg-surface-subtle"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-ink-dark tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-ink-secondary hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent-soft text-accent text-xs font-medium border border-accent/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Governance Gate Active</span>
          </div>
          <Link
            href="/reviews/new"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Content</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
