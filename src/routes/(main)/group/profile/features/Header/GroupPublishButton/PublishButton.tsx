import { Button } from '@lobehub/ui';
import { ShapesUploadIcon } from '@lobehub/ui/icons';
import { Popconfirm } from 'antd';
import isEqual from 'fast-deep-equal';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { message } from '@/components/AntdStaticMethods';
import { useAgentGroupStore } from '@/store/agentGroup';
import { agentGroupSelectors } from '@/store/agentGroup/selectors';

import { useGroupVersionReviewStatus } from '../../GroupProfile/GroupVersionReviewTag';
import GroupForkConfirmModal from './GroupForkConfirmModal';
import { type MarketPublishAction, type OriginalGroupInfo } from './types';
import { useMarketGroupPublish } from './useMarketGroupPublish';

interface GroupPublishButtonProps {
  action: MarketPublishAction;
  onPublishSuccess?: (identifier: string) => void;
}

const PublishButton = memo<GroupPublishButtonProps>(({ action, onPublishSuccess }) => {
  const { t } = useTranslation('setting');

  const { isCheckingOwnership, isPublishing } = useMarketGroupPublish({
    action,
    onSuccess: onPublishSuccess,
  });

  const { isUnderReview } = useGroupVersionReviewStatus();
  const currentGroupMeta = useAgentGroupStore(agentGroupSelectors.currentGroupMeta, isEqual);
  const currentGroup = useAgentGroupStore(agentGroupSelectors.currentGroup);

  const [showForkModal, setShowForkModal] = useState(false);
  const [originalGroupInfo, setOriginalGroupInfo] = useState<OriginalGroupInfo | null>(null);
  const [confirmOpened, setConfirmOpened] = useState(false);

  const buttonTitle = useMemo(() => {
    if (action === 'upload') return t('marketPublish.uploadGroup.tooltip');
    return t('submitGroupModal.tooltips');
  }, [action, t]);

  const handleButtonClick = useCallback(() => {
    if (isUnderReview) {
      message.warning({
        content: t('marketPublish.validation.underReview', {
          defaultValue: 'Your new version is currently under review.',
        }),
      });
      return;
    }
    if (!currentGroupMeta?.title || currentGroupMeta.title.trim() === '') {
      message.error({ content: t('marketPublish.validation.emptyName') });
      return;
    }
    if (!currentGroup?.content || currentGroup.content.trim() === '') {
      message.error({ content: t('marketPublish.validation.emptySystemRole') });
      return;
    }
    setConfirmOpened(true);
  }, [currentGroupMeta?.title, currentGroup?.content, isUnderReview, t]);

  const loading = isCheckingOwnership || isPublishing;

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
      <GroupForkConfirmModal
        loading={isPublishing}
        open={showForkModal}
        originalGroup={originalGroupInfo}
        onCancel={() => {
          setShowForkModal(false);
          setOriginalGroupInfo(null);
        }}
        onConfirm={() => {
          setShowForkModal(false);
          setOriginalGroupInfo(null);
        }}
      />
    </>
  );
});

PublishButton.displayName = 'GroupPublishButton';

export default PublishButton;
