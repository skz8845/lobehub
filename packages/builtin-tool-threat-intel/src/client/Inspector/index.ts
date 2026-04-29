import { ThreatIntelApiName } from '../../types';
import { QueryFileHashInspector } from './QueryFileHash';
import { QueryIndicatorInspector } from './QueryIndicator';

export const ThreatIntelInspectors = {
  [ThreatIntelApiName.queryFileHash]: QueryFileHashInspector,
  [ThreatIntelApiName.queryIndicator]: QueryIndicatorInspector,
};
