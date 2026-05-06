'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryAttackerEventsArgs, QueryAttackerEventsState } from '../../..';

export const QueryAttackerEventsInspector = memo<
  BuiltinInspectorProps<QueryAttackerEventsArgs, QueryAttackerEventsState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const srcIp = args?.srcIp || partialArgs?.srcIp || '';
  const total = pluginState?.total;

  if (isArgumentsStreaming) {
    if (!srcIp)
      return (
        <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
          <span>查询攻击者历史事件</span>
        </div>
      );
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询攻击者历史事件: </span>
        <span className={highlightTextStyles.danger}>{srcIp}</span>
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询攻击者历史事件: </span>
      {srcIp && <span className={highlightTextStyles.danger}>{srcIp}</span>}
      {!isLoading && total != null && <span style={{ marginInlineStart: 4 }}>({total}条)</span>}
    </div>
  );
});

QueryAttackerEventsInspector.displayName = 'QueryAttackerEventsInspector';
