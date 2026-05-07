'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { QueryIpEventsArgs, QueryIpEventsState, SecurityEventDetail } from '../../..';

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
const ROLE_LABEL: Record<string, string> = {
  dev: '监测设备',
  dst: '攻击目标',
  src: '攻击来源',
};

const NETWORK_LABEL: Record<string, string> = {
  internet: '互联网',
  mobilePolice: '移动信息网',
  police: '公安网',
  video: '视频传输网',
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
    margin-block-start: 4px;
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
  `,
  title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

const EventCard = memo<{ event: SecurityEventDetail }>(({ event }) => {
  const level = event.level ?? 1;
  return (
    <Flexbox className={styles.card}>
      <div className={styles.content}>
        <Flexbox horizontal align="center" gap={8} style={{ marginBlockEnd: 4 }}>
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
            <span>
              目标: <strong>{event.dstIp}</strong>
              {event.dstPort ? `:${event.dstPort}` : ''}
            </span>
          )}
        </div>
        {event.message && <div className={styles.meta}>{event.message}</div>}
      </div>
      <div className={styles.footer}>
        {event.time && <span style={{ marginInlineEnd: 12 }}>{event.time}</span>}
        {event.networkType && <span>{event.networkType}</span>}
      </div>
    </Flexbox>
  );
});

EventCard.displayName = 'EventCard';

const QueryIpEventsRender = memo<BuiltinRenderProps<QueryIpEventsArgs, QueryIpEventsState>>(
  ({ pluginState }) => {
    const { records, total, ip, ipRole } = pluginState || {};

    if (!records || records.length === 0) {
      return (
        <Empty
          description={`未找到 ${ip ?? ''} (${ROLE_LABEL[ipRole ?? 'src'] ?? ipRole}) 的关联事件`}
        />
      );
    }

    return (
      <Flexbox gap={8}>
        <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
          {ip} ({ROLE_LABEL[ipRole ?? 'src']}) 共 {total} 条事件
        </div>
        {records.map((event, index) => (
          <EventCard event={event} key={event.id ?? String(index)} />
        ))}
      </Flexbox>
    );
  },
);

export default QueryIpEventsRender;
