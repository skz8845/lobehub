import { createHash } from 'node:crypto';

import { IncidentAnalyzerIdentifier } from '@lobechat/builtin-tool-incident-analyzer';
import debug from 'debug';

import { type ServerRuntimeRegistration } from './types';

const log = debug('lobe-server:incident-analyzer');

// ─── SA API client ────────────────────────────────────────────────────────────

interface SaRuntimeContext {
  rzzxAppToken?: string;
  rzzxUserToken?: string;
}

function saApiUrl() {
  return (process.env.SA_API_URL ?? 'http://192.168.9.118:28080/manage/v1').replace(/\/$/, '');
}

function saSignKey() {
  return process.env.SA_SIGN_KEY ?? '';
}

function generateSign(nonce: string, timestamp: number, queryParams: string, body: string): string {
  const source = saSignKey() + nonce + timestamp + queryParams + body;
  return createHash('md5').update(source, 'utf8').digest('hex');
}

function makeHeaders(ctx: SaRuntimeContext | undefined, queryParams: string, body: string) {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).slice(2, 15);
  return {
    'Content-Type': 'application/json',
    'RZZX-APPTOKEN': ctx?.rzzxAppToken ?? '',
    'RZZX-USERTOKEN': ctx?.rzzxUserToken ?? '',
    'nonce': nonce,
    'sign': generateSign(nonce, timestamp, queryParams, body),
    'timestamp': timestamp.toString(),
  };
}

async function saPost(ctx: SaRuntimeContext | undefined, path: string, body: Record<string, any>) {
  const url = `${saApiUrl()}${path}`;
  const bodyStr = JSON.stringify(body);
  log('SA POST %s', path);
  const res = await fetch(url, {
    body: bodyStr,
    headers: makeHeaders(ctx, '', bodyStr),
    method: 'POST',
  });
  if (!res.ok) throw new Error(`SA API ${res.status} ${path}`);
  const json = await res.json();
  return json.data;
}

// ─── MISP client ─────────────────────────────────────────────────────────────

function mispBaseUrl() {
  return (process.env.MISP_BASE_URL ?? 'https://192.168.10.142:3443').replace(/\/$/, '');
}

function mispApiKey() {
  return process.env.MISP_API_KEY ?? '';
}

