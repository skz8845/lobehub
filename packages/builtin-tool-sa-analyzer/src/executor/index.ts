import type { BuiltinToolContext, BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { lambdaClient } from '@/libs/trpc/client';

import { SaAnalyzerApiName, SaAnalyzerIdentifier } from '../types';

function makeResult(result: any, stateExtras?: Record<string, any>): BuiltinToolResult {
  if (!result.success) return result as BuiltinToolResult;
  return { ...result, state: { data: result.data, ...stateExtras } };
}

function errResult(msg: string, e: unknown): BuiltinToolResult {
  return {
    content: `${msg}: ${(e as Error).message}`,
    error: { body: e, message: (e as Error).message, type: 'PluginServerError' },
    success: false,
  };
}

class SaAnalyzerExecutor extends BaseExecutor<typeof SaAnalyzerApiName> {
  readonly identifier = SaAnalyzerIdentifier;
  protected readonly apiEnum = SaAnalyzerApiName;

  querySecurityEvents = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.querySecurityEvents.mutate(p);
      if (!r.success) return r as BuiltinToolResult;
      const records = (r as any).data?.records ?? [];
      return makeResult(r, { records, total: (r as any).data?.total ?? records.length });
    } catch (e) {
      return errResult('查询安全事件失败', e);
    }
  };

  queryVulnerabilities = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.queryVulnerabilities.mutate(p);
      if (!r.success) return r as BuiltinToolResult;
      const records = (r as any).data?.records ?? [];
      return makeResult(r, { records, total: (r as any).data?.total ?? records.length });
    } catch (e) {
      return errResult('查询脆弱性失败', e);
    }
  };

  getSecurityOverview = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getSecurityOverview.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取安全概览失败', e);
    }
  };

  getAbnormalDeviceStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getAbnormalDeviceStats.mutate(p);
      return makeResult(r, { stats: (r as any).data });
    } catch (e) {
      return errResult('获取异常设备统计失败', e);
    }
  };

  getAttackTopIPs = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getAttackTopIPs.mutate(p);
      return makeResult(r, { direction: p.direction, items: (r as any).data?.items ?? [] });
    } catch (e) {
      return errResult('获取攻击Top IP失败', e);
    }
  };

  getEventTypeStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getEventTypeStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取事件类型统计失败', e);
    }
  };

  getEventRiskStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getEventRiskStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取风险统计失败', e);
    }
  };

  getEventSubTypeStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getEventSubTypeStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取事件子类型统计失败', e);
    }
  };

  getDeviceTypeStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getDeviceTypeStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取设备类型统计失败', e);
    }
  };

  getDeviceOnlineStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getDeviceOnlineStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取设备在线统计失败', e);
    }
  };

  getIllegalOutreachTop = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getIllegalOutreachTop.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取违规外联Top失败', e);
    }
  };

  getIllegalSoftwareStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getIllegalSoftwareStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取违规软件统计失败', e);
    }
  };

  getMaliciousProgramStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getMaliciousProgramStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取恶意程序统计失败', e);
    }
  };

  getUserActionStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getUserActionStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取用户行为分析失败', e);
    }
  };

  getEventTrend = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getEventTrend.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取事件趋势失败', e);
    }
  };

  getMediumHighRiskHosts = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getMediumHighRiskHosts.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('获取中高风险主机失败', e);
    }
  };

  getVideoBoundaryViolation = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getVideoBoundaryViolation.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取边界违规统计失败', e);
    }
  };

  getVideoSecurityRisk = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getVideoSecurityRisk.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取视频网安全风险失败', e);
    }
  };

  getVideoWeakPassStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getVideoWeakPassStats.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取弱口令统计失败', e);
    }
  };

  getMobileNetworkStats = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getMobileNetworkStats.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('获取移动网统计失败', e);
    }
  };

  getRiskLevel = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getRiskLevel.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('获取风险等级失败', e);
    }
  };

  getWorkSuggestions = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getWorkSuggestions.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('获取工作建议失败', e);
    }
  };

  queryMessages = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.queryMessages.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('查询消息失败', e);
    }
  };

  markAllMessagesRead = async (_p: any, __: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.markAllMessagesRead.mutate({});
      return r as BuiltinToolResult;
    } catch (e) {
      return errResult('标记已读失败', e);
    }
  };

  queryEnumDict = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.queryEnumDict.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('查询字典失败', e);
    }
  };

  getAttackInfoView = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getAttackInfoView.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('获取攻击视图失败', e);
    }
  };

  getDeviceCount = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getDeviceCount.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('获取设备总量失败', e);
    }
  };

  getVideoDeviceIpRate = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getVideoDeviceIpRate.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('获取IP规范使用率失败', e);
    }
  };

  getNetworkAreaDeviceTypeStat = async (
    p: any,
    _: BuiltinToolContext,
  ): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.getNetworkAreaDeviceTypeStat.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('获取区域设备类型统计失败', e);
    }
  };

  queryAssets = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.queryAssets.mutate(p);
      return makeResult(r);
    } catch (e) {
      return errResult('查询资产失败', e);
    }
  };

  loadDictByGroupCode = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.saAnalyzer.loadDictByGroupCode.mutate(p);
      return makeResult(r, { items: (r as any).data ?? [] });
    } catch (e) {
      return errResult('加载字典失败', e);
    }
  };
}

export const saAnalyzerExecutor = new SaAnalyzerExecutor();
