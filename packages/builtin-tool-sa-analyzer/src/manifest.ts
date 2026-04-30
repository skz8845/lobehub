import type { BuiltinToolManifest } from '@lobechat/types';

import { systemPrompt } from './systemRole';
import { SaAnalyzerApiName, SaAnalyzerIdentifier } from './types';

const networkBaseProps = {
  endTime: { description: '结束时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' as const },
  networkTypes: {
    default: ['police'],
    description:
      '网络区域: police=公安网, internet=互联网, video=视频传输网, mobilePolice=移动信息网',
    items: { type: 'string' as const },
    type: 'array' as const,
  },
  startTime: { description: '开始时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' as const },
};

export const SaAnalyzerManifest: BuiltinToolManifest = {
  api: [
    // ─── Core data queries ────────────────────────────────────────────────────
    {
      description: `分页查询安全事件，支持按事件类型、危险级别、网络区域、时间段过滤。

### 网络区域可用值
- police(公安网), internet(互联网), video(视频传输网), mobilePolice(移动信息��)

### typeIn 事件一级类型
| 网络 | 编码 | 说明 |
|------|------|------|
| police | 31 | 违规事件 |
| police | 32 | 安全事件 |
| police | 33 | 用户行为异常 |
| police | 34 | 数据安全 |
| police | 35 | 设备健康 |
| video | 1 | 违规事件 |
| video | 2 | 安全事件 |
| video | 3 | 其他 |
| internet | 41 | 安全事件 |
| internet | 42 | 正常事件 |
| internet | 43 | 网站攻击 |
| internet | 44 | 服务控制 |
| mobilePolice | 21 | 漏洞利用攻击 |
| mobilePolice | 22 | 网站攻击 |
| mobilePolice | 23 | 僵尸网络 |
| mobilePolice | 24 | 业务弱点 |

### subTypeIn 常用子类型(police)
- **31违规事件**: 3198=违规远控(319801=TeamViewer,319802=向日葵), 3199=违规外联, 3102=违规代理, 3103=违规内网穿透, 3104=违规接入
- **32安全事件**: 3205=安全扫描, 3207=暴力破解, 3213=僵尸网络, 3225=应用层DDos, 3229=Web应用攻击(322901=SQL注入), 3230=漏洞利用, 3231=恶意程序C2, 3238=APT事件
- **33用户行为**: 3309=认证登录异常, 3310=PKI证书异常, 3311=数据查询异常

### subTypeIn 常用子类型(internet)
- 43网站攻击: 4301=Web入侵, 4302=Web扫描, 4303=XSS攻击, 4304=SQL注入

### levelIn 危险级别
1=提示, 2=低危, 3=中危, 4=高危, 5=超危`,
      name: SaAnalyzerApiName.querySecurityEvents,
      parameters: {
        additionalProperties: false,
        properties: {
          endTime: { description: '结束时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
          levelIn: {
            description: '危险级别: 1=提示, 2=低危, 3=中危, 4=高危, 5=超危',
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
          startTime: { description: '开始时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
          subTypeIn: {
            description: '事件二级/三级类型编码',
            items: { type: 'string' },
            type: 'array',
          },
          typeIn: {
            description: '事件一级类型编码',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `分页查询脆弱性（漏洞），支持按类型、危险级别、网络区域、时间段过滤。

### networkTypeIn
video(视频传输网,主要), police(公安网), internet(互联网)

### typeIn 脆弱性一级类型(video)
| 编码 | 说明 |
|------|------|
| webvuln | Web漏洞 |
| sysvuln | 系统漏洞 |
| password | 弱口令 |
| compliance | 边界完整性 |
| other | 其他 |

### subTypeIn webvuln子类(Web漏洞)
- remote_code_exec_web=RCE, xss_web=XSS, sql_inject_web=SQL注入, sensitive_info_leak_web=信息泄漏
- 厂商漏洞: v_Hikvision_Video_Product_Vulnerabilities=海康, v_Dahua=大华, v_UniNets=宇视

### subTypeIn password子类(弱口令)
- brute_force_attack_password=暴力破解
- v_1001=onvif弱口令, v_1003=rtsp弱口令, v_3003=ssh弱口令, v_3004=telnet弱口令

### subTypeIn compliance子类(边界完整性)
- v_multi_host=多穴主机, v_internal_scan=违规外联检测, v_wifi_route_check=无线路由检测

### subTypeIn sysvuln子类(系统漏洞)
- v_heartbleed=心脏出血, v_shellshock=破壳, v_poodle=POODLE

### levelIn 危险级别
1=提示, 2=低危, 3=中危, 4=高危, 5=超危`,
      name: SaAnalyzerApiName.queryVulnerabilities,
      parameters: {
        additionalProperties: false,
        properties: {
          endTime: { description: '结束时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
          levelIn: {
            description: '危险级别: 1=提示, 2=低危, 3=中危, 4=高危, 5=超危',
            items: { type: 'string' },
            type: 'array',
          },
          networkTypeIn: {
            description: '网络区域: video=视频传输网（主要）, police=公安网, internet=互联网',
            items: { type: 'string' },
            type: 'array',
          },
          pageNum: { default: 1, description: '页码（默认1）', type: 'number' },
          pageSize: { default: 10, description: '每页条数（默认10）', type: 'number' },
          startTime: { description: '开始时间，格式: yyyy-MM-dd HH:mm:ss', type: 'string' },
          subTypeIn: {
            description: '脆弱性二级类型',
            items: { type: 'string' },
            type: 'array',
          },
          typeIn: {
            description: '脆弱性一级类型',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Overview & stats ────────────────────────────────────────────────────
    {
      description: `获取安全事件概览，包含事件总数、设备数、已处置数及今日统计。

### 支持网络
- police(公安网): 返回事件数、设备数、处置数、今日事件
- internet(互联网): 返回事件数、设备数、处置数、今日事件`,
      name: SaAnalyzerApiName.getSecurityOverview,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取异常设备分布统计。

### 返回数据
- 未传pageNum时: 返回汇总统计(abnormalDeviceTotal=异常设备总数, externalConTotal=违规外联, vulnerabilityTotal=脆弱口令)
- 传pageNum时: 返回异常设备分页列表

### subTypeIn 安全事件类型
- police: 31=违规事件, 32=安全事件, 33=用户行为异常`,
      name: SaAnalyzerApiName.getAbnormalDeviceStats,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          pageNum: {
            default: 1,
            description: '页���（传入时返回分页列表，否则返回汇总统计）',
            type: 'number',
          },
          pageSize: { default: 10, description: '每页条数', type: 'number' },
          subTypeIn: { description: '安全事件类型过滤', items: { type: 'string' }, type: 'array' },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取攻击者/被攻击者 Top IP 列表。

### direction 参数
- "attacker": 攻击来源IP TOP排名
- "attacked": 被攻击目标IP TOP排名

### 支持网络
- police(公安网)
- internet(互联网)
- video(视频传输网)`,
      name: SaAnalyzerApiName.getAttackTopIPs,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          direction: {
            description: '"attacker"=攻击来源IP, "attacked"=被攻击目标IP',
            enum: ['attacker', 'attacked'],
            type: 'string',
          },
        },
        required: ['direction'],
        type: 'object',
      },
    },
    {
      description: `获取安全事件一级类型统计（按事件类型分组的事件数和设备数）。

### 支持网络
- police(公安网): typeCode对应 31=违规事件,32=安全事件,33=用户行为异常,34=数据安全,35=设备健康
- internet(互联网): typeCode对应 41=安全事件, 43=网站攻击

### 返回字段
- typeName: 类型名称
- eventCount: 事件数
- devCount: 设备数`,
      name: SaAnalyzerApiName.getEventTypeStats,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取安全事件风险级别统计（提示/低危/中危/高危/超危的事件数和设备数）。

### 支持网络
- police(公安网)
- internet(互联网)
- mobilePolice(移动信息网)

### 返回字段
- oneCount: 提示(1级)事件数
- twoCount: 低危(2级)事件数
- threeCount: 中危(3级)事件数
- fourCount: 高危(4级)事件数
- fiveCount: 超危(5级)事件数`,
      name: SaAnalyzerApiName.getEventRiskStats,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取安全事件二级子类型统计。

### 支持网络
- police(公安网)
- internet(互联网)

### firstTypes 一级事件类型
- police: ["31"]=违规事件, ["32"]=安全事件, ["33"]=用户行为异常
- internet: ["43"]=网站攻击事件

### 返回
返回该一级类型下各子类型的事件数、设备数`,
      name: SaAnalyzerApiName.getEventSubTypeStats,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          firstTypes: {
            description: '一级事件类型编码',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取设备类型分布统计（各类型设备数量及占比）。

### 支持网络
- police(公安网)
- internet(互联网)
- video(视频传输网)
- mobilePolice(移动信息网)`,
      name: SaAnalyzerApiName.getDeviceTypeStats,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取设备在线/离线统计（包含在线数、离线数、老旧设备数）。

### 支持网络
- internet(互联网): onlineCount, offlineCount
- video(视频传输网): onlineCount, offlineCount, oldDeviceCount
- mobilePolice(移动信息网): onlineCount, offlineCount`,
      name: SaAnalyzerApiName.getDeviceOnlineStats,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    // ─── Police network specific ─────────────────────────────────────────────
    {
      description: `获取违规外联 Top 排名（违规外联设备IP、发生次数）。

### 支持网络
- police(公安网)
- video(视频传输网)`,
      name: SaAnalyzerApiName.getIllegalOutreachTop,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          limit: { default: 8, description: 'Top 排名数量（默认8）', type: 'number' },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取违规软件使用统计（公安网）。

### queryType
- "stats": 类型统计（按软件类型分组的设备数和事件数）
- "userTop": 用户Top（违规软件使用用户TOP50）`,
      name: SaAnalyzerApiName.getIllegalSoftwareStats,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          groupCodes: {
            description: '类型分组编码（默认["event_type"]）',
            items: { type: 'string' },
            type: 'array',
          },
          limit: { default: 50, description: 'top 排名（userTop时有效，默认50）', type: 'number' },
          queryType: {
            default: 'stats',
            description: '"stats"=类型统计（默认），"userTop"=用户Top',
            enum: ['stats', 'userTop'],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取恶意程序统计（按类型分组的恶意程序事件数）。（公安网专用）

### groupCodes 可选值
- event_type: 按事件类型
- malware_type: 按恶意程序类型`,
      name: SaAnalyzerApiName.getMaliciousProgramStats,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          groupCodes: {
            description: '类型分组编码（默认["event_type"]）',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取用户行为分析统计（公安网中用户违规行为按类型统计）。

### groupCodes 可选值
- event_type: 按���件类型
- user_behavior: 按行为类型`,
      name: SaAnalyzerApiName.getUserActionStats,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          groupCodes: {
            description: '类型分组编码（默认["event_type"]）',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Internet network specific ───────────────────────────────────────────
    {
      description: `获取安全事件趋势图数据。（互联网）

### trendType
- "byLevel": 按风险级别堆叠（提示/低危/中危/高危/超危）
- "byType": 按类型堆叠折线图

### firstTypes 可选
- ["41"]=安全事件, ["42"]=正常事件, ["43"]=网站攻击, ["44"]=服务控制`,
      name: SaAnalyzerApiName.getEventTrend,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          firstTypes: { description: '一级事件类型过滤', items: { type: 'string' }, type: 'array' },
          groupCodes: { description: '类型分组编码', items: { type: 'string' }, type: 'array' },
          trendType: {
            default: 'byLevel',
            description: '"byType"=按类型, "byLevel"=按风险级别（默认）',
            enum: ['byType', 'byLevel'],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取中高风险主机列表（中危以上安全事件关联的主机IP、所属部门、业务系统等）。（互联网）

### 返回字段
- dev_ip: 设备IP
- riskCount: 风险事件数
- component: 所属组件
- partment: 所属部门`,
      name: SaAnalyzerApiName.getMediumHighRiskHosts,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          pageNum: { default: 1, description: '页码', type: 'number' },
          pageSize: { default: 10, description: '每页条数', type: 'number' },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Video network specific ──────────────────────────────────────────────
    {
      description: `获取视频传输网边界违规统计（按违规类型分组的设备数量）。（视频传输网专用）

### firstTypes
- ["compliance"]: 合规性边界（默认）
- 其他: 可传入其他脆弱性类型`,
      name: SaAnalyzerApiName.getVideoBoundaryViolation,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          firstTypes: {
            default: ['compliance'],
            description: '脆弱性一级类型（默认["compliance"]）',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取视频传输网安全风险统计。

### queryType 参数
| 值 | 说明 |
|----|------|
| firstType | 一级分类统计 |
| riskDistribution | 风险分布（默认） |
| riskDistributionByLevel | 区域风险分布 |
| subType | 二级分类统计 |`,
      name: SaAnalyzerApiName.getVideoSecurityRisk,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          firstTypes: { description: '一级类型过滤', items: { type: 'string' }, type: 'array' },
          queryType: {
            default: 'riskDistribution',
            description:
              '"firstType"=一级分类, "riskDistribution"=风险分布（默认）, "riskDistributionByLevel"=区域分布, "subType"=二级分类',
            enum: ['firstType', 'riskDistribution', 'riskDistributionByLevel', 'subType'],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取视频传输网弱口令统计。

### queryType 参数
| 值 | 说明 |
|----|------|
| show | 弱口令总览（默认） |
| abnormal | 子异常展示 |
| abnormalType | 弱口令TOP排名 |
| mediumAndAbove | 中危以上设备类型 |
| mediumAndAboveTop | TOP6漏洞 |
| subMediumAndAbove | 设备类型二级分组 |

### groupCodes 可选值
- weak_dataArchive: 数据归档弱口令
- weak_application: 应用弱口令
- weak_middleware: 中间件弱口令
- weak_video_application: 视频应用弱口令`,
      name: SaAnalyzerApiName.getVideoWeakPassStats,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          deviceType: { description: '设备类型（subMediumAndAbove时可用）', type: 'string' },
          groupCodes: { description: '类型分组编码', items: { type: 'string' }, type: 'array' },
          limit: { default: 6, description: 'top 排名（默认6）', type: 'number' },
          queryType: {
            default: 'show',
            description:
              '"show"=总览（默认）, "abnormal"=子异常, "abnormalType"=TOP弱口令, "mediumAndAbove"=中危以上, "mediumAndAboveTop"=TOP6漏洞, "subMediumAndAbove"=设备二级',
            enum: [
              'abnormal',
              'abnormalType',
              'mediumAndAbove',
              'mediumAndAboveTop',
              'show',
              'subMediumAndAbove',
            ],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Mobile network specific ─────────────────────────────────────────────
    {
      description: `获取移动警务网统计。

### queryType 参数
| 值 | 说明 |
|----|------|
| deviceView | 设备概览（默认） |
| nonWorkHours | 非工时访问Top |
| accessTimes | 设备访问次数Top |
| attackTrend | 攻击趋势 |
| dstIpTop | 目标地址通信次数Top4 |
| srcIpTop | 源地址通信次数Top4 |
| flowTrend | 流量趋势 |
| modelDistribution | 设备型号分布 |
| onlineDeviceTrend | 在线设备趋势 |
| wafEventProportion | WAF事件占比 |
| wafSubEventProportion | WAF子事件占比 |`,
      name: SaAnalyzerApiName.getMobileNetworkStats,
      parameters: {
        additionalProperties: false,
        properties: {
          ...networkBaseProps,
          firstTypes: {
            description: '事件一级类型（wafSubEventProportion时可用）',
            items: { type: 'string' },
            type: 'array',
          },
          groupCodes: {
            description: '类型分组编码（wafSubEventProportion时可用）',
            items: { type: 'string' },
            type: 'array',
          },
          limit: { default: 8, description: 'top 排名', type: 'number' },
          queryType: {
            default: 'deviceView',
            description:
              '"deviceView"=设备概览（默认）, "nonWorkHours"=非工时访问, "accessTimes"=访问次数Top, "attackTrend"=攻击趋势, "dstIpTop"=目标IP Top4, "srcIpTop"=源IP Top4, "flowTrend"=流量趋势, "modelDistribution"=型号分布, "onlineDeviceTrend"=在线趋势, "wafEventProportion"=WAF事件, "wafSubEventProportion"=WAF子事件',
            enum: [
              'accessTimes',
              'attackTrend',
              'deviceView',
              'dstIpTop',
              'flowTrend',
              'modelDistribution',
              'nonWorkHours',
              'onlineDeviceTrend',
              'srcIpTop',
              'wafEventProportion',
              'wafSubEventProportion',
            ],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Cross-network ───────────────────────────────────────────────────────
    {
      description: `获取整体态势风险等级及工作建议。

### 返回数据
- riskValue: 风险等级(严重/高风险/一般/良好/优秀)
- ruleContent: 风险规则描述
- suggests: 工作建议列表`,
      name: SaAnalyzerApiName.getRiskLevel,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    {
      description: `获取指定网络类型的工作建议列表。

### networkType
police, internet, video, mobilePolice`,
      name: SaAnalyzerApiName.getWorkSuggestions,
      parameters: {
        additionalProperties: false,
        properties: {
          endTime: { description: '结束时间', type: 'string' },
          networkType: {
            description: '单一网络类型: police, internet, video, mobilePolice',
            type: 'string',
          },
          startTime: { description: '开始时间', type: 'string' },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Message center ──────────────────────────────────────────────────────
    {
      description: `分页查询消息中心通知（安全事件通知、违规行为、系统通知）。

### 参数
- isRead: 0=未读, 1=已读（不传则返回全部）`,
      name: SaAnalyzerApiName.queryMessages,
      parameters: {
        additionalProperties: false,
        properties: {
          isRead: { description: '是否已读: 0=未读, 1=已读', type: 'number' },
          pageNum: { default: 1, description: '页码', type: 'number' },
          pageSize: { default: 10, description: '每页条数', type: 'number' },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description: '将消息中心所有未读消息标记为已读。',
      name: SaAnalyzerApiName.markAllMessagesRead,
      parameters: {
        additionalProperties: false,
        properties: {},
        required: [],
        type: 'object',
      },
    },
    // ─── Network attack info view ─────────────────────────────────────────────
    {
      description: `获取网络攻击信息视图，展示各网络的攻击事件统计。

### 返回字段
- networkType: 网络类型
- eventCount: 事件总次数
- fromIpCount: 来源IP数
- toIpCount: 目标IP数
- outDirection: 内→外次数
- inDirection: 外→内次数

### 支持网络
- police(公安网)`,
      name: SaAnalyzerApiName.getAttackInfoView,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    // ─── Internet device count ────────────────────────────────────────────────
    {
      description: `获取互联网设备总量。（互联网专用）`,
      name: SaAnalyzerApiName.getDeviceCount,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    // ─── Video IP rate ────────────────────────────────────────────────────────
    {
      description: `获取视频传输网在线设备IP地址平均规范使用率（0-100）。（视频传输网专用）`,
      name: SaAnalyzerApiName.getVideoDeviceIpRate,
      parameters: {
        additionalProperties: false,
        properties: networkBaseProps,
        required: [],
        type: 'object',
      },
    },
    // ─── Network area device type stat ───────────────────────────────────────
    {
      description: `获取指定区域的资产子设备类型统计。

### 参数
- regionId: 区域ID（默认604154）
- networkType: 网络类型（单值）: police, internet, video, mobilePolice

### 返回
- regionName: 区域名称
- childDeviceTypeStats: 子设备类型统计列表`,
      name: SaAnalyzerApiName.getNetworkAreaDeviceTypeStat,
      parameters: {
        additionalProperties: false,
        properties: {
          endTime: { description: '结束时间', type: 'string' },
          networkType: {
            description: '网络类型（单值）: police, internet, video, mobilePolice',
            type: 'string',
          },
          regionId: { description: '区域ID（默认604154）', type: 'number' },
          startTime: { description: '开始时间', type: 'string' },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Asset management ────────────────────────────────────────────────────
    {
      description: `分页查询资产信息（按IP查询设备详情）。

### 返回字段
- ip: IP地址
- host: 主机名
- assetDeviceModel: 设备型号
- os: 操作系统
- networkType: 所属网络
- openPorts: 开放端口
- status: 在线状态`,
      name: SaAnalyzerApiName.queryAssets,
      parameters: {
        additionalProperties: false,
        properties: {
          ip: { description: 'IP地址（精确或模糊匹配）', type: 'string' },
          networkType: {
            description: '网络类型: police, internet, video, mobilePolice',
            type: 'string',
          },
          pageNum: { default: 1, description: '页码', type: 'number' },
          pageSize: { default: 10, description: '每页条数', type: 'number' },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Dictionary (by group code) ───────────────────────────────────────────
    {
      description: `按字典分组编码批量加载字典项（含子节点层级结构）。

### groupCodes 常用值
| 编码 | 说明 |
|------|------|
| event_type | 事件类型 |
| device_type | 设备类型 |
| vulnerability_type | 漏洞类型 |
| network_type | 网络类型 |

### networkType
影响返回的字典项范围: police, internet, video, mobilePolice`,
      name: SaAnalyzerApiName.loadDictByGroupCode,
      parameters: {
        additionalProperties: false,
        properties: {
          groupCodes: { description: '字典分组编码列表', items: { type: 'string' }, type: 'array' },
          networkType: { description: '网络类型（影响返回的字典项范围）', type: 'string' },
        },
        required: [],
        type: 'object',
      },
    },
    // ─── Dictionary (enum) ────────────────────────────────────────────────────
    {
      description: `查询枚举字典项，用于解析事件类型、危险级别等编码含义。

### enumDictCode 常用值
| 编码 | 说明 |
|------|------|
| event_type | 事件类型 |
| severity | 危险级别 |
| event_deal_status | 事件处置状态 |
| device_type | 设备类型 |
| vulnerability_type | 漏洞类型 |`,
      name: SaAnalyzerApiName.queryEnumDict,
      parameters: {
        additionalProperties: false,
        properties: {
          enumDictCode: {
            description: '字典分组编码',
            type: 'string',
          },
        },
        required: ['enumDictCode'],
        type: 'object',
      },
    },
  ],
  identifier: SaAnalyzerIdentifier,
  meta: {
    avatar: '🛡️',
    description: '查询安全事件、脆弱性及多网络安全态势统计',
    title: '安全运营助手',
  },
  systemRole: systemPrompt,
  type: 'builtin',
};
