'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layout, List, Settings, FileText, Shield, Activity, BarChart3, LogOut, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV: NavItem[] = [
  { href: '/(dashboard)/overview', label: 'Overview', icon: Layout },
  { href: '/(dashboard)/reviews', label: 'Content Reviews', icon: List },
  { href: '/(dashboard)/guidelines', label: 'Brand Guidelines', icon: Shield },
  { href: '/(dashboard)/knowledge', label: 'Approved Knowledge', icon: FileText },
  { href: '/(dashboard)/passports', label: 'Evidence Passports', icon: FileText },
  { href: '/(dashboard)/insights', label: 'Governance Insights', icon: BarChart3 },
  { href: '/(dashboard)/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ workspaceName, userName }: { workspaceName: string; userName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex lg:w-[var(--sidebar-width)] flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 h-[var(--header-height)] px-6 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span className="font-bold text-ink-dark text-sm tracking-tight">BrandVault AI</span>
      </div>

      <div className="p-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-accent-soft text-accent border-l-2 border-accent'
                  : 'text-ink-secondary hover:bg-surface-subtle hover:text-ink-dark',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-border pt-4 pb-6 px-4">
        <div className="px-3 py-2.5 rounded-lg bg-accent-soft text-accent text-xs font-medium border border-accent/30">
          Workspace: {workspaceName}
        </div>
        <div className="mt-2 px-3 py-1 text-xs text-ink-secondary">
          Signed in as {userName}
        </div>
      </div>
    </aside>
  );
}
