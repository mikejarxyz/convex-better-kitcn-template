"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { authClient } from "@/lib/convex/auth-client";
import {
  FileKeyIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldOffIcon,
} from "lucide-react";
import { useAuthAccounts } from "../../hooks/use-auth-accounts";
import { isAppTwoFactorAvailable } from "../../lib/first-class-auth";
import { TwoFactorDisable } from "./two-factor-disable";
import { TwoFactorEnable } from "./two-factor-enable";
import { TwoFactorRegenerateBackupCodes } from "./two-factor-regenerate-backup-codes";

export function TwoFactorSettings() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const { accounts, isPending: accountsPending } = useAuthAccounts();
  const isMounted = useMounted();

  const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false;
  const twoFactorAvailable = isAppTwoFactorAvailable(accounts);

  const handleSuccess = () => {
    void refetch();
  };

  if (!isMounted || isPending || accountsPending) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Two-Factor Authentication</CardTitle>
            <Skeleton className="h-5 w-16" />
          </div>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-2xl p-2">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!twoFactorAvailable) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Two-Factor Authentication</CardTitle>
          <Badge variant={twoFactorEnabled ? "success" : "secondary"} size="sm">
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <Item size="sm" className="hover:bg-muted/30 flex-nowrap">
          <ItemMedia
            variant="icon"
            className={cn(
              "size-10 shrink-0 rounded-lg border bg-muted",
              twoFactorEnabled && "border-success/40 bg-success/10",
            )}
          >
            {twoFactorEnabled ? (
              <ShieldCheckIcon className="text-success size-5" />
            ) : (
              <ShieldIcon className="text-muted-foreground size-5" />
            )}
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>Authenticator App</ItemTitle>
            <ItemDescription>
              {twoFactorEnabled
                ? "Your account is protected with 2FA"
                : "Secure your account with a time-based code"}
            </ItemDescription>
          </ItemContent>
          <ItemActions className="shrink-0">
            {twoFactorEnabled && (
              <TwoFactorDisable
                trigger={
                  <Button variant="outline" size="sm">
                    <ShieldOffIcon />
                    Disable
                  </Button>
                }
                onSuccess={handleSuccess}
                available={twoFactorAvailable}
              />
            )}
            <TwoFactorEnable
              trigger={
                <Button size="sm" className={twoFactorEnabled ? "hidden" : ""}>
                  Enable
                </Button>
              }
              onSuccess={handleSuccess}
              available={twoFactorAvailable}
            />
          </ItemActions>
        </Item>

        {twoFactorEnabled && (
          <Item size="sm" className="hover:bg-muted/30 flex-nowrap">
            <ItemMedia
              variant="icon"
              className="size-10 shrink-0 rounded-lg border bg-muted"
            >
              <FileKeyIcon className="text-muted-foreground size-5" />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>Backup Codes</ItemTitle>
              <ItemDescription>Generate new recovery codes</ItemDescription>
            </ItemContent>
            <ItemActions className="shrink-0">
              <TwoFactorRegenerateBackupCodes
                trigger={
                  <Button variant="outline" size="sm">
                    Regenerate
                  </Button>
                }
                onSuccess={handleSuccess}
                available={twoFactorAvailable}
              />
            </ItemActions>
          </Item>
        )}
      </CardContent>
    </Card>
  );
}
