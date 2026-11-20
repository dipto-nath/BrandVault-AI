import { storage } from '@/lib/db/adaptor';
import { KnowledgeManager } from '@/components/knowledge/knowledge-manager';
import { getRequestContext } from '@/lib/auth';

export default async function KnowledgePage() {
  const ctx = await getRequestContext();
  const workspaceId = ctx.workspaceId;
  const [facts, documents] = await Promise.all([
    workspaceId ? storage.listFacts(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listDocuments(workspaceId) : Promise.resolve([]),
  ]);

  return <KnowledgeManager facts={facts} documents={documents} />;
}
