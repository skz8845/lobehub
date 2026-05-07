import { createHash } from 'node:crypto';
import { createConnection } from 'node:net';

import {
  detectScenario,
  IncidentAnalyzerIdentifier,
  SCENARIO_GUIDES,
} from '@lobechat/builtin-tool-incident-analyzer';
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
const NETWORK_LABEL: Record<string, string> = {
  internet: '互联网',
  mobilePolice: '移动信息网',
  police: '公安网',
  video: '视频传输网',
};
const lv = (l?: number) => (l != null ? (LEVEL[l] ?? `L${l}`) : '未知');
const st = (s?: number) => (s != null ? (STATUS[s] ?? '') : '');
const nl = (n?: string) => (n != null ? (NETWORK_LABEL[n] ?? '') : '未知');

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
    `**时间**: ${r.time ?? '未知'} | **网络**: ${nl(r.networkType)} | **状态**: ${st(r.status)}`,
    r.srcIp ? `**来源**: ${r.srcIp}${r.srcPort ? `:${r.srcPort}` : ''}` : '',
    r.dstIp ? `**目标**: ${r.dstIp}${r.dstPort ? `:${r.dstPort}` : ''}` : '',
    r.devName ? `**设备**: ${r.devName}` : '',
    r.message ? `**详情**: ${r.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Payload decoder (pure, no external I/O) ─────────────────────────────────

type DecodeEncoding = 'base64' | 'hex' | 'html' | 'unicode' | 'url';

function detectEncoding(s: string): DecodeEncoding | null {
  if (/%[0-9A-F]{2}/i.test(s)) return 'url';
  if (/\\u[0-9A-Fa-f]{4}/.test(s)) return 'unicode';
  if (/&(?:#\d+|#x[0-9A-F]+|lt|gt|amp|quot|apos);/i.test(s)) return 'html';
  const hex = s.replaceAll(/\\x|0x/gi, '').replaceAll(/\s/g, '');
  if (hex.length >= 4 && /^[0-9A-F]+$/i.test(hex) && hex.length % 2 === 0) return 'hex';
  const b64 = s.trim();
  if (b64.length >= 8 && /^[A-Z0-9+/]+=*$/i.test(b64) && b64.length % 4 === 0) return 'base64';
  return null;
}

function tryDecode(s: string, enc: DecodeEncoding): string | null {
  try {
    switch (enc) {
      case 'url': {
        return decodeURIComponent(s.replaceAll('+', ' '));
      }
      case 'base64': {
        return Buffer.from(s.trim(), 'base64').toString('utf8');
      }
      case 'hex': {
        const clean = s.replaceAll(/\\x|0x/gi, '').replaceAll(/\s/g, '');
        return Buffer.from(clean, 'hex').toString('utf8');
      }
      case 'unicode': {
        return s.replaceAll(/\\u([0-9A-Fa-f]{4})/g, (_, h) =>
          String.fromCharCode(Number.parseInt(h, 16)),
        );
      }
      case 'html': {
        return s
          .replaceAll(/&amp;/gi, '&')
          .replaceAll(/&lt;/gi, '<')
          .replaceAll(/&gt;/gi, '>')
          .replaceAll(/&quot;/gi, '"')
          .replaceAll(/&apos;/gi, "'")
          .replaceAll(/&#(\d+);/g, (_, n) => String.fromCharCode(Number.parseInt(n, 10)))
          .replaceAll(/&#x([0-9A-F]+);/gi, (_, h) => String.fromCharCode(Number.parseInt(h, 16)));
      }
    }
  } catch {
    return null;
  }
}

function decodePayloadPure(
  payload: string,
  forcedEncoding?: string,
): {
  decoded: string;
  layers: Array<{ encoding: string; input: string; layer: number; output: string }>;
  original: string;
} {
  const layers: Array<{ encoding: string; input: string; layer: number; output: string }> = [];
  let current = payload;

  for (let i = 1; i <= 5; i++) {
    const enc: DecodeEncoding | null =
      i === 1 && forcedEncoding && forcedEncoding !== 'auto'
        ? (forcedEncoding as DecodeEncoding)
        : detectEncoding(current);
    if (!enc) break;
    const result = tryDecode(current, enc);
    if (!result || result === current) break;
    layers.push({ encoding: enc, input: current, layer: i, output: result });
    current = result;
  }

  return { decoded: current, layers, original: payload };
}

// ─── Request replay ───────────────────────────────────────────────────────────

type ReplayAuthResult = 'error' | 'failed' | 'success' | 'timeout';

function makeReplayResult(
  authResult: ReplayAuthResult,
  protocol: string,
  host: string,
  latency: number,
  extra?: { error?: string; port?: number; responseBody?: string; statusCode?: number },
) {
  const LABEL: Record<ReplayAuthResult, string> = {
    error: '连接错误',
    failed: '认证失败',
    success: '认证成功（高危）',
    timeout: '连接超时',
  };
  const data = {
    authResult,
    host,
    latency,
    protocol,
    success: authResult === 'success',
    ...extra,
  };
  const lines = [
    `## 请求回放结果 [${LABEL[authResult]}]`,
    `**协议**: ${protocol.toUpperCase()} | **目标**: ${host}${extra?.port ? `:${extra.port}` : ''} | **延迟**: ${latency}ms`,
    extra?.statusCode != null ? `**HTTP状态码**: ${extra.statusCode}` : '',
    extra?.error ? `**错误**: ${extra.error}` : '',
    extra?.responseBody ? `**响应摘要**: ${extra.responseBody.slice(0, 200)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { content: lines, data, success: true };
}

interface ParsedHttpRequest {
  body: string;
  headers: Record<string, string>;
  method: string;
  path: string;
}

function parseRawHttpRequest(raw: string): ParsedHttpRequest {
  const normalized = raw.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  const blankLine = normalized.indexOf('\n\n');
  const headerSection = blankLine >= 0 ? normalized.slice(0, blankLine) : normalized;
  const body = blankLine >= 0 ? normalized.slice(blankLine + 2) : '';

  const lines = headerSection.split('\n');
  const requestLine = lines[0] ?? '';
  const parts = requestLine.split(' ');
  const method = parts[0] ?? 'GET';
  const path = parts[1] ?? '/';

  const headers: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const colon = line.indexOf(':');
    if (colon > 0) {
      headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
    }
  }

  return { body, headers, method, path };
}

async function replayHttp(args: {
  body?: string;
  headers?: Record<string, string>;
  host: string;
  port?: number;
  protocol: string;
  queryParams?: string;
  rawRequest?: string;
  start: number;
  timeout: number;
}) {
  const {
    protocol,
    host,
    port,
    rawRequest,
    body,
    queryParams,
    headers = {},
    timeout,
    start,
  } = args;
  const targetPort = port ?? (protocol === 'https' ? 443 : 80);

  let method: string;
  let path: string;
  let resolvedBody: string | undefined;
  let resolvedHeaders: Record<string, string>;

  if (rawRequest) {
    const parsed = parseRawHttpRequest(rawRequest);
    method = parsed.method;
    path = parsed.path;
    resolvedBody = parsed.body || undefined;
    resolvedHeaders = { ...parsed.headers, ...headers };
  } else {
    resolvedBody = body;
    resolvedHeaders = { 'content-type': 'application/x-www-form-urlencoded', ...headers };
    const hasBody = !!body;
    method = hasBody ? 'POST' : 'GET';
    path = queryParams ? `/?${queryParams}` : '/';
  }

  const url = `${protocol}://${host}:${targetPort}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout * 1000);

  try {
    const res = await fetch(url, {
      body: resolvedBody ?? undefined,
      headers: resolvedHeaders,
      method,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latency = Date.now() - start;
    let responseText = '';
    try {
      responseText = await res.text();
    } catch {
      /* empty */
    }

    let authResult: ReplayAuthResult;
    if (res.status >= 200 && res.status < 300) {
      const failPattern =
        /登录失败|login\s*fail|invalid\s*(?:user|pass|cred)|incorrect|wrong\s*pass|unauthorized|authentication\s*fail/i;
      authResult = failPattern.test(responseText) ? 'failed' : 'success';
    } else if (res.status === 301 || res.status === 302) {
      const loc = res.headers.get('location') ?? '';
      authResult = /login|error|fail|denied/i.test(loc) ? 'failed' : 'success';
    } else if (res.status === 401 || res.status === 403) {
      authResult = 'failed';
    } else {
      authResult = 'error';
    }

    return makeReplayResult(authResult, protocol, host, latency, {
      port: targetPort,
      responseBody: responseText,
      statusCode: res.status,
    });
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      return makeReplayResult('timeout', protocol, host, Date.now() - start, {
        port: targetPort,
      });
    }
    throw e;
  }
}

