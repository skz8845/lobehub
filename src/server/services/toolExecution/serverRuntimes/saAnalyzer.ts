import { createHash } from 'node:crypto';

import { POLICE_32_ANQUAN, SaAnalyzerIdentifier } from '@lobechat/builtin-tool-sa-analyzer';
import debug from 'debug';

const log = debug('lobe-server:sa-analyzer');

// ─── SA API client ────────────────────────────────────────────────────────────

interface SaRuntimeContext {
  rzzxAppToken?: string;
  rzzxUserToken?: string;
}

export function saApiUrl() {
  return (process.env.SA_API_URL ?? 'http://192.168.9.118:28080/manage/v1').replace(/\/$/, '');
}

export function saSignKey() {
  return process.env.SA_SIGN_KEY ?? '';
}

export function generateSign(
  nonce: string,
  timestamp: number,
  queryParams: string,
  body: string,
): string {
  const signKey = saSignKey();
  const source = signKey + nonce + timestamp + queryParams + body;
  const result = createHash('md5').update(source, 'utf8').digest('hex');
  log(`generateSign result ${result} ${source}`);
  return result;
}

export function generateHeadersAndSign(
  ctx: SaRuntimeContext | undefined,
  queryParams: string,
  body: string,
) {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).slice(2, 15);
  const sign = generateSign(nonce, timestamp, queryParams, body);
  const appToken = ctx?.rzzxAppToken ?? '';
  const userToken = ctx?.rzzxUserToken ?? '';
  const headers = {
    'Content-Type': 'application/json',
    'RZZX-APPTOKEN': appToken,
    'RZZX-USERTOKEN': userToken,
    'sign': sign,
    'timestamp': timestamp.toString(),
    'nonce': nonce,
  };
  return headers;
}

async function saPost(ctx: SaRuntimeContext | undefined, path: string, body: Record<string, any>) {
  const url = `${saApiUrl()}${path}`;
  const bodyStr = JSON.stringify(body);
  const headers = generateHeadersAndSign(ctx, '', bodyStr);
  log('SA POST %s', path);
  const res = await fetch(url, {
    body: bodyStr,
    headers,
    method: 'POST',
  });
  if (!res.ok) throw new Error(`SA API ${res.status} ${path}`);
  const json = await res.json();
  return json.data;
}

