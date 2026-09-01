import { AuthMethod } from "./auth-methods";
import { OAuthProviderId } from "./oauth-providers";

export type AuthAction =
  | { type: "changePassword" }
  | { type: "unlinkOAuth"; provider: OAuthProviderId; accountId: string }
  | { type: "primaryAuth" }
  | { type: "renamePasskey"; passkeyId: string }
  | { type: "deletePasskey"; passkeyId: string };

export function getAuthActionsForMethod(method: AuthMethod): AuthAction[] {
  switch (method.kind) {
    case "password":
      return [{ type: "changePassword" }];

    case "oauth":
      return [
        {
          type: "unlinkOAuth",
          provider: method.providerId,
          accountId: method.accountId,
        },
      ];

    case "passkey":
      return [
        { type: "renamePasskey", passkeyId: method.id },
        { type: "deletePasskey", passkeyId: method.id },
      ];
  }
}

export function authMethodKey(method: AuthMethod) {
  switch (method.kind) {
    case "password":
      return "password";
    case "oauth":
      return `oauth:${method.providerId}:${method.accountId}`;
    case "passkey":
      return `passkey:${method.id}`;
  }
}
