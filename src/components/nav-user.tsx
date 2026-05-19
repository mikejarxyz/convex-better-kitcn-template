"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronsUpDown,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { resetAuthAccountsCache } from "@/features/auth/hooks/use-auth-accounts";
import { resetPasskeysCache } from "@/features/auth/hooks/use-passkeys";
import { authClient } from "@/lib/convex/auth-client";
import { ROUTES } from "@/lib/constants/routes";

function isRouteActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavUser() {
  const router = useRouter();
  const pathname = usePathname();
  const sessionState = authClient.useSession();
  const user = sessionState.data?.user;
  const { resolvedTheme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  const closeIfMobile = React.useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  async function signOut() {
    setIsSigningOut(true);
    if (isMobile) setOpenMobile(false);

    try {
      const { error } = await authClient.signOut();
      if (error) {
        throw new Error(error.message ?? "Could not sign out.");
      }

      clearSessionAtom();
      resetAuthAccountsCache();
      resetPasskeysCache();
      router.replace(ROUTES.AUTH.SIGN_IN);
      router.refresh();
    } catch (error) {
      setIsSigningOut(false);
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  const accountActive = isRouteActive(pathname, ROUTES.APP.ACCOUNT);
  const displayName = user?.name ?? "Signed in";
  const isPending = sessionState.isPending;

  const identityContent = (
    <>
      <Avatar className="size-8 shrink-0 rounded-lg">
        {user?.image ? (
          <AvatarImage src={user.image} alt={`${displayName} avatar`} />
        ) : null}
        <AvatarFallback className="rounded-lg text-xs font-medium">
          {userInitials(user?.name, user?.email)}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        {isPending ? (
          <>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-32" />
          </>
        ) : (
          <>
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email ?? "-"}
            </span>
          </>
        )}
      </div>
    </>
  );

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {identityContent}
                <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    {identityContent}
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link
                    href={ROUTES.APP.ACCOUNT}
                    onClick={closeIfMobile}
                    className={cn(accountActive && "bg-accent font-medium")}
                  >
                    <UserCircleIcon />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
                  {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSigningOut}
                  onClick={() => void signOut()}
                >
                  <LogOutIcon />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

function clearSessionAtom() {
  const sessionAtom = authClient.$store?.atoms?.session;
  if (
    !sessionAtom ||
    typeof sessionAtom.get !== "function" ||
    typeof sessionAtom.set !== "function"
  ) {
    return;
  }

  const current = sessionAtom.get();
  sessionAtom.set({
    data: null,
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: current.refetch,
  });
}

function userInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.slice(0, 2).toUpperCase() ?? "?";
}
