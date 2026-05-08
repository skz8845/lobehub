export const IncidentAnalyzerIdentifier = 'lobe-incident-analyzer';

export const IncidentAnalyzerApiName = {
  decodePayload: 'decodePayload',
  getScenarioGuide: 'getScenarioGuide',
  queryAssetByIp: 'queryAssetByIp',
  queryEventDetail: 'queryEventDetail',
  queryIpEvents: 'queryIpEvents',
  queryIpVulnerabilities: 'queryIpVulnerabilities',
  replayRequest: 'replayRequest',
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

export interface GetScenarioGuideArgs {
  eventName?: string;
  subType?: string;
  type?: number;
}

export interface GetScenarioGuideState {
  guide: string;
  id: string;
  name: string;
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

export type ReplayProtocol = 'ftp' | 'http' | 'https' | 'rdp' | 'ssh';

export type ReplayAuthResult = 'error' | 'failed' | 'success' | 'timeout';

export interface ReplayRequestArgs {
  // HTTP/HTTPS — 无原始报文时的结构化输入
  body?: string;
  headers?: Record<string, string>;
  // SSH / FTP / RDP 凭据
  host: string;
  password?: string;
  port?: number;
  protocol: ReplayProtocol;
  queryParams?: string;
  // HTTP/HTTPS — 优先使用原始报文（明文时直接传入）
  rawRequest?: string;
  timeout?: number;
  username?: string;
}

export interface ReplayRequestState {
  authResult: ReplayAuthResult;
  error?: string;
  host: string;
  latency?: number;
  port?: number;
  protocol: ReplayProtocol;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  statusCode?: number;
  success: boolean;
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
