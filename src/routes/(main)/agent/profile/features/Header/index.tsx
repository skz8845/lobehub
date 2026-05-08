import { ActionIcon, DropdownMenu, Flexbox, Icon } from '@lobehub/ui';
import { App } from 'antd';
import { BotMessageSquareIcon, MoreHorizontal, Settings2Icon, Trash } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { message } from '@/components/AntdStaticMethods';
import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import NavHeader from '@/features/NavHeader';
import ToggleRightPanelButton from '@/features/RightPanel/ToggleRightPanelButton';
import { useAgentStore } from '@/store/agent';
import { useHomeStore } from '@/store/home';

import AgentForkTag from './AgentForkTag';
import AgentStatusTag from './AgentStatusTag';
import AgentVersionReviewTag from './AgentVersionReviewTag';
import AutoSaveHint from './AutoSaveHint';

const Header = memo(() => {
  const { t } = useTranslation(['setting', 'chat']);
  const { modal } = App.useApp();
  const navigate = useNavigate();

  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const removeAgent = useHomeStore((s) => s.removeAgent);

  const handleDelete = useCallback(() => {
    if (!activeAgentId) return;
    modal.confirm({
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await removeAgent(activeAgentId);
        message.success(t('confirmRemoveSessionSuccess', { ns: 'chat' }));
        navigate('/');
      },
      title: t('confirmRemoveSessionItemAlert', { ns: 'chat' }),
    });
  }, [activeAgentId, modal, navigate, removeAgent, t]);

  const menuItems = useMemo(
    () => [
      {
        icon: <Icon icon={Settings2Icon} />,
        key: 'advanced-settings',
        label: t('advancedSettings', { ns: 'setting' }),
        onClick: () => useAgentStore.setState({ showAgentSetting: true }),
      },
      { type: 'divider' as const },
      {
        danger: true,
        icon: <Icon icon={Trash} />,
        key: 'delete',
        label: t('delete', { ns: 'common' }),
        onClick: handleDelete,
      },
    ],
    [handleDelete, t],
  );

  return (
    <NavHeader
      left={
        <Flexbox horizontal gap={8}>
          <AutoSaveHint />
          <AgentStatusTag />
          <AgentVersionReviewTag />
          <AgentForkTag />
        </Flexbox>
      }
      right={
        <Flexbox horizontal align={'center'} gap={4}>
          <DropdownMenu items={menuItems}>
            <ActionIcon icon={MoreHorizontal} size={DESKTOP_HEADER_ICON_SIZE} />
          </DropdownMenu>
          <ToggleRightPanelButton icon={BotMessageSquareIcon} showActive={true} />
        </Flexbox>
      }
    />
  );
});

export default Header;
