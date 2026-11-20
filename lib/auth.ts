import { cookies } from 'next/headers';
import { getStorage } from '@/lib/db/adaptor';
import type { WorkspaceRole } from '@/types/database';

export const SESSION_COOKIE = 'bv_session';
export const REFRESH_COOKIE = 'bv_refresh';
export const WS_COOKIE = 'bv_ws';
export const DEMO_USER_ID = '22222222-2222-2222-2222-222222222222';
export const DEMO_ORG_ID = '11111111-1111-1111-1111-111111111111';

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

export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = Buffer.from(parts[1], 'base64url').toString('utf-8');
      return JSON.parse(decoded);
    }
  } catch {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(decoded);
      }
    } catch {
      // Ignore invalid JWT format
    }
  }
  return null;
}

/**
 * Returns the authenticated request context, or throws an Error if unauthenticated.
 */
export async function getRequestContext(): Promise<RequestContext> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const wsSlug = cookieStore.get(WS_COOKIE)?.value;

  if (!sessionToken) {
    throw new Error('Authentication required');
  }

  const payload = parseJwtPayload(sessionToken);
  if (!payload || !payload.sub || !payload.org_id) {
    throw new Error('Invalid authentication session');
  }

  // Check token expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Session has expired');
  }

  const isDemoOrg = payload.org_id === DEMO_ORG_ID || Boolean(payload.is_demo);
  const role = (payload.role || 'ADMIN') as WorkspaceRole;

  return {
    userId: payload.sub,
    userEmail: payload.email ?? (isDemoOrg ? 'demo@nexatech.example' : null),
    userName: payload.name || payload.full_name || (payload.email ? payload.email.split('@')[0] : 'Member'),
    workspaceId: payload.org_id,
    workspaceSlug: wsSlug || (isDemoOrg ? 'nexatech' : 'workspace'),
    role,
    isDemo: isDemoOrg,
    isAdmin: role === 'ADMIN',
    token: sessionToken,
  };
}

/**
 * Safe helper returning the session context if valid, or null if not authenticated.
 */
export async function getSession(): Promise<RequestContext | null> {
  try {
    return await getRequestContext();
  } catch {
    return null;
  }
}

export async function requireAdmin(ctx: RequestContext): Promise<void> {
  if (!ctx.isAdmin) {
    throw new Error('Administrator role required');
  }
}

export async function requireManagerOrAbove(ctx: RequestContext): Promise<void> {
  if (!['ADMIN', 'MANAGER'].includes(ctx.role)) {
    throw new Error('Manager role or above required');
  }
}

export async function requireReviewerOrAbove(ctx: RequestContext): Promise<void> {
  if (!['ADMIN', 'MANAGER', 'REVIEWER'].includes(ctx.role)) {
    throw new Error('Reviewer role or above required');
  }
}

export async function requireCreatorOrAbove(ctx: RequestContext): Promise<void> {
  if (!['ADMIN', 'MANAGER', 'REVIEWER', 'CREATOR'].includes(ctx.role)) {
    throw new Error('Creator role or above required');
  }
}

export function canApprove(ctx: RequestContext): boolean {
  return ['ADMIN', 'MANAGER', 'REVIEWER'].includes(ctx.role);
}

export function canOverride(ctx: RequestContext): boolean {
  return ['ADMIN', 'REVIEWER'].includes(ctx.role);
}

export function canManageTeam(ctx: RequestContext): boolean {
  return ctx.role === 'ADMIN';
}

export function canManageGuidelines(ctx: RequestContext): boolean {
  return ['ADMIN'].includes(ctx.role);
}

export function canSubmitContent(ctx: RequestContext): boolean {
  return ['ADMIN', 'MANAGER', 'REVIEWER', 'CREATOR', 'AGENCY'].includes(ctx.role);
}

export function canViewInsights(ctx: RequestContext): boolean {
  return ['ADMIN', 'MANAGER', 'REVIEWER'].includes(ctx.role);
}

export function canApproveGuidelineChanges(ctx: RequestContext): boolean {
  return ctx.role === 'ADMIN';
}