async function mispPost(path: string, body: Record<string, any>): Promise<any> {
  const url = `${mispBaseUrl()}${path}`;
  const verifySsl = process.env.MISP_VERIFY_SSL === 'true';
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (!verifySsl) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    const res = await fetch(url, {
      body: JSON.stringify(body),
      headers: {
        'Accept': 'application/json',
        'Authorization': mispApiKey(),
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (!res.ok) throw new Error(`MISP API error: ${res.status}`);
    return res.json();
  } finally {
    if (!verifySsl) {
      if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL: Record<number, string> = { 1: '提示', 2: '低危', 3: '中危', 4: '高危', 5: '超危' };
const STATUS: Record<number, string> = { 1: '未消除', 2: '已处置', 3: '不处置' };
const lv = (l?: number) => (l != null ? (LEVEL[l] ?? `L${l}`) : '未知');
const st = (s?: number) => (s != null ? (STATUS[s] ?? '') : '');

const IP_RE = /^(?:\d{1,3}\.){3}\d{1,3}$|^[\d:A-F][\dA-F]*:[\d:A-F]+$/i;
const HASH_RE = /^[0-9a-f]{32}$|^[0-9a-f]{40}$|^[0-9a-f]{64}$/i;
const URL_RE = /^https?:\/\//i;

function detectType(value: string): string {
  if (IP_RE.test(value)) return 'ip';
  if (HASH_RE.test(value)) return 'hash';
  if (URL_RE.test(value)) return 'url';
  if (value.includes('.') && !value.includes(' ')) return 'domain';
  return 'unknown';
}

function formatEvent(r: any): string {
  return [
    `### ${r.eventName ?? '未知'} [${lv(r.level)}]`,
    `**时间**: ${r.time ?? '未知'} | **网络**: ${r.networkType ?? '未知'} | **状态**: ${st(r.status)}`,
    r.srcIp ? `**来源**: ${r.srcIp}${r.srcPort ? `:${r.srcPort}` : ''}` : '',
    r.dstIp ? `**目标**: ${r.dstIp}${r.dstPort ? `:${r.dstPort}` : ''}` : '',
    r.devName ? `**设备**: ${r.devName}` : '',
    r.message ? `**详情**: ${r.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Runtime factory ──────────────────────────────────────────────────────────

const createIncidentAnalyzerRuntime = (ctx?: SaRuntimeContext) => ({
  queryEventDetail: async (args: any) => {
    try {
      const { eventId } = args;
      log('queryEventDetail %s', eventId);

      // Try detail endpoint first, fall back to page query by id
      let data: any = null;
      try {
        data = await saPost(ctx, '/event/detail', { id: eventId, uuid: eventId });
      } catch {
        // Fall back: search page with id filter
        const pageData = await saPost(ctx, '/event/page', {
          id: eventId,
          networkTypeIn: ['police', 'internet', 'video', 'mobilePolice'],
          pageNum: 1,
          pageSize: 1,
        });
        data = pageData?.records?.[0] ?? null;
      }

      if (!data) {
        return {
          content: `未找到事件 ID "${eventId}" 的记录。`,
          data: null,
          success: true,
        };
      }

      const lines = [
        `## 安全事件详情 [${lv(data.level)}]`,
        '',
        `**事件名称**: ${data.eventName ?? '未知'}`,
        `**事件 ID**: ${data.id ?? eventId}`,
        `**时间**: ${data.time ?? '未知'}`,
        `**网络**: ${data.networkType ?? '未知'}`,
        `**状态**: ${st(data.status)}`,
        '',
        data.srcIp ? `**攻击来源**: ${data.srcIp}${data.srcPort ? `:${data.srcPort}` : ''}` : '',
        data.dstIp ? `**攻击目标**: ${data.dstIp}${data.dstPort ? `:${data.dstPort}` : ''}` : '',
        data.devIp ? `**监测设备**: ${data.devName ?? ''} (${data.devIp})` : '',
        '',
        data.message ? `**详情描述**: ${data.message}` : '',
      ]
        .filter((l) => l !== undefined)
        .join('\n');

      return { content: lines, data, success: true };
    } catch (e) {
      return { content: `查询事件详情失败: ${(e as Error).message}`, success: false };
    }
  },

  queryIpEvents: async (args: any) => {
    try {
      const { srcIp: ip, ipRole = 'src' } = args;
      const nets = args.networkTypeIn ?? ['police', 'internet', 'video', 'mobilePolice'];

      // Map ipRole to the correct SA API parameter
      const ipParam: Record<string, any> = {};
      if (ipRole === 'src') ipParam.srcIp = ip;
      else if (ipRole === 'dst') ipParam.dstIp = ip;
      else if (ipRole === 'dev') ipParam.devIp = ip;

      const data = await saPost(ctx, '/event/page', {
        endTime: args.endTime ?? '',
        levelIn: args.levelIn ?? [],
        networkTypeIn: nets,
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
        startTime: args.startTime ?? '',
        subTypeIn: [],
        typeIn: [],
        ...ipParam,
      });

      const records: any[] = data?.records ?? [];
      const roleLabel = ipRole === 'src' ? '攻击来源' : ipRole === 'dst' ? '攻击目标' : '监测设备';

      if (!records.length) {
        return {
          content: `未找到 ${ip}（${roleLabel}）关联的安全事件记录。`,
          data,
          success: true,
        };
      }

      const rows = records.map(formatEvent);
      return {
        content: `## ${ip} 关联事件（${roleLabel}，共 ${data?.total ?? records.length} 条，第 ${data?.current ?? 1} 页）\n\n${rows.join('\n\n---\n\n')}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `查询 IP 关联事件失败: ${(e as Error).message}`, success: false };
    }
  },

  queryAssetByIp: async (args: any) => {
    try {
      const { ip, networkType } = args;
      log('queryAssetByIp %s', ip);

      const data = await saPost(ctx, '/asset/page', {
        ip,
        networkType: networkType ?? '',
        pageNum: 1,
        pageSize: 5,
      });

      const records: any[] = data?.records ?? (Array.isArray(data) ? data : []);

      if (!records.length) {
        return {
          content: `未找到 IP ${ip} 的资产记录。该 IP 可能不在资产管理范围内。`,
          data: [],
          success: true,
        };
      }

      const lines = [
        `## ${ip} 资产信息`,
        '',
        ...records.map((r: any) =>
          [
            `**IP**: ${r.ip ?? ip}`,
            r.host ? `**主机名**: ${r.host}` : '',
            r.os ? `**操作系统**: ${r.os}` : '',
            r.assetDeviceModel ? `**设备型号**: ${r.assetDeviceModel}` : '',
            r.networkType ? `**所属网络**: ${r.networkType}` : '',
            r.openPorts ? `**开放端口**: ${r.openPorts}` : '',
            r.status ? `**在线状态**: ${r.status}` : '',
          ]
            .filter(Boolean)
            .join(' | '),
        ),
      ];

      return { content: lines.join('\n'), data: records, success: true };
    } catch (e) {
      return { content: `查询资产信息失败: ${(e as Error).message}`, success: false };
    }
  },

  queryIpVulnerabilities: async (args: any) => {
    try {
      const data = await saPost(ctx, '/vulnerability/page/ext', {
        endTime: args.endTime ?? '',
        ip: args.ip,
        levelIn: args.levelIn ?? [],
        networkTypeIn: args.networkTypeIn ?? ['video', 'police', 'internet'],
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
        startTime: args.startTime ?? '',
        subTypeIn: args.subTypeIn ?? [],
        typeIn: args.typeIn ?? [],
      });

      const records: any[] = data?.records ?? [];
      if (!records.length) {
        return {
          content: `未找到 ${args.ip} 的脆弱性记录。`,
          data,
          success: true,
        };
      }

      const rows = records.map((r: any) => {
        const ids = [r.cve, r.cnnvd, r.cnvd].filter(Boolean).join(' / ') || '无编号';
        return [
          `### ${r.name ?? '未知漏洞'} [${lv(r.level)}]`,
          `**编号**: ${ids}`,
          r.type ? `**类型**: ${r.type}` : '',
          r.ip ? `**IP**: ${r.ip}` : '',
          r.message ? `**描述**: ${r.message}` : '',
          r.time ? `**时间**: ${r.time}` : '',
        ]
          .filter(Boolean)
          .join('\n');
      });

      return {
        content: `## ${args.ip} 脆弱性（共 ${data?.total ?? records.length} 条，第 ${data?.current ?? 1} 页）\n\n${rows.join('\n\n---\n\n')}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `查询脆弱性失败: ${(e as Error).message}`, success: false };
    }
  },

  queryIndicatorIntel: async (args: any) => {
    try {
      const { indicator } = args;
      const type = args.type ?? detectType(indicator);
      log('queryIndicatorIntel %s (%s)', indicator, type);

      const rawResponse = await mispPost('/attributes/restSearch', { value: indicator });
      const rawAttrs: any[] = rawResponse?.response?.Attribute ?? [];

      if (!rawAttrs.length) {
        return {
          content: `未找到 "${indicator}" 的威胁情报记录，该指标暂无已知威胁记录。`,
          data: { records: [], type },
          success: true,
        };
      }

      const records = rawAttrs.map((attr: any) => ({
        attributes: [attr],
        event: attr.Event
          ? {
              date: attr.Event.date,
              id: attr.Event.id,
              info: attr.Event.info,
              threatLevel: attr.Event.threat_level_id,
            }
          : undefined,
        event_id: attr.event_id,
        id: attr.id,
        primaryAttribute: {
          category: attr.category,
          comment: attr.comment,
          tags: attr.Tag?.map((t: any) => ({ colour: t.colour, name: t.name })),
          timestamp: attr.timestamp,
          to_ids: Boolean(attr.to_ids),
          type: attr.type,
          value: attr.value,
        },
      }));

      const iocCount = records.filter((r) => r.primaryAttribute.to_ids).length;
      const lines = [
        `## 威胁情报: ${indicator} (${type})`,
        '',
        `共 **${records.length}** 条记录，其中 **${iocCount}** 条为已确认 IOC`,
        '',
        ...records.slice(0, 5).map((r) => {
          const p = r.primaryAttribute;
          const ev = r.event;
          return [
            `### 事件 ${r.event_id}${ev?.info ? ` — ${ev.info}` : ''}`,
            `- **类型**: ${p.type} | **分类**: ${p.category} | **IOC**: ${p.to_ids ? '✅ 已确认' : '❌ 未确认'}`,
            p.comment ? `- **备注**: ${p.comment}` : '',
            p.tags?.length ? `- **标签**: ${p.tags.map((t: any) => t.name).join(', ')}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        }),
      ];

      return {
        content: lines.join('\n'),
        data: { records, total: records.length, type },
        records,
        success: true,
        type,
      };
    } catch (e) {
      return { content: `查询威胁情报失败: ${(e as Error).message}`, success: false };
    }
  },
});

type IncidentAnalyzerRuntime = ReturnType<typeof createIncidentAnalyzerRuntime>;

export const incidentAnalyzerRuntime: ServerRuntimeRegistration & {
  createWithTokens: (tokens: { appToken?: string; userToken?: string }) => IncidentAnalyzerRuntime;
} = {
  createWithTokens: (tokens) =>
    createIncidentAnalyzerRuntime({
      rzzxAppToken: tokens.appToken,
      rzzxUserToken: tokens.userToken,
    }),
  factory: (context?: any) =>
    createIncidentAnalyzerRuntime({
      rzzxAppToken: context?.rzzxAppToken,
      rzzxUserToken: context?.rzzxUserToken,
    }),
  identifier: IncidentAnalyzerIdentifier,
};
