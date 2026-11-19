import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('bv_refresh')?.value;

  if (refreshToken) {
    try {
      await backendFetch('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (e) {
      // Continue clearing cookies regardless
    }
  }

  const response = NextResponse.json({ status: 'ok' });
  response.cookies.delete('bv_session');
  response.cookies.delete('bv_refresh');
  response.cookies.delete('bv_ws');
  response.cookies.delete('bv_demo');
  response.cookies.delete('bv_demo_ws');

  return response;
}
