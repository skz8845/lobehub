import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import type { AuthContext } from '@/libs/trpc/lambda/context';
import { saAnalyzerRuntime } from '@/server/services/toolExecution/serverRuntimes/saAnalyzer';

const rt = (ctx: AuthContext) =>
  saAnalyzerRuntime.createWithTokens({ appToken: ctx.rzzxAppToken, userToken: ctx.rzzxUserToken });

const networkBase = {
  endTime: z.string().optional(),
  networkTypes: z.array(z.string()).optional(),
  startTime: z.string().optional(),
};
const pageBase = { pageNum: z.number().optional(), pageSize: z.number().optional() };

export const saAnalyzerRouter = router({
  // 2.4.16
  querySecurityEvents: authedProcedure
    .input(
      z.object({
        ...pageBase,
        endTime: z.string().optional(),
        levelIn: z.array(z.string()).optional(),
        networkTypeIn: z.array(z.string()).optional(),
        startTime: z.string().optional(),
        subTypeIn: z.array(z.string()).optional(),
        typeIn: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).querySecurityEvents(input)),

  // 2.9.10
  queryVulnerabilities: authedProcedure
    .input(
      z.object({
        ...pageBase,
        endTime: z.string().optional(),
        levelIn: z.array(z.string()).optional(),
        networkTypeIn: z.array(z.string()).optional(),
        startTime: z.string().optional(),
        subTypeIn: z.array(z.string()).optional(),
        typeIn: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryVulnerabilities(input)),

  // 2.12.3
  queryEnumDict: authedProcedure
    .input(z.object({ enumDictCode: z.string() }))
    .mutation(async ({ ctx, input }) => rt(ctx).queryEnumDict(input)),

  // 2.62.4
  loadDictByGroupCode: authedProcedure
    .input(
      z.object({
        groupCodes: z.array(z.string()).optional(),
        networkType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).loadDictByGroupCode(input)),

  // 2.15.1 + 2.15.2
  getAbnormalDeviceStats: authedProcedure
    .input(
      z.object({
        ...networkBase,
        ...pageBase,
        subTypeIn: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getAbnormalDeviceStats(input)),

  // 2.15.4+2.15.5+2.18.2+2.18.18
  getAttackTopIPs: authedProcedure
    .input(
      z.object({
        ...networkBase,
        direction: z.enum(['attacker', 'attacked']),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getAttackTopIPs(input)),

  // 2.15.6
  getAttackInfoView: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getAttackInfoView(input)),

  // 2.15.8+2.15.9
  getIllegalSoftwareStats: authedProcedure
    .input(
      z.object({
        ...networkBase,
        groupCodes: z.array(z.string()).optional(),
        limit: z.number().optional(),
        queryType: z.enum(['stats', 'userTop']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getIllegalSoftwareStats(input)),

  // 2.15.10+2.30.7
  getIllegalOutreachTop: authedProcedure
    .input(z.object({ ...networkBase, limit: z.number().optional() }))
    .mutation(async ({ ctx, input }) => rt(ctx).getIllegalOutreachTop(input)),

  // 2.15.13
  getMaliciousProgramStats: authedProcedure
    .input(z.object({ ...networkBase, groupCodes: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => rt(ctx).getMaliciousProgramStats(input)),

  // 2.15.16+2.18.14
  getSecurityOverview: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getSecurityOverview(input)),

  // 2.15.17+2.18.15
  getEventTypeStats: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getEventTypeStats(input)),

  // 2.15.18+2.18.16+2.41.8
  getEventRiskStats: authedProcedure
    .input(z.object({ ...networkBase, groupCodes: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => rt(ctx).getEventRiskStats(input)),

  // 2.15.19+2.18.17
  getEventSubTypeStats: authedProcedure
    .input(z.object({ ...networkBase, firstTypes: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => rt(ctx).getEventSubTypeStats(input)),

  // 2.15.20+2.18.5+2.30.6+2.41.6
  getDeviceTypeStats: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getDeviceTypeStats(input)),

  // 2.15.22
  getUserActionStats: authedProcedure
    .input(z.object({ ...networkBase, groupCodes: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => rt(ctx).getUserActionStats(input)),

  // 2.18.4+2.30.4+2.41.13
  getDeviceOnlineStats: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getDeviceOnlineStats(input)),

  // 2.18.6
  getDeviceCount: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getDeviceCount(input)),

  // 2.18.7+2.18.8
  getEventTrend: authedProcedure
    .input(
      z.object({
        ...networkBase,
        firstTypes: z.array(z.string()).optional(),
        groupCodes: z.array(z.string()).optional(),
        trendType: z.enum(['byType', 'byLevel']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getEventTrend(input)),

  // 2.18.11
  getMediumHighRiskHosts: authedProcedure
    .input(z.object({ ...networkBase, ...pageBase }))
    .mutation(async ({ ctx, input }) => rt(ctx).getMediumHighRiskHosts(input)),

  // 2.30.1
  getVideoBoundaryViolation: authedProcedure
    .input(z.object({ ...networkBase, firstTypes: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => rt(ctx).getVideoBoundaryViolation(input)),

  // 2.30.3
  getVideoDeviceIpRate: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getVideoDeviceIpRate(input)),

  // 2.30.16+2.30.17+2.30.18+2.30.19
  getVideoSecurityRisk: authedProcedure
    .input(
      z.object({
        ...networkBase,
        firstTypes: z.array(z.string()).optional(),
        queryType: z
          .enum(['firstType', 'riskDistribution', 'riskDistributionByLevel', 'subType'])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getVideoSecurityRisk(input)),

  // 2.30.21~2.30.26
  getVideoWeakPassStats: authedProcedure
    .input(
      z.object({
        ...networkBase,
        deviceType: z.string().optional(),
        groupCodes: z.array(z.string()).optional(),
        limit: z.number().optional(),
        queryType: z
          .enum([
            'abnormal',
            'abnormalType',
            'mediumAndAbove',
            'mediumAndAboveTop',
            'show',
            'subMediumAndAbove',
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getVideoWeakPassStats(input)),

  // 2.36.1
  getNetworkAreaDeviceTypeStat: authedProcedure
    .input(
      z.object({
        endTime: z.string().optional(),
        networkType: z.string().optional(),
        regionId: z.number().optional(),
        startTime: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getNetworkAreaDeviceTypeStat(input)),

  // 2.36.8
  getRiskLevel: authedProcedure
    .input(z.object(networkBase))
    .mutation(async ({ ctx, input }) => rt(ctx).getRiskLevel(input)),

  // 2.36.10
  getWorkSuggestions: authedProcedure
    .input(
      z.object({
        endTime: z.string().optional(),
        networkType: z.string().optional(),
        startTime: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getWorkSuggestions(input)),

  // 2.39.5
  queryMessages: authedProcedure
    .input(z.object({ ...pageBase, isRead: z.number().optional() }))
    .mutation(async ({ ctx, input }) => rt(ctx).queryMessages(input)),

  // 2.39.8
  markAllMessagesRead: authedProcedure.mutation(async ({ ctx }) => rt(ctx).markAllMessagesRead()),

  // 2.41.x
  getMobileNetworkStats: authedProcedure
    .input(
      z.object({
        ...networkBase,
        firstTypes: z.array(z.string()).optional(),
        groupCodes: z.array(z.string()).optional(),
        limit: z.number().optional(),
        queryType: z
          .enum([
            'accessTimes',
            'attackTrend',
            'deviceView',
            'dstIpTop',
            'flowTrend',
            'modelDistribution',
            'nonWorkHours',
            'onlineDeviceTrend',
            'srcIpTop',
            'wafEventProportion',
            'wafSubEventProportion',
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).getMobileNetworkStats(input)),

  // 2.59.24
  queryAssets: authedProcedure
    .input(
      z.object({
        ...pageBase,
        ip: z.string().optional(),
        networkType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => rt(ctx).queryAssets(input)),
});
