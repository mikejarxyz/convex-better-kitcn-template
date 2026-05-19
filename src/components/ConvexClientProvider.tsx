"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "kitcn/auth/client";
import type { ReactNode } from "react";
import { authClient } from "@/lib/convex/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider authClient={authClient} client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}
