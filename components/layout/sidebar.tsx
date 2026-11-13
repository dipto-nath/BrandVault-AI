'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ClipboardList, Shield, BookOpen, FileCheck2, BarChart2, Settings, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export const NAV: NavItem[] = [
  { href: '/overview',   label: 'Overview',            icon: Home },
  { href: '/reviews',    label: 'Content Reviews',     icon: ClipboardList },
  { href: '/guidelines', label: 'Brand Guidelines',    icon: Shield },
  { href: '/knowledge',  label: 'Approved Knowledge',  icon: BookOpen },
  { href: '/passports',  label: 'Evidence Passports',  icon: FileCheck2 },
  { href: '/insights',   label: 'Governance Insights', icon: BarChart2 },
  { href: '/settings',   label: 'Settings',            icon: Settings },
];

export function Sidebar({
  workspaceName = 'Tech',
  userName = 'No Reviewer',
  onNavigate,
}: {
  workspaceName?: string;
  userName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="w-[230px] h-full flex flex-col select-none relative overflow-hidden shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0F1A2E 0%, #172744 60%, #13213A 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* ── Subtle planet crescent glow in bottom-left background ── */}
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 w-52 h-52 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(198, 166, 107, 0.05) 40%, transparent 70%)',
          filter: 'blur(12px)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 w-44 h-44 rounded-full border border-white/10"
        style={{
          maskImage: 'linear-gradient(to top right, black 30%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to top right, black 30%, transparent 70%)',
        }}
      />

      {/* ── Brand Logo Header ── */}
      <div
        className="flex items-center gap-3 px-5 shrink-0 z-10"
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Shield with gold check */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #C6A66B 0%, #8A6D30 100%)',
            boxShadow: '0 2px 10px rgba(198, 166, 107, 0.35)',
          }}
        >
          <Shield className="w-4 h-4 text-white fill-white/20" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-[15px] tracking-tight text-white">
            BrandVault AI
          </span>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 z-10">
        <div
          className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'rgba(165, 180, 203, 0.6)' }}
        >
          + &nbsp;Governance Studio
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                active
                  ? 'text-white font-medium shadow-sm'
                  : 'text-[#8E9EB5] hover:text-white hover:bg-white/[0.04]'
              )}
              style={
                active
                  ? {
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                    }
                  : undefined
              }
            >
              <item.icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: active ? '#FFFFFF' : '#8E9EB5' }}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Bottom Workspace Indicator ── */}
      <div
        className="shrink-0 px-4 py-4 z-10"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        {/* Workspace Active */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: '#22C55E', boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)' }}
          />
          <span className="text-[11px] font-semibold text-[#8E9EB5]">
            Workspace Active
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2.5 pl-0.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <User className="w-3.5 h-3.5 text-white/80" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white leading-tight truncate">
              {workspaceName}
            </div>
            <div className="text-[11px] text-[#8E9EB5] leading-tight truncate">
              {userName}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
