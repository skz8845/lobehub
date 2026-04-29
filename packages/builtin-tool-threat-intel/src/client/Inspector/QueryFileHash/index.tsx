'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { QueryFileHashArgs, QueryFileHashState } from '../../..';

export const QueryFileHashInspector = memo<
  BuiltinInspectorProps<QueryFileHashArgs, QueryFileHashState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const fileName =
    args?.fileName || partialArgs?.fileName || args?.fileId || partialArgs?.fileId || '';
  const total = pluginState?.total;

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>计算文件哈希</span>
        {fileName && (
          <>
            <span>: </span>
            <span className={highlightTextStyles.gold}>{fileName}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span style={{ marginInlineStart: 2 }}>
        <span>文件威胁情报: </span>
        {fileName && <span className={highlightTextStyles.gold}>{fileName}</span>}
        {!isLoading && total != null && <span style={{ marginInlineStart: 4 }}>({total})</span>}
        {!isLoading && pluginState?.hashes && (
          <span style={{ marginInlineStart: 4, opacity: 0.6 }}>
            MD5:{pluginState.hashes.md5.slice(0, 8)}…
          </span>
        )}
      </span>
    </div>
  );
});

QueryFileHashInspector.displayName = 'QueryFileHashInspector';
