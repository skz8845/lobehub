import { type NextRequest, NextResponse } from 'next/server';

import { getServerDB } from '@/database/core/db-adaptor';
import { SSOService } from '@/server/services/sso';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userToken, appToken } = body;

    if (!userToken || !appToken) {
      return NextResponse.json({ error: 'Missing userToken or appToken' }, { status: 400 });
    }

    const serverDB = await getServerDB();
    const ssoService = new SSOService(serverDB);

    const session = await ssoService.login({ userToken, appToken });

    const response = NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        phone: session.phone,
      },
      permissions: session.permissions,
      roles: session.roles,
    });
    return response;
  } catch (error) {
    console.error('SSO login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'SSO login failed' },
      { status: 500 },
    );
  }
}
