import { createServerClient } from '@/lib/db/server';
import { Workspace } from '@/types/database';

export async function getDemoWorkspace(): Promise<Workspace | null> {
  const db = createServerClient();
  const { data } = await db
    .from('workspaces')
    .select('*')
    .eq('slug', process.env.NEXT_PUBLIC_DEMO_WORKSPACE_SLUG || 'nexatech')
    .single();
  return data;
}

export async function getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  const db = createServerClient();
  const { data } = await db.from('workspaces').select('*').eq('slug', slug).single();
  return data;
}

export async function getDashboardStats(workspaceId: string) {
  const db = createServerClient();
  const { data: submissions } = await db
    .from('content_submissions')
    .select('status, risk_level, created_at')
    .eq('workspace_id', workspaceId);
  
  const stats = {
    total: submissions?.length ?? 0,
    pending: submissions?.filter(s => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length ?? 0,
    approved: submissions?.filter(s => s.status === 'APPROVED').length ?? 0,
    rejected: submissions?.filter(s => s.status === 'REJECTED').length ?? 0,
    high_risk: submissions?.filter(s => s.risk_level === 'HIGH').length ?? 0,
  };
  return stats;
}
