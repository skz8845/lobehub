import { memo } from 'react';

import { SaAnalyzerApiName } from '../../types';
import { GenericInspector } from './GenericInspector';
import { QuerySecurityEventsInspector } from './QuerySecurityEvents';
import { QueryVulnerabilitiesInspector } from './QueryVulnerabilities';

const makeGeneric = (title: string) =>
  memo<any>(({ isArgumentsStreaming, isLoading }) => (
    <GenericInspector
      isArgumentsStreaming={isArgumentsStreaming}
      isLoading={isLoading}
      title={title}
    />
  ));

export const SaAnalyzerInspectors = {
  [SaAnalyzerApiName.getAbnormalDeviceStats]: makeGeneric('异常设备统计'),
  [SaAnalyzerApiName.getAttackInfoView]: makeGeneric('网络攻击视图'),
  [SaAnalyzerApiName.getAttackTopIPs]: makeGeneric('攻击Top IP'),
  [SaAnalyzerApiName.getDeviceCount]: makeGeneric('互联网设备总量'),
  [SaAnalyzerApiName.getDeviceOnlineStats]: makeGeneric('设备在线统计'),
  [SaAnalyzerApiName.getDeviceTypeStats]: makeGeneric('设备类型统计'),
  [SaAnalyzerApiName.getEventRiskStats]: makeGeneric('风险级别统计'),
  [SaAnalyzerApiName.getEventSubTypeStats]: makeGeneric('事件子类型统计'),
  [SaAnalyzerApiName.getEventTrend]: makeGeneric('事件趋势'),
  [SaAnalyzerApiName.getEventTypeStats]: makeGeneric('事件类型统计'),
  [SaAnalyzerApiName.getIllegalOutreachTop]: makeGeneric('违规外联Top'),
  [SaAnalyzerApiName.getIllegalSoftwareStats]: makeGeneric('违规软件统计'),
  [SaAnalyzerApiName.getMaliciousProgramStats]: makeGeneric('恶意程序统计'),
  [SaAnalyzerApiName.getMediumHighRiskHosts]: makeGeneric('中高风险主机'),
  [SaAnalyzerApiName.getMobileNetworkStats]: makeGeneric('移动网统计'),
  [SaAnalyzerApiName.getRiskLevel]: makeGeneric('态势风险等级'),
  [SaAnalyzerApiName.getSecurityOverview]: makeGeneric('安全事件概览'),
  [SaAnalyzerApiName.getUserActionStats]: makeGeneric('用户行为分析'),
  [SaAnalyzerApiName.getVideoBoundaryViolation]: makeGeneric('视频网边界违规'),
  [SaAnalyzerApiName.getVideoSecurityRisk]: makeGeneric('视频网安全风险'),
  [SaAnalyzerApiName.getVideoWeakPassStats]: makeGeneric('视频网弱口令'),
  [SaAnalyzerApiName.getNetworkAreaDeviceTypeStat]: makeGeneric('区域设备类型统计'),
  [SaAnalyzerApiName.getVideoDeviceIpRate]: makeGeneric('视频网IP规范使用率'),
  [SaAnalyzerApiName.getWorkSuggestions]: makeGeneric('工作建议'),
  [SaAnalyzerApiName.loadDictByGroupCode]: makeGeneric('加载字典分组'),
  [SaAnalyzerApiName.markAllMessagesRead]: makeGeneric('标记消息已读'),
  [SaAnalyzerApiName.queryAssets]: makeGeneric('查询资产'),
  [SaAnalyzerApiName.queryEnumDict]: makeGeneric('查询字典'),
  [SaAnalyzerApiName.queryMessages]: makeGeneric('消息通知'),
  [SaAnalyzerApiName.querySecurityEvents]: QuerySecurityEventsInspector,
  [SaAnalyzerApiName.queryVulnerabilities]: QueryVulnerabilitiesInspector,
};
