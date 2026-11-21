import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, ApiError } from '@/lib/api/client';
import { storage } from '@/lib/db/adaptor';
import { extractDocumentText, sanitizeExtractedText } from '@/lib/ai/documents';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
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
    const contentType = req.headers.get('content-type') || '';
    let company_name = '';
    let workspace_slug = '';
    let email = '';
    let password = '';
    let full_name = '';
    let industry = '';
    let sourceDocuments: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      company_name = formData.get('company_name') as string;
      workspace_slug = formData.get('workspace_slug') as string;
      email = formData.get('email') as string;
      password = formData.get('password') as string;
      full_name = formData.get('full_name') as string;
      industry = formData.get('industry') as string;

      const files = formData.getAll('sourceDocuments') as File[];
      sourceDocuments = files.filter(f => f.type === 'application/pdf');
    } else {
      const body = await req.json();
      company_name = body.company_name;
      workspace_slug = body.workspace_slug;
      email = body.email;
      password = body.password;
      full_name = body.full_name;
      industry = body.industry;
    }

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

    try {
      if (sourceDocuments.length > 0) {
        const formData = new FormData();
        formData.append('company_name', company_name);
        formData.append('workspace_slug', slug);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('full_name', full_name);
        if (industry) formData.append('industry', industry);
        sourceDocuments.forEach(f => formData.append('sourceDocuments', f));

        data = await backendFetch('/api/v1/auth/register', {
          method: 'POST',
          body: formData,
        });
      } else {
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
      }
    } catch (backendErr: any) {
      if (backendErr instanceof ApiError && backendErr.status === 400) {
        return NextResponse.json({ error: backendErr.message }, { status: 400 });
      }

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

      if (sourceDocuments.length > 0) {
        const uploadDir = join(process.cwd(), '.brandvault', 'uploads');
        if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

        for (const file of sourceDocuments) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = join(uploadDir, `${Date.now()}-${sanitizedFilename}`);
          writeFileSync(storagePath, buffer);

          let extractedText = '';
          try {
            const extraction = await extractDocumentText(storagePath, 'application/pdf');
            extractedText = sanitizeExtractedText(extraction.text);
          } catch {
            extractedText = '';
          }

          await storage.createDocument({
            workspace_id: workspace.id,
            filename: file.name,
            storage_path: storagePath,
            mime_type: 'application/pdf',
            file_size: file.size,
            source_name: file.name,
            document_status: 'APPROVED',
            extracted_text: extractedText.slice(0, 50000),
            extraction_error: null,
            uploaded_by: userId,
          });
        }
      }

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

    // Detect if we should use secure cookie (MUST NOT be true on unencrypted localhost, otherwise Safari drops it!)
    const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol?.replace(':', '') || '';
    const host = req.headers.get('host') || req.nextUrl.host || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isHttps = proto === 'https';
    const isSecureCookie = isHttps && !isLocalhost;

    // Set secure HTTP-only cookies
    if (data.access_token) {
      response.cookies.set('bv_session', data.access_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: isSecureCookie,
      });
    }

    if (data.refresh_token) {
      response.cookies.set('bv_refresh', data.refresh_token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        secure: isSecureCookie,
      });
    }

    // Set workspace slug for UI reference
    if (data.organization?.slug) {
      response.cookies.set('bv_ws', data.organization.slug, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        secure: isSecureCookie,
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
