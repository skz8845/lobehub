'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { Text } from '@lobehub/ui';
import { cssVar, cx } from 'antd-style';
import { memo } from 'react';

import { inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryVulnerabilitiesArgs, QueryVulnerabilitiesState } from '../../..';

export const QueryVulnerabilitiesInspector = memo<
  BuiltinInspectorProps<QueryVulnerabilitiesArgs, QueryVulnerabilitiesState>
>(({ isArgumentsStreaming, isLoading, pluginState }) => {
  const total = pluginState?.total ?? 0;
  const hasResults = total > 0;

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询脆弱性</span>
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询脆弱性</span>
      {!isLoading &&
        pluginState &&
        (hasResults ? (
          <span style={{ marginInlineStart: 4 }}>({total})</span>
        ) : (
          <Text
            as={'span'}
            color={cssVar.colorTextDescription}
            fontSize={12}
            style={{ marginInlineStart: 4 }}
          >
            (无结果)
          </Text>
        ))}
    </div>
  );
});

QueryVulnerabilitiesInspector.displayName = 'QueryVulnerabilitiesInspector';
