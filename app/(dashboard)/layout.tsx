'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { X } from 'lucide-react';

function getPageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname === '/overview') {
    return {
      title: 'Workspace Overview',
      subtitle: 'NexaTech brand compliance & governance health',
    };
  }
  if (pathname === '/reviews') {
    return {
      title: 'Content Reviews',
      subtitle: 'Audited content submissions, risk levels and verification states',
    };
  }
  if (pathname === '/reviews/new') {
    return {
      title: 'Content Review Studio',
      subtitle: 'Submit marketing copy, social posts and product statements for analysis',
    };
  }
  if (pathname.includes('/findings/')) {
    return {
      title: 'Finding Inspection & Reviewer Feedback',
      subtitle: 'Inspect evidence, evaluate findings and record governance feedback',
    };
  }
  if (pathname.startsWith('/reviews/')) {
    return {
      title: 'Content Review & Approval',
      subtitle: 'Detailed analysis, claim verification, corrections and human review',
    };
  }
  if (pathname === '/guidelines') {
    return {
      title: 'Brand Guidelines',
      subtitle: 'Active brand voice, tone principles, and terminology rules',
    };
  }
  if (pathname === '/knowledge') {
    return {
      title: 'Approved Knowledge Base',
      subtitle: 'Authoritative facts, specifications, and document source material',
    };
  }
  if (pathname === '/passports') {
    return {
      title: 'Brand Evidence Passports',
      subtitle: 'Persistent verification records and accountable publishing audits',
    };
  }
  if (pathname.startsWith('/passports/')) {
    return {
      title: 'Brand Evidence Passport',
      subtitle: 'Immutable record of evidence, claim checks, and human sign-off',
    };
  }
  if (pathname === '/insights') {
    return {
      title: 'Governance Insights & Intelligence Loop',
      subtitle: 'Aggregated reviewer feedback, recurring violations, and guideline suggestions',
    };
  }
  if (pathname === '/settings') {
    return {
      title: 'Workspace Settings',
      subtitle: 'Governance parameters, AI engine configuration, and member roles',
    };
  }
  return {
    title: 'BrandVault AI',
    subtitle: 'Evidence-first brand governance platform',
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const workspaceName = 'NexaTech';
  const userName = 'Demo Reviewer';

  const { title, subtitle } = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-base flex flex-col lg:flex-row">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-30">
        <Sidebar workspaceName={workspaceName} userName={userName} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-ink-dark/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-surface h-full flex flex-col z-10 shadow-2xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md text-ink-secondary hover:text-ink-dark hover:bg-surface-subtle"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              workspaceName={workspaceName}
              userName={userName}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
