import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AppPageContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6", className)}>
      {children}
    </div>
  );
}
