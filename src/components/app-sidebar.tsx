"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppMark } from "@/components/app-mark";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_NAME } from "@/config/app-shell";
import { ROUTES } from "@/lib/constants/routes";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { title: "Dashboard", url: ROUTES.APP.ROOT, icon: LayoutDashboardIcon },
];

function isRouteActive(pathname: string, url: string) {
  return pathname === url || (url !== ROUTES.APP.ROOT && pathname.startsWith(`${url}/`));
}

function NavLinkRow({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = isRouteActive(pathname, item.url);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link
          href={item.url}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <Icon aria-hidden />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <AppMark className="size-7" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium">{APP_NAME}</div>
            <div className="truncate text-xs text-muted-foreground">Template</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup className="pb-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavLinkRow key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-2" />
      </SidebarContent>
      <NavUser />
      <SidebarRail />
    </Sidebar>
  );
}
