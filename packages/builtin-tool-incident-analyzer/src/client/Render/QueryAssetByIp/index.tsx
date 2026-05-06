'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { Empty, Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { AssetDetail, QueryAssetByIpArgs, QueryAssetByIpState } from '../../..';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    overflow: hidden;
    width: 100%;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
  `,
  content: css`
    padding-block: 12px;
    padding-inline: 14px;
  `,
  label: css`
    min-width: 72px;
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
  `,
  ports: css`
    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 4px;

    font-family: monospace;
    font-size: 11px;
    color: ${cssVar.colorText};

    background: ${cssVar.colorFillQuaternary};
  `,
  title: css`
    margin-block-end: 10px;
    font-size: 13px;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
}));

const AssetCard = memo<{ asset: AssetDetail }>(({ asset }) => (
  <Flexbox className={styles.card}>
    <div className={styles.content}>
      <div className={styles.title}>{asset.ip}</div>
      <Flexbox gap={6}>
        {asset.host && (
          <Flexbox horizontal gap={8}>
            <span className={styles.label}>主机名</span>
            <span style={{ fontSize: 13 }}>{asset.host}</span>
          </Flexbox>
        )}
        {asset.os && (
          <Flexbox horizontal gap={8}>
            <span className={styles.label}>操作系统</span>
            <span style={{ fontSize: 13 }}>{asset.os}</span>
          </Flexbox>
        )}
        {asset.assetDeviceModel && (
          <Flexbox horizontal gap={8}>
            <span className={styles.label}>设备型号</span>
            <span style={{ fontSize: 13 }}>{asset.assetDeviceModel}</span>
          </Flexbox>
        )}
        {asset.networkType && (
          <Flexbox horizontal gap={8}>
            <span className={styles.label}>所属网络</span>
            <span style={{ fontSize: 13 }}>{asset.networkType}</span>
          </Flexbox>
        )}
        {asset.status && (
          <Flexbox horizontal gap={8}>
            <span className={styles.label}>在线状态</span>
            <span
              style={{
                color:
                  asset.status === '在线' || asset.status === 'online'
                    ? 'var(--ant-color-success)'
                    : 'var(--ant-color-text-tertiary)',
                fontSize: 13,
              }}
            >
              {asset.status}
            </span>
          </Flexbox>
        )}
        {asset.openPorts && (
          <Flexbox horizontal align="flex-start" gap={8}>
            <span className={styles.label}>开放端口</span>
            <span className={styles.ports}>{asset.openPorts}</span>
          </Flexbox>
        )}
      </Flexbox>
    </div>
  </Flexbox>
));

AssetCard.displayName = 'AssetCard';

const QueryAssetByIpRender = memo<BuiltinRenderProps<QueryAssetByIpArgs, QueryAssetByIpState>>(
  ({ pluginState }) => {
    const { assets, ip } = pluginState || {};

    if (!assets || assets.length === 0) {
      return <Empty description={`未找到 ${ip ?? ''} 的资产记录`} />;
    }

    return (
      <Flexbox gap={8}>
        {assets.map((asset, index) => (
          <AssetCard asset={asset} key={asset.ip ?? String(index)} />
        ))}
      </Flexbox>
    );
  },
);

export default QueryAssetByIpRender;
