'use client';

import { cx } from 'antd-style';
import { memo } from 'react';

import { inspectorTextStyles, shinyTextStyles } from '@/styles';

interface GenericInspectorProps {
  isArgumentsStreaming?: boolean;
  isLoading?: boolean;
  title: string;
}

export const GenericInspector = memo<GenericInspectorProps>(
  ({ isArgumentsStreaming, isLoading, title }) => (
    <div
      className={cx(
        inspectorTextStyles.root,
        (isArgumentsStreaming || isLoading) && shinyTextStyles.shinyText,
      )}
    >
      <span>{title}</span>
    </div>
  ),
);

GenericInspector.displayName = 'GenericInspector';
