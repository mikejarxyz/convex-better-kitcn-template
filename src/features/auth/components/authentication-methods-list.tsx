"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AUTH_FEATURES } from "@/config/auth";

import { authClient } from "@/lib/convex/auth-client";
import { formatShortDateInUserTz } from "@/lib/formatters/date";

import {
  AuthAction,
  authMethodKey,
  getAuthActionsForMethod,
} from "../auth-actions";
import { toMenuActionView } from "../auth-action-view";
import {
  AuthMethod,
  getAuthMethodMeta,
  sortAuthMethods,
} from "../auth-methods";
import { useAuthAccounts } from "../hooks/use-auth-accounts";
import { usePasskeys } from "../hooks/use-passkeys";
import {
  canUnlinkOAuthAccount,
  getFirstClassAccountCount,
} from "../lib/first-class-auth";
import { enabledOAuthProviders, OAUTH_PROVIDERS } from "../oauth-providers";
import { AuthenticationMethodRow } from "./authentication-method-row";
import { ChangePasswordDialog } from "./change-password-dialog";
import { OAuthButton } from "./oauth/oauth-button";
import {
  AddPasskeyDialog,
  DeletePasskeyDialog,
  RenamePasskeyDialog,
} from "./passkey";

type ActiveModal =
  | { type: "changePassword" }
  | { type: "renamePasskey"; passkeyId: string; currentName: string }
  | { type: "deletePasskey"; passkeyId: string; passkeyName: string }
  | {
      type: "confirm";
      title: string;
      description?: string;
      destructive?: boolean;
      confirmLabel?: string;
      onConfirm: () => Promise<void> | void;
    }
  | null;

async function unlinkOAuthProvider(accountId: string) {
  const result = await authClient.unlinkAccount({ accountId });
  if (result?.error) {
    toast.error(result.error.message ?? "Failed to unlink provider.");
    throw new Error(result.error.message ?? "Failed to unlink provider.");
  }
  toast.success("Provider unlinked.");
}

function actionToModal(action: AuthAction, method: AuthMethod): ActiveModal {
  switch (action.type) {
    case "changePassword":
      return { type: "changePassword" };

    case "renamePasskey": {
      if (method.kind !== "passkey") return null;
      return {
        type: "renamePasskey",
        passkeyId: method.id,
        currentName: method.nickname,
      };
    }

    case "deletePasskey": {
      if (method.kind !== "passkey") return null;
      return {
        type: "deletePasskey",
        passkeyId: method.id,
        passkeyName: method.nickname,
      };
    }

    case "unlinkOAuth":
      return {
        type: "confirm",
        title: "Unlink provider?",
        description: "You can link it again later.",
        destructive: true,
        onConfirm: async () => {
          await unlinkOAuthProvider(action.accountId);
        },
      };

    case "primaryAuth":
      return null;
  }
}

const isKnownOAuthProvider = (
  providerId: string,
): providerId is keyof typeof OAUTH_PROVIDERS => providerId in OAUTH_PROVIDERS;

