import { AppMark } from "@/components/app-mark";
import { cn } from "@/lib/utils";

export function BrandAuthLoading({
  layout = "standalone",
  className,
}: {
  layout?: "standalone" | "inline";
  className?: string;
}) {
  const content = (
    <>
      <AppMark />
      <div className="relative h-1.5 w-full max-w-[150px] overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-primary animate-app-shell-indeterminate" />
      </div>
    </>
  );

  if (layout === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading"
        className={cn("flex flex-col items-center gap-6", className)}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn(
        "flex min-h-svh w-full flex-col items-center justify-center p-6",
        className,
      )}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        {content}
      </div>
    </div>
  );
}
