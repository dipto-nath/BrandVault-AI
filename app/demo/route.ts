import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Rather than bypassing auth, redirect visitor to the login page with the judge preset
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('judge', 'true');
  return NextResponse.redirect(loginUrl);
}
