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
- police(公安网), internet(互联网), video(视频传输网), mobilePolice(移动信息网)

### typeIn 事件一级类型
| 网络 | 编码 | 说明 |
|------|------|------|
| police | 31 | 违规事件 |
| police | 32 | 安全事件 |
| police | 33 | 用户行为异常 |
| police | 34 | 数据安全事件 |
| police | 35 | 设备健康事件 |
| video | 1 | 违规事件 |
| video | 2 | 安全事件 |
| video | 3 | 其他事件 |
| internet | 41 | 安全事件 |
| internet | 42 | 正常事件 |
| internet | 43 | 网站攻击事件 |
| internet | 44 | 服务控制或应用控制 |
| mobilePolice | 21 | 漏洞利用攻击 |
| mobilePolice | 22 | 网站攻击 |
| mobilePolice | 23 | 僵尸网络 |
| mobilePolice | 24 | 业务弱点 |

### subTypeIn 子类型 — police 31 违规事件
**L2**: 3101=运维违规, 3102=违规代理, 3103=违规内网穿透, 3104=违规接入, 3105=飞行与特种作业违规, 3106=违规进程运行, 3108=资产配置违规, 3109=违规远程登录, 3198=违规远控, 3199=违规外联
**L3 3198违规远控**: 319801=TeamViewer, 319802=向日葵, 319803=ToDesk, 319804=RustDesk, 319805=AnyDesk, 319806=腾讯远程协助, 319807=百度远程控制, 319808=pcAnywhere, 319810=X11 Forwarding
**L3 3199违规外联**: 319901=违规外联互联网, 319902=离网外联互联网, 319903=串网外联互联网, 319904=违规外联其他网, 319905=一机两用, 319906=IPv6串线风险, 319908=隐蔽外联通道, 319909=违规上网-网络娱乐
**L3 3102违规代理**: 310201=FreeGate(自由门), 310202=Tor(洋葱路由), 310203=Shadowsocks(SS), 310204=V2Ray/Xray, 310205=Clash, 310206=SSH隧道
**L3 3103违规内网穿透**: 310301=花生壳, 310302=FRP, 310303=Ngrok
**L3 3104违规接入**: 310401=灰资产接入, 310402=辖区外/跨域接入, 310403=疑似串网接入, 310404=移动终端违规接入, 310405=非法外设接入, 310406=一卡多机, 310407=一机多卡, 310408=违规组网

### subTypeIn 子类型 — police 32 安全事件
**L2核心**: 3205=安全扫描, 3207=暴力破解, 3208=脆弱口令, 3210=分布式拒绝服务, 3213=僵尸网络, 3216=木马后门, 3217=欺骗劫持, 3225=应用层DDos攻击, 3229=Web应用攻击, 3230=漏洞利用与渗透, 3231=恶意程序与C2, 3232=隐蔽隧道技术, 3233=邮件与协议攻击, 3234=网络层DoS, 3235=不安全配置, 3236=异常扫描, 3237=后门攻击, 3238=APT事件, 3239=恶意通信, 3240=协议异常
**L3 3229 Web应用攻击**: 322901=SQL注入, 322902=XSS跨站脚本, 322903=远程命令/代码执行(RCE), 322904=目录遍历与文件包含, 322905=Webshell上传, 322906=Webshell连接通信, 322907=CC攻击, 322908=恶意爬虫与撞库, 322910=未授权访问, 322920=跨站请求伪造(CSRF)
**L3 3230 漏洞利用与渗透**: 323001=远程代码执行漏洞利用, 323002=反序列化漏洞利用, 323003=SMB/NTLM横向移动, 323006=中间件/容器漏洞利用, 323021=网页篡改, 323025=钓鱼网站, 323028=拖库
**L3 3231 恶意程序与C2**: 323101=勒索软件通信, 323102=挖矿程序通信, 323103=DGA域名解析, 323104=僵尸网络/C2心跳, 323105=恶意文件传播, 323107=间谍软件, 323109=恶意程序
**L3 3232 隐蔽隧道**: 323201=DNS隧道, 323202=ICMP隧道, 323203=HTTP/HTTPS隐蔽通道, 323204=SSH隧道, 323206=SOCKS代理违规搭建
**L3 3234 网络层DoS**: 323401=SYN Flood, 323402=ACK Flood, 323405=UDP Flood, 323406=ICMP Flood/Smurf, 323408=DNS反射放大, 323411=NTP反射放大
**L3 3238 APT事件**: 323801=海莲花, 323802=APT-C-35, 323804=APT30, 323806=Lazarus, 323807=BITTER, 323809=APT10, 323813=APT28, 323817=高级持续性威胁