function replayFtp(args: {
  host: string;
  password?: string;
  port: number;
  start: number;
  timeout: number;
  username?: string;
}): Promise<ReturnType<typeof makeReplayResult>> {
  return new Promise((resolve) => {
    const { host, port, username = 'anonymous', password = '', timeout, start } = args;
    const socket = createConnection({ host, port });
    let buffer = '';
    let stage: 'banner' | 'pass' | 'user' = 'banner';

    const done = (authResult: ReplayAuthResult, error?: string) => {
      timer.unref();
      socket.destroy();
      resolve(makeReplayResult(authResult, 'ftp', host, Date.now() - start, { error, port }));
    };

    const timer = setTimeout(() => done('timeout'), timeout * 1000);

    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const code = Number.parseInt(line.slice(0, 3), 10);
        if (Number.isNaN(code)) continue;
        if (stage === 'banner' && code === 220) {
          stage = 'user';
          socket.write(`USER ${username}\r\n`);
        } else if (stage === 'user') {
          if (code === 230) {
            done('success');
            return;
          } else if (code === 331) {
            stage = 'pass';
            socket.write(`PASS ${password}\r\n`);
          } else {
            done('failed');
            return;
          }
        } else if (stage === 'pass') {
          done(code === 230 ? 'success' : 'failed');
          return;
        }
      }
    });

    socket.on('error', (e: Error) => done('error', e.message));
    socket.on('timeout', () => done('timeout'));
    socket.setTimeout(timeout * 1000);
  });
}

