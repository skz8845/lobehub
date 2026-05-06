'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type {
  AttackTargetItem,
  QueryAttackedTargetsArgs,
  QueryAttackedTargetsState,
} from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  bar: css`
    height: 6px;
    border-radius: 3px;
    opacity: 0.7;
    background: ${cssVar.colorError};
  `,
  row: css`
    padding-block: 8px;
    padding-inline: 12px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    &:last-child {
      border-block-end: none;
    }
  `,
  wrapper: css`
    overflow: hidden;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
  `,
}));

const TargetRow = memo<{ item: AttackTargetItem; maxCount: number; rank: number }>(
  ({ item, maxCount, rank }) => {
    const pct = maxCount > 0 ? (item.eventCount / maxCount) * 100 : 0;
    return (
      <Flexbox className={styles.row} gap={6}>
        <Flexbox horizontal align="center" gap={8}>
          <span style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)', width: 20 }}>
            {rank}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{item.dstIp}</span>
          <span style={{ fontSize: 12, color: 'var(--ant-color-error)' }}>
            {item.eventCount} 次
          </span>
        </Flexbox>
        <div className={styles.bar} style={{ width: `${pct}%` }} />
      </Flexbox>
    );
  },
);

TargetRow.displayName = 'TargetRow';

const QueryAttackedTargetsRender = memo<
  BuiltinRenderProps<QueryAttackedTargetsArgs, QueryAttackedTargetsState>
>(({ pluginState }) => {
  const { items, srcIp, total } = pluginState || {};

  if (!items || items.length === 0) {
    return <Empty description={`未找到 ${srcIp ?? ''} 的攻击目标记录`} />;
  }

  const maxCount = Math.max(...items.map((i) => i.eventCount));

  return (
    <Flexbox gap={8}>
      <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
        {srcIp} 攻击了 {total} 个目标
      </div>
      <div className={styles.wrapper}>
        {items.map((item, index) => (
          <TargetRow item={item} key={item.dstIp} maxCount={maxCount} rank={index + 1} />
        ))}
      </div>
    </Flexbox>
  );
});

export default QueryAttackedTargetsRender;
