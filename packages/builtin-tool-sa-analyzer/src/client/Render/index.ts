import { lazy } from 'react';

import { SaAnalyzerApiName } from '../../types';

const lazyGeneric = () => import('./GenericList');

export const SaAnalyzerRenders = {
  [SaAnalyzerApiName.getAbnormalDeviceStats]: lazy(() => import('./GetAbnormalDeviceStats')),
  [SaAnalyzerApiName.getAttackInfoView]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getAttackTopIPs]: lazy(() => import('./GetAttackTopIPs')),
  [SaAnalyzerApiName.getDeviceCount]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getDeviceOnlineStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getDeviceTypeStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getEventRiskStats]: lazy(() => import('./GetEventRiskStats')),
  [SaAnalyzerApiName.getEventSubTypeStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getEventTrend]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getEventTypeStats]: lazy(() => import('./GetEventTypeStats')),
  [SaAnalyzerApiName.getIllegalOutreachTop]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getIllegalSoftwareStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getMaliciousProgramStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getMediumHighRiskHosts]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getMobileNetworkStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getRiskLevel]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getSecurityOverview]: lazy(() => import('./GetSecurityOverview')),
  [SaAnalyzerApiName.getUserActionStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getVideoBoundaryViolation]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getVideoSecurityRisk]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getVideoWeakPassStats]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getNetworkAreaDeviceTypeStat]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getVideoDeviceIpRate]: lazy(lazyGeneric),
  [SaAnalyzerApiName.getWorkSuggestions]: lazy(lazyGeneric),
  [SaAnalyzerApiName.loadDictByGroupCode]: lazy(lazyGeneric),
  [SaAnalyzerApiName.markAllMessagesRead]: lazy(lazyGeneric),
  [SaAnalyzerApiName.queryAssets]: lazy(lazyGeneric),
  [SaAnalyzerApiName.queryEnumDict]: lazy(lazyGeneric),
  [SaAnalyzerApiName.queryMessages]: lazy(lazyGeneric),
  [SaAnalyzerApiName.querySecurityEvents]: lazy(() => import('./QuerySecurityEvents')),
  [SaAnalyzerApiName.queryVulnerabilities]: lazy(() => import('./QueryVulnerabilities')),
};
