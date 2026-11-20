import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
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

  return (
    <DashboardClientLayout initialSession={session}>
      {children}
    </DashboardClientLayout>
  );
}
