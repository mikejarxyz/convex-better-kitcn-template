"use client";

import { useState } from "react";
import { toast } from "sonner";

import GoogleOAuthIcon from "@/features/auth/components/google-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/convex/auth-client";

export function OAuthButtons({
  callbackURL = "/app",
  disabled = false,
  onLoadingChange,
}: {
  callbackURL?: string;
  disabled?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setPending(true);
    onLoadingChange?.(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
      if (error) throw new Error(error.message ?? "Could not sign in with Google.");
    } catch (error) {
      setPending(false);
      onLoadingChange?.(false);
      toast.error(
        error instanceof Error ? error.message : "Could not sign in with Google.",
      );
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full justify-center gap-2"
      disabled={disabled || pending}
      onClick={() => void signInWithGoogle()}
    >
      <GoogleOAuthIcon className="size-4" />
      <span>{pending ? "Google..." : "Continue with Google"}</span>
    </Button>
  );
}
