import { passkey } from '@better-auth/passkey';
import { lastLoginMethod, twoFactor } from 'better-auth/plugins';
import { convex } from 'kitcn/auth';
import { AUTH_FEATURES } from '../app-auth.config';
import authConfig from './auth.config';
import { defineAuth } from './generated/auth';
import { getAuthJwks } from './lib/env';

export default defineAuth(() => ({
  emailAndPassword: {
    enabled: AUTH_FEATURES.credentials,
  },
  socialProviders: {
    ...(AUTH_FEATURES.google
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {}),
  },
  baseURL: process.env.SITE_URL!,
  plugins: [
    convex({
      authConfig,
      jwks: getAuthJwks(),
    }),
    lastLoginMethod(),
    ...(AUTH_FEATURES.passkeys
      ? [
          passkey({
            rpID: new URL(process.env.SITE_URL!).hostname,
            rpName: 'Auto TCG',
            origin: process.env.SITE_URL!,
          }),
        ]
      : []),
    ...(AUTH_FEATURES.twoFactor ? [twoFactor()] : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24 * 15,
  },
  telemetry: { enabled: false },
  trustedOrigins: [process.env.SITE_URL!],
}));
