import { getAuthConfigProvider } from 'kitcn/auth/config';
import type { AuthConfig } from 'convex/server';

export default {
  providers: [
    process.env.JWKS
      ? getAuthConfigProvider({ jwks: process.env.JWKS })
      : getAuthConfigProvider(),
  ],
} satisfies AuthConfig;
