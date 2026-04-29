import { createHash } from 'node:crypto';

import type {
  FileHashes,
  IndicatorType,
  ThreatIntelAttribute,
  ThreatIntelEvent,
  ThreatIntelRecord,
} from '@lobechat/builtin-tool-threat-intel';
import { ThreatIntelIdentifier } from '@lobechat/builtin-tool-threat-intel';
import type { ThreatLevel } from '@lobechat/builtin-tool-threat-intel/client';
import debug from 'debug';

import { FileModel } from '@/database/models/file';
import { FileService } from '@/server/services/file';

import { type ToolExecutionContext } from '../types';
import { type ServerRuntimeRegistration } from './types';

const log = debug('lobe-server:threat-intel');

// ─── Config ──────────────────────────────────────────────────────────────────

function mispBaseUrl() {
  return (process.env.MISP_BASE_URL ?? 'https://192.168.10.142:3443').replace(/\/$/, '');
}

function mispApiKey() {
  return process.env.MISP_API_KEY ?? '';
}

// ─── TLS-tolerant fetch ───────────────────────────────────────────────────────

async function mispFetch(path: string, body?: Record<string, any>): Promise<any> {
  const url = `${mispBaseUrl()}${path}`;
  log('MISP %s %s', body !== undefined ? 'POST' : 'GET', url);

  const verifySsl = process.env.MISP_VERIFY_SSL === 'true';
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (!verifySsl) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {
    const isPost = body !== undefined;
    const res = await fetch(url, {
      body: isPost ? JSON.stringify(body) : undefined,
      headers: {
        Accept: 'application/json',
        Authorization: mispApiKey(),
        ...(isPost && { 'Content-Type': 'application/json' }),
      },
      method: isPost ? 'POST' : 'GET',
    });

    if (!res.ok) {
      log('MISP error: %d %s', res.status, url);
      throw new Error(`MISP API error: ${res.status}`);
    }

    return res.json();
  } finally {
    if (!verifySsl) {
      if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  }
}

// ─── Indicator type detection ─────────────────────────────────────────────────

const IP_RE = /^(?:\d{1,3}\.){3}\d{1,3}$|^[\d:A-F][\dA-F]*:[\d:A-F]+$/i;
const HASH_RE = /^[0-9a-f]{32}$|^[0-9a-f]{40}$|^[0-9a-f]{64}$/i;
const URL_RE = /^https?:\/\//i;

export function detectIndicatorType(value: string): IndicatorType {
  if (IP_RE.test(value)) return 'ip';
  if (HASH_RE.test(value)) return 'hash';
  if (URL_RE.test(value)) return 'url';
  if (value.includes('.') && !value.includes(' ')) return 'domain';
  return 'unknown';
}

export function detectThreatLevel(value: string): ThreatLevel {
  if (value == '3') return 'Low';
  if (value == '2') return 'Medium';
  if (value == '1') return 'High';
  return 'unknown';
}

// ─── MISP attribute mapper ────────────────────────────────────────────────────

function mapEvent(raw: Record<string, any> | undefined): ThreatIntelEvent | undefined {
  if (!raw) return undefined;
  return {
    date: raw.date || undefined,
    id: raw.id ?? '',
    info: raw.info ?? '',
    org: raw.Org?.name || raw.org_id || undefined,
    orgc: raw.Orgc?.name || undefined,
    threatLevel: detectThreatLevel(raw?.threat_level_id) || 'unknown',
    uuid: raw.uuid || undefined,
  };
}

function mapAttribute(raw: Record<string, any>): ThreatIntelAttribute {
  return {
    category: raw.category ?? '',
    comment: raw.comment || undefined,
    event: mapEvent(raw.Event),
    event_id: raw.event_id ?? '',
    first_seen: raw.first_seen || undefined,
    id: raw.id ?? '',
    last_seen: raw.last_seen || undefined,
    tags: Array.isArray(raw.Tag)
      ? raw.Tag.map((t: any) => ({ colour: t.colour ?? '#888', name: t.name ?? '' }))
      : Array.isArray(raw.AttributeTag)
        ? raw.AttributeTag.map((t: any) => ({
            colour: t?.Tag.colour ?? '#888',
            name: t?.Tag.name ?? '',
          }))
        : undefined,
    timestamp: raw.timestamp || undefined,
    to_ids: Boolean(raw.to_ids),
    type: raw.type ?? '',
    value: raw.value ?? '',
  };
}

// ─── Format output ────────────────────────────────────────────────────────────

function formatRecords(records: ThreatIntelRecord[], indicator: string, type: IndicatorType) {
  if (records.length === 0) return `未找到指标 "${indicator}" 的威胁情报记录。`;

  const lines = [
    `## 威胁情报查询: ${indicator} (${type})\n`,
    `共找到 **${records.length}** 条记录\n`,
  ];

  for (const rec of records) {
    const p = rec.primaryAttribute;
    const ev = rec.event;
    const ioc = rec.attributes.some((a) => a.to_ids) ? ' **[IOC]**' : '';
    const eventTitle = ev?.info ? ` — ${ev.info}` : '';
    lines.push(`### 事件 ${rec.event_id}${eventTitle}${ioc}`);
    if (ev) {
      const meta = [
        ev.date && `日期: ${ev.date}`,
        ev.threatLevel && `威胁等级: ${ev.threatLevel}`,
        ev.orgc && `来源: ${ev.orgc}`,
      ]
        .filter(Boolean)
        .join(' | ');
      if (meta) lines.push(`> ${meta}`);
    }
    lines.push(`- **类型**: ${p.type} | **分类**: ${p.category}`);
    lines.push(`- **值**: \`${p.value}\``);
    if (p.comment) lines.push(`- **备注**: ${p.comment}`);
    if (p.tags && p.tags.length > 0) {
      lines.push(`- **标签**: ${p.tags.map((t) => t.name).join(', ')}`);
    }
    if (rec.objectName) lines.push(`- **对象**: ${rec.objectName}`);
    if (rec.attributes.length > 1) {
      const related = rec.attributes.filter((a) => a.value !== p.value).slice(0, 5);
      if (related.length > 0) {
        lines.push(
          `- **相关属性**: ${related.map((a) => `${a.type}: \`${a.value}\``).join(' | ')}`,
        );
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── File hash helpers ────────────────────────────────────────────────────────

function computeHashes(bytes: Uint8Array): FileHashes {
  const buf = Buffer.from(bytes);
  return {
    md5: createHash('md5').update(buf).digest('hex'),
    sha1: createHash('sha1').update(buf).digest('hex'),
    sha256: createHash('sha256').update(buf).digest('hex'),
  };
}

async function queryAllHashes(hashes: FileHashes): Promise<ThreatIntelRecord[]> {
  const results = await Promise.allSettled([
    queryMisp(hashes.md5),
    queryMisp(hashes.sha1),
    queryMisp(hashes.sha256),
  ]);

  const seen = new Set<string>();
  const records: ThreatIntelRecord[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const rec of result.value) {
        if (!seen.has(rec.id)) {
          seen.add(rec.id);
          records.push(rec);
        }
      }
    }
  }

  return records;
}

async function queryMisp(indicator: string): Promise<ThreatIntelRecord[]> {
  const rawResponse: Record<string, any> = await mispFetch('/attributes/restSearch', {
    value: indicator,
  });
  if (!rawResponse) return [];
  const rawAttributes: Record<string, any>[] = rawResponse?.response?.Attribute ?? [];
  if (!Array.isArray(rawAttributes) || rawAttributes.length === 0) return [];

  // Group by object_id; "0" means standalone attribute
  const objectGroups = new Map<string, Record<string, any>[]>();
  for (const attr of rawAttributes) {
    const objUuid = String(attr.uuid ?? '0');
    if (!objectGroups.has(objUuid)) objectGroups.set(objUuid, []);
    objectGroups.get(objUuid)!.push(attr);
  }

  const records: ThreatIntelRecord[] = [];
  for (const [objUuid, attrs] of objectGroups) {
    if (objUuid !== '0') {
      try {
        const objDataResponse = await mispFetch(`/objects/restSearch`, { uuid: objUuid });
        const objList = objDataResponse?.response || [];
        for (const objData of objList) {
          const obj = objData?.Object;
          if (!obj) {
            continue;
          }
          const allAttrs: ThreatIntelAttribute[] = Array.isArray(obj?.Attribute)
            ? obj.Attribute.map(mapAttribute)
            : attrs.map(mapAttribute);
          const primary = mapAttribute(attrs[0]);
          records.push({
            attributes: allAttrs,
            event: primary.event,
            event_id: primary.event_id,
            id: attrs.id,
            objectName: obj?.name || undefined,
            primaryAttribute: primary,
          });
        }
      } catch {
        const primary = mapAttribute(attrs[0]);
        records.push({
          attributes: attrs.map(mapAttribute),
          event: primary.event,
          event_id: primary.event_id,
          id: attrs.id,
          primaryAttribute: primary,
        });
      }
    } else {
      const primary = mapAttribute(attrs[0]);
      records.push({
        attributes: attrs.map(mapAttribute),
        event: primary.event,
        event_id: primary.event_id,
        id: primary.id,
        primaryAttribute: primary,
      });
    }
  }

  if (!records || records.length === 0) {
    const primary = mapAttribute(rawAttributes[0]);
    records.push({
      attributes: rawAttributes.map(mapAttribute),
      event: primary.event,
      event_id: primary.event_id,
      id: primary.id,
      primaryAttribute: primary,
    });
  }
  return records;
}

// ─── Runtime factory ──────────────────────────────────────────────────────────

const createThreatIntelRuntime = (context?: ToolExecutionContext) => ({
  queryFileHash: async (args: { fileId: string; fileName?: string }) => {
    const { fileId, fileName } = args;
    log('queryFileHash - fileId: %s, fileName: %s', fileId, fileName);

    if (!context?.serverDB || !context?.userId) {
      return { content: '无法访问文件：缺少数据库或用户上下文。', success: false };
    }

    try {
      const fileModel = new FileModel(context.serverDB, context.userId);
      const file = await fileModel.findById(fileId);

      if (!file) {
        return { content: `未找到文件 ID "${fileId}"`, success: false };
      }

      const fileService = new FileService(context.serverDB, context.userId);
      const bytes = await fileService.getFileByteArray(file.url);
      const hashes = computeHashes(bytes);

      log(
        'Computed hashes for %s - md5: %s, sha1: %s',
        fileName ?? fileId,
        hashes.md5,
        hashes.sha1,
      );

      const records = await queryAllHashes(hashes);
      const displayName = fileName ?? file.name ?? fileId;

      const hashSummary = [
        `## 文件威胁情报: ${displayName}`,
        `- **MD5**: \`${hashes.md5}\``,
        `- **SHA1**: \`${hashes.sha1}\``,
        `- **SHA256**: \`${hashes.sha256}\``,
        '',
        records.length > 0
          ? formatRecords(records, displayName, 'hash')
          : `未在威胁情报库中找到与该文件相关的记录。`,
      ].join('\n');

      return {
        content: hashSummary,
        hashes,
        records,
        success: true,
      };
    } catch (e) {
      log('queryFileHash error: %O', e);
      return { content: `文件哈希查询失败: ${(e as Error).message}`, success: false };
    }
  },

  queryIndicator: async (args: { indicator: string; type?: IndicatorType }) => {
    const { indicator } = args;
    const type: IndicatorType = args.type ?? detectIndicatorType(indicator);
    log('queryIndicator - indicator: %s, type: %s', indicator, type);

    try {
      const records = await queryMisp(indicator);
      log('Returning %d records', records.length);
      return {
        content: formatRecords(records, indicator, type),
        records,
        success: true,
        type,
      };
    } catch (e) {
      log('queryIndicator error: %O', e);
      return { content: `查询失败: ${(e as Error).message}`, success: false };
    }
  },
});

export const threatIntelRuntime: ServerRuntimeRegistration = {
  factory: (context?: ToolExecutionContext) => createThreatIntelRuntime(context),
  identifier: ThreatIntelIdentifier,
};
