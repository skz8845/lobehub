import type { BuiltinToolManifest } from '@lobechat/types';

import { systemPrompt } from './systemRole';
import { IncidentAnalyzerApiName, IncidentAnalyzerIdentifier } from './types';

export const IncidentAnalyzerManifest: BuiltinToolManifest = {
  api: [
    {
      description: `对安全事件报文中的编码内容进行精确解码，逐层还原攻击者的真实意图。

### 使用场景
- message/Payload 中含有 %XX URL 编码（如 %3Cscript%3E）
- Base64 编码内容（Java 序列化特征：rO0AB；.NET：AAEAAAD；命令：d2hvYW1p）
- 十六进制编码的 Shellcode 或系统命令（\\x2f\\x65\\x74\\x63 等）
- Unicode 转义（\\u003c\\u0073\\u0063\\u0072\\u0069\\u0070\\u0074\\u003e）
- HTML 实体编码（&lt;script&gt; 等）
- 攻击者双重/多重编码绕过 WAF（如 %2527 → %27 → '）

### 支持的编码类型（encoding 参数）
- url：URL 百分号编码
- base64：Base64 编码
- hex：十六进制编码（支持 \\xNN、0xNN、纯十六进制串）
- unicode：Unicode 转义序列（\\uXXXX）
- html：HTML 实体编码
- auto：自动识别（默认，会尝试多种格式）

### 注意
- 存在编码内容时**必须调用此工具**，禁止自行推测解码结果
- 多层嵌套编码将自动逐层解码（最多 5 层）`,
      name: IncidentAnalyzerApiName.decodePayload,
      parameters: {
        additionalProperties: false,
        properties: {
          encoding: {
            description:
              '编码类型（可选，默认 auto 自动识别）：url / base64 / hex / unicode / html / auto',
            enum: ['auto', 'base64', 'hex', 'html', 'unicode', 'url'],
            type: 'string',
          },
          payload: {
            description: '需要解码的原始字符串，可以是完整请求体、URL 参数值或任意编码片段',
            type: 'string',
          },
        },
        required: ['payload'],
        type: 'object',
      },
    },
    {
      description: `根据事件的 type、subType、eventName 自动匹配场景并返回专项分析指引。

### 匹配逻辑
服务端通过确定性规则匹配以下 14 个场景（每次只返回一个最精确的匹配）：
- 场景 A：弱口令 / 暴力破解
- 场景 B：Web 应用攻击
- 场景 C：漏洞利用与渗透
- 场景 D：安全扫描 / 异常扫描
- 场景 E：违规行为（外联/代理/远控/接入/进程/配置违规）
- 场景 F：恶意程序 / C2 通信 / 后门 / 僵尸网络
- 场景 G：DoS / DDoS 攻击
- 场景 H：欺骗劫持
- 场景 I：用户行为异常
- 场景 J：APT 事件
- 场景 K：数据安全事件
- 场景 L：设备健康 / 物联网 / 无人机安全
- 场景 M：互联网安全事件
- 场景 N：其他 / 兜底处理

### 返回内容
返回该场景的完整专项分析指引，包含必须执行的分析节和注意事项。

### 调用时机
获取 queryEventDetail 结果后**立即调用**，在其他查询前先确定分析框架。`,
      name: IncidentAnalyzerApiName.getScenarioGuide,
      parameters: {
        additionalProperties: false,
        properties: {
          eventName: { description: '事件名称（用于关键词匹配，如"SSH暴力破解"）', type: 'string' },
          subType: { description: '事件二级类型编码（如 "320701"、"v_3001"）', type: 'string' },
          type: { description: '事件一级类型编码（数字，如 33、34、35、41）', type: 'number' },
        },
        required: [],
        type: 'object',
      },
    },
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
        },
        required: ['ip'],
        type: 'object',
      },
    },
    {
      description: `对弱口令/暴力破解事件中的请求进行回放，验证凭据是否真实有效。

### 支持协议
- http / https：HTTP 表单或接口认证回放
- ssh：SSH 密码认证验证
- ftp：FTP 登录验证
- rdp：RDP 凭据验证

### HTTP/HTTPS 传参策略（二选一）
1. **rawRequest**（优先）：message 中存在明文 HTTP 报文时，将整段报文原样传入，服务端自动解析方法、路径、请求头、请求体
2. **结构化**：无明文报文时，分别传入 queryParams（GET 参数）、body（POST 请求体）、headers（请求头）

### 回放结果（authResult）
- success：凭据有效，认证成功 → 直接判定为**真实攻击成功**
- failed：凭据无效，认证拒绝 → 倾向**真实攻击失败**
- timeout：连接超时，目标不可达 → 结合其他证据判断
- error：协议错误或连接被拒绝 → 可能服务不存在，倾向**误报**或攻击失败

### 注意
- 仅在弱口令/暴力破解场景（场景 A）且报文中存在明文凭据时调用
- 根据目标端口自动选择协议：22→ssh、21→ftp、3389→rdp、80/8080→http、443/8443→https`,
      name: IncidentAnalyzerApiName.replayRequest,
      parameters: {
        additionalProperties: false,
        properties: {
          body: {
            description:
              '[HTTP/HTTPS 结构化] POST 请求体，如 username=admin&password=123456 或 JSON 字符串',
            type: 'string',
          },
          headers: {
            additionalProperties: { type: 'string' },
            description: '[HTTP/HTTPS 结构化] 需要附加的请求头（键值对）',
            type: 'object',
          },
          host: { description: '目标主机 IP 或域名', type: 'string' },
          password: { description: '[SSH/FTP/RDP] 登录密码', type: 'string' },
          port: {
            description:
              '目标端口（不填则使用协议默认端口：ssh=22、ftp=21、rdp=3389、http=80、https=443）',
            type: 'number',
          },
          protocol: {
            description: '协议类型：http / https / ssh / ftp / rdp',
            enum: ['ftp', 'http', 'https', 'rdp', 'ssh'],
            type: 'string',
          },
          queryParams: {
            description:
              '[HTTP/HTTPS 结构化] GET 请求参数，URL 编码字符串，如 user=admin&pass=123456',
            type: 'string',
          },
          rawRequest: {
            description:
              '[HTTP/HTTPS 优先] 从 message 中提取的原始明文 HTTP 报文，包含请求行、请求头、请求体的完整文本',
            type: 'string',
          },
          timeout: { default: 10, description: '超时时间（秒，默认 10）', type: 'number' },
          username: { description: '[SSH/FTP/RDP] 登录用户名', type: 'string' },
        },
        required: ['protocol', 'host'],
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
