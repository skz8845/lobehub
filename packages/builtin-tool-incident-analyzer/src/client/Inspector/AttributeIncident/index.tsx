'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { AttributeIncidentArgs, AttributeIncidentState } from '../../..';

export const AttributeIncidentInspector = memo<
  BuiltinInspectorProps<AttributeIncidentArgs, AttributeIncidentState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading }) => {
  const srcIp = args?.srcIp || partialArgs?.srcIp || '';

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>归因分析</span>
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
      <span>归因分析</span>
      {srcIp && (
        <>
          <span>: </span>
          <span className={highlightTextStyles.danger}>{srcIp}</span>
        </>
      )}
    </div>
  );
});

AttributeIncidentInspector.displayName = 'AttributeIncidentInspector';
