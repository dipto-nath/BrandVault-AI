import { Suspense } from 'react';
import { KnowledgeManagerClient } from '@/components/knowledge/knowledge-manager-client';
import { getRequestContext } from '@/lib/auth';
import { storage } from '@/lib/db/adaptor';

interface ProductItem {
  id: string;
  name: string;
  category?: string;
  model_or_version?: string;
  facts_count?: number;
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; action?: string; upload?: string; returnTo?: string }>;
}) {
  const ctx = await getRequestContext();
  const workspaceId = ctx.workspaceId;
  const params = await searchParams;
  const showWelcome = params.welcome === '1';
  const initialUploadOpen = params.action === 'upload' || params.upload === 'true' || params.upload === '1';
  const returnTo = params.returnTo;
  
  const [facts, documents, products] = await Promise.all([
    workspaceId ? storage.listFacts(workspaceId, { active: true }) : Promise.resolve([]),
    workspaceId ? storage.listDocuments(workspaceId) : Promise.resolve([]),
    workspaceId ? storage.listProducts(workspaceId) : Promise.resolve([]),
  ]);

  // Transform products to match ProductItem interface
  const productItems: ProductItem[] = products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category ?? undefined,
    model_or_version: p.model_or_version ?? undefined,
    facts_count: p.facts_count,
  }));

  return (
    <KnowledgeManagerClient
      initialFacts={facts}
      initialDocuments={documents}
      initialProducts={productItems}
      showWelcome={showWelcome}
      initialUploadOpen={initialUploadOpen}
      returnTo={returnTo}
    />
  );
}
