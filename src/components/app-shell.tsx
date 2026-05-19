"use client";

import type { ReactNode } from "react";

import { AppPageContent } from "@/components/app-page-content";
import { AppShellTopBar } from "@/components/app-shell-top-bar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SHOW_APP_SHELL_TOP_BAR } from "@/config/app-shell";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden bg-muted/20">
        {SHOW_APP_SHELL_TOP_BAR ? (
          <AppShellTopBar />
        ) : (
          <SidebarTrigger className="fixed left-4 top-4 md:hidden" />
        )}
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto md:[scrollbar-gutter:stable]">
          <AppPageContent>{children}</AppPageContent>
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
