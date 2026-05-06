'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type {
  QueryIpVulnerabilitiesArgs,
  QueryIpVulnerabilitiesState,
  VulnerabilityItem,
} from '../../..';

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
  ids: css`
    font-family: monospace;
    font-size: 11px;
    color: ${cssVar.colorTextSecondary};
  `,
  message: css`
    margin-block-start: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: ${cssVar.colorTextSecondary};
  `,
  title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

const VulnCard = memo<{ vuln: VulnerabilityItem }>(({ vuln }) => {
  const level = vuln.level ?? 1;
  const ids = [vuln.cve, vuln.cnnvd, vuln.cnvd].filter(Boolean).join(' / ');

  return (
    <Flexbox className={styles.card}>
      <div className={styles.content}>
        <Flexbox horizontal align="center" gap={8} style={{ marginBlockEnd: 4 }}>
          <span className={styles.title}>{vuln.name ?? '未知漏洞'}</span>
          <Tag color={LEVEL_COLOR[level]}>{LEVEL_LABEL[level] ?? `L${level}`}</Tag>
        </Flexbox>
        {ids && <div className={styles.ids}>{ids}</div>}
        {vuln.message && <div className={styles.message}>{vuln.message}</div>}
      </div>
      <div className={styles.footer}>
        {vuln.type && <span style={{ marginInlineEnd: 12 }}>{vuln.type}</span>}
        {vuln.time && <span>{vuln.time}</span>}
      </div>
    </Flexbox>
  );
});

VulnCard.displayName = 'VulnCard';

const QueryIpVulnerabilitiesRender = memo<
  BuiltinRenderProps<QueryIpVulnerabilitiesArgs, QueryIpVulnerabilitiesState>
>(({ pluginState }) => {
  const { records, total, ip } = pluginState || {};

  if (!records || records.length === 0) {
    return <Empty description={`未找到 ${ip ?? ''} 的脆弱性记录`} />;
  }

  return (
    <Flexbox gap={8}>
      <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
        {ip} 共 {total} 条脆弱性记录
      </div>
      {records.map((vuln, index) => (
        <VulnCard key={vuln.id ?? String(index)} vuln={vuln} />
      ))}
    </Flexbox>
  );
});

export default QueryIpVulnerabilitiesRender;