### subTypeIn 子类型 — police 33 用户行为异常
**L2**: 3301=异地登录, 3302=同人不同终端, 3303=红名单, 3304=退休用户访问, 3305=同终端不同人, 3306=频繁操作, 3307=非工作时间访问, 3308=非业务部门查询, 3309=认证与登录异常, 3310=PKI证书使用行为异常, 3311=数据查询行为异常, 3312=终端操作行为
**L3 3309 认证登录异常**: 330901=异地登录/非常用地点, 330902=非工作时间登录, 330903=频繁登录失败, 330904=同人不同终端, 330906=退休用户访问
**L3 3310 PKI证书**: 331001=PKI跨区域使用, 331002=PKI长期未拔出, 331003=一Key多机, 331004=一机多证, 331008=离退休PKI被使用, 331012=PKI证书弱口令
**L3 3311 数据查询**: 331101=查询应用超限, 331102=查询警员数量超限, 331104=查询频次突增, 331107=敏感人群定向查询, 331109=查询年轻女性, 331110=公众人物查询
**L3 3312 终端操作**: 331201=高频截屏/录屏, 331202=大量文件拷贝/打印, 331204=非授权文件分发/大流量传输

### subTypeIn 子类型 — police 34 数据安全事件
3401=身份证信息泄露风险, 3402=手机号信息泄露风险, 3403=车牌信息泄露风险, 3404=用户信息泄露风险, 3405=身份证号批量查询/导出, 3406=敏感人员被查, 3407=轨迹数据异常访问, 3408=数据库备份文件外传, 3409=源代码/配置文件外传, 3410=敏感关键词内容传输, 3411=退休人员访问敏感数据, 3412=非授权部门访问高密数据

### subTypeIn 子类型 — police 35 设备健康事件
3501=物联网设备状态(350101=低电量,350102=设备离线), 3502=无人机飞行安全(350201=GPS丢失,350203=避障失效,350209=遥控信号丢失,350210=电机/电调异常)

### subTypeIn 子类型 — mobilePolice 21 漏洞利用攻击
2101=mail漏洞攻击, 2103=口令暴力破解, 2105=database漏洞攻击, 2108=shellcode漏洞攻击, 2113=web漏洞攻击, 2122=IPS云防护, 2123=shellcode漏洞利用, 2125=数据库利用攻击, 2126=rat攻击

### subTypeIn 子类型 — mobilePolice 22 网站攻击
2201=SQL注入, 2202=XSS攻击, 2203=网页木马, 2204=网站扫描, 2205=WEBSHELL上传, 2206=跨站请求伪造, 2207=系统命令注入, 2208=文件包含攻击, 2209=目录遍历攻击, 2210=信息泄漏攻击, 2219=网页篡改, 2233=CC攻击防护, 2236=WEBSHELL后门, 2242=PHP反序列化攻击, 2243=Java反序列化攻击, 2252=服务端请求伪造(SSRF), 2253=RAT攻击

### subTypeIn 子类型 — mobilePolice 23 僵尸网络
2301=僵尸网络, 2302=木马远控, 2303=恶意链接, 2304=异常流量, 2305=移动僵尸网络, 2306=移动病毒, 2307=恶意软件

### subTypeIn 子类型 — mobilePolice 24 业务弱点
2401=弱口令检测, 2402=SQL注入漏洞, 2403=远程文件包含漏洞, 2404=系统命令注入漏洞, 2405=文件上传漏洞, 2406=跨站脚本(XSS)漏洞, 2409=WEBSHELL文件访问, 2411=WEB服务器漏洞, 2412=database服务器漏洞, 2419=cms漏洞

### subTypeIn 子类型 — internet
**41安全事件**: 4101=越权操作, 4102=攻击行为, 4103=切换账号风险, 4106=未授权操作, 4107=试探攻击
**42正常事件**: 4201=系统运行行为, 4202=合规运维操作, 4203=系统提醒行为
**43网站攻击事件**: 4301=SQL注入, 4302=XSS攻击, 4303=网页木马, 4304=网站扫描, 4305=WEBSHELL上传, 4306=跨站请求伪造, 4307=系统命令注入, 4308=文件包含攻击, 4309=目录遍历攻击, 4310=信息泄漏攻击, 4319=网页篡改, 4333=CC攻击防护, 4336=WEBSHELL后门, 4342=PHP反序列化攻击, 4343=Java反序列化攻击, 4352=服务端请求伪造(SSRF), 4353=RAT攻击, 4354=XXE攻击

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
            description:
              '事件子类型编码（**仅接受叶节点码**：无下级子类的末级码）。有 L3 子类的 L2 码（如 3207=暴力破解、3229=Web应用攻击、3238=APT事件等）不可直接传入，须传其全部 L3 子类码集合；无子类的 L2 码（如 3213=僵尸网络、3216=木马后门、34xx 系列）可直接传入。',
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

### typeIn 脆弱性一级类型
| 编码 | 说明 |
|------|------|
| webvuln | Web漏洞 |
| sysvuln | 系统漏洞 |
| password | 弱口令 |
| compliance | 边界完整性 |
| other | 其他 |

