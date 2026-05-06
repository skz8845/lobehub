'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryAssetByIpArgs, QueryAssetByIpState } from '../../..';

export const QueryAssetByIpInspector = memo<
  BuiltinInspectorProps<QueryAssetByIpArgs, QueryAssetByIpState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading }) => {
  const ip = args?.ip || partialArgs?.ip || '';

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>查询资产信息</span>
        {ip && (
          <>
            <span>: </span>
            <span className={highlightTextStyles.info}>{ip}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>查询资产信息: </span>
      {ip && <span className={highlightTextStyles.info}>{ip}</span>}
    </div>
  );
});

QueryAssetByIpInspector.displayName = 'QueryAssetByIpInspector';