async function saGet(
  ctx: SaRuntimeContext | undefined,
  path: string,
  params: Record<string, string>,
) {
  const qs = new URLSearchParams(params).toString();
  const url = `${saApiUrl()}${path}${qs ? `?${qs}` : ''}`;
  const headers = generateHeadersAndSign(ctx, qs, '');
  log('SA GET %s', path);
  const res = await fetch(url, { headers, method: 'GET' });
  if (!res.ok) throw new Error(`SA API ${res.status} ${path}`);
  const json = await res.json();
  return json.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL: Record<number, string> = { 1: '提示', 2: '低危', 3: '中危', 4: '高危', 5: '超危' };
const STATUS: Record<number, string> = { 1: '未消除', 2: '已处置', 3: '不处置' };
const lv = (l?: number) => (l != null ? (LEVEL[l] ?? `L${l}`) : '未知');
const st = (s?: number) => (s != null ? (STATUS[s] ?? '') : '');

// ─── Runtime factory ──────────────────────────────────────────────────────────

const createSaRuntime = (ctx?: SaRuntimeContext) => ({
  rzzxAppToken: ctx?.rzzxAppToken,
  rzzxUserToken: ctx?.rzzxUserToken,

  // 2.4.16
  querySecurityEvents: async (args: any) => {
    try {
      const data = await saPost(ctx, '/event/page', {
        endTime: args.endTime ?? '',
        levelIn: args.levelIn ?? [],
        networkTypeIn: args.networkTypeIn ?? ['police'],
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
        startTime: args.startTime ?? '',
        subTypeIn: args.subTypeIn ?? [],
        typeIn: args.typeIn ?? [],
      });
      const records: any[] = data.records ?? [];
      if (!records.length) return { content: '未找到相关安全事件。', data, success: true };
      const rows = records.map((r: any) =>
        [
          `### ${r.eventName ?? '未知'} [${lv(r.level)}]`,
          r.message ? `**详情**: ${r.message}` : '',
          r.srcIp ? `**源IP**: ${r.srcIp}${r.srcPort ? `:${r.srcPort}` : ''}` : '',
          r.dstIp ? `**目标IP**: ${r.dstIp}${r.dstPort ? `:${r.dstPort}` : ''}` : '',
          r.devName ? `**设备**: ${r.devName}` : '',
          r.time ? `**时间**: ${r.time}` : '',
          r.status != null ? `**状态**: ${st(r.status)}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
      return {
        content: `## 安全事件（共${data.total ?? records.length}，第${data.current ?? 1}页）\n\n${rows.join('\n\n---\n\n')}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `查询安全事件失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.9.10
  queryVulnerabilities: async (args: any) => {
    try {
      const data = await saPost(ctx, '/vulnerability/page/ext', {
        endTime: args.endTime ?? '',
        levelIn: args.levelIn ?? [],
        networkTypeIn: args.networkTypeIn ?? ['police'],
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
        startTime: args.startTime ?? '',
        subTypeIn: args.subTypeIn ?? [],
        typeIn: args.typeIn ?? [],
      });
      const records: any[] = data.records ?? [];
      if (!records.length) return { content: '未找到相关脆弱性数据。', data, success: true };
      const rows = records.map((r: any) => {
        const ids = [r.cve, r.cnnvd, r.cnvd].filter(Boolean).join(' / ') || '未知';
        return [
          `### ${r.name ?? '未知漏洞'} [${lv(r.level)}]`,
          `**编号**: ${ids}`,
          r.ip ? `**IP**: ${r.ip}` : '',
          r.message ? `**描述**: ${r.message}` : '',
          r.time ? `**时间**: ${r.time}` : '',
        ]
          .filter(Boolean)
          .join('\n');
      });
      return {
        content: `## 脆弱性（共${data.total ?? records.length}，第${data.current ?? 1}页）\n\n${rows.join('\n\n---\n\n')}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `查询脆弱性失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.12.3
  queryEnumDict: async (args: any) => {
    try {
      const data = await saGet(ctx, '/dynamic/queryEnumDict', { enumDictCode: args.enumDictCode });
      const items: any[] = Array.isArray(data) ? data : [];
      return {
        content: `## 字典: ${args.enumDictCode}\n\n${items.map((i: any) => `- **${i.itemCode}**: ${i.itemValue}`).join('\n') || '暂无'}`,
        data: items,
        success: true,
      };
    } catch (e) {
      return { content: `查询字典失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.62.4
  loadDictByGroupCode: async (args: any) => {
    try {
      const data: any[] = await saPost(ctx, '/dictItem/loadDictByGroupCode', {
        groupCodes: args.groupCodes ?? [],
        networkType: args.networkType ?? 'police',
      });
      const fmt = (item: any): string => {
        const children = item.children?.length
          ? `\n${item.children.map((c: any) => `  - **${c.itemCode}**: ${c.itemValue}`).join('\n')}`
          : '';
        return `- **${item.itemCode}**: ${item.itemValue}${children}`;
      };
      return {
        content: `## 字典组\n\n${(data ?? []).map(fmt).join('\n') || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `加载字典失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.1 + 2.15.2
  getAbnormalDeviceStats: async (args: any) => {
    try {
      if (args.pageNum != null) {
        const data = await saPost(ctx, '/policeNetwork/view/abnormalDevicePage', {
          endTime: args.endTime ?? '',
          pageNum: args.pageNum,
          pageSize: args.pageSize ?? 10,
          startTime: args.startTime ?? '',
          subTypeIn: args.subTypeIn ?? [],
        });
        return { content: `## 异常设备列表（共${data.total ?? 0}）`, data, success: true };
      }
      const data = await saPost(ctx, '/policeNetwork/view/abnormalDeviceDistribution', {
        endTime: args.endTime ?? '',
        networkTypes: args.networkTypes ?? ['police'],
        startTime: args.startTime ?? '',
      });
      return {
        content: `## 异常设备分布\n\n- **异常设备总数**: ${data.abnormalDeviceTotal ?? 0}\n- **违规外联**: ${data.externalConTotal ?? 0}\n- **脆弱口令**: ${data.vulnerabilityTotal ?? 0}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取异常设备统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.4+2.15.5+2.15.6+2.18.2+2.18.18
  getAttackTopIPs: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['police'];
      let path: string;
      let isPage = false;
      if (nets.includes('internet')) {
        path =
          args.direction === 'attacker'
            ? '/internetNetwork/view/attackIpTop'
            : '/internetNetwork/view/theAttackedIpTop';
        isPage = true;
      } else {
        path =
          args.direction === 'attacker'
            ? '/policeNetwork/view/attackerTop'
            : '/policeNetwork/view/attackedTop';
      }
      const body: any = {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      };
      if (isPage) {
        body.pageNum = 1;
        body.pageSize = 10;
      }
      const raw = await saPost(ctx, path, body);
      const items: any[] = isPage ? (raw.records ?? []) : Array.isArray(raw) ? raw : [];
      const ipF = args.direction === 'attacker' ? 'srcIp' : 'dstIp';
      const dirF = args.direction === 'attacker' ? 'srcIpDirection' : 'dstIpDirection';
      const title = args.direction === 'attacker' ? '攻击者 Top IP' : '被攻击者 Top IP';
      const rows = items
        .map(
          (it: any, i: number) =>
            `| ${i + 1} | ${it[ipF] ?? it.dev_ip ?? '未知'} | ${it[dirF] ?? ''} | ${it.eventCount ?? it.riskCount ?? 0} |`,
        )
        .join('\n');
      return {
        content: `## ${title}\n\n| 排名 | IP | 方向 | 次数 |\n|------|-----|------|------|\n${rows || '暂无'}`,
        data: { direction: args.direction, items },
        success: true,
      };
    } catch (e) {
      return { content: `获取攻击Top IP失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.6 (exposed separately)
  getAttackInfoView: async (args: any) => {
    try {
      const data: any[] = await saPost(ctx, '/policeNetwork/view/attInfoView', {
        endTime: args.endTime ?? '',
        networkTypes: args.networkTypes ?? ['police'],
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? []).map(
        (it: any) =>
          `**${it.networkType ?? '未知'}**: 事件${it.eventCount ?? 0}次，来源IP ${it.fromIpCount ?? 0}，目标IP ${it.toIpCount ?? 0}，内→外${it.outDirection ?? 0}，外→内${it.inDirection ?? 0}`,
      );
      return {
        content: `## 网络攻击信息视图\n\n${rows.join('\n') || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取攻击视图失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.8+2.15.9
  getIllegalSoftwareStats: async (args: any) => {
    try {
      if (args.queryType === 'userTop') {
        const data: any[] = await saPost(
          ctx,
          '/policeNetwork/view/illegalityUseOfSoftwareUserTop',
          {
            endTime: args.endTime ?? '',
            groupCodes: args.groupCodes ?? ['event_type'],
            limit: args.limit ?? 50,
            networkTypes: args.networkTypes ?? ['police'],
            startTime: args.startTime ?? '',
          },
        );
        const rows = (data ?? [])
          .map(
            (it: any) =>
              `| ${it.typeName ?? '未知'} | ${it.eventCount ?? 0} | ${it.networkType ?? ''} |`,
          )
          .join('\n');
        return {
          content: `## 违规软件用户Top\n\n| 用户 | 事件数 | 网络 |\n|------|--------|------|\n${rows || '暂无'}`,
          data,
          success: true,
        };
      }
      const data: any[] = await saPost(ctx, '/policeNetwork/view/illegalityUseOfSoftware', {
        endTime: args.endTime ?? '',
        groupCodes: args.groupCodes ?? ['event_type'],
        limit: args.limit ?? 10,
        networkTypes: args.networkTypes ?? ['police'],
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map(
          (it: any) =>
            `| ${it.typeName ?? it.typeCode ?? '未知'} | ${it.devCount ?? 0} | ${it.times ?? 0} |`,
        )
        .join('\n');
      return {
        content: `## 违规软件统计\n\n| 类型 | 设备数 | 事件数 |\n|------|--------|--------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取违规软件统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.10+2.30.7
  getIllegalOutreachTop: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['police'];
      const path = nets.includes('video')
        ? '/videoNetwork/view/illegalOutreach/top'
        : '/policeNetwork/view/illegalOutreachTop';
      const data: any[] = await saPost(ctx, path, {
        endTime: args.endTime ?? '',
        limit: args.limit ?? 8,
        networkTypes: nets,
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map(
          (it: any, i: number) =>
            `| ${i + 1} | ${it.devIp ?? '未知'} | ${it.devType ?? ''} | ${it.accessCount ?? it.riskTotalCount ?? 0} |`,
        )
        .join('\n');
      return {
        content: `## 违规外联Top\n\n| 排名 | 设备IP | 类型 | 次数 |\n|------|--------|------|------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取违规外联Top失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.13
  getMaliciousProgramStats: async (args: any) => {
    try {
      const data: any[] = await saPost(ctx, '/policeNetwork/view/maliciousProgramCount', {
        endTime: args.endTime ?? '',
        groupCodes: args.groupCodes ?? ['event_type'],
        networkTypes: args.networkTypes ?? ['police'],
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map((it: any) => `| ${it.typeName ?? it.typeCode ?? '未知'} | ${it.eventCount ?? 0} |`)
        .join('\n');
      return {
        content: `## 恶意程序统计\n\n| 类型 | 事件数 |\n|------|--------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取恶意程序统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.16+2.18.14
  getSecurityOverview: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['police'];
      const path = nets.includes('internet')
        ? '/internetNetwork/view/securityEventsView'
        : '/policeNetwork/view/securityEventsView';
      const data: any[] = await saPost(ctx, path, {
        endTime: args.endTime ?? '',
        groupCodes: ['event_type'],
        networkTypes: nets,
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? []).map(
        (it: any) =>
          `**${it.networkType ?? '未知'}**: 事件${it.eventCount ?? 0}，设备${it.devCount ?? 0}，已处置${it.disposedCount ?? 0}，今日事件${it.todayEventCount ?? 0}`,
      );
      return { content: `## 安全事件概览\n\n${rows.join('\n') || '暂无'}`, data, success: true };
    } catch (e) {
      return { content: `获取安全概览失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.17+2.18.1+2.18.15
  getEventTypeStats: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['police'];
      const path = nets.includes('internet')
        ? '/internetNetwork/view/sercurityEventByFirstTypeCount'
        : '/policeNetwork/view/sercurityEventByFirstTypeCount';
      const data: any[] = await saPost(ctx, path, {
        endTime: args.endTime ?? '',
        groupCodes: ['event_type'],
        networkTypes: nets,
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map(
          (it: any) =>
            `| ${it.typeName ?? it.typeCode ?? '未知'} | ${it.eventCount ?? 0} | ${it.devCount ?? 0} |`,
        )
        .join('\n');
      return {
        content: `## 事件类型统计\n\n| 类型 | 事件数 | 设备数 |\n|------|--------|--------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取事件类型统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.18+2.18.16+2.41.8
  getEventRiskStats: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['police'];
      let path: string;
      if (nets.includes('mobilePolice')) path = '/mobileNetwork/view/eventCountByRiskLevel';
      else if (nets.includes('internet'))
        path = '/internetNetwork/view/sercurityEventByRiskLevelCount';
      else path = '/policeNetwork/view/sercurityEventByRiskLevelCount';
      const body: any = {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      };
      if (nets.includes('mobilePolice')) body.groupCodes = args.groupCodes ?? ['event_type'];
      else body.groupCodes = ['event_type'];
      const data: any[] = await saPost(ctx, path, body);
      const rows = (data ?? []).map(
        (it: any) =>
          `**${it.networkType ?? '未知'}**: 提示${it.oneCount ?? 0} 低${it.twoCount ?? 0} 中${it.threeCount ?? 0} 高${it.fourCount ?? 0} 超${it.fiveCount ?? 0}`,
      );
      return { content: `## 风险级别统计\n\n${rows.join('\n') || '暂无'}`, data, success: true };
    } catch (e) {
      return { content: `获取风险统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.19+2.18.17
  getEventSubTypeStats: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['police'];
      const path = nets.includes('internet')
        ? '/internetNetwork/view/sercurityEventBySubTypeCount'
        : '/policeNetwork/view/sercurityEventBySubTypeCount';
      const data: any[] = await saPost(ctx, path, {
        endTime: args.endTime ?? '',
        firstTypes: args.firstTypes ?? ['32'],
        groupCodes: ['event_type'],
        networkTypes: nets,
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map(
          (it: any) =>
            `| ${it.typeName ?? POLICE_32_ANQUAN[it.typeCode] ?? it.typeCode ?? '未知'} | ${it.eventCount ?? 0} | ${it.devCount ?? 0} |`,
        )
        .join('\n');
      return {
        content: `## 事件子类型统计\n\n| 子类型 | 事件数 | 设备数 |\n|--------|--------|--------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取子类型统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.20+2.18.5+2.30.6+2.41.6
  getDeviceTypeStats: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['police'];
      let path: string;
      if (nets.includes('internet')) path = '/internetNetwork/view/device/statisticsByDeviceType';
      else if (nets.includes('video')) path = '/videoNetwork/view/device/statisticsByDeviceType';
      else if (nets.includes('mobilePolice')) path = '/mobileNetwork/view/deviceView';
      else path = '/policeNetwork/view/statisticsByDeviceType';
      const data: any[] = await saPost(ctx, path, {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map(
          (it: any) =>
            `| ${it.name ?? it.type ?? '未知'} | ${it.typeCount ?? 0} | ${it.totalCount ?? 0} | ${it.scale ?? ''} |`,
        )
        .join('\n');
      return {
        content: `## 设备类型统计\n\n| 类型 | 数量 | 总数 | 占比 |\n|------|------|------|------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取设备类型统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.15.22
  getUserActionStats: async (args: any) => {
    try {
      const data: any[] = await saPost(ctx, '/policeNetwork/view/userActionAnalysis', {
        endTime: args.endTime ?? '',
        groupCodes: args.groupCodes ?? ['event_type'],
        networkTypes: args.networkTypes ?? ['police'],
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map(
          (it: any) =>
            `| ${it.typeName ?? it.typeCode ?? '未知'} | ${it.eventCount ?? 0} | ${it.devCount ?? 0} |`,
        )
        .join('\n');
      return {
        content: `## 用户行为分析\n\n| 类型 | 事件数 | 设备数 |\n|------|--------|--------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取用户行为分析失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.18.4+2.30.4+2.41.13
  getDeviceOnlineStats: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['internet'];
      let path: string;
      if (nets.includes('video')) path = '/videoNetwork/view/device/oldCount';
      else if (nets.includes('mobilePolice')) path = '/mobileNetwork/view/onlineAndOffline';
      else path = '/internetNetwork/view/device/safetyOnlineCount';
      const data: any[] = await saPost(ctx, path, {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? []).map(
        (it: any) =>
          `**${it.networkType ?? '未知'}**: 在线${it.onlineCount ?? 0}，离线${it.offlineCount ?? 0}，老旧${it.oldDeviceCount ?? 0}`,
      );
      return { content: `## 设备在线统计\n\n${rows.join('\n') || '暂无'}`, data, success: true };
    } catch (e) {
      return { content: `获取设备在线统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.18.6
  getDeviceCount: async (args: any) => {
    try {
      const data = await saPost(ctx, '/internetNetwork/view/device/totalCount', {
        endTime: args.endTime ?? '',
        networkTypes: args.networkTypes ?? ['internet'],
        startTime: args.startTime ?? '',
      });
      const count = data?.data ?? data ?? 0;
      return { content: `## 设备总量\n\n**${count}** 台`, data, success: true };
    } catch (e) {
      return { content: `获取设备总量失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.18.7+2.18.8
  getEventTrend: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['internet'];
      const path =
        args.trendType === 'byType'
          ? '/internetNetwork/view/eventAreaStackingPlotByFirstType'
          : '/internetNetwork/view/eventAreaStackingPlotByLevel';
      const body: any = {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      };
      if (args.trendType === 'byType') {
        body.firstTypes = args.firstTypes ?? ['41', '42', '43', '44'];
        body.groupCodes = args.groupCodes ?? ['event_type'];
      }
      const data: any[] = await saPost(ctx, path, body);
      return {
        content: `## 事件趋势（${args.trendType === 'byType' ? '按类型' : '按级别'}）\n\n共${(data ?? []).length}天数据`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取事件趋势失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.18.11
  getMediumHighRiskHosts: async (args: any) => {
    try {
      const data = await saPost(ctx, '/internetNetwork/view/mediumAndHighRiskHosts', {
        endTime: args.endTime ?? '',
        networkTypes: args.networkTypes ?? ['internet'],
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
        startTime: args.startTime ?? '',
      });
      const records: any[] = data.records ?? [];
      const rows = records
        .map(
          (r: any, i: number) =>
            `| ${i + 1} | ${r.dev_ip ?? '未知'} | ${r.riskCount ?? 0} | ${r.component ?? ''} | ${r.partment ?? ''} |`,
        )
        .join('\n');
      return {
        content: `## 中高风险主机（共${data.total ?? 0}）\n\n| 序号 | IP | 风险数 | 组件 | 部门 |\n|------|-----|--------|------|------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取中高风险主机失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.30.1
  getVideoBoundaryViolation: async (args: any) => {
    try {
      const data: any[] = await saPost(ctx, '/videoNetwork/view/boundary/violation', {
        endTime: args.endTime ?? '',
        firstTypes: args.firstTypes ?? ['compliance'],
        networkTypes: args.networkTypes ?? ['video'],
        startTime: args.startTime ?? '',
      });
      const rows = (data ?? [])
        .map((it: any) => `| ${it.typeName ?? it.typeCode ?? '未知'} | ${it.deviceCount ?? 0} |`)
        .join('\n');
      return {
        content: `## 视频网边界违规\n\n| 类型 | 设备数 |\n|------|--------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取边界违规失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.30.3
  getVideoDeviceIpRate: async (args: any) => {
    try {
      const data = await saPost(ctx, '/videoNetwork/view/device/ipRate', {
        endTime: args.endTime ?? '',
        networkTypes: args.networkTypes ?? ['video'],
        startTime: args.startTime ?? '',
      });
      const rate = data?.data ?? data ?? 0;
      return { content: `## 视频网IP规范使用率\n\n**${rate}%**`, data, success: true };
    } catch (e) {
      return { content: `获取IP规范使用率失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.30.16+2.30.17+2.30.18+2.30.19
  getVideoSecurityRisk: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['video'];
      const pathMap: Record<string, string> = {
        firstType: '/videoNetwork/view/security/firstType',
        riskDistribution: '/videoNetwork/view/security/riskDistribution',
        riskDistributionByLevel: '/videoNetwork/view/security/riskDistributionByLevel',
        subType: '/videoNetwork/view/security/subType',
      };
      const qt = args.queryType ?? 'riskDistribution';
      const body: any = {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      };
      if (args.firstTypes) body.firstTypes = args.firstTypes;
      const data: any[] = await saPost(ctx, pathMap[qt] ?? pathMap.riskDistribution, body);
      const labelMap: Record<string, string> = {
        firstType: '一级分类',
        riskDistribution: '风险分布',
        riskDistributionByLevel: '区域风险',
        subType: '二级分类',
      };
      return {
        content: `## 视频网安全风险-${labelMap[qt] ?? qt}\n\n共${(data ?? []).length}条`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取视频网安全风险失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.30.21~2.30.26
  getVideoWeakPassStats: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['video'];
      const qt = args.queryType ?? 'show';
      const pathMap: Record<string, string> = {
        abnormal: '/videoNetwork/view/weak/abnormal',
        abnormalType: '/videoNetwork/view/weak/abnormal/type',
        mediumAndAbove: '/videoNetwork/view/vul/mediumRiskAndAbove',
        mediumAndAboveTop: '/videoNetwork/view/vul/mediumRiskAndAboveTop',
        show: '/videoNetwork/view/weak/show',
        subMediumAndAbove: '/videoNetwork/view/vul/subMediumRiskAndAbove',
      };
      const defGC = [
        'weak_dataArchive',
        'weak_application',
        'weak_middleware',
        'weak_video_application',
      ];
      const body: any = {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      };
      if (['abnormal', 'abnormalType', 'show'].includes(qt))
        body.groupCodes = args.groupCodes ?? defGC;
      if (['abnormalType', 'mediumAndAboveTop'].includes(qt)) body.limit = args.limit ?? 6;
      if (qt === 'subMediumAndAbove') {
        body.deviceType = args.deviceType ?? '';
        body.groupCodes = args.groupCodes ?? ['device_type'];
      }
      const data: any[] = await saPost(ctx, pathMap[qt] ?? pathMap.show, body);
      const labelMap: Record<string, string> = {
        abnormal: '子异常',
        abnormalType: 'TOP弱口令',
        mediumAndAbove: '中危以上设备类型',
        mediumAndAboveTop: 'TOP6漏洞',
        show: '弱口令总览',
        subMediumAndAbove: '设备二级分组',
      };
      return {
        content: `## 视频网弱口令-${labelMap[qt] ?? qt}\n\n共${(data ?? []).length}条`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取弱口令统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.36.1
  getNetworkAreaDeviceTypeStat: async (args: any) => {
    try {
      const data = await saPost(ctx, '/network/view/childDeviceTypeStat', {
        endTime: args.endTime ?? '',
        networkType: args.networkType ?? 'police',
        regionId: args.regionId ?? 0,
        startTime: args.startTime ?? '',
      });
      return {
        content: `## 网络区域子设备类型统计\n\n区域: ${data.regionName ?? args.regionId ?? '未知'}，共${(data.childDeviceTypeStats ?? []).length}类设备`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取区域设备类型统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.36.8
  getRiskLevel: async (args: any) => {
    try {
      const data = await saPost(ctx, '/network/view/riskLevel', {
        endTime: args.endTime ?? '',
        networkTypes: args.networkTypes ?? ['police'],
        startTime: args.startTime ?? '',
      });
      const content = [
        `## 整体态势风险等级`,
        data?.riskValue ? `**风险等级**: ${data.riskValue}` : '',
        data?.ruleContent ? `**规则**: ${data.ruleContent}` : '',
        (data?.suggests ?? []).length
          ? `**工作建议**:\n${data.suggests.map((s: any) => `- ${s.sugContent}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');
      return { content, data, success: true };
    } catch (e) {
      return { content: `获取风险等级失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.36.10
  getWorkSuggestions: async (args: any) => {
    try {
      const data: any[] = await saPost(ctx, '/network/view/workSuggest', {
        endTime: args.endTime ?? '',
        networkType: args.networkType ?? 'police',
        startTime: args.startTime ?? '',
      });
      return {
        content: `## 工作建议（${args.networkType ?? 'police'}）\n\n${(data ?? []).map((it: any) => `- ${it.sugContent ?? ''}`).join('\n') || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取工作建议失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.39.5
  queryMessages: async (args: any) => {
    try {
      const data = await saPost(ctx, '/message/page', {
        isRead: args.isRead,
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
      });
      const records: any[] = data.records ?? [];
      const rows = records.map((r: any) =>
        [
          `### ${r.title ?? '无标题'}`,
          r.desc ? `**内容**: ${r.desc}` : '',
          r.isRead === 0 ? '⚡ **未读**' : '',
          r.createTime ? `**时间**: ${r.createTime}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
      return {
        content: `## 消息（共${data.total ?? 0}）\n\n${rows.join('\n\n---\n\n') || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `查询消息失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.39.8
  markAllMessagesRead: async () => {
    try {
      await saPost(ctx, '/message/readAll', {});
      return { content: '✅ 所有消息已标记为已读。', data: null, success: true };
    } catch (e) {
      return { content: `标记已读失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.41.1+2.41.2+2.41.3+2.41.6+2.41.7+2.41.9+2.41.12+2.41.14+2.41.18+2.41.21+2.41.22
  getMobileNetworkStats: async (args: any) => {
    try {
      const nets = args.networkTypes ?? ['mobilePolice'];
      const qt = args.queryType ?? 'deviceView';
      const pathMap: Record<string, string> = {
        accessTimes: '/mobileNetwork/view/accessTimesTop',
        attackTrend: '/mobileNetwork/view/attackEventTrend',
        deviceView: '/mobileNetwork/view/deviceView',
        dstIpTop: '/mobileNetwork/view/dstIpTop',
        flowTrend: '/mobileNetwork/view/flowTrend',
        modelDistribution: '/mobileNetwork/view/modelDistribution',
        nonWorkHours: '/mobileNetwork/view/accDurNonWorkHours',
        onlineDeviceTrend: '/mobileNetwork/view/onlineDeviceTrend',
        srcIpTop: '/mobileNetwork/view/srcIpTop',
        wafEventProportion: '/mobileNetwork/view/wafEventProportion',
        wafSubEventProportion: '/mobileNetwork/view/wafSubEventProportion',
      };
      const path = pathMap[qt] ?? pathMap.deviceView;
      const body: any = {
        endTime: args.endTime ?? '',
        networkTypes: nets,
        startTime: args.startTime ?? '',
      };
      if (['nonWorkHours', 'accessTimes'].includes(qt)) body.limit = args.limit ?? 8;
      if (qt === 'wafSubEventProportion') {
        body.firstTypes = args.firstTypes ?? [];
        body.groupCodes = args.groupCodes ?? ['event_type'];
      }
      const labelMap: Record<string, string> = {
        accessTimes: '设备访问次数Top',
        attackTrend: '攻击事件趋势',
        deviceView: '设备概览',
        dstIpTop: '目标地址通信次数Top4',
        flowTrend: '流量趋势',
        modelDistribution: '设备型号分布',
        nonWorkHours: '非工时访问Top',
        onlineDeviceTrend: '在线设备趋势',
        srcIpTop: '源地址通信次数Top4',
        wafEventProportion: 'WAF事件占比',
        wafSubEventProportion: 'WAF子事件占比',
      };
      const data = await saPost(ctx, path, body);
      const items: any[] = Array.isArray(data) ? data : (data?.records ?? []);
      return {
        content: `## 移动网-${labelMap[qt] ?? qt}\n\n共${items.length}条数据`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `获取移动网统计失败: ${(e as Error).message}`, success: false };
    }
  },

  // 2.59.24
  queryAssets: async (args: any) => {
    try {
      const data = await saPost(ctx, '/asset/page', {
        ip: args.ip ?? '',
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
        networkType: args.networkType ?? '',
        ...args.extra,
      });
      const records: any[] = data.records ?? [];
      const rows = records
        .map(
          (r: any, i: number) =>
            `| ${i + 1} | ${r.ip ?? ''} | ${r.host ?? ''} | ${r.assetDeviceModel ?? ''} | ${r.os ?? ''} | ${r.networkType ?? ''} |`,
        )
        .join('\n');
      return {
        content: `## 资产列表（共${data.total ?? 0}，第${data.current ?? 1}页）\n\n| 序号 | IP | 主机名 | 型号 | 操作系统 | 网络 |\n|------|-----|--------|------|----------|------|\n${rows || '暂无'}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `查询资产失败: ${(e as Error).message}`, success: false };
    }
  },
});

export const saAnalyzerRuntime = {
  createWithTokens: (tokens?: { appToken?: string; userToken?: string }) =>
    createSaRuntime({ rzzxAppToken: tokens?.appToken, rzzxUserToken: tokens?.userToken }),
  identifier: SaAnalyzerIdentifier,
};
