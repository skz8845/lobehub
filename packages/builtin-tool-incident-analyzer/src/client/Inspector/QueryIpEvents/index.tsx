'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryIpEventsArgs, QueryIpEventsState } from '../../..';

const ROLE_LABEL: Record<string, string> = {
  dev: '监测设备',
  dst: '攻击目标',
  src: '攻击来源',
};

export const QueryIpEventsInspector = memo<
  BuiltinInspectorProps<QueryIpEventsArgs, QueryIpEventsState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const ip = args?.srcIp || partialArgs?.srcIp || '';
  const role = args?.ipRole || partialArgs?.ipRole || 'src';
  const total = pluginState?.total;

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询关联事件</span>
        {ip && (
          <>
            <span>: </span>
            <span className={highlightTextStyles.danger}>{ip}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询关联事件({ROLE_LABEL[role] ?? role}): </span>
      {ip && <span className={highlightTextStyles.danger}>{ip}</span>}
      {!isLoading && total != null && <span style={{ marginInlineStart: 4 }}>({total}条)</span>}
    </div>
  );
});

QueryIpEventsInspector.displayName = 'QueryIpEventsInspector';
