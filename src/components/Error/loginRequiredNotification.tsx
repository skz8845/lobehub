export const loginRequired = {
  // eslint-disable-next-line no-empty-pattern
  redirect: ({}: { timeout?: number } = {}) => {
    const currentUrl = window.location.href;
    const ssoUrl = new URL(process.env.NEXT_PUBLIC_SSO_LOGIN_URL || '');
    ssoUrl.searchParams.set('callbackUrl', currentUrl);

    window.location.href = ssoUrl.toString();
  },
  showNotification: () => {
    // For compatibility - just redirect
    loginRequired.redirect();
  },
};
