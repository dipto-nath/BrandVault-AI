import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { storage } from '@/lib/db/adaptor';
import { DashboardClientLayout } from '@/components/layout/dashboard-client-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/?auth=required&next=/overview');
  }

  // User session verified
  return (
    <DashboardClientLayout initialSession={session}>
      {children}
    </DashboardClientLayout>
  );
}
