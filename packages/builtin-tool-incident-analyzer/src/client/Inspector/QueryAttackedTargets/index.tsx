'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryAttackedTargetsArgs, QueryAttackedTargetsState } from '../../..';

export const QueryAttackedTargetsInspector = memo<
  BuiltinInspectorProps<QueryAttackedTargetsArgs, QueryAttackedTargetsState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const srcIp = args?.srcIp || partialArgs?.srcIp || '';
  const total = pluginState?.total;

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询攻击目标</span>
        {srcIp && (
          <>
            <span>: </span>
            <span className={highlightTextStyles.danger}>{srcIp}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询攻击目标: </span>
      {srcIp && <span className={highlightTextStyles.danger}>{srcIp}</span>}
      {!isLoading && total != null && <span style={{ marginInlineStart: 4 }}>({total}个目标)</span>}
    </div>
  );
});

QueryAttackedTargetsInspector.displayName = 'QueryAttackedTargetsInspector';
