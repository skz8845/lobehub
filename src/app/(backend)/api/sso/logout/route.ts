import { type NextRequest, NextResponse } from 'next/server';

import { SSO_COOKIE_NAME } from '@/server/services/sso';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  response.cookies.delete(SSO_COOKIE_NAME);

  return response;
}
