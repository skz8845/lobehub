'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { Progress } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { BuildAttackerProfileArgs, BuildAttackerProfileState } from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  label: css`
    min-width: 80px;
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
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
  scoreLabel: css`
    font-size: 24px;
    font-weight: 700;
    color: ${cssVar.colorError};
  `,
}));

const scoreColor = (score: number) => {
  if (score >= 80) return '#f5222d';
  if (score >= 60) return '#fa8c16';
  if (score >= 40) return '#faad14';
  return '#52c41a';
};

const BuildAttackerProfileRender = memo<
  BuiltinRenderProps<BuildAttackerProfileArgs, BuildAttackerProfileState>
>(({ pluginState }) => {
  const { profile, srcIp } = pluginState || {};

  if (!profile) {
    return <Empty description={`未找到 ${srcIp ?? ''} 的攻击者画像数据`} />;
  }

  const { behaviorSummary, intelRecords, threatScore } = profile;

  return (
    <Flexbox gap={10}>
      <div className={styles.section}>
        <Flexbox horizontal align="center" gap={16}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>威胁评分</div>
            <span className={styles.scoreLabel}>{threatScore ?? 0}</span>
            <span style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)' }}>/100</span>
          </div>
          <Progress
            percent={threatScore ?? 0}
            showInfo={false}
            strokeColor={scoreColor(threatScore ?? 0)}
            style={{ flex: 1 }}
          />
        </Flexbox>
      </div>

      {behaviorSummary && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>行为摘要</div>
          <Flexbox gap={6}>
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>总攻击次数</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {behaviorSummary.totalEvents ?? 0}
              </span>
            </Flexbox>
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>攻击目标数</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {behaviorSummary.attackedTargets ?? 0}
              </span>
            </Flexbox>
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>威胁情报命中</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: intelRecords > 0 ? 'var(--ant-color-error)' : undefined,
                }}
              >
                {intelRecords > 0 ? `${intelRecords} 条` : '未命中'}
              </span>
            </Flexbox>
          </Flexbox>
        </div>
      )}

      {profile.attackedTargets && profile.attackedTargets.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Top 攻击目标</div>
          {profile.attackedTargets.slice(0, 5).map((t) => (
            <Flexbox horizontal key={t.dstIp} style={{ padding: '3px 0', fontSize: 12 }}>
              <span style={{ flex: 1 }}>{t.dstIp}</span>
              <span style={{ color: 'var(--ant-color-error)' }}>{t.eventCount} 次</span>
            </Flexbox>
          ))}
        </div>
      )}
    </Flexbox>
  );
});

export default BuildAttackerProfileRender;
