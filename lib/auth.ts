import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/db/server';
import { getStorage, hasSupabaseConfig } from '@/lib/db/adaptor';
import type { WorkspaceRole } from '@/types/database';

const SESSION_COOKIE = 'bv_session';
const DEMO_COOKIE = 'bv_demo';
const DEMO_WS_COOKIE = 'bv_demo_ws';
const WS_COOKIE = 'bv_ws';
const DEMO_USER_ID = '22222222-2222-2222-2222-222222222222';
const DEMO_ORG_ID = '11111111-1111-1111-1111-111111111111';

export interface RequestContext {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  workspaceId: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  isDemo: boolean;
  isAdmin: boolean;
  token?: string;
}

function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(decoded);
    }
  } catch (e) {
    // Ignore invalid JWT format
  }
  return null;
}

export async function getRequestContext(): Promise<RequestContext> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const demo = cookieStore.get(DEMO_COOKIE)?.value === '1';
  const demoWs = cookieStore.get(DEMO_WS_COOKIE)?.value;
  const wsSlug = cookieStore.get(WS_COOKIE)?.value;

  // 1. Authenticated JWT Session
  if (sessionToken) {
    const payload = parseJwtPayload(sessionToken);
    if (payload && payload.sub && payload.org_id) {
      const isDemoOrg = payload.org_id === DEMO_ORG_ID || demo;
      const role = (payload.role || 'CREATOR') as WorkspaceRole;
      return {
        userId: payload.sub,
        userEmail: payload.email ?? null,
        userName: payload.email ? payload.email.split('@')[0] : 'User',
        workspaceId: payload.org_id,
        workspaceSlug: wsSlug || (isDemoOrg ? 'nexatech' : 'workspace'),
        role,
        isDemo: isDemoOrg,
        isAdmin: role === 'ADMIN',
        token: sessionToken,
      };
    }
  }

  // 2. Demo Session or Local Demo Mode
  const storage = getStorage();
  let workspace = demoWs ? await storage.getWorkspaceBySlug(demoWs) : null;
  if (!workspace) {
    workspace = await storage.getDemoWorkspace();
  }
  if (!workspace) {
    workspace = {
      id: DEMO_ORG_ID,
      name: 'NexaTech',
      slug: 'nexatech',
      description: 'AI hardware and robotics company',
      logo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  try {
    await storage.ensureMember(workspace.id, DEMO_USER_ID, 'ADMIN');
  } catch {
    // Ignore storage errors in ephemeral environments
  }

  const profile = await storage.getProfile(DEMO_USER_ID).catch(() => null);

  return {
    userId: DEMO_USER_ID,
    userEmail: profile?.email ?? 'demo@nexatech.example',
    userName: profile?.full_name ?? 'Demo Reviewer',
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    role: 'ADMIN',
    isDemo: true,
    isAdmin: true,
  };
}

export async function requireAdmin(ctx: RequestContext): Promise<void> {
  if (!ctx.isAdmin) throw new Error('Administrator role required');
}

export function setDemoCookies(
  response: { cookies: { set: (name: string, value: string, opts?: Record<string, unknown>) => void } },
  workspaceSlug: string
): void {
  response.cookies.set(DEMO_COOKIE, '1', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set(DEMO_WS_COOKIE, workspaceSlug, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
}