async function replaySsh(args: {
  host: string;
  password?: string;
  port: number;
  start: number;
  timeout: number;
  username?: string;
}): Promise<ReturnType<typeof makeReplayResult>> {
  const { host, port, username = 'root', password = '', timeout, start } = args;

  let ssh2: any;
  try {
    ssh2 = await import('ssh2');
  } catch {
    // ssh2 not installed — fall back to TCP reachability check
    return replayTcpCheck({ host, port, protocol: 'ssh', start, timeout });
  }

  return new Promise((resolve) => {
    const client = new ssh2.Client();
    let resolved = false;

    const done = (authResult: ReplayAuthResult, error?: string) => {
      if (resolved) return;
      resolved = true;
      timer.unref();
      try {
        client.end();
      } catch {}
      resolve(makeReplayResult(authResult, 'ssh', host, Date.now() - start, { error, port }));
    };

    const timer = setTimeout(() => done('timeout'), timeout * 1000);

    client
      .on('ready', () => done('success'))
      .on('error', (e: Error) => {
        const msg = e.message.toLowerCase();
        const isAuthFail =
          msg.includes('auth') ||
          msg.includes('permission denied') ||
          msg.includes('keyboard-interactive');
        done(isAuthFail ? 'failed' : 'error', e.message);
      })
      .connect({
        host,
        password,
        port,
        readyTimeout: timeout * 1000,
        tryKeyboard: false,
        username,
      });
  });
}

function replayTcpCheck(args: {
  host: string;
  port: number;
  protocol: string;
  start: number;
  timeout: number;
}): Promise<ReturnType<typeof makeReplayResult>> {
  return new Promise((resolve) => {
    const { host, port, protocol, start, timeout } = args;
    const socket = createConnection({ host, port });
    let settled = false;

    const done = (authResult: ReplayAuthResult, error?: string) => {
      if (settled) return;
      settled = true;
      timer.unref();
      socket.destroy();
      resolve(makeReplayResult(authResult, protocol, host, Date.now() - start, { error, port }));
    };

    const timer = setTimeout(() => done('timeout', '连接超时'), timeout * 1000);

    socket.on('connect', () =>
      done('error', `端口 ${port} 可达，但 ${protocol.toUpperCase()} 凭据验证需要专用客户端库`),
    );
    socket.on('error', (e: Error) => done('error', e.message));
    socket.on('timeout', () => done('timeout', '连接超时'));
    socket.setTimeout(timeout * 1000);
  });
}

