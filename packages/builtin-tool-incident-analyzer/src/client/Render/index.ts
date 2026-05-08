import QueryAssetByIpRender from './QueryAssetByIp';
import QueryEventDetailRender from './QueryEventDetail';
import QueryIpEventsRender from './QueryIpEvents';
import QueryIpVulnerabilitiesRender from './QueryIpVulnerabilities';
import ReplayRequestRender from './ReplayRequest';

export const IncidentAnalyzerRenders = {
  queryAssetByIp: QueryAssetByIpRender,
  queryEventDetail: QueryEventDetailRender,
  queryIpEvents: QueryIpEventsRender,
  queryIpVulnerabilities: QueryIpVulnerabilitiesRender,
  replayRequest: ReplayRequestRender,
};
