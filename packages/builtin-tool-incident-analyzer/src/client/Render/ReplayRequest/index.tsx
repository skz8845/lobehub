'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { ReplayRequestArgs, ReplayRequestState } from '../../..';

const AUTH_CONFIG: Record<string, { color: string; label: string; sublabel: string }> = {
  error: {
    color: 'var(--ant-color-text-tertiary)',
    label: '连接错误',
    sublabel: '协议错误或目标拒绝连接，服务可能不存在',
  },
  failed: {
    color: 'var(--ant-color-success)',
    label: '认证失败',
    sublabel: '凭据无效，目标拒绝登录',
  },
  success: {
    color: 'var(--ant-color-error)',
    label: '认证成功',
    sublabel: '凭据有效，攻击者可成功登录目标系统',
  },
  timeout: {
    color: 'var(--ant-color-warning)',
    label: '连接超时',
    sublabel: '目标不可达或端口未开放',
  },
};

const PROTOCOL_LABEL: Record<string, string> = {
  ftp: 'FTP',
  http: 'HTTP',
  https: 'HTTPS',
  ssh: 'SSH',
};

const styles = createStaticStyles(({ css, cssVar }) => ({
  badge: css`
    display: inline-flex;
    align-items: center;

    padding-block: 2px;
    padding-inline: 8px;
    border-radius: 4px;

    font-family: monospace;
    font-size: 11px;

    background: ${cssVar.colorFillTertiary};
  `,
  body: css`
    padding-block: 12px;
    padding-inline: 14px;
  `,
  card: css`
    overflow: hidden;
    width: 100%;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
  `,
  footer: css`
    padding-block: 6px;
    padding-inline: 14px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};

    font-size: 12px;
    color: ${cssVar.colorTextTertiary};

    background: ${cssVar.colorFillQuaternary};
  `,
  label: css`
    min-width: 72px;
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
  `,
  responseBody: css`
    overflow: hidden;

    padding-block: 6px;
    padding-inline: 10px;
    border-radius: 4px;

    font-family: monospace;
    font-size: 11px;
    line-height: 1.5;
    color: ${cssVar.colorTextSecondary};
    word-break: break-all;
    white-space: pre-wrap;

    background: ${cssVar.colorFillQuaternary};
  `,
  resultBadge: css`
    display: inline-flex;
    align-items: center;

    padding-block: 4px;
    padding-inline: 12px;
    border-radius: 6px;

    font-size: 14px;
    font-weight: 700;

    background: ${cssVar.colorFillSecondary};
  `,
  sublabel: css`
    margin-block-start: 2px;
    font-size: 12px;
    color: ${cssVar.colorTextTertiary};
  `,
}));

const ReplayRequestRender = memo<BuiltinRenderProps<ReplayRequestArgs, ReplayRequestState>>(
  ({ pluginState }) => {
    if (!pluginState) return null;

    const { authResult, protocol, host, port, statusCode, latency, responseBody, error } =
      pluginState;

    const cfg = authResult ? AUTH_CONFIG[authResult] : null;
    const target = `${PROTOCOL_LABEL[protocol] ?? protocol.toUpperCase()}://${host}${port ? `:${port}` : ''}`;

    return (
      <Flexbox className={styles.card}>
        <div className={styles.body}>
          <Flexbox gap={12}>
            <Flexbox horizontal align="center" gap={10}>
              <span className={styles.badge}>{target}</span>
              {latency != null && (
                <span style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)' }}>
                  {latency}ms
                </span>
              )}
            </Flexbox>

            {cfg && (
              <Flexbox>
                <span className={styles.resultBadge} style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className={styles.sublabel}>{cfg.sublabel}</span>
              </Flexbox>
            )}

            <Flexbox gap={6}>
              {statusCode != null && (
                <Flexbox horizontal gap={8}>
                  <span className={styles.label}>状态码</span>
                  <span
                    style={{
                      color:
                        statusCode >= 200 && statusCode < 300
                          ? 'var(--ant-color-success)'
                          : statusCode >= 400
                            ? 'var(--ant-color-error)'
                            : 'var(--ant-color-text)',
                      fontFamily: 'monospace',
                      fontSize: 13,
                    }}
                  >
                    {statusCode}
                  </span>
                </Flexbox>
              )}
              {error && (
                <Flexbox horizontal align="flex-start" gap={8}>
                  <span className={styles.label}>错误信息</span>
                  <span style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)' }}>
                    {error}
                  </span>
                </Flexbox>
              )}
            </Flexbox>

            {responseBody && (
              <Flexbox gap={4}>
                <span className={styles.label}>响应内容</span>
                <div className={styles.responseBody}>
                  {responseBody.length > 500 ? `${responseBody.slice(0, 500)}…` : responseBody}
                </div>
              </Flexbox>
            )}
          </Flexbox>
        </div>
        <div className={styles.footer}>回放验证 · 凭据测试结果仅供研判参考</div>
      </Flexbox>
    );
  },
);

ReplayRequestRender.displayName = 'ReplayRequestRender';

export default ReplayRequestRender;
