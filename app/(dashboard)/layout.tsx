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

  // Check if user has any products
  const products = await storage.listProducts(session.workspaceId);
  
  // If no products and not on onboarding page, redirect to onboarding
  // Note: We can't easily check the current path in server component,
  // so we'll let the onboarding page itself check and redirect back if products exist
  // Or we can check here and redirect if no products and path is not onboarding
  
  return (
    <DashboardClientLayout initialSession={session}>
      {children}
    </DashboardClientLayout>
  );
}
