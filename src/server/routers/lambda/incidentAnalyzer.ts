import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import type { AuthContext } from '@/libs/trpc/lambda/context';
import { incidentAnalyzerRuntime } from '@/server/services/toolExecution/serverRuntimes/incidentAnalyzer';

const rt = (ctx: AuthContext) =>
  incidentAnalyzerRuntime.createWithTokens({
    appToken: ctx.rzzxAppToken,
    userToken: ctx.rzzxUserToken,
  });

export const incidentAnalyzerRouter = router({
  queryAssetByIp: authedProcedure
    .input(
      z.object({
        ip: z.string().min(1),
        networkType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryAssetByIp(input)),

  queryEventDetail: authedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => rt(ctx).queryEventDetail(input)),

  queryIpVulnerabilities: authedProcedure
    .input(
      z.object({
        endTime: z.string().optional(),
        ip: z.string().min(1),
        levelIn: z.array(z.string()).optional(),
        networkTypeIn: z.array(z.string()).optional(),
        pageNum: z.number().optional(),
        pageSize: z.number().optional(),
        startTime: z.string().optional(),
        subTypeIn: z.array(z.string()).optional(),
        typeIn: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryIpVulnerabilities(input)),

  queryIndicatorIntel: authedProcedure
    .input(
      z.object({
        indicator: z.string().min(1),
        type: z.enum(['domain', 'hash', 'ip', 'url']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryIndicatorIntel(input)),

  queryIpEvents: authedProcedure
    .input(
      z.object({
        endTime: z.string().optional(),
        ipRole: z.enum(['dev', 'dst', 'src']).optional(),
        levelIn: z.array(z.string()).optional(),
        networkTypeIn: z.array(z.string()).optional(),
        pageNum: z.number().optional(),
        pageSize: z.number().optional(),
        srcIp: z.string().min(1),
        startTime: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryIpEvents(input)),
});
