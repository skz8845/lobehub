import { ActionIcon } from '@lobehub/ui';
import { ShapesUploadIcon } from '@lobehub/ui/icons';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { useServerConfigStore } from '@/store/serverConfig';

import { type MarketPublishAction } from './types';
import { useMarketPublish } from './useMarketPublish';

interface MarketPublishButtonProps {
  action: MarketPublishAction;
  marketIdentifier?: string;
  onPublishSuccess?: (identifier: string) => void;
}

const PublishButton = memo<MarketPublishButtonProps>(({ action, onPublishSuccess }) => {
  const { t } = useTranslation('setting');

  const mobile = useServerConfigStore((s) => s.isMobile);

  const { isPublishing } = useMarketPublish({
    action,
    onSuccess: onPublishSuccess,
  });

  const buttonTitle = useMemo(() => {
    if (action === 'upload') return t('marketPublish.upload.tooltip');
    return t('submitAgentModal.tooltips');
  }, [action, t]);

  return (
    <ActionIcon
      disabled
      icon={ShapesUploadIcon}
      loading={isPublishing}
      size={HEADER_ICON_SIZE(mobile)}
      title={buttonTitle}
    />
  );
});

PublishButton.displayName = 'MarketPublishButton';

export default PublishButton;
