import type { BuiltinToolManifest } from '@lobechat/types';

import { systemPrompt } from './systemRole';
import { IncidentAnalyzerApiName, IncidentAnalyzerIdentifier } from './types';

const networkFilterProps = {
  endTime: { description: '结束时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' as const },
  networkTypeIn: {
    description:
      '网络区域: police=公安网, internet=互联网, video=视频传输网, mobilePolice=移动信息网',
    items: { type: 'string' as const },
    type: 'array' as const,
  },
  startTime: { description: '开始时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' as const },
};

export const IncidentAnalyzerManifest: BuiltinToolManifest = {
  api: [
    {
      description: `按攻击者来源IP分页查询其历史攻击事件，用于追溯攻击轨迹、确认攻击持续时长与频率。

### 返回字段
- eventName: 事件名称
- srcIp: 攻击来源IP
- dstIp: 被攻击目标IP
- level: 危险级别（1-5）
- subType: 攻击子类型编码
- time: 事件时间
- networkType: 所属网络

### levelIn 危险级别
1=提示, 2=低危, 3=中危, 4=高危, 5=超危`,
      name: IncidentAnalyzerApiName.queryAttackerEvents,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkFilterProps,
          levelIn: {
            description: '危险级别过滤: 1=提示, 2=低危, 3=中危, 4=高危, 5=超危',
            items: { type: 'string' },
            type: 'array',
          },
          pageNum: { default: 1, description: '页码（默认1）', type: 'number' },
          pageSize: { default: 10, description: '每页条数（默认10）', type: 'number' },
          srcIp: { description: '攻击者来源IP地址（精确匹配）', type: 'string' },
        },
        required: ['srcIp'],
        type: 'object',
      },
    },
    {
      description: `分析指定攻击者IP的攻击行为模式，包括：
- 攻击类型分布（Web攻击/漏洞利用/扫描侦察/C2通信等）
- 危险级别分布
- 攻击频率与活跃时段
- TTP战术技术映射（ATT&CK框架）
- 使用的攻击工具特征

用于识别攻击手法指纹，为归因提供TTP依据。`,
      name: IncidentAnalyzerApiName.analyzeAttackBehavior,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkFilterProps,
          srcIp: { description: '攻击者来源IP地址', type: 'string' },
        },
        required: ['srcIp'],
        type: 'object',
      },
    },
    {
      description: `查询IP/域名/URL/文件哈希的威胁情报，从MISP平台获取已知IOC记录、关联攻击事件、威胁标签等信息。

### indicator 支持格式
- IPv4地址（如 192.168.1.1）
- 域名（如 evil.com）
- URL（如 http://evil.com/payload）
- 文件哈希：MD5(32位) / SHA1(40位) / SHA256(64位)

### type 指标类型（可选，自动识别）
ip | domain | url | hash`,
      name: IncidentAnalyzerApiName.queryIndicatorIntel,
      parameters: {
        additionalProperties: false,
        properties: {
          indicator: {
            description: '要查询的指标值：IP地址、域名、URL 或文件哈希（MD5/SHA1/SHA256）',
            type: 'string',
          },
          type: {
            description: '指标类型（可选，自动识别）：ip, domain, url, hash',
            enum: ['ip', 'domain', 'url', 'hash'],
            type: 'string',
          },
        },
        required: ['indicator'],
        type: 'object',
      },
    },
    {
      description: `综合构建攻击者画像，聚合以下多维度信息：
1. **攻击历史统计**：总事件数、最早/最近攻击时间
2. **行为分布**：按网络、按危险级别的事件分布
3. **主要战术**：排名前5的攻击类型与TTP
4. **目标偏好**：被攻击的主要目标IP及次数
5. **威胁情报**：是否为已知恶意IP/APT基础设施

综合以上数据计算**威胁评分**（0-100）。`,
      name: IncidentAnalyzerApiName.buildAttackerProfile,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkFilterProps,
          srcIp: { description: '攻击者来源IP地址', type: 'string' },
        },
        required: ['srcIp'],
        type: 'object',
      },
    },
    {
      description: `查询指定攻击者IP历史攻击过的目标IP列表，支持分页。

### 用途
- 识别攻击者的定向攻击目标（特定业务系统/部门）
- 发现横向移动路径和内网目标偏好
- 与其他攻击者的目标重叠分析（共同目标 = 可能同一团伙）

### 返回字段
- dstIp: 被攻击目标IP
- eventCount: 攻击次数
- dstIpDirection: 目标IP方向（内网/外网）`,
      name: IncidentAnalyzerApiName.queryAttackedTargets,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkFilterProps,
          pageNum: { default: 1, description: '页码（默认1）', type: 'number' },
          pageSize: { default: 20, description: '每页条数（默认20）', type: 'number' },
          srcIp: { description: '攻击者来源IP地址', type: 'string' },
        },
        required: ['srcIp'],
        type: 'object',
      },
    },
    {
      description: `基于多维度证据进行综合归因分析，输出归因结论。

### 分析维度
1. TTP匹配：攻击手法与已知APT组织特征库比对
2. IOC关联：威胁情报平台历史记录
3. 目标偏好：攻击目标与APT惯常目标吻合度
4. 时间模式：攻击活跃时段与时区推断

### 归因结论格式
- APT组织候选列表（含置信度）
- 关键匹配证据
- 攻击意图研判
- 建议处置措施

### indicators（可选）
补充域名、URL、哈希等关联指标，增强归因证据链`,
      name: IncidentAnalyzerApiName.attributeIncident,
      parameters: {
        additionalProperties: false,
        properties: {
          endTime: { description: '结束时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
          indicators: {
            description: '补充关联指标（域名/URL/哈希），增强归因证据',
            items: { type: 'string' },
            type: 'array',
          },
          networkTypeIn: {
            description: '网络区域过滤',
            items: { type: 'string' },
            type: 'array',
          },
          srcIp: { description: '主要攻击者IP地址（首要研判对象）', type: 'string' },
          startTime: { description: '开始时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
        },
        required: [],
        type: 'object',
      },
    },
  ],
  identifier: IncidentAnalyzerIdentifier,
  meta: {
    avatar: '🔬',
    description: '攻击溯源、威胁情报关联、攻击者画像与精准归因',
    title: '安全事件研判助手',
  },
  systemRole: systemPrompt,
  type: 'builtin',
};
