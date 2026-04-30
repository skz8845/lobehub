import { cache } from 'react';

import type { SSOSession } from './types';

/**
 * Request-scoped store for RZZX tokens and SSO session data.
 *
 * Uses React's `cache()` to ensure values are scoped to the current
 * request (not shared across requests or responses). Any server-side
 * code can call `getRZZXTokens()` or `getSSOSession()` after the
 * store has been populated at the request entry point.
 */

// ─── RZZX tokens ──────────────────────────────────────────────────────────────

interface RZZXTokenStore {
  appToken?: string;
  userToken?: string;
}

const getRZZXTokenStore = cache((): RZZXTokenStore => ({}));

export const setRZZXTokens = cache((appToken?: string, userToken?: string) => {
  const store = getRZZXTokenStore();
  store.appToken = appToken;
  store.userToken = userToken;
});

export function getRZZXTokens(): { appToken?: string; userToken?: string } {
  return getRZZXTokenStore();
}

// ─── SSO session ──────────────────────────────────────────────────────────────

const getSSOSessionStore = cache((): { session?: SSOSession } => ({}));

export const setSSOSession = cache((session: SSOSession) => {
  getSSOSessionStore().session = session;
});

export function getSSOSession(): SSOSession | undefined {
  return getSSOSessionStore().session;
}
