export const AUTH_CONFIG = {
  providers: {
    credentials: true,
    // Keep OAuth out of the local lesson path. Enable only after configuring
    // GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the target deployment.
    google: false,
  },
  account: {
    profile: true,
    linkedAccounts: true,
  },
  security: {
    passkeys: true,
    twoFactor: true,
  },
} as const;

export const AUTH_FEATURES = {
  credentials: AUTH_CONFIG.providers.credentials,
  google: AUTH_CONFIG.providers.google,
  forgotPassword: AUTH_CONFIG.providers.credentials,
  resetPassword: AUTH_CONFIG.providers.credentials,
  verifyEmail: AUTH_CONFIG.providers.credentials,
  changePassword: AUTH_CONFIG.providers.credentials,
  linkedAccounts: AUTH_CONFIG.account.linkedAccounts,
  profile: AUTH_CONFIG.account.profile,
  passkeys: AUTH_CONFIG.security.passkeys,
  twoFactor: AUTH_CONFIG.security.twoFactor,
} as const;
