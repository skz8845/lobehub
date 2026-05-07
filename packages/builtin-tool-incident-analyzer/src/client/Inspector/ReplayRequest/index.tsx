'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { cx } from 'antd-style';
import { memo } from 'react';

import { highlightTextStyles, inspectorTextStyles, shinyTextStyles } from '@/styles';

import type { ReplayRequestArgs, ReplayRequestState } from '../../..';

const PROTOCOL_LABEL: Record<string, string> = {
  ftp: 'FTP',
  http: 'HTTP',
  https: 'HTTPS',
  ssh: 'SSH',
};

const AUTH_RESULT_LABEL: Record<string, string> = {
  error: '连接错误',
  failed: '认证失败',
  success: '认证成功',
  timeout: '连接超时',
};

export const ReplayRequestInspector = memo<
  BuiltinInspectorProps<ReplayRequestArgs, ReplayRequestState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const protocol = args?.protocol || partialArgs?.protocol || '';
  const host = args?.host || partialArgs?.host || '';
  const port = args?.port || partialArgs?.port;
  const authResult = pluginState?.authResult;

  const target = host ? `${host}${port ? `:${port}` : ''}` : '';
  const protocolLabel = protocol ? (PROTOCOL_LABEL[protocol] ?? protocol.toUpperCase()) : '';

  if (isArgumentsStreaming) {
    return (
      <div className={cx(inspectorTextStyles.root, shinyTextStyles.shinyText)}>
        <span>回放请求</span>
        {protocolLabel && (
          <>
            <span> [</span>
            <span className={highlightTextStyles.info}>{protocolLabel}</span>
            <span>]</span>
          </>
        )}
      </div>
    );
  }

  if (!isLoading && authResult) {
    const isSuccess = authResult === 'success';
    return (
      <div className={cx(inspectorTextStyles.root)}>
        <span>回放请求: </span>
        {target && <span className={highlightTextStyles.info}>{target}</span>}
        <span> → </span>
        <span
          style={{
            color: isSuccess
              ? 'var(--ant-color-error)'
              : authResult === 'failed'
                ? 'var(--ant-color-success)'
                : 'var(--ant-color-text-tertiary)',
            fontWeight: 600,
          }}
        >
          {AUTH_RESULT_LABEL[authResult] ?? authResult}
        </span>
      </div>
    );
  }

  return (
    <div className={cx(inspectorTextStyles.root, isLoading && shinyTextStyles.shinyText)}>
      <span>回放请求</span>
      {protocolLabel && (
        <>
          <span> [</span>
          <span className={highlightTextStyles.info}>{protocolLabel}</span>
          <span>]</span>
        </>
      )}
      {target && (
        <>
          <span>: </span>
          <span className={highlightTextStyles.warning}>{target}</span>
        </>
      )}
    </div>
  );
});

ReplayRequestInspector.displayName = 'ReplayRequestInspector';
