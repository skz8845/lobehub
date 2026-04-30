export const SaAnalyzerIdentifier = 'lobe-sa-analyzer';

export const SaAnalyzerApiName = {
  getAbnormalDeviceStats: 'getAbnormalDeviceStats',
  getAttackInfoView: 'getAttackInfoView',
  getAttackTopIPs: 'getAttackTopIPs',
  getDeviceCount: 'getDeviceCount',
  getDeviceOnlineStats: 'getDeviceOnlineStats',
  getDeviceTypeStats: 'getDeviceTypeStats',
  getEventRiskStats: 'getEventRiskStats',
  getEventSubTypeStats: 'getEventSubTypeStats',
  getEventTrend: 'getEventTrend',
  getEventTypeStats: 'getEventTypeStats',
  getIllegalOutreachTop: 'getIllegalOutreachTop',
  getIllegalSoftwareStats: 'getIllegalSoftwareStats',
  getMaliciousProgramStats: 'getMaliciousProgramStats',
  getMediumHighRiskHosts: 'getMediumHighRiskHosts',
  getMobileNetworkStats: 'getMobileNetworkStats',
  getNetworkAreaDeviceTypeStat: 'getNetworkAreaDeviceTypeStat',
  getRiskLevel: 'getRiskLevel',
  getSecurityOverview: 'getSecurityOverview',
  getUserActionStats: 'getUserActionStats',
  getVideoBoundaryViolation: 'getVideoBoundaryViolation',
  getVideoDeviceIpRate: 'getVideoDeviceIpRate',
  getVideoSecurityRisk: 'getVideoSecurityRisk',
  getVideoWeakPassStats: 'getVideoWeakPassStats',
  getWorkSuggestions: 'getWorkSuggestions',
  loadDictByGroupCode: 'loadDictByGroupCode',
  markAllMessagesRead: 'markAllMessagesRead',
  queryAssets: 'queryAssets',
  queryEnumDict: 'queryEnumDict',
  queryMessages: 'queryMessages',
  querySecurityEvents: 'querySecurityEvents',
  queryVulnerabilities: 'queryVulnerabilities',
} as const;

export type SaAnalyzerApiNameType = (typeof SaAnalyzerApiName)[keyof typeof SaAnalyzerApiName];

// ============ Common Param Types ============

export interface NetworkBaseArgs {
  endTime?: string;
  networkTypes?: string[];
  startTime?: string;
}

export interface PageArgs {
  pageNum?: number;
  pageSize?: number;
}

// ============ API Args ============

export interface QuerySecurityEventsArgs extends PageArgs {
  endTime?: string;
  levelIn?: string[];
  networkTypeIn?: string[];
  startTime?: string;
  subTypeIn?: string[];
  typeIn?: string[];
}

export interface QueryVulnerabilitiesArgs extends PageArgs {
  endTime?: string;
  levelIn?: string[];
  networkTypeIn?: string[];
  startTime?: string;
  subTypeIn?: string[];
  typeIn?: string[];
}

export interface GetSecurityOverviewArgs extends NetworkBaseArgs {}

export interface GetAbnormalDeviceStatsArgs extends NetworkBaseArgs, PageArgs {
  subTypeIn?: string[];
}

export interface GetAttackTopIPsArgs extends NetworkBaseArgs {
  direction: 'attacked' | 'attacker';
}

export interface GetEventTypeStatsArgs extends NetworkBaseArgs {}

export interface GetEventRiskStatsArgs extends NetworkBaseArgs {}

export interface GetEventSubTypeStatsArgs extends NetworkBaseArgs {
  firstTypes?: string[];
}

export interface GetDeviceTypeStatsArgs extends NetworkBaseArgs {}

export interface GetDeviceOnlineStatsArgs extends NetworkBaseArgs {}

export interface GetIllegalOutreachTopArgs extends NetworkBaseArgs {
  limit?: number;
}

export interface GetIllegalSoftwareStatsArgs extends NetworkBaseArgs {
  groupCodes?: string[];
  limit?: number;
  queryType?: 'stats' | 'userTop';
}

export interface GetMaliciousProgramStatsArgs extends NetworkBaseArgs {
  groupCodes?: string[];
}

export interface GetUserActionStatsArgs extends NetworkBaseArgs {
  groupCodes?: string[];
}

