import { getAuthConfigProvider } from 'kitcn/auth/config';
import type { AuthConfig } from 'convex/server';
import { getAuthJwks } from './lib/env';

const jwks = getAuthJwks();

export default {
  providers: [
    jwks ? getAuthConfigProvider({ jwks }) : getAuthConfigProvider(),
  ],
} satisfies AuthConfig;
