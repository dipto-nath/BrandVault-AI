'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<{ workspaceName: string; userName: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // In demo mode, context is seeded by the server via a cookie-read pattern.
    // For now, default to NexaTech demo context.
    setCtx({ workspaceName: 'NexaTech', userName: 'Demo Reviewer' });
  }, []);

  if (!ctx) return null;

  return (
    <div className="min-h-screen bg-base">
      <Sidebar workspaceName={ctx.workspaceName} userName={ctx.userName} />
      <div className="flex-1 flex flex-col">
        <Header title={(pathname.split('/').pop() ?? 'Overview').replace(/-/g, ' ')} subtitle="BrandVault AI workspace" />
        <main className="flex-1 container py-6 px-0">
          {children}
        </main>
      </div>
    </div>
  );
}
