import { storage } from '@/lib/db/adaptor';
import { GuidelinesManager } from '@/components/guidelines/guidelines-manager';
import { getRequestContext } from '@/lib/auth';

export default async function GuidelinesPage() {
  const ctx = await getRequestContext();
  const workspaceId = ctx.workspaceId;
  const guidelines = workspaceId ? await storage.listGuidelines(workspaceId, { active: true }) : [];

  return <GuidelinesManager guidelines={guidelines} />;
}
