'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { AttackEvent, QueryAttackerEventsArgs, QueryAttackerEventsState } from '../../..';

const LEVEL_COLOR: Record<number, string> = {
  1: 'default',
  2: 'blue',
  3: 'orange',
  4: 'red',
  5: 'volcano',
};

const LEVEL_LABEL: Record<number, string> = {
  1: '提示',
  2: '低危',
  3: '中危',
  4: '高危',
  5: '超危',
};

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    overflow: hidden;
    width: 100%;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
  `,
  content: css`
    padding-block: 10px;
    padding-inline: 14px;
  `,
  footer: css`
    padding-block: 6px;
    padding-inline: 14px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};

    font-size: 12px;
    color: ${cssVar.colorTextTertiary};

    background: ${cssVar.colorFillQuaternary};
  `,
  meta: css`
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
  `,
  title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

const EventCard = memo<{ event: AttackEvent }>(({ event }) => {
  const level = event.level ?? 1;
  return (
    <Flexbox className={styles.card}>
      <div className={styles.content}>
        <Flexbox horizontal align="center" gap={8} style={{ marginBlockEnd: 6 }}>
          <span className={styles.title}>{event.eventName ?? '未知事件'}</span>
          <Tag color={LEVEL_COLOR[level]}>{LEVEL_LABEL[level] ?? `L${level}`}</Tag>
        </Flexbox>
        <div className={styles.meta}>
          {event.srcIp && (
            <span style={{ marginInlineEnd: 12 }}>
              来源: <strong>{event.srcIp}</strong>
              {event.srcPort ? `:${event.srcPort}` : ''}
            </span>
          )}
          {event.dstIp && (
            <span style={{ marginInlineEnd: 12 }}>
              目标: <strong>{event.dstIp}</strong>
              {event.dstPort ? `:${event.dstPort}` : ''}
            </span>
          )}
        </div>
        {event.message && (
          <div className={styles.meta} style={{ marginBlockStart: 4 }}>
            {event.message}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        {event.time && <span style={{ marginInlineEnd: 12 }}>{event.time}</span>}
        {event.networkType && <span>{event.networkType}</span>}
      </div>
    </Flexbox>
  );
});

EventCard.displayName = 'EventCard';

const QueryAttackerEventsRender = memo<
  BuiltinRenderProps<QueryAttackerEventsArgs, QueryAttackerEventsState>
>(({ pluginState }) => {
  const { records, total, srcIp } = pluginState || {};

  if (!records || records.length === 0) {
    return <Empty description={`未找到 ${srcIp ?? ''} 的历史攻击事件`} />;
  }

  return (
    <Flexbox gap={8}>
      <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
        {srcIp} 共 {total} 条攻击记录
      </div>
      {records.map((event, index) => (
        <EventCard event={event} key={event.id ?? String(index)} />
      ))}
    </Flexbox>
  );
});

export default QueryAttackerEventsRender;