export default function AuthenticationMethodsList() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const {
    passkeys,
    isPending: passkeysPending,
    refetch: refetchPasskeys,
  } = usePasskeys();
  const {
    accounts,
    isPending: accountsPending,
    refetch: refetchAccounts,
  } = useAuthAccounts();
  const isLoading = (AUTH_FEATURES.passkeys && passkeysPending) || accountsPending;

  const baseMethods: AuthMethod[] = [];
  const credentialAccount = accounts.find(
    (account) => account.providerId === "credential",
  );

  if (credentialAccount && user?.email) {
    baseMethods.push({
      kind: "password",
      email: user.email,
      connectedAt: credentialAccount.createdAt
        ? new Date(credentialAccount.createdAt).toISOString()
        : user.createdAt
          ? new Date(user.createdAt).toISOString()
          : new Date().toISOString(),
    });
  }

  const oauthMethodsRaw: AuthMethod[] = accounts
    .filter((account) => isKnownOAuthProvider(account.providerId))
    .map((account) => ({
      kind: "oauth" as const,
      providerId: account.providerId as keyof typeof OAUTH_PROVIDERS,
      accountId: account.id,
      connectedEmail: user?.email,
      connectedAt: account.createdAt
        ? new Date(account.createdAt).toISOString()
        : undefined,
    }));

  const passkeyMethodsRaw: AuthMethod[] = AUTH_FEATURES.passkeys
    ? passkeys.map((pk) => ({
        kind: "passkey" as const,
        id: pk.id,
        nickname: pk.name || "Passkey",
        connectedAt: new Date(pk.createdAt).toISOString(),
      }))
    : [];

  const methods: AuthMethod[] = sortAuthMethods([
    ...baseMethods,
    ...oauthMethodsRaw,
    ...passkeyMethodsRaw,
  ]);

  const groupedMethods = {
    passwordMethods: methods.filter((m) => m.kind === "password"),
    oauthMethods: methods.filter((m) => m.kind === "oauth"),
    passkeyMethods: methods.filter((m) => m.kind === "passkey"),
  };

  const hasPasswordMethods = groupedMethods.passwordMethods.length > 0;
  const hasOAuthMethods = groupedMethods.oauthMethods.length > 0;
  const hasPasskeyMethods = groupedMethods.passkeyMethods.length > 0;
  const firstClassMethodCount = getFirstClassAccountCount(accounts);
  const hasPasswordPrimary = hasPasswordMethods;
  const hasSingleOAuthPrimary =
    !hasPasswordPrimary && groupedMethods.oauthMethods.length === 1;

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  const handleAction = (action: AuthAction, method: AuthMethod) => {
    const modal = actionToModal(action, method);
    if (modal) setActiveModal(modal);
  };

  const handlePasskeySuccess = () => {
    setActiveModal(null);
    refetchPasskeys();
  };

  const handleOAuthSuccess = () => {
    setActiveModal(null);
    refetchAccounts();
  };

  const renderMethod = (method: AuthMethod) => {
    const meta = getAuthMethodMeta(method);
    const isPrimary =
      (method.kind === "password" && hasPasswordPrimary) ||
      (method.kind === "oauth" && hasSingleOAuthPrimary);
    const primaryBadge = isPrimary ? (
      <Badge variant="secondary" size="sm">Primary</Badge>
    ) : undefined;

    let actionsForMethod = getAuthActionsForMethod(method);

    if (method.kind === "oauth") {
      const canUnlink = canUnlinkOAuthAccount(accounts);
      actionsForMethod = canUnlink
        ? [
            {
              type: "unlinkOAuth",
              provider: method.providerId,
              accountId: method.accountId,
            },
          ]
        : [];
    }

    const actions = actionsForMethod.map((a) => {
      const view = toMenuActionView(a);
      return {
        key: view.key,
        label: view.label,
        destructive: view.destructive,
        disabled: view.disabled,
        action: view.action,
      };
    });

    return (
      <AuthenticationMethodRow<AuthAction>
        key={authMethodKey(method)}
        icon={<meta.Icon />}
        label={meta.label}
        badge={primaryBadge}
        sublabel={
          method.kind === "oauth" && firstClassMethodCount === 1
            ? "Add another sign-in method before unlinking"
            : meta.sublabel
        }
        actions={actions}
        connectedDate={
          method.connectedAt
            ? formatShortDateInUserTz(method.connectedAt)
            : undefined
        }
        onAction={(action) => handleAction(action, method)}
      />
    );
  };

  const hasMethods = methods.length > 0;

  const linkedProviderIds = new Set(
    accounts
      .filter((account) => isKnownOAuthProvider(account.providerId))
      .map((account) => account.providerId),
  );

  const linkableProviders = enabledOAuthProviders().filter(
    (provider) => !linkedProviderIds.has(provider.id),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>Manage your authentication methods</CardDescription>
      </CardHeader>

      <CardContent className="space-y-1">
        {isLoading ? (
          <>
            <div className="flex items-center justify-between gap-4 rounded-2xl p-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Separator className="my-3" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-32" />
            </div>
          </>
        ) : (
          <>
            {groupedMethods.passwordMethods.map(renderMethod)}

            {hasPasswordMethods && hasOAuthMethods && (
              <Separator className="my-1" />
            )}

            {groupedMethods.oauthMethods.map(renderMethod)}

            {(hasPasswordMethods || hasOAuthMethods) && hasPasskeyMethods && (
              <Separator className="my-1" />
            )}

            {groupedMethods.passkeyMethods.map(renderMethod)}

            {hasMethods && <Separator className="my-3" />}

            <div className="flex flex-wrap gap-2">
              {AUTH_FEATURES.passkeys && (
                <AddPasskeyDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      <KeyIcon />
                      Add passkey
                    </Button>
                  }
                  onSuccess={handlePasskeySuccess}
                />
              )}
              {linkableProviders.map((provider) => (
                <OAuthButton
                  key={provider.id}
                  variant="outline"
                  size="sm"
                  provider={provider.id}
                  mode="link"
                  isLoading={linkingProvider === provider.id}
                  onLoadingChange={(loading) =>
                    setLinkingProvider(loading ? provider.id : null)
                  }
                />
              ))}
            </div>

            <ChangePasswordDialog
              open={activeModal?.type === "changePassword"}
              onOpenChange={(open) =>
                setActiveModal(open ? { type: "changePassword" } : null)
              }
            />

            <RenamePasskeyDialog
              open={activeModal?.type === "renamePasskey"}
              onOpenChange={(open) => !open && setActiveModal(null)}
              passkeyId={
                activeModal?.type === "renamePasskey"
                  ? activeModal.passkeyId
                  : ""
              }
              currentName={
                activeModal?.type === "renamePasskey"
                  ? activeModal.currentName
                  : ""
              }
              onSuccess={handlePasskeySuccess}
            />

            <DeletePasskeyDialog
              open={activeModal?.type === "deletePasskey"}
              onOpenChange={(open) => !open && setActiveModal(null)}
              passkeyId={
                activeModal?.type === "deletePasskey"
                  ? activeModal.passkeyId
                  : ""
              }
              passkeyName={
                activeModal?.type === "deletePasskey"
                  ? activeModal.passkeyName
                  : ""
              }
              onSuccess={handlePasskeySuccess}
            />

            <ConfirmDialog
              open={activeModal?.type === "confirm"}
              onOpenChange={(open) => !open && setActiveModal(null)}
              title={activeModal?.type === "confirm" ? activeModal.title : ""}
              description={
                activeModal?.type === "confirm"
                  ? activeModal.description
                  : undefined
              }
              destructive={
                activeModal?.type === "confirm"
                  ? !!activeModal.destructive
                  : false
              }
              confirmLabel={
                activeModal?.type === "confirm"
                  ? (activeModal.confirmLabel ?? "Confirm")
                  : "Confirm"
              }
              onConfirm={
                activeModal?.type === "confirm"
                  ? async () => {
                      await activeModal.onConfirm();
                      handleOAuthSuccess();
                    }
                  : () => {}
              }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
