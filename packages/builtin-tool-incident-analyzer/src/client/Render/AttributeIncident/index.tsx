'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Tag } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { AttributeIncidentArgs, AttributeIncidentState } from '../../..';

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'red',
  low: 'default',
  medium: 'orange',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '高置信度',
  low: '低置信度',
  medium: '中置信度',
};

const styles = createStaticStyles(({ css, cssVar }) => ({
  aptCard: css`
    padding-block: 10px;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 6px;
  `,
  groupName: css`
    font-size: 14px;
    font-weight: 700;
    color: ${cssVar.colorText};
  `,
  section: css`
    padding: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
  `,
  sectionTitle: css`
    margin-block-end: 8px;
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  summary: css`
    font-size: 13px;
    line-height: 1.6;
    color: ${cssVar.colorText};
  `,
}));

const AttributeIncidentRender = memo<
  BuiltinRenderProps<AttributeIncidentArgs, AttributeIncidentState>
>(({ pluginState }) => {
  const { attribution, srcIp } = pluginState || {};

  if (!attribution) {
    return <Empty description={`未找到 ${srcIp ?? ''} 的归因数据`} />;
  }

  const { aptGroups, confidence, evidence, summary } = attribution;

  return (
    <Flexbox gap={10}>
      <div className={styles.section}>
        <Flexbox horizontal align="center" gap={8} style={{ marginBlockEnd: 8 }}>
          <div className={styles.sectionTitle} style={{ marginBlockEnd: 0 }}>
            归因结论
          </div>
          <Tag color={CONFIDENCE_COLOR[confidence] ?? 'default'}>
            {CONFIDENCE_LABEL[confidence] ?? confidence}
          </Tag>
        </Flexbox>
        <div className={styles.summary}>{summary}</div>
      </div>

      {aptGroups && aptGroups.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>APT 组织匹配</div>
          <Flexbox gap={8}>
            {aptGroups.map((group) => (
              <div className={styles.aptCard} key={group.groupId}>
                <Flexbox horizontal align="center" gap={8} style={{ marginBlockEnd: 4 }}>
                  <span className={styles.groupName}>{group.groupName}</span>
                  <Tag color={CONFIDENCE_COLOR[group.confidence] ?? 'default'}>
                    {CONFIDENCE_LABEL[group.confidence] ?? group.confidence}
                  </Tag>
                </Flexbox>
                {group.matchedTechniques && group.matchedTechniques.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
                    匹配技术: {group.matchedTechniques.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </Flexbox>
        </div>
      )}

      {evidence && evidence.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>关键证据</div>
          <Flexbox gap={4}>
            {evidence.map((e, index) => (
              <div key={String(index)} style={{ fontSize: 12, color: 'var(--ant-color-text)' }}>
                • {e}
              </div>
            ))}
          </Flexbox>
        </div>
      )}
    </Flexbox>
  );
});

export default AttributeIncidentRender;
