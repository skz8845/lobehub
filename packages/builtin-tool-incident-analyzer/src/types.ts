export const IncidentAnalyzerIdentifier = 'lobe-incident-analyzer';

export const IncidentAnalyzerApiName = {
  analyzeAttackBehavior: 'analyzeAttackBehavior',
  attributeIncident: 'attributeIncident',
  buildAttackerProfile: 'buildAttackerProfile',
  queryAttackedTargets: 'queryAttackedTargets',
  queryAttackerEvents: 'queryAttackerEvents',
  queryIndicatorIntel: 'queryIndicatorIntel',
} as const;

export type IncidentAnalyzerApiNameType =
  (typeof IncidentAnalyzerApiName)[keyof typeof IncidentAnalyzerApiName];

// ============ Common Param Types ============

export interface TimeRangeArgs {
  endTime?: string;
  startTime?: string;
}

export interface NetworkArgs extends TimeRangeArgs {
  networkTypeIn?: string[];
}

export interface PageArgs {
  pageNum?: number;
  pageSize?: number;
}

// ============ API Args ============

export interface QueryAttackerEventsArgs extends NetworkArgs, PageArgs {
  levelIn?: string[];
  srcIp: string;
}

export interface AnalyzeAttackBehaviorArgs extends NetworkArgs {
  srcIp: string;
}

export interface QueryIndicatorIntelArgs {
  indicator: string;
  type?: 'domain' | 'hash' | 'ip' | 'url';
}

export interface BuildAttackerProfileArgs extends NetworkArgs {
  srcIp: string;
}

export interface QueryAttackedTargetsArgs extends NetworkArgs, PageArgs {
  srcIp: string;
}

export interface AttributeIncidentArgs extends TimeRangeArgs {
  indicators?: string[];
  networkTypeIn?: string[];
  srcIp?: string;
}

// ============ Response Types ============

export interface AttackEvent {
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
}

export interface AttackTargetItem {
  dstIp: string;
  dstIpDirection?: string;
  eventCount: number;
}

export interface TTPItem {
  attackType: string;
  count: number;
  level: string;
  subTypes: string[];
  tacticId?: string;
  tacticName?: string;
}

export interface AttackBehaviorProfile {
  attackedTargets: number;
  firstSeen?: string;
  lastSeen?: string;
  levelDistribution: Record<string, number>;
  networkDistribution: Record<string, number>;
  primaryTactics: string[];
  srcIp: string;
  topAttackTypes: TTPItem[];
  totalEvents: number;
}

export interface AttackerProfile {
  attackedTargets: AttackTargetItem[];
  behaviorSummary: AttackBehaviorProfile;
  intelRecords: number;
  srcIp: string;
  threatScore: number;
}

export interface AttributionResult {
  aptGroups: Array<{
    confidence: 'high' | 'low' | 'medium';
    groupId: string;
    groupName: string;
    matchedTechniques: string[];
  }>;
  confidence: 'high' | 'low' | 'medium';
  evidence: string[];
  summary: string;
}

// ============ UI State ============

export interface QueryAttackerEventsState {
  current?: number;
  records: AttackEvent[];
  srcIp: string;
  total: number;
}

export interface AnalyzeAttackBehaviorState {
  profile: AttackBehaviorProfile;
  srcIp: string;
}

export interface QueryIndicatorIntelState {
  indicator: string;
  records: any[];
  total: number;
  type: string;
}

export interface BuildAttackerProfileState {
  profile: AttackerProfile;
  srcIp: string;
}

export interface QueryAttackedTargetsState {
  current?: number;
  items: AttackTargetItem[];
  srcIp: string;
  total: number;
}

export interface AttributeIncidentState {
  attribution: AttributionResult;
  srcIp?: string;
}
