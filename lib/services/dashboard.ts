import { storage } from '@/lib/db/adaptor';

export async function stats(workspaceId: string) {
  return storage.dashboardStats(workspaceId);
}
