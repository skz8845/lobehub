'use client';

import { Center, Flexbox } from '@lobehub/ui';
import { Button, Spin, Typography } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { SSO_APP_TOKEN_KEY, SSO_USER_INFO_KEY, SSO_USER_TOKEN_KEY } from '@/libs/sso';

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const SSOPage = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userToken = searchParams.get('userToken');
  const appToken = searchParams.get('appToken');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (!userToken || !appToken) {
      setError('Missing token parameters');
      return;
    }

    const doLogin = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/sso/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userToken, appToken }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('[SSO Page] Login failed:', data);
          throw new Error(data.error || 'SSO login failed');
        }

        const data = await response.json();

        // Store tokens in localStorage
        localStorage.setItem(SSO_USER_TOKEN_KEY, userToken!);
        localStorage.setItem(SSO_APP_TOKEN_KEY, appToken!);

        // Store tokens in cookie
        setCookie(SSO_USER_TOKEN_KEY, userToken!);
        setCookie(SSO_APP_TOKEN_KEY, appToken!);

        // Store user info in localStorage
        if (data.user) {
          localStorage.setItem(SSO_USER_INFO_KEY, JSON.stringify(data.user));
        }

        // Set session cookie via the API response (handled server-side)
        // Just redirect to callback URL
        window.location.href = callbackUrl ?? '/';
      } catch (err) {
        console.error('[SSO Page] Error:', err);
        setError(err instanceof Error ? err.message : 'SSO login failed');
      } finally {
        setLoading(false);
      }
    };

    doLogin();
  }, [userToken, appToken, callbackUrl]);

  if (loading) {
    return (
      <Center height="100vh">
        <Flexbox horizontal align="center" gap={16}>
          <Spin size="large" />
          <Typography.Text>Logging in...</Typography.Text>
        </Flexbox>
      </Center>
    );
  }

  if (error) {
    return (
      <Center height="100vh">
        <Flexbox gap={16} style={{ textAlign: 'center' }}>
          <Typography.Title level={4}>Login Failed</Typography.Title>
          <Typography.Text type="danger">{error}</Typography.Text>
          <Button onClick={() => navigate('/')}>Back Home</Button>
        </Flexbox>
      </Center>
    );
  }

  return null;
});

SSOPage.displayName = 'SSOPage';

export default SSOPage;
