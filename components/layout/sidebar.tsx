'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layout, List, Settings, FileText, Shield, BarChart3, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export const NAV: NavItem[] = [
  { href: '/overview', label: 'Overview', icon: Layout },
  { href: '/reviews', label: 'Content Reviews', icon: List },
  { href: '/guidelines', label: 'Brand Guidelines', icon: Shield },
  { href: '/knowledge', label: 'Approved Knowledge', icon: FileText },
  { href: '/passports', label: 'Evidence Passports', icon: ShieldCheck },
  { href: '/insights', label: 'Governance Insights', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  workspaceName,
  userName,
  onNavigate,
}: {
  workspaceName: string;
  userName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full flex flex-col border-r border-border bg-surface select-none">
      <div className="flex items-center gap-2.5 h-[var(--header-height)] px-6 border-b border-border shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
        <span className="font-semibold text-ink-dark text-sm tracking-tight">BrandVault AI</span>
        <span className="ml-auto text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/20">
          v1.0
        </span>
      </div>

      <div className="p-3 space-y-1 overflow-y-auto flex-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
          Governance Studio
        </div>
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/overview' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                active
                  ? 'bg-accent-soft text-accent font-semibold border-l-2 border-accent shadow-sm'
                  : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink-dark',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border p-4 bg-surface-subtle/50 shrink-0">
        <div className="p-2.5 rounded-md bg-surface border border-border text-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-secondary mb-0.5">
            Active Workspace
          </div>
          <div className="font-semibold text-ink-dark truncate">{workspaceName}</div>
          <div className="text-[11px] text-ink-secondary mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="truncate">{userName}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