// ─── Runtime factory ──────────────────────────────────────────────────────────

const createIncidentAnalyzerRuntime = (ctx?: SaRuntimeContext) => ({
  queryEventDetail: async (args: any) => {
    try {
      const { eventId } = args;
      log('queryEventDetail %s', eventId);

      const pageData = await saPost(ctx, '/event/page', {
        uuid: eventId,
        pageNum: 1,
        pageSize: 1,
      });
      const data: any = pageData?.records?.[0] ?? null;

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
        `**网络**: ${nl(data.networkType)}`,
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

      // Map ipRole to the correct SA API parameter
      const ipParam: Record<string, any> = {};
      if (ipRole === 'src') ipParam.srcIp = ip;
      else if (ipRole === 'dst') ipParam.dstIp = ip;
      else if (ipRole === 'dev') ipParam.devIp = ip;

      const data = await saPost(ctx, '/event/page', {
        endTime: args.endTime ?? '',
        levelIn: args.levelIn ?? [],
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
      const { ip } = args;
      log('queryAssetByIp %s', ip);

      const data = await saPost(ctx, '/asset/page', {
        ip,
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
            r.networkType ? `**所属网络**: ${nl(r.networkType)}` : '',
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
  getScenarioGuide: async (args: any) => {
    const { type, subType, eventName } = args;
    const id = detectScenario(type, subType, eventName);
    const scenario = SCENARIO_GUIDES[id];
    const content = [
      `## 专项分析指引：场景 ${id} — ${scenario.name}`,
      '',
      scenario.guide.trim(),
    ].join('\n');
    return {
      content,
      data: { guide: scenario.guide.trim(), id, name: scenario.name },
      success: true,
    };
  },

  replayRequest: async (args: any) => {
    const {
      protocol,
      host,
      port,
      username,
      password,
      rawRequest,
      queryParams,
      headers,
      body,
      timeout = 10,
    } = args;
    const start = Date.now();
    log('replayRequest %s %s', protocol, host);
    try {
      switch (protocol) {
        case 'http':
        case 'https': {
          return await replayHttp({
            body,
            headers,
            host,
            port,
            protocol,
            queryParams,
            rawRequest,
            start,
            timeout,
          });
        }
        case 'ssh': {
          return await replaySsh({ host, password, port: port ?? 22, start, timeout, username });
        }
        case 'ftp': {
          return await replayFtp({ host, password, port: port ?? 21, start, timeout, username });
        }
        case 'rdp': {
          return replayTcpCheck({ host, port: port ?? 3389, protocol: 'rdp', start, timeout });
        }
        default: {
          return { content: `不支持的协议: ${protocol}`, success: false };
        }
      }
    } catch (e) {
      return makeReplayResult('error', protocol, host, Date.now() - start, {
        error: (e as Error).message,
        port,
      });
    }
  },

  decodePayload: async (args: any) => {
    try {
      const { payload, encoding } = args;
      const result = decodePayloadPure(payload, encoding);

      if (!result.layers.length) {
        return {
          content: `未检测到已知编码格式，内容可能已是明文：\n\`\`\`\n${payload}\n\`\`\``,
          data: result,
          success: true,
        };
      }

      const layerBlocks = result.layers.map(
        (l) =>
          `### 第 ${l.layer} 层 — ${l.encoding.toUpperCase()} 解码\n**输入**: \`${l.input.slice(0, 300)}${l.input.length > 300 ? '...' : ''}\`\n**输出**:\n\`\`\`\n${l.output}\n\`\`\``,
      );

      const lines = [
        `## 编码解析结果（共 ${result.layers.length} 层）`,
        ``,
        `**原始输入**: \`${payload.slice(0, 200)}${payload.length > 200 ? '...' : ''}\``,
        ``,
        layerBlocks.join('\n\n'),
        ``,
        `**最终明文**:\n\`\`\`\n${result.decoded}\n\`\`\``,
      ];

      return { content: lines.join('\n'), data: result, success: true };
    } catch (e) {
      return { content: `解码失败: ${(e as Error).message}`, success: false };
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
