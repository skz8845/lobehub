'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { EventRiskStatItem, GetEventRiskStatsArgs, GetEventRiskStatsState } from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  count: css`
    font-size: 20px;
    font-weight: 700;
    color: ${cssVar.colorText};
  `,
  label: css`
    margin-block-start: 2px;
    font-size: 11px;
    color: ${cssVar.colorTextTertiary};
  `,
  networkTag: css`
    margin-block-end: 8px;
    font-size: 12px;
    font-weight: 600;
    color: ${cssVar.colorPrimary};
  `,
  riskCard: css`
    flex: 1;

    min-width: 60px;
    padding: 8px;
    border-radius: 6px;

    text-align: center;
  `,
  wrapper: css`
    padding: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
    background: ${cssVar.colorBgContainer};
  `,
}));

const RISK_LEVELS = [
  { color: '#8c8c8c', field: 'oneCount' as const, label: '提示' },
  { color: '#1677ff', field: 'twoCount' as const, label: '低危' },
  { color: '#fa8c16', field: 'threeCount' as const, label: '中危' },
  { color: '#f5222d', field: 'fourCount' as const, label: '高危' },
  { color: '#820014', field: 'fiveCount' as const, label: '超危' },
];

const NETWORK_LABEL: Record<string, string> = {
  internet: '互联网',
  mobilePolice: '移动信息网',
  police: '公安网',
  video: '视频传输网',
};

const RiskStatCard = memo<{ item: EventRiskStatItem }>(({ item }) => (
  <div className={styles.wrapper}>
    {item.networkType && (
      <div className={styles.networkTag}>{NETWORK_LABEL[item.networkType] ?? item.networkType}</div>
    )}
    <Flexbox horizontal gap={4}>
      {RISK_LEVELS.map(({ color, field, label }) => (
        <div className={styles.riskCard} key={field} style={{ background: `${color}18` }}>
          <div className={styles.count} style={{ color }}>
            {item[field] ?? 0}
          </div>
          <div className={styles.label}>{label}</div>
        </div>
      ))}
    </Flexbox>
  </div>
));

RiskStatCard.displayName = 'RiskStatCard';

const GetEventRiskStats = memo<BuiltinRenderProps<GetEventRiskStatsArgs, GetEventRiskStatsState>>(
  ({ pluginState }) => {
    const { items } = pluginState || {};

    if (!items || items.length === 0) {
      return <Empty description={'暂无风险统计数据'} />;
    }

    return (
      <Flexbox gap={8}>
        {items.map((item, index) => (
          <RiskStatCard item={item} key={item.networkType ?? index} />
        ))}
      </Flexbox>
    );
  },
);

export default GetEventRiskStats;
