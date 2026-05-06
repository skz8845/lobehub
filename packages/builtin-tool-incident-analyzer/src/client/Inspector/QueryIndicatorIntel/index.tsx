'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryIndicatorIntelArgs, QueryIndicatorIntelState } from '../../..';

export const QueryIndicatorIntelInspector = memo<
  BuiltinInspectorProps<QueryIndicatorIntelArgs, QueryIndicatorIntelState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const indicator = args?.indicator || partialArgs?.indicator || '';
  const total = pluginState?.total;

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询威胁情报</span>
        {indicator && (
          <>
            <span>: </span>
            <span className={highlightTextStyles.info}>{indicator}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询威胁情报: </span>
      {indicator && <span className={highlightTextStyles.info}>{indicator}</span>}
      {!isLoading && total != null && <span style={{ marginInlineStart: 4 }}>({total}条)</span>}
    </div>
  );
});

QueryIndicatorIntelInspector.displayName = 'QueryIndicatorIntelInspector';
