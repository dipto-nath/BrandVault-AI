import { storage } from '@/lib/db/adaptor';
import { GuidelinesManager } from '@/components/guidelines/guidelines-manager';

export default async function GuidelinesPage() {
  const ws = await storage.getDemoWorkspace();
  const guidelines = ws ? await storage.listGuidelines(ws.id) : [];

  return <GuidelinesManager guidelines={guidelines} />;
}