export interface GetEventTrendArgs extends NetworkBaseArgs {
  firstTypes?: string[];
  groupCodes?: string[];
  trendType?: 'byLevel' | 'byType';
}

export interface GetMediumHighRiskHostsArgs extends NetworkBaseArgs, PageArgs {}

export interface GetVideoBoundaryViolationArgs extends NetworkBaseArgs {
  firstTypes?: string[];
}

export interface GetVideoSecurityRiskArgs extends NetworkBaseArgs {
  firstTypes?: string[];
  queryType?: 'firstType' | 'riskDistribution' | 'riskDistributionByLevel' | 'subType';
}

export interface GetVideoWeakPassStatsArgs extends NetworkBaseArgs {
  deviceType?: string;
  groupCodes?: string[];
  limit?: number;
  queryType?:
    | 'abnormal'
    | 'abnormalType'
    | 'mediumAndAbove'
    | 'mediumAndAboveTop'
    | 'show'
    | 'subMediumAndAbove';
}

export interface GetRiskLevelArgs extends NetworkBaseArgs {}

export interface GetWorkSuggestionsArgs {
  endTime?: string;
  networkType?: string;
  startTime?: string;
}

export interface QueryMessagesArgs extends PageArgs {
  isRead?: number;
}

export interface GetMobileNetworkStatsArgs extends NetworkBaseArgs {
  limit?: number;
  queryType?: 'accessTimes' | 'attackTrend' | 'deviceView' | 'nonWorkHours';
}

export interface QueryEnumDictArgs {
  enumDictCode: string;
}

// ============ Response Types ============

export interface SecurityEvent {
  createTime?: string;
  devIp?: string;
  devName?: string;
  devType?: string;
  dstIp?: string;
  dstPort?: number;
  eventName?: string;
  id?: number;
  level?: number;
  message?: string;
  networkType?: string;
  srcIp?: string;
  srcPort?: number;
  status?: number;
  subType?: string;
  time?: string;
  times?: number;
  type?: number;
}

export interface VulnerabilityItem {
  cnnvd?: string;
  cnvd?: string;
  cve?: string;
  id?: number;
  ip?: string;
  level?: number;
  message?: string;
  name?: string;
  networkType?: string;
  status?: number;
  time?: string;
  type?: string;
}

export interface SecurityOverviewItem {
  devCount?: number;
  disposedCount?: number;
  eventCount?: number;
  networkType?: string;
  todayDevCount?: number;
  todayEventCount?: number;
}

export interface AbnormalDeviceStats {
  abnormalDeviceTotal?: number;
  externalConTotal?: number;
  vulnerabilityTotal?: number;
}

export interface AttackIPItem {
  dstIp?: string;
  dstIpDirection?: string;
  eventCount?: number;
  srcIp?: string;
  srcIpDirection?: string;
}

export interface EventTypeStatItem {
  devCount?: number;
  eventCount?: number;
  networkType?: string;
  typeCode?: string;
  typeName?: string;
}

export interface EventRiskStatItem {
  fiveCount?: number;
  fiveDevCount?: number;
  fourCount?: number;
  fourDevCount?: number;
  networkType?: string;
  oneCount?: number;
  oneDevCount?: number;
  threeCount?: number;
  threeDevCount?: number;
  twoCount?: number;
  twoDevCount?: number;
}

// ============ UI State ============

export interface QuerySecurityEventsState {
  current?: number;
  records: SecurityEvent[];
  total: number;
}

export interface QueryVulnerabilitiesState {
  current?: number;
  records: VulnerabilityItem[];
  total: number;
}

export interface GetSecurityOverviewState {
  items: SecurityOverviewItem[];
}

export interface GetAbnormalDeviceStatsState {
  records?: any[];
  stats?: AbnormalDeviceStats;
  total?: number;
}

export interface GetAttackTopIPsState {
  direction: 'attacked' | 'attacker';
  items: AttackIPItem[];
}

export interface GetEventTypeStatsState {
  items: EventTypeStatItem[];
}

export interface GetEventRiskStatsState {
  items: EventRiskStatItem[];
}

export interface GenericListState {
  items: any[];
}

export interface GenericPageState {
  current?: number;
  records: any[];
  total: number;
}
