'use client';

import { App } from 'antd';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { marketApiService } from '@/services/marketApi';

export type AgentStatusAction = 'publish' | 'unpublish' | 'deprecate';
export type EntityType = 'agent' | 'group';

interface UseUserDetailOptions {
  onMutate?: () => void;
}

export const useUserDetail = ({ onMutate }: UseUserDetailOptions = {}) => {
  const { t } = useTranslation('setting');
  const { message, modal } = App.useApp();

  const handleStatusChange = useCallback(
    async (identifier: string, action: AgentStatusAction, type: EntityType = 'agent') => {
      const messageKey = `${type}-status-${action}`;
      const loadingText = t(`myAgents.actions.${action}Loading` as any);
      const successText = t(`myAgents.actions.${action}Success` as any);
      const errorText = t(`myAgents.actions.${action}Error` as any);

      async function executeStatusChange(
        identifier: string,
        action: AgentStatusAction,
        type: EntityType,
      ) {
        try {
          message.loading({ content: loadingText, key: messageKey });

          if (type === 'group') {
            switch (action) {
              case 'publish': {
                await marketApiService.publishAgentGroup(identifier);
                break;
              }
              case 'unpublish': {
                await marketApiService.unpublishAgentGroup(identifier);
                break;
              }
              case 'deprecate': {
                await marketApiService.deprecateAgentGroup(identifier);
                break;
              }
            }
          } else {
            switch (action) {
              case 'publish': {
                await marketApiService.publishAgent(identifier);
                break;
              }
              case 'unpublish': {
                await marketApiService.unpublishAgent(identifier);
                break;
              }
              case 'deprecate': {
                await marketApiService.deprecateAgent(identifier);
                break;
              }
            }
          }

          message.success({ content: successText, key: messageKey });
          onMutate?.();
        } catch (error) {
          console.error(`[useUserDetail] ${action} ${type} error:`, error);
          message.error({
            content: `${errorText}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            key: messageKey,
          });
        }
      }

      if (action === 'deprecate') {
        modal.confirm({
          cancelText: t('myAgents.actions.cancel'),
          content: t('myAgents.actions.deprecateConfirmContent'),
          okButtonProps: { danger: true },
          okText: t('myAgents.actions.confirmDeprecate'),
          onOk: async () => {
            await executeStatusChange(identifier, action, type);
          },
          title: t('myAgents.actions.deprecateConfirmTitle'),
        });
        return;
      }

      await executeStatusChange(identifier, action, type);
    },
    [message, modal, t, onMutate],
  );

  return {
    handleStatusChange,
  };
};
