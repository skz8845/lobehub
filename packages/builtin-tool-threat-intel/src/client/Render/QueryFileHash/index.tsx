'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Descriptions, Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { QueryFileHashArgs, QueryFileHashState, ThreatIntelRecord } from '../../..';

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
  hash: css`
    font-family: monospace;
    font-size: 11px;
    color: ${cssVar.colorTextSecondary};
    word-break: break-all;
  `,
  hashSection: css`
    padding-block: 10px;
    padding-inline: 14px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;

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
  sectionTitle: css`
    margin-block-end: 6px;

    font-size: 12px;
    font-weight: 600;
    color: ${cssVar.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
  const ev = record.event;
  const hasIoc = record.attributes.some((a) => a.to_ids);

  const descItems = [
    { children: record.event_id, label: '事件 ID' },
    ev?.info && { children: ev.info, label: '事件名称' },
    ev?.date && { children: ev.date, label: '日期' },
    ev?.threatLevel && { children: ev.threatLevel, label: '威胁等级' },
    ev?.orgc && { children: ev.orgc, label: '来源' },
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
          <div style={{ marginBlockStart: 6 }}>
            {primary.tags.map((tag) => (
              <Tag color={tag.colour} key={tag.name} style={{ fontSize: 11 }}>
                {tag.name}
              </Tag>
            ))}
          </div>
        )}
        {relatedValues.length > 0 && (
          <div style={{ fontSize: 12, marginBlockStart: 4, opacity: 0.7 }}>
            {relatedValues.map((a) => `${a.type}: ${a.value}`).join(' · ')}
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

const QueryFileHash = memo<BuiltinRenderProps<QueryFileHashArgs, QueryFileHashState>>(
  ({ pluginState }) => {
    const { hashes, records, fileName, fileId } = pluginState || {};

    const hashItems = hashes
      ? [
          { children: <span className={styles.hash}>{hashes.md5}</span>, label: 'MD5' },
          { children: <span className={styles.hash}>{hashes.sha1}</span>, label: 'SHA1' },
          { children: <span className={styles.hash}>{hashes.sha256}</span>, label: 'SHA256' },
        ]
      : [];

    return (
      <Flexbox gap={12}>
        {hashes && (
          <div className={styles.hashSection}>
            <div className={styles.sectionTitle}>{fileName ?? fileId ?? '文件哈希'}</div>
            <Descriptions column={1} items={hashItems} size={'small'} />
          </div>
        )}
        {!records || records.length === 0 ? (
          <Empty description={'未找到与该文件相关的威胁情报记录'} />
        ) : (
          <Flexbox gap={8}>
            {records.map((record, index) => (
              <RecordCard key={record.id || String(index)} record={record} />
            ))}
          </Flexbox>
        )}
      </Flexbox>
    );
  },
);

export default QueryFileHash;
