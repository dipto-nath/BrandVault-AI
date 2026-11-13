'use client';

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-10">
      <div className="flex items-center justify-between h-[var(--header-height)] px-6">
        <div>
          <h1 className="text-lg font-bold text-ink-dark">{title}</h1>
          {subtitle && <p className="text-xs text-ink-secondary">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-ink-secondary hover:text-ink-dark">
            <span className="sr-only">Notifications</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
