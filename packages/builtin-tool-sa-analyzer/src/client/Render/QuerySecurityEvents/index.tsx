'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox, Tag, Text } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { QuerySecurityEventsArgs, QuerySecurityEventsState, SecurityEvent } from '../../..';

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
    width: 100%;
    padding-block: 8px;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;

    background: ${cssVar.colorBgContainer};
  `,
  description: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    margin-block-start: 4px;

    font-size: 12px;
    line-height: 1.5;
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
  `,
  ip: css`
    font-family: monospace;
    font-size: 11px;
    color: ${cssVar.colorTextSecondary};
  `,
  title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

const EventCard = memo<{ event: SecurityEvent }>(({ event }) => (
  <div className={styles.card}>
    <Flexbox horizontal align={'center'} gap={8} justify={'space-between'}>
      <span className={styles.title}>{event.eventName || '未知事件'}</span>
      <Flexbox horizontal align={'center'} gap={6}>
        {event.level != null && (
          <Tag color={LEVEL_COLOR[event.level] ?? 'default'}>
            {LEVEL_LABEL[event.level] ?? `级别${event.level}`}
          </Tag>
        )}
      </Flexbox>
    </Flexbox>
    <Flexbox horizontal gap={12} style={{ marginBlockStart: 4 }}>
      {event.srcIp && <span className={styles.ip}>源IP: {event.srcIp}</span>}
      {event.dstIp && <span className={styles.ip}>目标IP: {event.dstIp}</span>}
      {event.devName && <span className={styles.ip}>设备: {event.devName}</span>}
    </Flexbox>
    {event.message && (
      <Text as={'p'} className={styles.description}>
        {event.message}
      </Text>
    )}
  </div>
));

EventCard.displayName = 'EventCard';

const QuerySecurityEvents = memo<
  BuiltinRenderProps<QuerySecurityEventsArgs, QuerySecurityEventsState>
>(({ pluginState }) => {
  const { records } = pluginState || {};

  if (!records || records.length === 0) {
    return <Empty description={'暂无安全事件数据'} />;
  }

  return (
    <Flexbox gap={8}>
      {records.map((event, index) => (
        <EventCard event={event} key={event.id ?? index} />
      ))}
    </Flexbox>
  );
});

export default QuerySecurityEvents;
