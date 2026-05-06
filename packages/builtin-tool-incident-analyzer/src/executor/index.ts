import type { BuiltinToolContext, BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { lambdaClient } from '@/libs/trpc/client';

import { IncidentAnalyzerApiName, IncidentAnalyzerIdentifier } from '../types';

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

class IncidentAnalyzerExecutor extends BaseExecutor<typeof IncidentAnalyzerApiName> {
  readonly identifier = IncidentAnalyzerIdentifier;
  protected readonly apiEnum = IncidentAnalyzerApiName;

  queryAttackerEvents = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.queryAttackerEvents.mutate(p);
      if (!r.success) return r as BuiltinToolResult;
      const records = (r as any).data?.records ?? [];
      return makeResult(r, {
        records,
        srcIp: p.srcIp,
        total: (r as any).data?.total ?? records.length,
      });
    } catch (e) {
      return errResult('查询攻击者历史事件失败', e);
    }
  };

  analyzeAttackBehavior = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.analyzeAttackBehavior.mutate(p);
      return makeResult(r, { profile: (r as any).data, srcIp: p.srcIp });
    } catch (e) {
      return errResult('分析攻击行为失败', e);
    }
  };

  queryIndicatorIntel = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.queryIndicatorIntel.mutate(p);
      if (!r.success) return r as BuiltinToolResult;
      const records = (r as any).records ?? [];
      return makeResult(r, {
        indicator: p.indicator,
        records,
        total: records.length,
        type: (r as any).type ?? 'unknown',
      });
    } catch (e) {
      return errResult('查询威胁情报失败', e);
    }
  };

  buildAttackerProfile = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.buildAttackerProfile.mutate(p);
      return makeResult(r, { profile: (r as any).data, srcIp: p.srcIp });
    } catch (e) {
      return errResult('构建攻击者画像失败', e);
    }
  };

  queryAttackedTargets = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.queryAttackedTargets.mutate(p);
      if (!r.success) return r as BuiltinToolResult;
      const items = (r as any).data?.items ?? [];
      return makeResult(r, {
        items,
        srcIp: p.srcIp,
        total: (r as any).data?.total ?? items.length,
      });
    } catch (e) {
      return errResult('查询被攻击目标失败', e);
    }
  };

  attributeIncident = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.attributeIncident.mutate(p);
      return makeResult(r, { attribution: (r as any).data, srcIp: p.srcIp });
    } catch (e) {
      return errResult('归因分析失败', e);
    }
  };
}

export const incidentAnalyzerExecutor = new IncidentAnalyzerExecutor();
