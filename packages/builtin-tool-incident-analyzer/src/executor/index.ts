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

  queryEventDetail = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.queryEventDetail.mutate(p);
      return makeResult(r, { event: (r as any).data ?? null, eventId: p.eventId });
    } catch (e) {
      return errResult('查询事件详情失败', e);
    }
  };

  queryIpEvents = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.queryIpEvents.mutate(p);
      if (!r.success) return r as BuiltinToolResult;
      const records = (r as any).data?.records ?? [];
      return makeResult(r, {
        ip: p.srcIp,
        ipRole: p.ipRole ?? 'src',
        records,
        total: (r as any).data?.total ?? records.length,
      });
    } catch (e) {
      return errResult('查询 IP 关联事件失败', e);
    }
  };

  queryAssetByIp = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.queryAssetByIp.mutate(p);
      return makeResult(r, { assets: (r as any).data ?? [], ip: p.ip });
    } catch (e) {
      return errResult('查询资产信息失败', e);
    }
  };

  queryIpVulnerabilities = async (p: any, _: BuiltinToolContext): Promise<BuiltinToolResult> => {
    try {
      const r = await lambdaClient.incidentAnalyzer.queryIpVulnerabilities.mutate(p);
      if (!r.success) return r as BuiltinToolResult;
      const records = (r as any).data?.records ?? [];
      return makeResult(r, {
        ip: p.ip,
        records,
        total: (r as any).data?.total ?? records.length,
      });
    } catch (e) {
      return errResult('查询脆弱性失败', e);
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
}

export const incidentAnalyzerExecutor = new IncidentAnalyzerExecutor();
