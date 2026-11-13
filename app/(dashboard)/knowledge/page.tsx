import { storage } from '@/lib/db/adaptor';
import { KnowledgeManager } from '@/components/knowledge/knowledge-manager';

export default async function KnowledgePage() {
  const ws = await storage.getDemoWorkspace();
  const [facts, documents] = await Promise.all([
    ws ? storage.listFacts(ws.id) : Promise.resolve([]),
    ws ? storage.listDocuments(ws.id) : Promise.resolve([]),
  ]);

  return <KnowledgeManager facts={facts} documents={documents} />;
}
