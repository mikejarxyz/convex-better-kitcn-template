import { authClient } from "@/lib/convex/auth-client";
import { ROUTES } from "@/lib/constants/routes";
import { OAuthProviderId } from "./oauth-providers";

export type OAuthMode = "signin" | "link" | "unlink";

export const OAUTH_REDIRECTS: Record<Exclude<OAuthMode, "unlink">, string> = {
  signin: ROUTES.APP.HOME,
  link: ROUTES.APP.ACCOUNT,
};

export const MODE_LABELS: Record<OAuthMode, string> = {
  signin: "Continue with",
  link: "Link",
  unlink: "Unlink",
};

type OAuthActionParams = {
  provider: OAuthProviderId;
  mode: OAuthMode;
  returnTo?: string;
  accountId?: string;
};

function resolveOAuthReturnTo(mode: OAuthMode, returnTo?: string) {
  if (mode === "unlink") return undefined;
  return returnTo ?? OAUTH_REDIRECTS[mode];
}

export async function runOAuthAction({
  provider,
  mode,
  returnTo,
  accountId,
}: OAuthActionParams) {
  switch (mode) {
    case "signin":
      return await authClient.signIn.social({
        provider,
        callbackURL: resolveOAuthReturnTo(mode, returnTo),
      });
    case "link":
      return await authClient.linkSocial({
        provider,
        callbackURL: resolveOAuthReturnTo(mode, returnTo),
        errorCallbackURL: resolveOAuthReturnTo(mode, returnTo),
      });
    case "unlink":
      if (!accountId) throw new Error("Account ID is required to unlink OAuth");
      return await authClient.unlinkAccount({ accountId });
  }
}
