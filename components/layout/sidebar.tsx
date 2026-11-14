'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Shield, BookOpen, FileCheck2, BarChart2, Settings, User, Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export const NAV: NavItem[] = [
  { href: '/overview',   label: 'Overview',            icon: LayoutDashboard },
  { href: '/reviews',    label: 'Content Reviews',     icon: ClipboardList },
  { href: '/guidelines', label: 'Brand Guidelines',    icon: Shield },
  { href: '/knowledge',  label: 'Approved Knowledge',  icon: BookOpen },
  { href: '/passports',  label: 'Evidence Passports',  icon: FileCheck2 },
  { href: '/insights',   label: 'Governance Insights', icon: BarChart2 },
  { href: '/settings',   label: 'Settings',            icon: Settings },
];

export function Sidebar({
  workspaceName = 'NexTech',
  userName = 'Demo Reviewer',
  onNavigate,
}: {
  workspaceName?: string;
  userName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="layout-sidebar h-full flex flex-col bg-navy-900 border-r border-navy-700">
      {/* ── Brand Logo Header ── */}
      <div className="flex items-center gap-3 px-6 h-[var(--header-height)] border-b border-navy-700 shrink-0">
        {/* BrandVault Logo */}
        <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 bg-gradient-to-br from-accent to-amber-700 shadow-lg shadow-accent/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-base tracking-tight text-white">
            BrandVault AI
          </span>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-1" aria-label="Main navigation">
        <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-accent/10 text-accent border border-accent/20 shadow-sm shadow-accent/10'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800/50'
              )}
            >
              <item.icon
                className="w-4.5 h-4.5 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Workspace & User ── */}
      <div className="shrink-0 px-4 py-4 border-t border-navy-700">
        {/* Workspace Status */}
        <div className="flex items-center gap-2 mb-3">
          <Circle className="w-2 h-2 text-success flex-shrink-0" />
          <span className="text-xs font-medium text-navy-300">
            Workspace Active
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-navy-800 border border-navy-700">
            <User className="w-4 h-4 text-navy-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white leading-tight truncate">
              {workspaceName}
            </div>
            <div className="text-xs text-navy-400 leading-tight truncate">
              {userName} &middot; Reviewer
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
