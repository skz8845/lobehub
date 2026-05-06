'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryEventDetailArgs, QueryEventDetailState } from '../../..';

export const QueryEventDetailInspector = memo<
  BuiltinInspectorProps<QueryEventDetailArgs, QueryEventDetailState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading }) => {
  const eventId = args?.eventId || partialArgs?.eventId || '';

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询事件详情</span>
        {eventId && (
          <>
            <span>: </span>
            <span className={highlightTextStyles.info}>{eventId}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询事件详情: </span>
      {eventId && <span className={highlightTextStyles.info}>{eventId}</span>}
    </div>
  );
});

QueryEventDetailInspector.displayName = 'QueryEventDetailInspector';
