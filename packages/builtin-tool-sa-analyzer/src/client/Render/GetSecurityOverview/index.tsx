'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type {
  GetSecurityOverviewArgs,
  GetSecurityOverviewState,
  SecurityOverviewItem,
} from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    flex: 1;

    min-width: 160px;
    padding: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;

    background: ${cssVar.colorBgContainer};
  `,
  label: css`
    margin-block-start: 2px;
    font-size: 11px;
    color: ${cssVar.colorTextTertiary};
  `,
  networkTag: css`
    display: inline-block;

    margin-block-end: 8px;
    padding-block: 2px;
    padding-inline: 8px;
    border-radius: 4px;

    font-size: 12px;
    font-weight: 600;
    color: ${cssVar.colorPrimary};

    background: ${cssVar.colorPrimaryBg};
  `,
  statRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding-block: 3px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    &:last-child {
      border-block-end: none;
    }
  `,
  value: css`
    font-size: 16px;
    font-weight: 700;
    color: ${cssVar.colorText};
  `,
}));

const NETWORK_LABEL: Record<string, string> = {
  internet: '互联网',
  mobilePolice: '移动信息网',
  police: '公安网',
  video: '视频传输网',
};

const OverviewCard = memo<{ item: SecurityOverviewItem }>(({ item }) => (
  <div className={styles.card}>
    <div className={styles.networkTag}>
      {NETWORK_LABEL[item.networkType ?? ''] ?? item.networkType ?? '未知网络'}
    </div>
    <div className={styles.statRow}>
      <span className={styles.label}>安全事件</span>
      <span className={styles.value}>{item.eventCount ?? 0}</span>
    </div>
    <div className={styles.statRow}>
      <span className={styles.label}>涉及设备</span>
      <span className={styles.value}>{item.devCount ?? 0}</span>
    </div>
    <div className={styles.statRow}>
      <span className={styles.label}>已处置</span>
      <span className={styles.value}>{item.disposedCount ?? 0}</span>
    </div>
    <div className={styles.statRow}>
      <span className={styles.label}>今日事件</span>
      <span className={styles.value}>{item.todayEventCount ?? 0}</span>
    </div>
    <div className={styles.statRow}>
      <span className={styles.label}>今日设备</span>
      <span className={styles.value}>{item.todayDevCount ?? 0}</span>
    </div>
  </div>
));

OverviewCard.displayName = 'OverviewCard';

const GetSecurityOverview = memo<
  BuiltinRenderProps<GetSecurityOverviewArgs, GetSecurityOverviewState>
>(({ pluginState }) => {
  const { items } = pluginState || {};

  if (!items || items.length === 0) {
    return <Empty description={'暂无安全概览数据'} />;
  }

  return (
    <Flexbox horizontal gap={8} wrap={'wrap'}>
      {items.map((item, index) => (
        <OverviewCard item={item} key={item.networkType ?? index} />
      ))}
    </Flexbox>
  );
});

export default GetSecurityOverview;
