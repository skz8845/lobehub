import type { BuiltinToolManifest } from '@lobechat/types';

import { systemPrompt } from './systemRole';
import { IncidentAnalyzerApiName, IncidentAnalyzerIdentifier } from './types';

export const IncidentAnalyzerManifest: BuiltinToolManifest = {
  api: [
    {
      description: `按安全事件唯一标识（UUID 或数字 ID）查询事件完整详情。

### 返回字段
- eventName: 事件名称
- srcIp / srcPort: 攻击来源 IP 和端口
- dstIp / dstPort: 攻击目标 IP 和端口
- devIp / devName: 监测设备 IP 和名称
- level: 危险级别（1=提示 2=低危 3=中危 4=高危 5=超危）
- type / subType: 事件一级和二级类型编码
- time: 事件时间
- message: 事件详情描述
- networkType: 所属网络区域
- status: 处置状态（1=未消除 2=已处置 3=不处置）`,
      name: IncidentAnalyzerApiName.queryEventDetail,
      parameters: {
        additionalProperties: false,
        properties: {
          eventId: {
            description: '安全事件唯一标识，支持数字 ID 或 UUID 字符串格式',
            type: 'string',
          },
        },
        required: ['eventId'],
        type: 'object',
      },
    },
    {
      description: `按 IP 地址查询关联安全事件，支持三种角色过滤。

### ipRole 参数
- "src": 该 IP 作为**攻击来源**（外部攻击者或内部违规主机）
- "dst": 该 IP 作为**攻击目标**（被攻击资产）
- "dev": 该 IP 作为**监测设备**（发现告警的检测设备所在 IP）

### 典型用法
- IP 溯源研判：先查 src 角色（该 IP 发起了哪些攻击），再查 dst 角色（该 IP 被谁攻击过）
- 事件关联：查 src=srcIp 了解攻击者历史；查 dst=dstIp 了解目标被攻击情况

### levelIn 危险级别
1=提示, 2=低危, 3=中危, 4=高危, 5=超危`,
      name: IncidentAnalyzerApiName.queryIpEvents,
      parameters: {
        additionalProperties: false,
        properties: {
          endTime: { description: '结束时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
          ipRole: {
            default: 'src',
            description: 'IP 角色: "src"=攻击来源（默认）, "dst"=攻击目标, "dev"=监测设备',
            enum: ['src', 'dst', 'dev'],
            type: 'string',
          },
          levelIn: {
            description: '危险级别过滤: 1=提示, 2=低危, 3=中危, 4=高危, 5=超危',
            items: { type: 'string' },
            type: 'array',
          },
          networkTypeIn: {
            description:
              '网络区域: police=公安网, internet=互联网, video=视频传输网, mobilePolice=移动信息网',
            items: { type: 'string' },
            type: 'array',
          },
          pageNum: { default: 1, description: '页码（默认1）', type: 'number' },
          pageSize: { default: 10, description: '每页条数（默认10）', type: 'number' },
          srcIp: { description: '要查询的 IP 地址', type: 'string' },
          startTime: { description: '开始时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
        },
        required: ['srcIp'],
        type: 'object',
      },
    },
    {
      description: `按 IP 地址查询对应的资产信息，用于明确 IP 归属与主机身份。

### 返回字段
- ip: IP 地址
- host: 主机名
- assetDeviceModel: 设备型号
- os: 操作系统
- networkType: 所属网络区域
- openPorts: 开放端口列表
- status: 在线状态

### 使用场景
- IP 溯源：确认攻击来源 IP 的真实身份（内网主机/边界设备/未知资产）
- 事件研判：了解被攻击资产（dstIp）的重要程度与暴露面`,
      name: IncidentAnalyzerApiName.queryAssetByIp,
      parameters: {
        additionalProperties: false,
        properties: {
          ip: { description: 'IP 地址（精确匹配）', type: 'string' },
          networkType: {
            description: '网络类型: police, internet, video, mobilePolice',
            type: 'string',
          },
        },
        required: ['ip'],
        type: 'object',
      },
    },
    {
      description: `查询 IP 地址、域名、URL 或文件哈希的威胁情报，从 MISP 平台获取已知 IOC 记录。

### indicator 支持格式
- IPv4 地址（如 1.2.3.4）
- 域名（如 evil.example.com）
- URL（如 http://evil.example.com/payload）
- 文件哈希：MD5(32位) / SHA1(40位) / SHA256(64位)

### type 指标类型（可选，自动识别）
ip | domain | url | hash

### 结果解读
- to_ids=true 的属性为已确认 IOC（Indicators of Compromise），具有高置信度
- 命中记录越多、标签越丰富，表明该指标的恶意程度越高`,
      name: IncidentAnalyzerApiName.queryIndicatorIntel,
      parameters: {
        additionalProperties: false,
        properties: {
          indicator: {
            description: '要查询的指标值：IP 地址、域名、URL 或文件哈希',
            type: 'string',
          },
          type: {
            description: '指标类型（可选，自动识别）：ip, domain, url, hash',
            enum: ['domain', 'hash', 'ip', 'url'],
            type: 'string',
          },
        },
        required: ['indicator'],
        type: 'object',
      },
    },
  ],
  identifier: IncidentAnalyzerIdentifier,
  meta: {
    avatar: '🔬',
    description: 'IP 溯源与安全事件研判：关联安全事件、资产信息、威胁情报进行综合分析',
    title: '安全事件研判',
  },
  systemRole: systemPrompt,
  type: 'builtin',
};
