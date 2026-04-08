import { type ChatCompletionErrorPayload } from '@lobechat/model-runtime';
import { AgentRuntimeError } from '@lobechat/model-runtime';
import { context as otContext } from '@lobechat/observability-otel/api';
import { type ClientSecretPayload } from '@lobechat/types';
import { ChatErrorType } from '@lobechat/types';

import { getServerDB } from '@/database/core/db-adaptor';
import { type LobeChatDatabase } from '@/database/type';
import { extractTraceContext, injectActiveTraceHeaders } from '@/libs/observability/traceparent';
import { validateSSOToken } from '@/libs/sso';
import { createErrorResponse } from '@/utils/errorResponse';

type RequestOptions = { params: Promise<{ provider?: string }> };

const RZZX_USER_TOKEN_HEADER = 'RZZX-USERTOKEN';
const RZZX_APP_TOKEN_HEADER = 'RZZX-APPTOKEN';

export type RequestHandler = (
  req: Request,
  options: RequestOptions & {
    jwtPayload: ClientSecretPayload;
    serverDB: LobeChatDatabase;
    userId: string;
  },
) => Promise<Response>;

export const checkAuth =
  (handler: RequestHandler) => async (req: Request, options: RequestOptions) => {
    // Clone the request to avoid "Response body object should not be disturbed or locked" error
    // in Next.js 16 when the body stream has been consumed by Next.js internal mechanisms
    // This ensures the handler can safely read the request body
    const clonedReq = req.clone();

    // Get serverDB for database access
    const serverDB = await getServerDB();

    // we have a special header to debug the api endpoint in development mode
    const isDebugApi = req.headers.get('lobe-auth-dev-backend-api') === '1';
    if (process.env.NODE_ENV === 'development' && isDebugApi) {
      return handler(clonedReq, {
        ...options,
        jwtPayload: { userId: 'DEV_USER' },
        serverDB,
        userId: 'DEV_USER',
      });
    }

    let jwtPayload: ClientSecretPayload;

    try {
      let ssoAuthorized = false;
      let ssoUserId: string | undefined;

      // First try RZZX headers
      const rzzxUserToken = req.headers.get(RZZX_USER_TOKEN_HEADER);
      const rzzxAppToken = req.headers.get(RZZX_APP_TOKEN_HEADER);

      if (rzzxUserToken && rzzxAppToken) {
        try {
          const response = await validateSSOToken({
            userToken: rzzxUserToken,
            appToken: rzzxAppToken,
          });
          if (response.code === '0' || response.code === '200') {
            ssoAuthorized = true;
            ssoUserId = String(response.data.userInfo.userId);
          }
        } catch (e) {
          console.error('RZZX header validation error:', e);
        }
      }

      if (!ssoAuthorized) {
        throw AgentRuntimeError.createError(ChatErrorType.Unauthorized);
      }

      if (ssoAuthorized && ssoUserId) {
        jwtPayload = { userId: ssoUserId };
      } else {
        throw AgentRuntimeError.createError(ChatErrorType.Unauthorized);
      }
    } catch (e) {
      const params = await options.params;

      // if the error is not a ChatCompletionErrorPayload, it means the application error
      if (!(e as ChatCompletionErrorPayload).errorType) {
        if ((e as any).code === 'ERR_JWT_EXPIRED')
          return createErrorResponse(ChatErrorType.SystemTimeNotMatchError, e);

        // other issue will be internal server error
        console.error(e);
        return createErrorResponse(ChatErrorType.InternalServerError, {
          error: e,
          provider: params?.provider,
        });
      }

      const {
        errorType = ChatErrorType.InternalServerError,
        error: errorContent,
        ...res
      } = e as ChatCompletionErrorPayload;

      const error = errorContent || e;

      return createErrorResponse(errorType, { error, ...res, provider: params?.provider });
    }

    const userId = jwtPayload.userId || '';

    const extractedContext = extractTraceContext(req.headers);

    const res = await otContext.with(extractedContext, () =>
      handler(clonedReq, { ...options, jwtPayload, serverDB, userId }),
    );

    // Only inject trace headers when the handler returns a Response
    if (!(res instanceof Response)) {
      console.warn('Response is not an instance of Response, skipping trace header injection.');
      return res;
    }

    try {
      const headers = new Headers(res.headers);
      const traceparent = injectActiveTraceHeaders(headers);
      if (!traceparent) {
        return res;
      }

      return new Response(res.body, { headers, status: res.status, statusText: res.statusText });
    } catch (err) {
      console.error('Failed to inject trace headers:', err);
      return res;
    }
  };
