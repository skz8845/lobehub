import { createHash } from 'node:crypto';

import { IncidentAnalyzerIdentifier } from '@lobechat/builtin-tool-incident-analyzer';
import debug from 'debug';

import { type ServerRuntimeRegistration } from './types';

const log = debug('lobe-server:incident-analyzer');

// ─── SA API client (shared with sa-analyzer) ─────────────────────────────────

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
  const signKey = saSignKey();
  const source = signKey + nonce + timestamp + queryParams + body;
  return createHash('md5').update(source, 'utf8').digest('hex');
}

function generateHeaders(ctx: SaRuntimeContext | undefined, queryParams: string, body: string) {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).slice(2, 15);
  const sign = generateSign(nonce, timestamp, queryParams, body);
  return {
    'Content-Type': 'application/json',
    'RZZX-APPTOKEN': ctx?.rzzxAppToken ?? '',
    'RZZX-USERTOKEN': ctx?.rzzxUserToken ?? '',
    'nonce': nonce,
    'sign': sign,
    'timestamp': timestamp.toString(),
  };
}

async function saPost(ctx: SaRuntimeContext | undefined, path: string, body: Record<string, any>) {
  const url = `${saApiUrl()}${path}`;
  const bodyStr = JSON.stringify(body);
  const headers = generateHeaders(ctx, '', bodyStr);
  log('SA POST %s', path);
  const res = await fetch(url, { body: bodyStr, headers, method: 'POST' });
  if (!res.ok) throw new Error(`SA API ${res.status} ${path}`);
  const json = await res.json();
  return json.data;
}

// ─── MISP client (shared with threat-intel) ───────────────────────────────────

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
const lv = (l?: number) => (l != null ? (LEVEL[l] ?? `L${l}`) : '未知');

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

// ATT&CK tactic mapping from event subtype
const TTP_MAP: Record<string, string> = {
  '3205': '侦察-主动扫描',
  '3207': '凭据访问-暴力破解',
  '3213': '命令控制-僵尸网络',
  '3216': '持久化-木马后门',
  '3225': '影响-应用层DDoS',
  '3229': '初始访问-Web应用攻击',
  '3230': '执行-漏洞利用渗透',
  '3231': '命令控制-恶意程序与C2',
  '3232': '命令控制-隐蔽隧道',
  '3233': '初始访问-邮件协议攻击',
  '3234': '影响-网络层DoS',
  '3236': '侦察-异常扫描',
  '3237': '持久化-后门攻击',
  '3238': '持续威胁-APT事件',
  '3239': '命令控制-恶意通信',
};

const APT_MAP: Record<string, { id: string; name: string; techniques: string[] }> = {
  '323801': {
    id: 'APT32',
    name: '海莲花 (APT32/OceanLotus)',
    techniques: ['鱼叉钓鱼', 'Cobalt Strike', 'PowerShell', '水坑攻击'],
  },
  '323804': {
    id: 'APT30',
    name: 'APT30',
    techniques: ['长期潜伏', '东南亚政府目标', '自研恶意软件'],
  },
  '323806': {
    id: 'Lazarus',
    name: 'Lazarus Group',
    techniques: ['金融目标', '供应链攻击', '自研恶意软件', 'WannaCry'],
  },
  '323807': {
    id: 'BITTER',
    name: 'BITTER',
    techniques: ['南亚政府目标', '鱼叉邮件', '.NET工具', 'Android恶意软件'],
  },
  '323809': {
    id: 'APT10',
    name: 'APT10 (Stone Panda)',
    techniques: ['托管服务商攻击', '网络间谍', 'PlugX', 'RedLeaves'],
  },
  '323813': {
    id: 'APT28',
    name: 'APT28 (Fancy Bear)',
    techniques: ['钓鱼攻击', '凭据窃取', '政府/军事目标', 'X-Agent'],
  },
};

// ─── Runtime factory ──────────────────────────────────────────────────────────

