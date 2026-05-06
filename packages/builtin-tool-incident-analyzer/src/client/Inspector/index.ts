import { IncidentAnalyzerApiName } from '../../types';
import { AnalyzeAttackBehaviorInspector } from './AnalyzeAttackBehavior';
import { AttributeIncidentInspector } from './AttributeIncident';
import { BuildAttackerProfileInspector } from './BuildAttackerProfile';
import { QueryAttackedTargetsInspector } from './QueryAttackedTargets';
import { QueryAttackerEventsInspector } from './QueryAttackerEvents';
import { QueryIndicatorIntelInspector } from './QueryIndicatorIntel';

export const IncidentAnalyzerInspectors = {
  [IncidentAnalyzerApiName.queryAttackerEvents]: QueryAttackerEventsInspector,
  [IncidentAnalyzerApiName.analyzeAttackBehavior]: AnalyzeAttackBehaviorInspector,
  [IncidentAnalyzerApiName.queryIndicatorIntel]: QueryIndicatorIntelInspector,
  [IncidentAnalyzerApiName.buildAttackerProfile]: BuildAttackerProfileInspector,
  [IncidentAnalyzerApiName.queryAttackedTargets]: QueryAttackedTargetsInspector,
  [IncidentAnalyzerApiName.attributeIncident]: AttributeIncidentInspector,
};
