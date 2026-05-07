import { IncidentAnalyzerApiName } from '../../types';
import { QueryAssetByIpInspector } from './QueryAssetByIp';
import { QueryEventDetailInspector } from './QueryEventDetail';
import { QueryIndicatorIntelInspector } from './QueryIndicatorIntel';
import { QueryIpEventsInspector } from './QueryIpEvents';
import { QueryIpVulnerabilitiesInspector } from './QueryIpVulnerabilities';
import { ReplayRequestInspector } from './ReplayRequest';

export const IncidentAnalyzerInspectors = {
  [IncidentAnalyzerApiName.queryEventDetail]: QueryEventDetailInspector,
  [IncidentAnalyzerApiName.queryIpEvents]: QueryIpEventsInspector,
  [IncidentAnalyzerApiName.queryAssetByIp]: QueryAssetByIpInspector,
  [IncidentAnalyzerApiName.queryIpVulnerabilities]: QueryIpVulnerabilitiesInspector,
  [IncidentAnalyzerApiName.queryIndicatorIntel]: QueryIndicatorIntelInspector,
  [IncidentAnalyzerApiName.replayRequest]: ReplayRequestInspector,
};
