'use client';

import { Empty } from '@lobehub/ui';
import { memo } from 'react';

const GenericList = memo<{ pluginState?: any }>(({ pluginState }) => {
  const items = pluginState?.data?.items ?? pluginState?.items ?? [];
  if (!items.length) return <Empty description={'暂无数据'} />;
  return (
    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
      {items.map((item: any, i: number) => (
        <div
          key={i}
          style={{
            marginBottom: 4,
            padding: '4px 8px',
            background: 'var(--ant-color-fill-tertiary)',
            borderRadius: 4,
          }}
        >
          {Object.entries(item)
            .filter(([, v]) => v != null && v !== '')
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')}
        </div>
      ))}
    </div>
  );
});

GenericList.displayName = 'GenericList';

export default GenericList;
