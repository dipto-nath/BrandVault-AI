import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/db/server';
import { getStorage, hasSupabaseConfig } from '@/lib/db/adaptor';
import type { WorkspaceRole } from '@/types/database';

const DEMO_COOKIE = 'bv_demo';
const DEMO_WS_COOKIE = 'bv_demo_ws';
const DEMO_USER_ID = '22222222-2222-2222-2222-222222222222';

export interface RequestContext {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  workspaceId: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  isDemo: boolean;
  isAdmin: boolean;
}

export async function getRequestContext(): Promise<RequestContext> {
  const cookieStore = await cookies();
  const demo = cookieStore.get(DEMO_COOKIE)?.value === '1';
  const demoWs = cookieStore.get(DEMO_WS_COOKIE)?.value;

  const storage = getStorage();

  if (demo) {
    const workspace = demoWs
      ? await storage.getWorkspaceBySlug(demoWs)
      : await storage.getDemoWorkspace();
    if (!workspace) throw new Error('Demo workspace not available');
    await storage.ensureMember(workspace.id, DEMO_USER_ID, 'ADMIN');
    const profile = await storage.getProfile(DEMO_USER_ID);
    return {
      userId: DEMO_USER_ID,
      userEmail: profile?.email ?? 'demo@nextech.example',
      userName: profile?.full_name ?? 'Demo Reviewer',
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
      role: 'ADMIN',
      isDemo: true,
      isAdmin: true,
    };
  }

  if (hasSupabaseConfig()) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const profile = await storage.getProfile(user.id);
    const workspace = await storage.getDemoWorkspace();
    if (!workspace) throw new Error('No workspace available');
    let member = await storage.getMember(workspace.id, user.id);
    if (!member) {
      member = await storage.ensureMember(workspace.id, user.id, 'CREATOR');
    }
    return {
      userId: user.id,
      userEmail: user.email ?? null,
      userName: profile?.full_name ?? profile?.email ?? user.email ?? null,
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
      role: member.role,
      isDemo: false,
      isAdmin: member.role === 'ADMIN',
    };
  }

  throw new Error('No authentication or demo session configured');
}

export async function requireAdmin(ctx: RequestContext): Promise<void> {
  if (!ctx.isAdmin) throw new Error('Administrator role required');
}

export function setDemoCookies(response: { cookies: { set: (name: string, value: string, opts?: Record<string, unknown>) => void } }, workspaceSlug: string): void {
  response.cookies.set(DEMO_COOKIE, '1', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set(DEMO_WS_COOKIE, workspaceSlug, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
}

export function clearDemoCookies(response: { cookies: { set: (name: string, value: string, opts?: Record<string, unknown>) => void } }): void {
  response.cookies.set(DEMO_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(DEMO_WS_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function aiProviderLabel(): string {
  return process.env.GEMINI_API_KEY ? 'Google Gemini' : 'None (deterministic checks only)';
}
