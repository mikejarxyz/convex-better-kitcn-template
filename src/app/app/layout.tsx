import type { ReactNode } from "react";

import { AppAuthGate } from "@/components/app-auth-gate";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGate>
      <AppShell>{children}</AppShell>
    </AppAuthGate>
  );
}
