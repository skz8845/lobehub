'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryIndicatorArgs, QueryIndicatorState } from '../../..';

export const QueryIndicatorInspector = memo<
  BuiltinInspectorProps<QueryIndicatorArgs, QueryIndicatorState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const indicator = args?.indicator || partialArgs?.indicator || '';
  const total = pluginState?.total;

  if (isArgumentsStreaming) {
    if (!indicator)
      return (
        <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
          <span>查询威胁情报</span>
        </div>
      );

    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询威胁情报: </span>
        <span className={highlightTextStyles.info}>{indicator}</span>
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span style={{ marginInlineStart: 2 }}>
        <span>查询威胁情报: </span>
        {indicator && <span className={highlightTextStyles.info}>{indicator}</span>}
        {!isLoading && total != null && <span style={{ marginInlineStart: 4 }}>({total})</span>}
      </span>
    </div>
  );
});

QueryIndicatorInspector.displayName = 'QueryIndicatorInspector';