### subTypeIn webvuln子类(Web漏洞)
**通用攻击类型**: remote_code_exec_web=远程代码执行, xss_web=XSS跨站脚本, sql_inject_web=SQL注入, sensitive_info_leak_web=敏感信息泄漏, unauth_access_web=未授权访问, unauth_login_web=未授权登录, dir_traversal_attack_web=目录遍历攻击, exceed_auth_access_web=越权访问, info_collect_web=信息收集, virus_web=病毒木马蠕虫
**主要视频厂商**: v_Hikvision_Video_Product_Vulnerabilities=海康视频漏洞, v_Dahua_Video_Product_Vulnerabilities=大华视频漏洞, v_Uniview_Video_Product_Vulnerabilities=宇视视频漏洞, v_KedaCom_Suzhou_Keda_Product_Vulnerabilities=KEDACOM科达漏洞, v_AVA_Audiovisual_Vulnerabilities=AVA奥威亚漏洞
**主流中间件/框架**: v_Apache_Tomcat_Vulnerabilities=Tomcat漏洞, v_Apache_Struts2_Vulnerabilities=Struts2漏洞, v_Apache_Shiro_Vulnerabilities=Shiro漏洞, v_Apache_ActiveMQ_Vulnerabilities=ActiveMQ漏洞, v_Spring_Framework_Vulnerabilities=Spring漏洞, v_WebLogic_Server_Vulnerabilities=WebLogic漏洞, v_Jenkins_Vulnerabilities=Jenkins漏洞
**数据库/存储**: v_Redis_Vulnerabilities=Redis漏洞, v_MySQL_Vulnerabilities=MySQL漏洞, v_Elastic_Vulnerabilities=Elastic漏洞, v_MinIO_Vulnerabilities=MinIO漏洞
**网络设备**: v_Cisco_Products_Vulnerabilities=Cisco漏洞, v_H3C_Products_Vulnerabilities=H3C漏洞, v_Ruijie_Product_Vulnerabilities=锐捷漏洞, v_Juniper_Products_Vulnerabilities=Juniper漏洞, v_F5_Products_Vulnerabilities=F5漏洞
**其他常见**: v_VMware_Vulnerabilities=VMware漏洞, v_WordPress_Vulnerabilities=WordPress漏洞, v_PHP_Vulnerabilities=PHP漏洞, v_OpenSSH_Vulnerabilities=OpenSSH漏洞, v_OpenSSL_Vulnerabilities=OpenSSL漏洞, v_Zero-Day_Vulnerability=零Day漏洞

### subTypeIn sysvuln子类(系统漏洞)
any_file_read_sys=任意文件读取, dir_traversal_attack_sys=目录遍历攻击, info_collect_sys=信息收集, reject_service_sys=拒绝服务攻击, remote_code_exec_sys=远程代码执行, sensitive_info_leak_sys=敏感信息泄漏, unauth_access_sys=未授权访问, unauth_command_exec_sys=未授权的命令执行, unauth_login_sys=未授权登录, virus_sys=病毒木马蠕虫, xss_sys=XSS跨站脚本, v_Windows_Vulnerabilities=Windows系统漏洞, resp_info_collect_sys=收集响应信息, rsa_attack_sys=RSA算法攻击

### subTypeIn password子类(弱口令)
brute_force_attack_password=暴力破解, null_command_password=空口令, unauth_login_password=未授权登录
**视频协议**: v_1001=onvif弱口令, v_1003=rtsp弱口令, v_1005=XMVideo弱口令, v_1006=hik-sdk弱口令, v_1007=hik-isapi弱口令
**数据库**: v_2001=elastic弱口令, v_2003=mongodb弱口令, v_2005=postgresql弱口令, v_2006=redis弱口令
**网络服务**: v_3001=ftp弱口令, v_3003=ssh弱口令, v_3006=telnet弱口令, v_3007=snmp弱口令
**其他**: v_4001=zookeeper弱口令, v_4002=spark弱口令, v_Weak_Password_Vulnerability=弱口令漏洞

### subTypeIn compliance子类(边界完整性)
v_illegal_in=非法接入检测, v_internal_scan=违规外联检测, v_multi_host=多穴主机, v_wifi_route_check=无线路由设备检测, v_compliance_test=边界完整性子级

### subTypeIn other子类(其他)
v_VMware_check_other=VMware虚机检测, v_env_check_other=系统环境变更检测, v_importance_offline_other=重要设备离线检测, v_malicious_botnet_other=恶意僵尸网络, v_info_collect_other=信息收集, v_other_other=其他

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
            description:
              '脆弱性子类型编码（**仅接受叶节点码**：无下级子类的末级码）。password/sysvuln/compliance/other 的子码均为叶节点，可直接传入。webvuln 的通用攻击类型码（如 remote_code_exec_web、sql_inject_web 等）及厂商漏洞码（如 v_Hikvision_Video_Product_Vulnerabilities）均为叶节点，可直接传入。',
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
            description: '页码（传入时返回分页列表，否则返回汇总统计）',
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
- event_type: 按事件类型
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
