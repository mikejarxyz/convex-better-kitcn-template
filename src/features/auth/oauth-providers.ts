import GoogleOAuthIcon from "./components/oauth/google-icon";
import GithubIcon from "./components/oauth/github-icon";
import { AUTH_CONFIG } from "@/config/auth";

export const OAUTH_PROVIDERS = {
  google: {
    label: "Google",
    Icon: GoogleOAuthIcon,
    enabled: AUTH_CONFIG.providers.google,
  },
  github: {
    label: "GitHub",
    Icon: GithubIcon,
    enabled: false,
  },
} as const;

export type OAuthProviderId = keyof typeof OAUTH_PROVIDERS;

export type OAuthProviderMeta = (typeof OAUTH_PROVIDERS)[OAuthProviderId] & {
  id: OAuthProviderId;
};

export function getOAuthProvider(id: OAuthProviderId) {
  return { id, ...OAUTH_PROVIDERS[id] };
}

export const enabledOAuthProviders = () =>
  (
    Object.entries(OAUTH_PROVIDERS) as Array<
      [OAuthProviderId, (typeof OAUTH_PROVIDERS)[OAuthProviderId]]
    >
  )
    .filter(([, p]) => p.enabled)
    .map(([id, p]) => ({ id, ...p }));
