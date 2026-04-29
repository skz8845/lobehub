export const ThreatIntelIdentifier = 'lobe-threat-intel';

export const ThreatIntelApiName = {
  queryFileHash: 'queryFileHash',
  queryIndicator: 'queryIndicator',
} as const;

export type ThreatIntelApiNameType = (typeof ThreatIntelApiName)[keyof typeof ThreatIntelApiName];

export type IndicatorType = 'ip' | 'domain' | 'url' | 'hash' | 'unknown';

export type ThreatLevel = 'Low' | 'Medium' | 'High' | 'unknown';

export interface ThreatIntelTag {
  colour: string;
  name: string;
}

export interface ThreatIntelEvent {
  date?: string;
  id: string;
  info: string;
  org?: string;
  orgc?: string;
  threatLevel?: string;
  uuid?: string;
}

export interface ThreatIntelAttribute {
  category: string;
  comment?: string;
  event?: ThreatIntelEvent;
  event_id: string;
  first_seen?: string;
  id: string;
  last_seen?: string;
  tags?: ThreatIntelTag[];
  timestamp?: string;
  to_ids: boolean;
  type: string;
  value: string;
}

export interface ThreatIntelRecord {
  attributes: ThreatIntelAttribute[];
  event?: ThreatIntelEvent;
  event_id: string;
  id: string;
  objectName?: string;
  primaryAttribute: ThreatIntelAttribute;
}

// ============ API Args ============

export interface QueryIndicatorArgs {
  indicator: string;
  type?: IndicatorType;
}

export interface QueryFileHashArgs {
  fileId: string;
  fileName?: string;
}

// ============ UI State ============

export interface QueryIndicatorState {
  indicator: string;
  records: ThreatIntelRecord[];
  total: number;
  type: IndicatorType;
}

export interface FileHashes {
  md5: string;
  sha1: string;
  sha256: string;
}

export interface QueryFileHashState {
  fileId: string;
  fileName?: string;
  hashes: FileHashes;
  records: ThreatIntelRecord[];
  total: number;
}
