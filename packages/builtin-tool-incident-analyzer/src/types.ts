export const IncidentAnalyzerIdentifier = 'lobe-incident-analyzer';

export const IncidentAnalyzerApiName = {
  decodePayload: 'decodePayload',
  queryAssetByIp: 'queryAssetByIp',
  queryEventDetail: 'queryEventDetail',
  queryIndicatorIntel: 'queryIndicatorIntel',
  queryIpEvents: 'queryIpEvents',
  queryIpVulnerabilities: 'queryIpVulnerabilities',
} as const;

export type IncidentAnalyzerApiNameType =
  (typeof IncidentAnalyzerApiName)[keyof typeof IncidentAnalyzerApiName];

// ============ API Args ============

export type DecodeEncoding = 'auto' | 'base64' | 'hex' | 'html' | 'unicode' | 'url';

export interface DecodePayloadArgs {
  encoding?: DecodeEncoding;
  payload: string;
}

export interface DecodeLayer {
  encoding: string;
  input: string;
  layer: number;
  output: string;
}

export interface DecodePayloadState {
  decoded: string;
  layers: DecodeLayer[];
  original: string;
}

export interface QueryEventDetailArgs {
  eventId: string;
}

export type IpRole = 'dev' | 'dst' | 'src';

export interface QueryIpEventsArgs {
  endTime?: string;
  ipRole?: IpRole;
  levelIn?: string[];
  networkTypeIn?: string[];
  pageNum?: number;
  pageSize?: number;
  srcIp: string;
  startTime?: string;
}

export interface QueryAssetByIpArgs {
  ip: string;
  networkType?: string;
}

export interface QueryIndicatorIntelArgs {
  indicator: string;
  type?: 'domain' | 'hash' | 'ip' | 'url';
}

export interface QueryIpVulnerabilitiesArgs {
  endTime?: string;
  ip: string;
  levelIn?: string[];
  networkTypeIn?: string[];
  pageNum?: number;
  pageSize?: number;
  startTime?: string;
  subTypeIn?: string[];
  typeIn?: string[];
}

// ============ Response Types ============

export interface SecurityEventDetail {
  devIp?: string;
  devName?: string;
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
  uuid?: string;
}

export interface AssetDetail {
  assetDeviceModel?: string;
  host?: string;
  ip?: string;
  networkType?: string;
  openPorts?: string;
  os?: string;
  status?: string;
}

// ============ UI State ============

export interface QueryEventDetailState {
  event: SecurityEventDetail | null;
  eventId: string;
}

export interface QueryIpEventsState {
  current?: number;
  ip: string;
  ipRole: IpRole;
  records: SecurityEventDetail[];
  total: number;
}

export interface QueryAssetByIpState {
  assets: AssetDetail[];
  ip: string;
}

export interface QueryIndicatorIntelState {
  indicator: string;
  records: any[];
  total: number;
  type: string;
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

export interface QueryIpVulnerabilitiesState {
  ip: string;
  records: VulnerabilityItem[];
  total: number;
}
