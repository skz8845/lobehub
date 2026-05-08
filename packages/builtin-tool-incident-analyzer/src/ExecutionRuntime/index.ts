import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type {
  DecodePayloadArgs,
  DecodePayloadState,
  GetScenarioGuideArgs,
  GetScenarioGuideState,
  QueryAssetByIpArgs,
  QueryAssetByIpState,
  QueryEventDetailArgs,
  QueryEventDetailState,
  QueryIpEventsArgs,
  QueryIpEventsState,
  QueryIpVulnerabilitiesArgs,
  QueryIpVulnerabilitiesState,
  ReplayRequestArgs,
  ReplayRequestState,
} from '../types';

export interface IncidentAnalyzerServiceResult {
  content: string;
  data?: any;
  success: boolean;
}

export interface IncidentAnalyzerService {
  decodePayload?: (args: DecodePayloadArgs) => Promise<IncidentAnalyzerServiceResult>;
  getScenarioGuide?: (args: GetScenarioGuideArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryAssetByIp: (args: QueryAssetByIpArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryEventDetail: (args: QueryEventDetailArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryIpEvents: (args: QueryIpEventsArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryIpVulnerabilities: (
    args: QueryIpVulnerabilitiesArgs,
  ) => Promise<IncidentAnalyzerServiceResult>;
  replayRequest?: (args: ReplayRequestArgs) => Promise<IncidentAnalyzerServiceResult>;
}

export class IncidentAnalyzerExecutionRuntime {
  private service: IncidentAnalyzerService;

  constructor(service: IncidentAnalyzerService) {
    this.service = service;
  }

  async getScenarioGuide(args: GetScenarioGuideArgs): Promise<BuiltinServerRuntimeOutput> {
    if (this.service.getScenarioGuide) {
      try {
        const result = await this.service.getScenarioGuide(args);
        if (!result.success) return { content: result.content, success: false };
        const state: GetScenarioGuideState = result.data ?? { guide: '', id: 'N', name: '其他' };
        return { content: result.content, state, success: true };
      } catch (e) {
        return { content: `获取场景指引失败: ${(e as Error).message}`, error: e, success: false };
      }
    }
    return { content: '场景指引服务不可用', success: false };
  }

  async decodePayload(args: DecodePayloadArgs): Promise<BuiltinServerRuntimeOutput> {
    if (this.service.decodePayload) {
      try {
        const result = await this.service.decodePayload(args);
        if (!result.success) return { content: result.content, success: false };
        const state: DecodePayloadState = result.data ?? {
          decoded: args.payload,
          layers: [],
          original: args.payload,
        };
        return { content: result.content, state, success: true };
      } catch (e) {
        return { content: `解码失败: ${(e as Error).message}`, error: e, success: false };
      }
    }
    return { content: '解码服务不可用', success: false };
  }

  async queryEventDetail(args: QueryEventDetailArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryEventDetail(args);
      if (!result.success) return { content: result.content, success: false };
      const state: QueryEventDetailState = {
        event: result.data ?? null,
        eventId: args.eventId,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询事件详情失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async queryIpEvents(args: QueryIpEventsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryIpEvents(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QueryIpEventsState = {
        current: result.data?.current,
        ip: args.srcIp,
        ipRole: args.ipRole ?? 'src',
        records,
        total: result.data?.total ?? records.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `查询 IP 关联事件失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }

  async queryAssetByIp(args: QueryAssetByIpArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryAssetByIp(args);
      if (!result.success) return { content: result.content, success: false };
      const state: QueryAssetByIpState = {
        assets: result.data ?? [],
        ip: args.ip,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询资产信息失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async queryIpVulnerabilities(
    args: QueryIpVulnerabilitiesArgs,
  ): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryIpVulnerabilities(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QueryIpVulnerabilitiesState = {
        ip: args.ip,
        records,
        total: result.data?.total ?? records.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询脆弱性失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async replayRequest(args: ReplayRequestArgs): Promise<BuiltinServerRuntimeOutput> {
    if (this.service.replayRequest) {
      try {
        const result = await this.service.replayRequest(args);
        if (!result.success) return { content: result.content, success: false };
        const state: ReplayRequestState = result.data ?? {
          authResult: 'error',
          host: args.host,
          port: args.port,
          protocol: args.protocol,
          success: false,
        };
        return { content: result.content, state, success: true };
      } catch (e) {
        return { content: `请求回放失败: ${(e as Error).message}`, error: e, success: false };
      }
    }
    return { content: '回放服务不可用', success: false };
  }
}
