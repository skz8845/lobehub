import type { SSOCredentials, SSOResponse, SSOSession } from './types';

export async function validateSSOToken(credentials: SSOCredentials): Promise<SSOResponse> {
  const response = await fetch(process.env.SSO_USER_INFO_URL || '', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'RZZX-USERTOKEN': credentials.userToken,
      'RZZX-APPTOKEN': credentials.appToken,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`SSO API error: ${response.status}`);
  }

  return response.json();
}

export function createSessionFromResponse(
  response: SSOResponse,
  credentials: SSOCredentials,
): SSOSession {
  const { data } = response;

  return {
    userId: String(data.userInfo.userId),
    name: data.userInfo.name,
    email: data.userInfo.email,
    phone: data.userInfo.phone,
    permissions: data.permissions,
    roles: data.roles,
    menus: data.menus,
    appToken: credentials.appToken,
    userToken: credentials.userToken,
    expireAt: data.appTokenInfo.expireAt,
  };
}

export const SSO_COOKIE_NAME = 'sso_session';

export function encodeSession(session: SSOSession): string {
  return JSON.stringify(session);
}

export function decodeSession(encoded: string): SSOSession | null {
  try {
    return JSON.parse(encoded);
  } catch {
    return null;
  }
}
