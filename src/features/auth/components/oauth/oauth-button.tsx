"use client";

import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MODE_LABELS, OAuthMode, runOAuthAction } from "../../oauth-actions";
import {
  enabledOAuthProviders,
  getOAuthProvider,
  OAuthProviderId,
} from "../../oauth-providers";
import LastUsedBadge from "../last-used-badge";

type OAuthButtonProps = Omit<
  React.ComponentProps<typeof LoadingButton>,
  "isLoading" | "onClick" | "type"
> & {
  provider: OAuthProviderId;
  mode: OAuthMode;
  label?: string | null;
  returnTo?: string;
  isLastUsed?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  isLoading?: boolean;
  wrapperClassName?: string;
};

export function OAuthButton({
  provider,
  mode,
  returnTo,
  label,
  isLastUsed = false,
  disabled = false,
  onLoadingChange,
  isLoading = false,
  className,
  wrapperClassName,
  ...props
}: OAuthButtonProps) {
  const meta = getOAuthProvider(provider);
  const displayLabel =
    label === undefined ? `${MODE_LABELS[mode]} ${meta.label}` : label;

  const isEnabled = enabledOAuthProviders().some((p) => p.id === provider);
  if (!isEnabled && mode !== "unlink") return null;

  const handleClick = async () => {
    if (disabled || isLoading) return;
    onLoadingChange?.(true);

    try {
      const result = await runOAuthAction({ provider, mode, returnTo });
      if (result?.error) {
        toast.error(result.error.message ?? "OAuth failed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth failed.";
      toast.error(message);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className={cn("relative", wrapperClassName)}>
      {isLastUsed && <LastUsedBadge />}
      <LoadingButton
        type="button"
        isLoading={isLoading}
        disabled={disabled}
        onClick={handleClick}
        className={cn(isLastUsed && "border-primary", className)}
        {...props}
      >
        <meta.Icon className="h-4 w-4" />
        {displayLabel}
      </LoadingButton>
    </div>
  );
}
