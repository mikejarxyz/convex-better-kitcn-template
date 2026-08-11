import { createAuthClient } from "better-auth/react";
import {
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { convexClient } from "kitcn/auth/client";

import { AUTH_FEATURES } from "@/config/auth";

const plugins = [
  convexClient(),
  lastLoginMethodClient(),
  ...(AUTH_FEATURES.twoFactor
    ? [
        twoFactorClient({
          onTwoFactorRedirect: () => {
            window.location.replace("/sign-in/2fa");
          },
        }),
      ]
    : []),
  ...(AUTH_FEATURES.passkeys ? [passkeyClient()] : []),
];

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL!,
  plugins,
});
