'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { AttackIPItem, GetAttackTopIPsArgs, GetAttackTopIPsState } from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  badge: css`
    padding-block: 2px;
    padding-inline: 6px;
    border-radius: 4px;

    font-size: 11px;
    color: ${cssVar.colorTextSecondary};

    background: ${cssVar.colorFillSecondary};
  `,
  count: css`
    min-width: 50px;

    font-size: 13px;
    font-weight: 700;
    color: ${cssVar.colorText};
    text-align: end;
  `,
  ip: css`
    font-family: monospace;
    font-size: 13px;
    color: ${cssVar.colorText};
  `,
  row: css`
    padding-block: 6px;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 6px;

    background: ${cssVar.colorBgContainer};
  `,
}));

const IPRow = memo<{ direction: 'attacked' | 'attacker'; index: number; item: AttackIPItem }>(
  ({ direction, index, item }) => {
    const ip = direction === 'attacker' ? item.srcIp : item.dstIp;
    const ipDir = direction === 'attacker' ? item.srcIpDirection : item.dstIpDirection;

    return (
      <div className={styles.row}>
        <Flexbox horizontal align={'center'} gap={8} justify={'space-between'}>
          <Flexbox horizontal align={'center'} gap={8}>
            <span style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)', minWidth: 20 }}>
              #{index + 1}
            </span>
            <span className={styles.ip}>{ip || '未知'}</span>
            {ipDir && <span className={styles.badge}>{ipDir}</span>}
          </Flexbox>
          <span className={styles.count}>{item.eventCount ?? 0} 次</span>
        </Flexbox>
      </div>
    );
  },
);

IPRow.displayName = 'IPRow';

const GetAttackTopIPs = memo<BuiltinRenderProps<GetAttackTopIPsArgs, GetAttackTopIPsState>>(
  ({ pluginState }) => {
    const { items, direction } = pluginState || {};

    if (!items || items.length === 0) {
      return <Empty description={'暂无攻击IP数据'} />;
    }

    return (
      <Flexbox gap={6}>
        {items.map((item, index) => (
          <IPRow direction={direction ?? 'attacker'} index={index} item={item} key={index} />
        ))}
      </Flexbox>
    );
  },
);

export default GetAttackTopIPs;
