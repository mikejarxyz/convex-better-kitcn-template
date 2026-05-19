import { AuthAction } from "./auth-actions";
import { getOAuthProvider } from "./oauth-providers";

export type MenuActionView = {
  key: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  action: AuthAction;
};

export function toMenuActionView(action: AuthAction): MenuActionView {
  switch (action.type) {
    case "changePassword":
      return { key: "changePassword", label: "Change Password", action };

    case "unlinkOAuth": {
      const provider = getOAuthProvider(action.provider);
      return {
        key: `unlink-${provider.id}`,
        label: `Unlink ${provider.label}`,
        destructive: true,
        action,
      };
    }

    case "primaryAuth":
      return {
        key: "primary-auth",
        label: "Primary",
        disabled: true,
        action,
      };

    case "renamePasskey":
      return { key: `rename-${action.passkeyId}`, label: "Rename Passkey", action };

    case "deletePasskey":
      return {
        key: `delete-${action.passkeyId}`,
        label: "Delete Passkey",
        destructive: true,
        action,
      };
  }
}
