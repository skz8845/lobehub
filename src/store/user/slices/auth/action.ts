import { type SSOProvider } from '@lobechat/types';

import { SSO_APP_TOKEN_KEY, SSO_USER_INFO_KEY, SSO_USER_TOKEN_KEY } from '@/libs/sso';
import type { SSOMenu } from '@/libs/sso/types';
import { type StoreSetter } from '@/store/types';

import { type UserStore } from '../../store';

// Cookie helper function
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
};

export interface SSOUserSession {
  email?: string;
  fullName?: string;
  id: string;
  menus?: SSOMenu[];
  permissions?: string[];
  phone?: string;
  roles?: string[];
}

interface AuthProvidersData {
  hasPasswordAccount: boolean;
  providers: SSOProvider[];
}

const fetchAuthProvidersData = async (): Promise<AuthProvidersData> => {
  const { accountInfo, listAccounts } = await import('@/libs/better-auth/auth-client');
  const result = await listAccounts();
  const accounts = result.data || [];
  const hasPasswordAccount = accounts.some((account) => account.providerId === 'credential');
  const providers = await Promise.all(
    accounts
      .filter((account) => account.providerId !== 'credential')
      .map(async (account) => {
        // In theory, the id_token could be decrypted from the accounts table, but I found that better-auth on GitHub does not save the id_token
        const info = await accountInfo({
          query: { accountId: account.accountId },
        });
        return {
          email: info.data?.user?.email ?? undefined,
          provider: account.providerId,
          providerAccountId: account.accountId,
        };
      }),
  );
  return { hasPasswordAccount, providers };
};

type Setter = StoreSetter<UserStore>;
export const createAuthSlice = (set: Setter, get: () => UserStore, _api?: unknown) =>
  new UserAuthActionImpl(set, get, _api);

export class UserAuthActionImpl {
  readonly #get: () => UserStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  fetchAuthProviders = async (): Promise<void> => {
    // Skip if already loaded
    if (this.#get().isLoadedAuthProviders) return;

    try {
      const { hasPasswordAccount, providers } = await fetchAuthProvidersData();
      this.#set({ authProviders: providers, hasPasswordAccount, isLoadedAuthProviders: true });
    } catch (error) {
      console.error('Failed to fetch auth providers:', error);
      this.#set({ isLoadedAuthProviders: true });
    }
  };

  login = async (session: SSOUserSession): Promise<void> => {
    this.#set({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: session.id,
        fullName: session.fullName,
        email: session.email,
      },
      permissions: session.permissions,
      roles: session.roles,
      menus: session.menus,
    });
  };

  logout = async (): Promise<void> => {
    try {
      await fetch('/api/sso/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear SSO tokens from localStorage
    localStorage.removeItem(SSO_USER_TOKEN_KEY);
    localStorage.removeItem(SSO_APP_TOKEN_KEY);
    localStorage.removeItem(SSO_USER_INFO_KEY);

    // Clear SSO tokens from cookie
    deleteCookie(SSO_USER_TOKEN_KEY);
    deleteCookie(SSO_APP_TOKEN_KEY);

    // Clear state and redirect
    this.#set({
      isSignedIn: false,
      isLoaded: true,
      user: undefined,
      permissions: undefined,
      roles: undefined,
      menus: undefined,
    });

    // Redirect to external SSO page
    window.location.href = process.env.NEXT_PUBLIC_SSO_LOGIN_URL || '';
  };

  openLogin = async (): Promise<void> => {
    const currentUrl = location.toString();
    const ssoUrl = new URL(process.env.NEXT_PUBLIC_SSO_LOGIN_URL || '');
    ssoUrl.searchParams.set('callbackUrl', currentUrl);
    window.location.href = ssoUrl.toString();
  };

  refreshSession = async (): Promise<void> => {
    try {
      const response = await fetch('/api/sso/user-info');
      if (response.ok) {
        const data = await response.json();
        this.#set({
          isSignedIn: true,
          isLoaded: true,
          user: {
            id: data.user.id,
            fullName: data.user.name,
            email: data.user.email,
          },
          permissions: data.permissions,
          roles: data.roles,
          menus: data.menus,
        });
      } else {
        this.#set({
          isSignedIn: false,
          isLoaded: true,
          user: undefined,
          permissions: undefined,
          roles: undefined,
          menus: undefined,
        });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      this.#set({
        isSignedIn: false,
        isLoaded: true,
      });
    }
  };

  refreshAuthProviders = async (): Promise<void> => {
    try {
      const { hasPasswordAccount, providers } = await fetchAuthProvidersData();
      this.#set({ authProviders: providers, hasPasswordAccount });
    } catch (error) {
      console.error('Failed to refresh auth providers:', error);
    }
  };
}

export type UserAuthAction = Pick<UserAuthActionImpl, keyof UserAuthActionImpl>;
