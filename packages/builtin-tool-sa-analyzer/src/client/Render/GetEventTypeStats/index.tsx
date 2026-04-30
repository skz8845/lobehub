'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { EventTypeStatItem, GetEventTypeStatsArgs, GetEventTypeStatsState } from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  count: css`
    font-size: 14px;
    font-weight: 700;
    color: ${cssVar.colorText};
  `,
  label: css`
    font-size: 11px;
    color: ${cssVar.colorTextTertiary};
  `,
  name: css`
    font-size: 13px;
    color: ${cssVar.colorText};
  `,
  row: css`
    padding-block: 6px;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 6px;

    background: ${cssVar.colorBgContainer};
  `,
}));

const StatRow = memo<{ item: EventTypeStatItem }>(({ item }) => (
  <div className={styles.row}>
    <Flexbox horizontal align={'center'} justify={'space-between'}>
      <span className={styles.name}>{item.typeName || item.typeCode || '未知类型'}</span>
      <Flexbox horizontal align={'center'} gap={16}>
        {item.devCount != null && (
          <Flexbox align={'center'}>
            <span className={styles.count}>{item.devCount}</span>
            <span className={styles.label}>设备</span>
          </Flexbox>
        )}
        <Flexbox align={'center'}>
          <span className={styles.count}>{item.eventCount ?? 0}</span>
          <span className={styles.label}>事件</span>
        </Flexbox>
      </Flexbox>
    </Flexbox>
  </div>
));

StatRow.displayName = 'StatRow';

const GetEventTypeStats = memo<BuiltinRenderProps<GetEventTypeStatsArgs, GetEventTypeStatsState>>(
  ({ pluginState }) => {
    const { items } = pluginState || {};

    if (!items || items.length === 0) {
      return <Empty description={'暂无事件类型统计数据'} />;
    }

    return (
      <Flexbox gap={6}>
        {items.map((item, index) => (
          <StatRow item={item} key={item.typeCode ?? index} />
        ))}
      </Flexbox>
    );
  },
);

export default GetEventTypeStats;
