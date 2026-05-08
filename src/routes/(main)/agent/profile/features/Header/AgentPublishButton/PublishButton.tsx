import { Button } from '@lobehub/ui';
import { ShapesUploadIcon } from '@lobehub/ui/icons';
import { Popconfirm } from 'antd';
import isEqual from 'fast-deep-equal';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { message } from '@/components/AntdStaticMethods';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import { useVersionReviewStatus } from '../AgentVersionReviewTag';
import ForkConfirmModal from './ForkConfirmModal';
import type { MarketPublishAction } from './types';
import { type OriginalAgentInfo, useMarketPublish } from './useMarketPublish';

interface MarketPublishButtonProps {
  action: MarketPublishAction;
  onPublishSuccess?: (identifier: string) => void;
}

const PublishButton = memo<MarketPublishButtonProps>(({ action, onPublishSuccess }) => {
  const { t } = useTranslation('setting');

  const { isCheckingOwnership, isPublishing } = useMarketPublish({
    action,
    onSuccess: onPublishSuccess,
  });

  const { loading: reviewStatusLoading } = useVersionReviewStatus();

  const meta = useAgentStore(agentSelectors.currentAgentMeta, isEqual);
  const systemRole = useAgentStore(agentSelectors.currentAgentSystemRole);

  const [showForkModal, setShowForkModal] = useState(false);
  const [originalAgentInfo, setOriginalAgentInfo] = useState<OriginalAgentInfo | null>(null);
  const [confirmOpened, setConfirmOpened] = useState(false);

  const buttonTitle = useMemo(() => {
    if (action === 'upload') return t('marketPublish.upload.tooltip');
    return t('submitAgentModal.tooltips');
  }, [action, t]);

  const handleButtonClick = useCallback(() => {
    if (!meta?.title || meta.title.trim() === '') {
      message.error({ content: t('marketPublish.validation.emptyName') });
      return;
    }
    if (!systemRole || systemRole.trim() === '') {
      message.error({ content: t('marketPublish.validation.emptySystemRole') });
      return;
    }
    setConfirmOpened(true);
  }, [meta?.title, systemRole, t]);

  const loading = isCheckingOwnership || isPublishing || reviewStatusLoading;

  return (
    <>
      <Popconfirm
        arrow={false}
        okButtonProps={{ disabled: true, type: 'primary' }}
        open={confirmOpened}
        placement="bottomRight"
        title={t('marketPublish.validation.confirmPublish')}
        onCancel={() => setConfirmOpened(false)}
        onConfirm={() => setConfirmOpened(false)}
        onOpenChange={(open) => {
          if (!open) setConfirmOpened(false);
        }}
      >
        <Button
          disabled
          icon={ShapesUploadIcon}
          loading={loading}
          title={buttonTitle}
          onClick={handleButtonClick}
        >
          {t('publishToCommunity')}
        </Button>
      </Popconfirm>
      <ForkConfirmModal
        loading={isPublishing}
        open={showForkModal}
        originalAgent={originalAgentInfo}
        onCancel={() => {
          setShowForkModal(false);
          setOriginalAgentInfo(null);
        }}
        onConfirm={() => {
          setShowForkModal(false);
          setOriginalAgentInfo(null);
        }}
      />
    </>
  );
});

PublishButton.displayName = 'MarketPublishButton';

export default PublishButton;
