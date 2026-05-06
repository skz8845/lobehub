'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { AnalyzeAttackBehaviorArgs, AnalyzeAttackBehaviorState, TTPItem } from '../../..';

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
  value: css`
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorError};
  `,
}));

const TTPRow = memo<{ item: TTPItem }>(({ item }) => (
  <Flexbox horizontal align="center" gap={8} style={{ padding: '4px 0' }}>
    <span
      style={{
        fontSize: 12,
        color: 'var(--ant-color-text-secondary)',
        flex: 1,
      }}
    >
      {item.attackType}
    </span>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ant-color-error)' }}>
      {item.count}
    </span>
  </Flexbox>
));

TTPRow.displayName = 'TTPRow';

const AnalyzeAttackBehaviorRender = memo<
  BuiltinRenderProps<AnalyzeAttackBehaviorArgs, AnalyzeAttackBehaviorState>
>(({ pluginState }) => {
  const { profile, srcIp } = pluginState || {};

  if (!profile) {
    return <Empty description={`未找到 ${srcIp ?? ''} 的攻击行为数据`} />;
  }

  return (
    <Flexbox gap={10}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>攻击概况</div>
        <Flexbox gap={6}>
          <Flexbox horizontal gap={8}>
            <span className={styles.label}>事件总数</span>
            <span className={styles.value}>{profile.totalEvents ?? 0}</span>
          </Flexbox>
          <Flexbox horizontal gap={8}>
            <span className={styles.label}>攻击目标数</span>
            <span className={styles.value}>{profile.attackedTargets ?? 0}</span>
          </Flexbox>
          {profile.firstSeen && (
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>首次发现</span>
              <span style={{ fontSize: 13 }}>{profile.firstSeen}</span>
            </Flexbox>
          )}
          {profile.lastSeen && (
            <Flexbox horizontal gap={8}>
              <span className={styles.label}>最近活动</span>
              <span style={{ fontSize: 13 }}>{profile.lastSeen}</span>
            </Flexbox>
          )}
        </Flexbox>
      </div>

      {profile.topAttackTypes && profile.topAttackTypes.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>攻击手法 (TTP)</div>
          {profile.topAttackTypes.map((item, index) => (
            <TTPRow item={item} key={`${item.attackType}-${index}`} />
          ))}
        </div>
      )}

      {profile.primaryTactics && profile.primaryTactics.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>ATT&CK 战术</div>
          <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', lineHeight: 1.8 }}>
            {profile.primaryTactics.join(' → ')}
          </div>
        </div>
      )}
    </Flexbox>
  );
});

export default AnalyzeAttackBehaviorRender;
