'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { QueryEventDetailArgs, QueryEventDetailState } from '../../..';

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
const STATUS_LABEL: Record<number, string> = { 1: '未消除', 2: '已处置', 3: '不处置' };

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    overflow: hidden;
    width: 100%;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
  `,
  content: css`
    padding-block: 12px;
    padding-inline: 14px;
  `,
  footer: css`
    padding-block: 8px;
    padding-inline: 14px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};

    font-size: 12px;
    color: ${cssVar.colorTextTertiary};

    background: ${cssVar.colorFillQuaternary};
  `,
  label: css`
    min-width: 72px;
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
  `,
  message: css`
    padding: 8px;
    border-radius: 4px;

    font-size: 12px;
    line-height: 1.6;
    color: ${cssVar.colorText};

    background: ${cssVar.colorFillQuaternary};
  `,
  title: css`
    font-size: 14px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

const QueryEventDetailRender = memo<
  BuiltinRenderProps<QueryEventDetailArgs, QueryEventDetailState>
>(({ pluginState }) => {
  const { event, eventId } = pluginState || {};

  if (!event) {
    return <Empty description={`未找到事件 ${eventId ?? ''} 的详情`} />;
  }

  const level = event.level ?? 1;

  return (
    <Flexbox className={styles.card}>
      <div className={styles.content}>
        <Flexbox horizontal align="center" gap={8} style={{ marginBlockEnd: 10 }}>
          <span className={styles.title}>{event.eventName ?? '未知事件'}</span>
          <Tag color={LEVEL_COLOR[level]}>{LEVEL_LABEL[level] ?? `L${level}`}</Tag>
          {event.status != null && <Tag>{STATUS_LABEL[event.status] ?? String(event.status)}</Tag>}
        </Flexbox>
        <Flexbox gap={6}>
          {event.srcIp && (
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>攻击来源</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {event.srcIp}
                {event.srcPort ? `:${event.srcPort}` : ''}
              </span>
            </Flexbox>
          )}
          {event.dstIp && (
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>攻击目标</span>
              <span style={{ fontSize: 13 }}>
                {event.dstIp}
                {event.dstPort ? `:${event.dstPort}` : ''}
              </span>
            </Flexbox>
          )}
          {event.devIp && (
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>监测设备</span>
              <span style={{ fontSize: 13 }}>
                {event.devName ? `${event.devName} (${event.devIp})` : event.devIp}
              </span>
            </Flexbox>
          )}
          {event.networkType && (
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>所属网络</span>
              <span style={{ fontSize: 13 }}>{event.networkType}</span>
            </Flexbox>
          )}
        </Flexbox>
        {event.message && (
          <div className={styles.message} style={{ marginBlockStart: 10 }}>
            {event.message}
          </div>
        )}
      </div>
      <div className={styles.footer}>{event.time}</div>
    </Flexbox>
  );
});

export default QueryEventDetailRender;
