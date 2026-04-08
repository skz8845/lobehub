import { type LobeChatDatabase } from '@lobechat/database';

import {
  createSessionFromResponse,
  decodeSession,
  encodeSession,
  SSO_COOKIE_NAME,
  validateSSOToken,
} from '@/libs/sso/sso-client';
import type { SSOCredentials, SSOSession } from '@/libs/sso/types';

export class SSOService {
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async login(credentials: SSOCredentials): Promise<SSOSession> {
    const response = await validateSSOToken(credentials);

    if (response.code !== '0' && response.code !== '200') {
      throw new Error(`SSO login failed: ${response.msg}`);
    }

    const session = createSessionFromResponse(response, credentials);
    return session;
  }

  async validateSession(sessionData: string): Promise<SSOSession | null> {
    const session = decodeSession(sessionData);
    if (!session) return null;

    // Check if session is expired
    if (session.expireAt) {
      const expireDate = new Date(session.expireAt);
      if (expireDate < new Date()) {
        return null;
      }
    }

    return session;
  }

  encodeSession(session: SSOSession): string {
    return encodeSession(session);
  }

  getSessionFromCookie(cookie: string): SSOSession | null {
    return decodeSession(cookie);
  }
}

export const ssoCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export { SSO_COOKIE_NAME };
