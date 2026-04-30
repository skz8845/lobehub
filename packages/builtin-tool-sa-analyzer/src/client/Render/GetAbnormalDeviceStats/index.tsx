'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { GetAbnormalDeviceStatsArgs, GetAbnormalDeviceStatsState } from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    flex: 1;

    min-width: 120px;
    padding-block: 12px;
    padding-inline: 16px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;

    text-align: center;

    background: ${cssVar.colorBgContainer};
  `,
  label: css`
    margin-block-start: 4px;
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
  `,
  value: css`
    font-size: 28px;
    font-weight: 700;
    color: ${cssVar.colorText};
  `,
}));

const GetAbnormalDeviceStats = memo<
  BuiltinRenderProps<GetAbnormalDeviceStatsArgs, GetAbnormalDeviceStatsState>
>(({ pluginState }) => {
  const { stats } = pluginState || {};

  return (
    <Flexbox horizontal gap={8} wrap={'wrap'}>
      <div className={styles.card}>
        <div className={styles.value}>{stats?.abnormalDeviceTotal ?? 0}</div>
        <div className={styles.label}>异常设备总数</div>
      </div>
      <div className={styles.card}>
        <div className={styles.value}>{stats?.externalConTotal ?? 0}</div>
        <div className={styles.label}>违规外联设备</div>
      </div>
      <div className={styles.card}>
        <div className={styles.value}>{stats?.vulnerabilityTotal ?? 0}</div>
        <div className={styles.label}>脆弱口令设备</div>
      </div>
    </Flexbox>
  );
});

export default GetAbnormalDeviceStats;
