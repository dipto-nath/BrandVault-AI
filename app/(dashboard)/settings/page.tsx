import { storage } from '@/lib/db/adaptor';
import { getRequestContext } from '@/lib/auth';
import { SettingsManager, MemberItem, InvitationItem } from '@/components/settings/settings-manager';

export default async function SettingsPage() {
  const ctx = await getRequestContext();
  const workspaceId = ctx.workspaceId;
  const isDemo = ctx.isDemo;
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const rawMembers = await storage.listMembers(workspaceId);
  const members: MemberItem[] = await Promise.all(
    rawMembers.map(async (m) => {
      const prof = await storage.getProfile(m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.created_at,
        user: {
          id: m.user_id,
          email: prof?.email || 'user@example.com',
          full_name: prof?.full_name || null,
        },
      };
    })
  );

  const workspace = {
    id: workspaceId,
    name: isDemo ? 'NexaTech' : (ctx.workspaceSlug ? ctx.workspaceSlug.toUpperCase() : 'Workspace'),
    slug: ctx.workspaceSlug || 'nexatech',
    description: isDemo
      ? 'Fictional Indian consumer technology company — demo sandbox workspace for BrandVault AI.'
      : 'Brand governance desk and ground truth vault.',
    isDemo,
  };

  // AI configuration from environment
  const aiEnabled = !!process.env.GEMINI_API_KEY;
  const aiProvider = 'Google Gemini';
  const aiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  return (
    <SettingsManager
      workspace={workspace}
      initialMembers={members}
      initialInvitations={[]}
      configuredModel={configuredModel}
      aiEnabled={aiEnabled}
      aiProvider={aiProvider}
      aiModel={aiModel}
    />
  );
}
