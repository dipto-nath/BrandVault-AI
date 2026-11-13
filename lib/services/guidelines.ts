import { storage } from '@/lib/db/adaptor';
import { audit } from './audit';
import type { BrandGuideline } from '@/types/database';

export async function listGuidelines(workspaceId: string, opts?: { active?: boolean; category?: string }) {
  return storage.listGuidelines(workspaceId, opts);
}

export async function getGuideline(id: string, workspaceId: string) {
  const g = await storage.getGuideline(id);
  if (!g || g.workspace_id !== workspaceId) return null;
  return g;
}

export async function createGuideline(workspaceId: string, userId: string | null, data: any) {
  const guideline = await storage.createGuideline({
    workspace_id: workspaceId,
    rule_code: data.rule_code,
    title: data.title,
    description: data.description,
    category: data.category,
    severity: data.severity,
    examples: data.examples ?? null,
    active: data.active ?? true,
    version: data.version ?? 1,
    created_by: userId,
  });
  await audit.log(workspaceId, userId, 'brand_guideline', guideline.id, 'CREATE', null, { rule_code: guideline.rule_code, title: guideline.title });
  return guideline;
}

export async function updateGuideline(id: string, workspaceId: string, userId: string | null, data: any) {
  const existing = await storage.getGuideline(id);
  if (!existing || existing.workspace_id !== workspaceId) throw new Error('Guideline not found');
  const guideline = await storage.updateGuideline(id, {
    title: data.title,
    description: data.description,
    category: data.category,
    severity: data.severity,
    examples: data.examples ?? null,
    active: data.active,
    version: existing.version + 1,
  });
  await audit.log(workspaceId, userId, 'brand_guideline', id, 'UPDATE', { title: existing.title, description: existing.description }, { title: guideline.title, description: guideline.description, version: guideline.version });
  return guideline;
}

export async function deactivateGuideline(id: string, workspaceId: string, userId: string | null) {
  const existing = await storage.getGuideline(id);
  if (!existing || existing.workspace_id !== workspaceId) throw new Error('Guideline not found');
  await storage.deactivateGuideline(id);
  await audit.log(workspaceId, userId, 'brand_guideline', id, 'DEACTIVATE', { active: true }, { active: false });
  return { success: true };
}
