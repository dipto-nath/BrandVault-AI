import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { storage } from '@/lib/db/adaptor';
import crypto from 'crypto';

function createLocalJwt(payload: { sub: string; org_id: string; role: string; email: string; name?: string; is_demo?: boolean }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const secret = process.env.JWT_SECRET || 'brandvault-jwt-secret-key-change-in-production-min-32-bytes';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, workspace_slug, email, password, full_name, industry } = body;

    if (!company_name || !email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Company name, work email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    let slug = (workspace_slug || company_name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[-\s]+/g, '-')
      .slice(0, 30);
    if (!slug) {
      slug = 'org-' + crypto.randomUUID().substring(0, 8);
    }

    let data: any = null;

    // 1. Try FastAPI backend first
    try {
      data = await backendFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          company_name,
          workspace_slug: slug,
          email,
          password,
          full_name,
          industry: industry || undefined,
        }),
      });
    } catch (backendErr: any) {
      // If backend threw a deliberate validation error (e.g. 400 user/slug already exists), propagate it
      if (backendErr instanceof ApiError && backendErr.status === 400) {
        return NextResponse.json({ error: backendErr.message }, { status: 400 });
      }

      // If backend is offline / unreachable (ECONNREFUSED / fetch failed), use storage fallback
      console.warn('Backend unavailable, creating workspace in storage engine:', backendErr.message);

      const userId = crypto.randomUUID();
      const existingWs = await storage.getWorkspaceBySlug(slug);
      const finalSlug = existingWs ? `${slug}-${userId.substring(0, 4)}` : slug;

      const workspace = await storage.createWorkspace({
        name: company_name,
        slug: finalSlug,
        description: `${industry || 'Company'} brand governance workspace.`,
      });

      await storage.createProfile({
        id: userId,
        email,
        full_name,
      });

      await storage.ensureMember(workspace.id, userId, 'ADMIN');

      // Seed starter guidelines for the new company
      try {
        await storage.createGuideline({
          workspace_id: workspace.id,
          rule_code: 'RULE-CLAIM-001',
          title: 'Substantiated Performance Claims',
          description: 'All product performance figures and specifications must cite approved ground truth documentation.',
          category: 'CLAIMS',
          severity: 'HIGH',
          active: true,
          version: 1,
          examples: { good: [], bad: [] },
          created_by: userId,
        });
        await storage.createGuideline({
          workspace_id: workspace.id,
          rule_code: 'RULE-TONE-002',
          title: 'Direct, Accurate Voice',
          description: 'Avoid unsubstantiated superlatives in customer-facing marketing copy.',
          category: 'TONE',
          severity: 'MEDIUM',
          active: true,
          version: 1,
          examples: { good: [], bad: [] },
          created_by: userId,
        });
      } catch {
        // Starter rules are best-effort
      }

      const accessToken = createLocalJwt({
        sub: userId,
        org_id: workspace.id,
        role: 'ADMIN',
        email,
        name: full_name,
        is_demo: false,
      });

      data = {
        access_token: accessToken,
        refresh_token: crypto.randomBytes(32).toString('hex'),
        token_type: 'bearer',
        user: {
          id: userId,
          email,
          full_name,
          role: 'ADMIN',
          created_at: new Date().toISOString(),
        },
        organization: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          created_at: new Date().toISOString(),
        },
      };
    }

    const response = NextResponse.json({
      user: data.user,
      organization: data.organization,
    });

    // Set secure HTTP-only cookies
    if (data.access_token) {
      response.cookies.set('bv_session', data.access_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
      });
    }

    if (data.refresh_token) {
      response.cookies.set('bv_refresh', data.refresh_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: process.env.NODE_ENV === 'production',
      });
    }

    // Set workspace slug for UI reference
    if (data.organization?.slug) {
      response.cookies.set('bv_ws', data.organization.slug, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    // Clear demo flags
    response.cookies.delete('bv_demo');
    response.cookies.delete('bv_demo_ws');

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    const status = err instanceof ApiError ? err.status : 500;
    const message = err.message || 'Failed to register';
    return NextResponse.json({ error: message }, { status });
  }
}
