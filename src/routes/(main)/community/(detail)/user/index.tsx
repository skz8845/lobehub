'use client';

import { memo, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useDiscoverStore } from '@/store/discover';

import NotFound from '../components/NotFound';
import { UserDetailProvider } from './features/DetailProvider';
import UserHeader from './features/Header';
import UserContent from './features/UserContent';
import Loading from './loading';

interface UserDetailPageProps {
  mobile?: boolean;
}

const UserDetailPage = memo<UserDetailPageProps>(({ mobile }) => {
  const params = useParams<{ slug: string }>();
  const username = decodeURIComponent(params.slug ?? '');

  const useUserProfile = useDiscoverStore((s) => s.useUserProfile);
  const { data, isLoading } = useUserProfile({ username });

  const contextConfig = useMemo(() => {
    if (!data || !data.user) return null;
    const {
      user,
      agents,
      agentGroups,
      forkedAgents,
      forkedAgentGroups,
      favoriteAgents,
      favoriteAgentGroups,
      skills,
      plugins,
    } = data;
    const totalInstalls = agents.reduce((sum, agent) => sum + (agent.installCount || 0), 0);
    return {
      agentCount: agents.length,
      agentGroups: agentGroups || [],
      agents,
      favoriteAgentGroups: favoriteAgentGroups || [],
      favoriteAgents: favoriteAgents || [],
      forkedAgentGroups: forkedAgentGroups || [],
      forkedAgents: forkedAgents || [],
      groupCount: agentGroups?.length || 0,
      isOwner: false,
      mobile,
      plugins: plugins || [],
      skills: skills || [],
      totalInstalls,
      user,
    };
  }, [data, mobile]);

  if (isLoading) return <Loading />;
  if (!contextConfig) return <NotFound />;

  return (
    <UserDetailProvider config={contextConfig}>
      <UserHeader />
      <UserContent />
    </UserDetailProvider>
  );
});

export const MobileUserDetailPage = memo(() => {
  return <UserDetailPage mobile={true} />;
});

export default UserDetailPage;
