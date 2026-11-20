import { NextResponse, type NextRequest } from 'next/server';

// Public routes that never require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/api/health',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Auth API routes are public
  if (pathname.startsWith('/api/auth/')) return true;
  // Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|woff2?|css|js)$/)
  ) {
    return true;
  }
  return false;
}

function parseJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function sanitizeNextUrl(rawNext: string): string {
  if (!rawNext) return '/overview';
  // Prevent protocol-relative URL redirection (e.g. //evil.com) and explicit protocols (e.g. https://evil.com)
  if (rawNext.startsWith('//') || rawNext.includes('://')) {
    return '/overview';
  }
  // Must be an internal path starting with /
  if (!rawNext.startsWith('/')) {
    return '/overview';
  }
  return rawNext;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow public assets and public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get('bv_session')?.value;
  let isAuthenticated = false;

  if (sessionToken) {
    const payload = parseJwt(sessionToken);
    if (payload && payload.sub && payload.org_id) {
      const now = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp > now) {
        isAuthenticated = true;
      }
    }
  }

  // If not authenticated, enforce default-deny
  if (!isAuthenticated) {
    // 1. API routes: return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to access this resource.',
          },
        },
        { status: 401 }
      );
    }

    // 2. Page routes: redirect to landing page with gate trigger
    const fullRequestedPath = pathname + (search || '');
    const sanitizedNext = sanitizeNextUrl(fullRequestedPath);
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('auth', 'required');
    redirectUrl.searchParams.set('next', sanitizedNext);

    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated: forward request with cache-control headers for sensitive pages
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
