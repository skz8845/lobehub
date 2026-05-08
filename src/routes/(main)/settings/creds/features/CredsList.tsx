'use client';

import { Empty } from 'antd';
import { createStaticStyles } from 'antd-style';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

const styles = createStaticStyles(({ css }) => ({
  empty: css`
    padding-block: 48px;
    padding-inline: 0;
  `,
}));

const CredsList: FC = () => {
  const { t } = useTranslation('setting');

  return <Empty className={styles.empty} description={t('creds.empty')} />;
};

export default CredsList;
