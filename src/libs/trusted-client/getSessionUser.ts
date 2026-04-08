import { parse } from 'cookie';
import { headers } from 'next/headers';

import { decodeSession, SSO_COOKIE_NAME } from '@/libs/sso';

import { type TrustedClientUserInfo } from './index';

/**
 * Get user info from the current session for trusted client authentication
 *
 * @returns User info or undefined if not authenticated
 */
export const getSessionUser = async (): Promise<TrustedClientUserInfo | undefined> => {
  try {
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie');

    if (!cookieHeader) {
      return undefined;
    }

    const cookies = parse(cookieHeader);
    const ssoSessionData = cookies[SSO_COOKIE_NAME];

    if (!ssoSessionData) {
      return undefined;
    }

    const session = decodeSession(decodeURIComponent(ssoSessionData));

    if (!session?.userId || !session?.email) {
      return undefined;
    }

    // Check if session is expired
    if (session.expireAt) {
      const expireDate = new Date(session.expireAt);
      if (expireDate < new Date()) {
        return undefined;
      }
    }

    return {
      email: session.email,
      name: session.name || undefined,
      userId: session.userId,
    };
  } catch {
    return undefined;
  }
};
