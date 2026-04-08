import { type NextRequest, NextResponse } from 'next/server';

import { getServerDB } from '@/database/core/db-adaptor';
import { SSOService } from '@/server/services/sso';

export async function GET(request: NextRequest) {
  try {
    // First try to get tokens from headers
    const userToken = request.headers.get('RZZX-USERTOKEN') || '';
    const appToken = request.headers.get('RZZX-APPTOKEN') || '';

    if (!userToken || !appToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const serverDB = await getServerDB();
    const ssoService = new SSOService(serverDB);

    const session = await ssoService.login({ userToken, appToken });

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        phone: session.phone,
      },
      permissions: session.permissions,
      roles: session.roles,
      menus: session.menus,
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 });
  }
}
