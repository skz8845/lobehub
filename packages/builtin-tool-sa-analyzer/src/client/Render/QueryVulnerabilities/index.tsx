'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox, Tag, Text } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type {
  QueryVulnerabilitiesArgs,
  QueryVulnerabilitiesState,
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
  badge: css`
    padding-block: 2px;
    padding-inline: 6px;
    border-radius: 2222px;

    font-family: monospace;
    font-size: 11px;
    line-height: 16px;
    color: ${cssVar.colorTextSecondary};

    background: ${cssVar.colorFillSecondary};
  `,
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

const VulnCard = memo<{ vuln: VulnerabilityItem }>(({ vuln }) => (
  <div className={styles.card}>
    <Flexbox horizontal align={'center'} gap={8} justify={'space-between'}>
      <span className={styles.title}>{vuln.name || '未知漏洞'}</span>
      <Flexbox horizontal align={'center'} gap={6}>
        {vuln.cve && <span className={styles.badge}>{vuln.cve}</span>}
        {vuln.level != null && (
          <Tag color={LEVEL_COLOR[vuln.level] ?? 'default'}>
            {LEVEL_LABEL[vuln.level] ?? `级别${vuln.level}`}
          </Tag>
        )}
      </Flexbox>
    </Flexbox>
    {vuln.ip && (
      <span className={styles.ip} style={{ marginBlockStart: 4, display: 'block' }}>
        IP: {vuln.ip}
      </span>
    )}
    {vuln.message && (
      <Text as={'p'} className={styles.description}>
        {vuln.message}
      </Text>
    )}
  </div>
));

VulnCard.displayName = 'VulnCard';

const QueryVulnerabilities = memo<
  BuiltinRenderProps<QueryVulnerabilitiesArgs, QueryVulnerabilitiesState>
>(({ pluginState }) => {
  const { records } = pluginState || {};

  if (!records || records.length === 0) {
    return <Empty description={'暂无脆弱性数据'} />;
  }

  return (
    <Flexbox gap={8}>
      {records.map((vuln, index) => (
        <VulnCard key={vuln.id ?? index} vuln={vuln} />
      ))}
    </Flexbox>
  );
});

export default QueryVulnerabilities;
