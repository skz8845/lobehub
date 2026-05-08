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
  getScenarioGuide: authedProcedure
    .input(
      z.object({
        eventName: z.string().optional(),
        subType: z.string().optional(),
        type: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getScenarioGuide(input)),

  decodePayload: authedProcedure
    .input(
      z.object({
        encoding: z.enum(['auto', 'base64', 'hex', 'html', 'unicode', 'url']).optional(),
        payload: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).decodePayload(input)),
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

  replayRequest: authedProcedure
    .input(
      z.object({
        body: z.string().optional(),
        headers: z.record(z.string()).optional(),
        host: z.string().min(1),
        password: z.string().optional(),
        port: z.number().optional(),
        protocol: z.enum(['ftp', 'http', 'https', 'rdp', 'ssh']),
        queryParams: z.string().optional(),
        rawRequest: z.string().optional(),
        timeout: z.number().optional(),
        username: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).replayRequest(input)),
});
