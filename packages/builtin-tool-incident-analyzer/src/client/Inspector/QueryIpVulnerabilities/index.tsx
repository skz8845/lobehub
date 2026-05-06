'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryIpVulnerabilitiesArgs, QueryIpVulnerabilitiesState } from '../../..';

export const QueryIpVulnerabilitiesInspector = memo<
  BuiltinInspectorProps<QueryIpVulnerabilitiesArgs, QueryIpVulnerabilitiesState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const ip = args?.ip || partialArgs?.ip || '';
  const total = pluginState?.total;

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询脆弱性</span>
        {ip && (
          <>
            <span>: </span>
            <span className={highlightTextStyles.warning}>{ip}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询脆弱性: </span>
      {ip && <span className={highlightTextStyles.warning}>{ip}</span>}
      {!isLoading && total != null && <span style={{ marginInlineStart: 4 }}>({total}条)</span>}
    </div>
  );
});

QueryIpVulnerabilitiesInspector.displayName = 'QueryIpVulnerabilitiesInspector';
