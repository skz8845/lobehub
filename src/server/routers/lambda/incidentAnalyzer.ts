import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import type { AuthContext } from '@/libs/trpc/lambda/context';
import { incidentAnalyzerRuntime } from '@/server/services/toolExecution/serverRuntimes/incidentAnalyzer';

const rt = (ctx: AuthContext) =>
  incidentAnalyzerRuntime.createWithTokens({
    appToken: ctx.rzzxAppToken,
    userToken: ctx.rzzxUserToken,
  });

const networkFilter = {
  endTime: z.string().optional(),
  networkTypeIn: z.array(z.string()).optional(),
  startTime: z.string().optional(),
};

const pageBase = { pageNum: z.number().optional(), pageSize: z.number().optional() };

export const incidentAnalyzerRouter = router({
  analyzeAttackBehavior: authedProcedure
    .input(
      z.object({
        ...networkFilter,
        srcIp: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).analyzeAttackBehavior(input)),

  attributeIncident: authedProcedure
    .input(
      z.object({
        endTime: z.string().optional(),
        indicators: z.array(z.string()).optional(),
        networkTypeIn: z.array(z.string()).optional(),
        srcIp: z.string().optional(),
        startTime: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).attributeIncident(input)),

  buildAttackerProfile: authedProcedure
    .input(
      z.object({
        ...networkFilter,
        srcIp: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).buildAttackerProfile(input)),

  queryAttackedTargets: authedProcedure
    .input(
      z.object({
        ...networkFilter,
        ...pageBase,
        srcIp: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryAttackedTargets(input)),

  queryAttackerEvents: authedProcedure
    .input(
      z.object({
        ...networkFilter,
        ...pageBase,
        levelIn: z.array(z.string()).optional(),
        srcIp: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryAttackerEvents(input)),

  queryIndicatorIntel: authedProcedure
    .input(
      z.object({
        indicator: z.string().min(1),
        type: z.enum(['ip', 'domain', 'url', 'hash']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryIndicatorIntel(input)),
});
