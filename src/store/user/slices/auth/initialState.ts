import { type SSOProvider } from '@lobechat/types';

import type { SSOMenu } from '@/libs/sso/types';
import { type LobeUser } from '@/types/user';

export interface UserAuthState {
  authProviders?: SSOProvider[];
  /**
   * Whether user registered with email/password (credential login)
   */
  hasPasswordAccount?: boolean;
  isLoaded?: boolean;
  isLoadedAuthProviders?: boolean;

  isSignedIn?: boolean;

  menus?: SSOMenu[];

  oAuthSSOProviders?: string[];

  permissions?: string[];
  roles?: string[];
  user?: LobeUser;
}

export const initialAuthState: UserAuthState = {};
