'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Descriptions, Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { QueryIndicatorArgs, QueryIndicatorState, ThreatIntelRecord } from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    overflow: hidden;
    width: 100%;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
  `,
  cardBody: css`
    padding-block: 10px;
    padding-inline: 14px;
  `,
  footer: css`
    padding-block: 8px;
    padding-inline: 14px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
    background: ${cssVar.colorFillQuaternary};
  `,
  footerText: css`
    font-size: 12px !important;
    color: ${cssVar.colorTextTertiary} !important;
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
  preview: css`
    display: -webkit-box;
    -webkit-box-orient: vertical;

    font-size: 12px;
    line-height: 1.5;
    color: ${cssVar.colorTextSecondary};
  `,
  tags: css`
    margin-block-start: 6px;
  `,
  title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  titleRow: css`
    margin-block-end: 4px;
  `,
}));

const RecordCard = memo<{ record: ThreatIntelRecord }>(({ record }) => {
  const primary = record.primaryAttribute;
  const hasIoc = record.attributes.some((a) => a.to_ids);

  const descItems = [
    { children: record.event_id, label: '事件 ID' },
    { children: primary.category, label: '分类' },
    { children: primary.type, label: '类型' },
    record.objectName && { children: record.objectName, label: '对象' },
    primary.comment && { children: primary.comment, label: '备注' },
  ].filter(Boolean) as Array<{ children: string; label: string }>;

  const relatedValues = record.attributes.filter((a) => a.value !== primary.value).slice(0, 5);

  return (
    <Flexbox className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <Flexbox horizontal align={'center'} gap={8}>
            <span className={styles.title}>{primary.value}</span>
            {hasIoc && <span className={styles.iocBadge}>IOC</span>}
          </Flexbox>
        </div>
        {primary.tags && primary.tags.length > 0 && (
          <div className={styles.tags}>
            {primary.tags.map((tag) => (
              <Tag color={tag.colour} key={tag.name} style={{ fontSize: 11 }}>
                {tag.name}
              </Tag>
            ))}
          </div>
        )}
        {relatedValues.length > 0 && (
          <div className={styles.preview}>
            {relatedValues.map((a) => (
              <div key={`${a.type}-${a.value}`}>
                <span style={{ opacity: 0.6 }}>{a.type}: </span>
                {a.value}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <Descriptions
          classNames={{ content: styles.footerText, label: styles.footerText }}
          column={2}
          items={descItems}
          size={'small'}
        />
      </div>
    </Flexbox>
  );
});

RecordCard.displayName = 'RecordCard';

const QueryIndicator = memo<BuiltinRenderProps<QueryIndicatorArgs, QueryIndicatorState>>(
  ({ pluginState }) => {
    const { records } = pluginState || {};

    if (!records || records.length === 0) {
      return <Empty description={'未找到相关威胁情报记录'} />;
    }

    return (
      <Flexbox gap={8}>
        {records.map((record, index) => (
          <RecordCard key={record.id || String(index)} record={record} />
        ))}
      </Flexbox>
    );
  },
);

export default QueryIndicator;
