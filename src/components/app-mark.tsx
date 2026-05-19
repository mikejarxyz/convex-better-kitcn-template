import { BoxesIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <BoxesIcon className="size-4" />
    </div>
  );
}
