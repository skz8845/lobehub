'use client';

import { memo, useEffect } from 'react';

import { SSO_APP_TOKEN_KEY, SSO_USER_TOKEN_KEY } from '@/libs/sso';
import { useUserStore } from '@/store/user';
import { type LobeUser } from '@/types/user';

/**
 * Sync Better-Auth session state to Zustand store
 */
const UserUpdater = memo(() => {
  // Sync user data from Better-Auth session to Zustand store
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userToken = localStorage.getItem(SSO_USER_TOKEN_KEY);
        const appToken = localStorage.getItem(SSO_APP_TOKEN_KEY);

        // If no tokens, set as not signed in without making API call
        if (!userToken || !appToken) {
          useUserStore.setState({
            isLoaded: true,
            isSignedIn: false,
            user: undefined,
          });
          return;
        }

        const response = await fetch('/api/sso/user-info', {
          headers: {
            'Content-Type': 'application/json',
            'RZZX-USERTOKEN': userToken,
            'RZZX-APPTOKEN': appToken,
          },
        } as RequestInit);
        if (response.ok) {
          const data = await response.json();

          const userAvatar = useUserStore.getState().user?.avatar;

          const lobeUser = {
            avatar: userAvatar || '',
            email: data.user.email,
            fullName: data.user.name,
            id: data.user.id,
            phone: data.user.phone,
          } as LobeUser;

          useUserStore.setState({
            isLoaded: true,
            isSignedIn: true,
            permissions: data.permissions,
            roles: data.roles,
            user: lobeUser,
          });
        } else {
          useUserStore.setState({
            isLoaded: true,
            isSignedIn: false,
            user: undefined,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        useUserStore.setState({
          isLoaded: true,
          isSignedIn: false,
        });
      }
    };

    fetchUserInfo();
  }, []);

  return null;
});

export default UserUpdater;
