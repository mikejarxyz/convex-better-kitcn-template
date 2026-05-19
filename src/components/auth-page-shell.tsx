import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6",
        className,
      )}
    >
      <div className="flex w-full max-w-sm flex-col gap-8">{children}</div>
    </main>
  );
}
