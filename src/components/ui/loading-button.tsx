import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Spinner } from "./spinner";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  isLoading?: boolean;
};

export function LoadingButton({
  isLoading = false,
  disabled = false,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      className={cn("relative", className)}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className={cn(
        "inline-flex items-center justify-center gap-2",
        isLoading ? "invisible" : "visible"
      )}>
        {children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </Button>
  );
}
