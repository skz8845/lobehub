import QueryAssetByIpRender from './QueryAssetByIp';
import QueryEventDetailRender from './QueryEventDetail';
import QueryIndicatorIntelRender from './QueryIndicatorIntel';
import QueryIpEventsRender from './QueryIpEvents';
import QueryIpVulnerabilitiesRender from './QueryIpVulnerabilities';
import ReplayRequestRender from './ReplayRequest';

export const IncidentAnalyzerRenders = {
  queryAssetByIp: QueryAssetByIpRender,
  queryEventDetail: QueryEventDetailRender,
  queryIndicatorIntel: QueryIndicatorIntelRender,
  queryIpEvents: QueryIpEventsRender,
  queryIpVulnerabilities: QueryIpVulnerabilitiesRender,
  replayRequest: ReplayRequestRender,
};
