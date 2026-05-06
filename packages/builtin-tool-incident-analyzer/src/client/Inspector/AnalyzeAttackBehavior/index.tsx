'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { AnalyzeAttackBehaviorArgs, AnalyzeAttackBehaviorState } from '../../..';

export const AnalyzeAttackBehaviorInspector = memo<
  BuiltinInspectorProps<AnalyzeAttackBehaviorArgs, AnalyzeAttackBehaviorState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading }) => {
  const srcIp = args?.srcIp || partialArgs?.srcIp || '';

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>分析攻击行为</span>
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
      <span>分析攻击行为: </span>
      {srcIp && <span className={highlightTextStyles.danger}>{srcIp}</span>}
    </div>
  );
});

AnalyzeAttackBehaviorInspector.displayName = 'AnalyzeAttackBehaviorInspector';
