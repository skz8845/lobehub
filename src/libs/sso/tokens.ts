/**
 * Extract RZZX authentication tokens from a Request's headers.
 */
export const RZZX_USER_TOKEN_HEADER = 'RZZX-USERTOKEN';
export const RZZX_APP_TOKEN_HEADER = 'RZZX-APPTOKEN';

export function extractRZZXTokens(req: Request): {
  rzzxAppToken?: string;
  rzzxUserToken?: string;
} {
  return {
    rzzxAppToken: req.headers.get(RZZX_APP_TOKEN_HEADER) ?? undefined,
    rzzxUserToken: req.headers.get(RZZX_USER_TOKEN_HEADER) ?? undefined,
  };
}
