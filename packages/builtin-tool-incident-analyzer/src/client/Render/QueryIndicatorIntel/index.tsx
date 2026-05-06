'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { QueryIndicatorIntelArgs, QueryIndicatorIntelState } from '../../..';

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
  iocBadge: css`
    display: inline-block;

    padding-block: 1px;
    padding-inline: 6px;
    border-radius: 4px;

    font-size: 11px;
    font-weight: 600;
    color: #fff;

    background: #f5222d;
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

const IntelRecordCard = memo<{ record: any }>(({ record }) => {
  const primary = record.primaryAttribute;
  const hasIoc = record.attributes?.some((a: any) => a.to_ids);
  const ev = record.event;

  return (
    <Flexbox className={styles.card}>
      <div className={styles.content}>
        <Flexbox horizontal align="center" gap={8} style={{ marginBlockEnd: 4 }}>
          <span className={styles.title}>{primary?.value ?? record.id}</span>
          {hasIoc && <span className={styles.iocBadge}>IOC</span>}
        </Flexbox>
        {ev?.info && <div className={styles.meta}>{ev.info}</div>}
        {primary?.tags && primary.tags.length > 0 && (
          <div style={{ marginBlockStart: 6 }}>
            {primary.tags.slice(0, 5).map((tag: any) => (
              <Tag color={tag.colour} key={tag.name} style={{ fontSize: 11 }}>
                {tag.name}
              </Tag>
            ))}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <span style={{ marginInlineEnd: 12 }}>事件 {record.event_id}</span>
        {ev?.threatLevel && <span>威胁等级: {ev.threatLevel}</span>}
      </div>
    </Flexbox>
  );
});

IntelRecordCard.displayName = 'IntelRecordCard';

const QueryIndicatorIntelRender = memo<
  BuiltinRenderProps<QueryIndicatorIntelArgs, QueryIndicatorIntelState>
>(({ pluginState }) => {
  const { records, indicator, total } = pluginState || {};

  if (!records || records.length === 0) {
    return <Empty description={`未找到 "${indicator ?? ''}" 的威胁情报记录`} />;
  }

  return (
    <Flexbox gap={8}>
      <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
        {indicator} 共 {total} 条情报记录
      </div>
      {records.map((record: any, index: number) => (
        <IntelRecordCard key={record.id ?? String(index)} record={record} />
      ))}
    </Flexbox>
  );
});

export default QueryIndicatorIntelRender;