const createIncidentAnalyzerRuntime = (ctx?: SaRuntimeContext) => ({
  queryAttackerEvents: async (args: any) => {
    try {
      const data = await saPost(ctx, '/event/page', {
        endTime: args.endTime ?? '',
        levelIn: args.levelIn ?? [],
        networkTypeIn: args.networkTypeIn ?? ['police', 'internet', 'video', 'mobilePolice'],
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 10,
        srcIpIn: [args.srcIp],
        startTime: args.startTime ?? '',
        subTypeIn: [],
        typeIn: [],
      });
      const records: any[] = data?.records ?? [];
      if (!records.length) {
        return {
          content: `未找到来自 ${args.srcIp} 的攻击事件记录。`,
          data,
          success: true,
        };
      }
      const rows = records.map(
        (r: any) =>
          `### ${r.eventName ?? '未知'} [${lv(r.level)}]\n` +
          `**时间**: ${r.time ?? '未知'} | **网络**: ${r.networkType ?? '未知'}\n` +
          (r.dstIp ? `**目标**: ${r.dstIp}${r.dstPort ? `:${r.dstPort}` : ''}\n` : '') +
          (r.message ? `**详情**: ${r.message}` : ''),
      );
      return {
        content: `## ${args.srcIp} 历史攻击事件（共${data?.total ?? records.length}条，第${data?.current ?? 1}页）\n\n${rows.join('\n\n---\n\n')}`,
        data,
        success: true,
      };
    } catch (e) {
      return { content: `查询攻击者历史事件失败: ${(e as Error).message}`, success: false };
    }
  },

  analyzeAttackBehavior: async (args: any) => {
    try {
      const nets = args.networkTypeIn ?? ['police', 'internet', 'video', 'mobilePolice'];

      // Query events for behavior analysis (larger page to capture patterns)
      const data = await saPost(ctx, '/event/page', {
        endTime: args.endTime ?? '',
        networkTypeIn: nets,
        pageNum: 1,
        pageSize: 200,
        srcIpIn: [args.srcIp],
        startTime: args.startTime ?? '',
        subTypeIn: [],
        typeIn: [],
      });

      const records: any[] = data?.records ?? [];
      const total: number = data?.total ?? records.length;

      if (!records.length) {
        return {
          content: `未找到来自 ${args.srcIp} 的攻击记录，无法进行行为分析。`,
          data: null,
          success: true,
        };
      }

      // Analyze level distribution
      const levelDist: Record<string, number> = {};
      const typeDist: Record<string, number> = {};
      const networkDist: Record<string, number> = {};
      const times: string[] = [];

      for (const r of records) {
        const lvKey = LEVEL[r.level] ?? `L${r.level}`;
        levelDist[lvKey] = (levelDist[lvKey] ?? 0) + 1;

        const subType = String(r.subType ?? r.type ?? '');
        const typeName = TTP_MAP[subType] ?? r.eventName ?? `类型${subType}`;
        typeDist[typeName] = (typeDist[typeName] ?? 0) + 1;

        const net = r.networkType ?? 'unknown';
        networkDist[net] = (networkDist[net] ?? 0) + 1;

        if (r.time) times.push(r.time);
      }

      times.sort();
      const firstSeen = times[0];
      const lastSeen = times.at(-1);

      const topAttackTypes = Object.entries(typeDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([attackType, count]) => ({
          attackType,
          count,
          level: '',
          subTypes: [],
        }));

      // Identify unique targets
      const targets = new Set(records.map((r: any) => r.dstIp).filter(Boolean));

      // Map to ATT&CK tactics
      const primaryTactics = [
        ...new Set(
          topAttackTypes
            .map((t) => {
              const parts = t.attackType.split('-');
              return parts.length > 1 ? parts[0] : '';
            })
            .filter(Boolean),
        ),
      ];

      const profile = {
        attackedTargets: targets.size,
        firstSeen,
        lastSeen,
        levelDistribution: levelDist,
        networkDistribution: networkDist,
        primaryTactics,
        srcIp: args.srcIp,
        topAttackTypes,
        totalEvents: total,
      };

      const lines = [
        `## ${args.srcIp} 攻击行为分析\n`,
        `- **总攻击次数**: ${total}（采样 ${records.length} 条）`,
        `- **攻击目标数**: ${targets.size}`,
        `- **首次攻击**: ${firstSeen ?? '未知'}`,
        `- **最近攻击**: ${lastSeen ?? '未知'}`,
        '',
        '### 攻击手法分布 (TTP)',
        ...topAttackTypes.map((t) => `- **${t.attackType}**: ${t.count} 次`),
        '',
        '### ATT&CK 战术链',
        primaryTactics.length > 0 ? primaryTactics.join(' → ') : '暂无充分数据',
        '',
        '### 危险级别分布',
        ...Object.entries(levelDist).map(([k, v]) => `- ${k}: ${v} 次`),
      ];

      return { content: lines.join('\n'), data: profile, success: true };
    } catch (e) {
      return { content: `分析攻击行为失败: ${(e as Error).message}`, success: false };
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
          content: `未找到 "${indicator}" 的威胁情报记录。`,
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
        `## 威胁情报: ${indicator} (${type})\n`,
        `共 **${records.length}** 条记录，其中 **${iocCount}** 条为已确认 IOC\n`,
        ...records
          .slice(0, 5)
          .map(
            (r) =>
              `### 事件 ${r.event_id}${r.event?.info ? ` — ${r.event.info}` : ''}\n` +
              `- **类型**: ${r.primaryAttribute.type} | **分类**: ${r.primaryAttribute.category}\n` +
              `- **IOC**: ${r.primaryAttribute.to_ids ? '✅ 已确认' : '❌ 未确认'}`,
          ),
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

  buildAttackerProfile: async (args: any) => {
    try {
      const nets = args.networkTypeIn ?? ['police', 'internet', 'video', 'mobilePolice'];

      // Query events for profile
      const evData = await saPost(ctx, '/event/page', {
        endTime: args.endTime ?? '',
        networkTypeIn: nets,
        pageNum: 1,
        pageSize: 200,
        srcIpIn: [args.srcIp],
        startTime: args.startTime ?? '',
        subTypeIn: [],
        typeIn: [],
      });

      const records: any[] = evData?.records ?? [];
      const total: number = evData?.total ?? records.length;

      // Query attack targets (top IPs)
      let targetItems: any[] = [];
      try {
        const targetData = await saPost(ctx, '/policeNetwork/view/attackedTop', {
          endTime: args.endTime ?? '',
          networkTypes: nets.includes('police') ? ['police'] : nets.slice(0, 1),
          startTime: args.startTime ?? '',
        });
        targetItems = Array.isArray(targetData) ? targetData : [];
      } catch {
        // target query is best-effort
      }

      // Query MISP for this IP
      let intelCount = 0;
      try {
        const mispResp = await mispPost('/attributes/restSearch', { value: args.srcIp });
        intelCount = (mispResp?.response?.Attribute ?? []).length;
      } catch {
        // intel query is best-effort
      }

      const times = records
        .map((r: any) => r.time)
        .filter(Boolean)
        .sort();
      const typeDist: Record<string, number> = {};
      const levelDist: Record<string, number> = {};
      const targets = new Set<string>();

      for (const r of records) {
        const subType = String(r.subType ?? r.type ?? '');
        const typeName = TTP_MAP[subType] ?? r.eventName ?? `类型${subType}`;
        typeDist[typeName] = (typeDist[typeName] ?? 0) + 1;

        const lvKey = LEVEL[r.level] ?? `L${r.level}`;
        levelDist[lvKey] = (levelDist[lvKey] ?? 0) + 1;

        if (r.dstIp) targets.add(r.dstIp);
      }

      const topAttackTypes = Object.entries(typeDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([attackType, count]) => ({ attackType, count, level: '', subTypes: [] }));

      const primaryTactics = [
        ...new Set(topAttackTypes.map((t) => t.attackType.split('-')[0]).filter(Boolean)),
      ];

      // Calculate threat score
      let score = 0;
      if (total > 100) score += 20;
      else if (total > 20) score += 10;
      if (intelCount > 0) score += 40;
      const hasHighSeverity = records.some((r: any) => r.level >= 4);
      if (hasHighSeverity) score += 20;
      if (targets.size > 10) score += 10;
      if (typeDist['持续威胁-APT事件']) score += 10;
      score = Math.min(score, 100);

      const attackedTargets = targetItems
        .slice(0, 10)
        .map((t: any) => ({
          dstIp: t.dstIp ?? t.dev_ip ?? '',
          dstIpDirection: t.dstIpDirection ?? '',
          eventCount: t.eventCount ?? t.riskCount ?? 0,
        }))
        .filter((t) => t.dstIp);

      const behaviorSummary = {
        attackedTargets: targets.size,
        firstSeen: times[0],
        lastSeen: times.at(-1),
        levelDistribution: levelDist,
        networkDistribution: {},
        primaryTactics,
        srcIp: args.srcIp,
        topAttackTypes,
        totalEvents: total,
      };

      const profile = {
        attackedTargets,
        behaviorSummary,
        intelRecords: intelCount,
        srcIp: args.srcIp,
        threatScore: score,
      };

      const lines = [
        `## 攻击者画像: ${args.srcIp}\n`,
        `### 威胁评分: **${score}/100**`,
        '',
        `| 维度 | 数据 |`,
        `|------|------|`,
        `| 总攻击次数 | ${total} |`,
        `| 攻击目标数 | ${targets.size} |`,
        `| 威胁情报命中 | ${intelCount > 0 ? `${intelCount} 条` : '未命中'} |`,
        `| 首次攻击 | ${times[0] ?? '未知'} |`,
        `| 最近攻击 | ${times.at(-1) ?? '未知'} |`,
        '',
        '### 主要攻击手法',
        ...topAttackTypes.slice(0, 5).map((t) => `- ${t.attackType}: ${t.count} 次`),
      ];

      return { content: lines.join('\n'), data: profile, success: true };
    } catch (e) {
      return { content: `构建攻击者画像失败: ${(e as Error).message}`, success: false };
    }
  },

  queryAttackedTargets: async (args: any) => {
    try {
      const nets = args.networkTypeIn ?? ['police', 'internet'];

      // Query events to extract targets
      const data = await saPost(ctx, '/event/page', {
        endTime: args.endTime ?? '',
        networkTypeIn: nets,
        pageNum: args.pageNum ?? 1,
        pageSize: args.pageSize ?? 20,
        srcIpIn: [args.srcIp],
        startTime: args.startTime ?? '',
        subTypeIn: [],
        typeIn: [],
      });

      const records: any[] = data?.records ?? [];
      if (!records.length) {
        return {
          content: `未找到来自 ${args.srcIp} 的攻击目标记录。`,
          data: { items: [], total: 0 },
          success: true,
        };
      }

      // Aggregate by dstIp
      const targetMap = new Map<string, number>();
      for (const r of records) {
        if (r.dstIp) {
          targetMap.set(r.dstIp, (targetMap.get(r.dstIp) ?? 0) + 1);
        }
      }

      const items = [...targetMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([dstIp, eventCount]) => ({ dstIp, eventCount }));

      const rows = items
        .slice(0, 10)
        .map((t, i) => `| ${i + 1} | ${t.dstIp} | ${t.eventCount} |`)
        .join('\n');

      return {
        content: `## ${args.srcIp} 攻击目标（共 ${items.length} 个）\n\n| 排名 | 目标IP | 攻击次数 |\n|------|--------|----------|\n${rows}`,
        data: { items, total: data?.total ?? items.length },
        success: true,
      };
    } catch (e) {
      return { content: `查询被攻击目标失败: ${(e as Error).message}`, success: false };
    }
  },

  attributeIncident: async (args: any) => {
    try {
      const nets = args.networkTypeIn ?? ['police', 'internet', 'video', 'mobilePolice'];
      const { srcIp, indicators = [] } = args;

      // Collect evidence
      const evidence: string[] = [];
      const aptCandidates: Array<{
        groupId: string;
        groupName: string;
        confidence: 'high' | 'medium' | 'low';
        matchedTechniques: string[];
        score: number;
      }> = [];

      // Query events for TTP analysis
      let records: any[] = [];
      let total = 0;
      if (srcIp) {
        try {
          const evData = await saPost(ctx, '/event/page', {
            endTime: args.endTime ?? '',
            networkTypeIn: nets,
            pageNum: 1,
            pageSize: 200,
            srcIpIn: [srcIp],
            startTime: args.startTime ?? '',
            subTypeIn: [],
            typeIn: [],
          });
          records = evData?.records ?? [];
          total = evData?.total ?? records.length;
        } catch {
          /* best-effort */
        }
      }

      // Find APT subtype codes in the events
      const foundAptCodes = new Set<string>();
      for (const r of records) {
        const st = String(r.subType ?? '');
        if (APT_MAP[st]) foundAptCodes.add(st);
      }

      // Score APT groups by matched techniques
      for (const [code, aptInfo] of Object.entries(APT_MAP)) {
        let score = 0;
        const matchedTechniques: string[] = [];

        if (foundAptCodes.has(code)) {
          score += 60;
          matchedTechniques.push(`直接APT事件标记 (${code})`);
          evidence.push(`检测到 ${aptInfo.name} 关联事件标记`);
        }

        if (score > 0) {
          aptCandidates.push({
            confidence: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low',
            groupId: aptInfo.id,
            groupName: aptInfo.name,
            matchedTechniques,
            score,
          });
        }
      }

      // MISP evidence for srcIp and indicators
      const allIndicators = [srcIp, ...indicators].filter(Boolean);
      let mispHits = 0;
      for (const ind of allIndicators) {
        try {
          const resp = await mispPost('/attributes/restSearch', { value: ind });
          const attrs = resp?.response?.Attribute ?? [];
          if (attrs.length > 0) {
            mispHits += attrs.length;
            evidence.push(`威胁情报命中: ${ind} (${attrs.length} 条记录)`);
          }
        } catch {
          /* best-effort */
        }
      }

      if (mispHits > 0) evidence.push(`共命中 ${mispHits} 条威胁情报记录`);
      if (total > 0) evidence.push(`历史攻击事件 ${total} 次`);
      if (records.some((r) => r.level >= 4))
        evidence.push('包含高危/超危级别攻击事件，具有明确攻击意图');

      aptCandidates.sort((a, b) => b.score - a.score);

      const overallConfidence: 'high' | 'medium' | 'low' =
        aptCandidates.length > 0 && aptCandidates[0].confidence === 'high'
          ? 'high'
          : mispHits > 0 || aptCandidates.length > 0
            ? 'medium'
            : 'low';

      const summaryParts = [
        srcIp ? `来自 ${srcIp} 的攻击活动` : '本次安全事件',
        total > 0 ? `涉及 ${total} 次历史攻击事件` : '',
        aptCandidates.length > 0
          ? `与 ${aptCandidates[0].groupName} 等 APT 组织的 TTP 存在重合`
          : '未直接关联已知 APT 组织',
        mispHits > 0 ? `在威胁情报平台命中 ${mispHits} 条记录` : '威胁情报平台未见相关记录',
      ]
        .filter(Boolean)
        .join('，');

      const attribution = {
        aptGroups: aptCandidates.slice(0, 3).map(({ score: _score, ...rest }) => rest),
        confidence: overallConfidence,
        evidence: evidence.slice(0, 10),
        summary: summaryParts + '。',
      };

      const lines = [
        `## 归因分析报告\n`,
        `**研判对象**: ${(srcIp ?? indicators.join(', ')) || '未指定'}`,
        `**归因置信度**: ${{ high: '高', medium: '中', low: '低' }[overallConfidence]}`,
        '',
        `### 结论摘要`,
        attribution.summary,
        '',
        aptCandidates.length > 0
          ? `### APT 组织关联\n${aptCandidates
              .slice(0, 3)
              .map(
                (g) =>
                  `**${g.groupName}** (${g.confidence === 'high' ? '高' : g.confidence === 'medium' ? '中' : '低'}置信度)\n` +
                  `- 匹配技术: ${g.matchedTechniques.join(', ')}`,
              )
              .join('\n\n')}`
          : '### APT 组织关联\n暂未发现直接 APT 组织关联证据',
        '',
        '### 关键证据',
        ...evidence.map((e) => `- ${e}`),
      ];

      return { content: lines.join('\n'), data: attribution, success: true };
    } catch (e) {
      return { content: `归因分析失败: ${(e as Error).message}`, success: false };
    }
  },
});

type IncidentAnalyzerRuntime = ReturnType<typeof createIncidentAnalyzerRuntime>;

const incidentAnalyzerRuntimeFactory = {
  createWithTokens: (tokens: { appToken?: string; userToken?: string }) =>
    createIncidentAnalyzerRuntime({
      rzzxAppToken: tokens.appToken,
      rzzxUserToken: tokens.userToken,
    }),
};

export const incidentAnalyzerRuntime: ServerRuntimeRegistration & {
  createWithTokens: (tokens: { appToken?: string; userToken?: string }) => IncidentAnalyzerRuntime;
} = {
  createWithTokens: incidentAnalyzerRuntimeFactory.createWithTokens,
  factory: (context?: any) =>
    createIncidentAnalyzerRuntime({
      rzzxAppToken: context?.rzzxAppToken,
      rzzxUserToken: context?.rzzxUserToken,
    }),
  identifier: IncidentAnalyzerIdentifier,
};
