"use client";

import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AUTH_FEATURES } from "@/config/auth";
import AuthenticationMethodsList from "@/features/auth/components/authentication-methods-list";
import { EditUserAvatar } from "@/features/auth/components/edit-user-avatar";
import { EditUserName } from "@/features/auth/components/edit-user-name";
import { AccountOauthErrorToast } from "@/features/auth/components/oauth/account-oauth-error-toast";
import { TwoFactorSettings } from "@/features/auth/components/two-factor";

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and sign-in methods.
        </p>
      </div>

      {AUTH_FEATURES.profile && (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <EditUserAvatar />
            <EditUserName />
          </CardContent>
        </Card>
      )}

      {AUTH_FEATURES.linkedAccounts && <AuthenticationMethodsList />}

      {AUTH_FEATURES.twoFactor && <TwoFactorSettings />}

      <Suspense fallback={<Skeleton className="h-0 w-0" />}>
        <AccountOauthErrorToast />
      </Suspense>
    </div>
  );
}
