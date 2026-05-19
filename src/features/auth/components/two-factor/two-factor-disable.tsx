"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/ui/form-field";
import { LoadingButton } from "@/components/ui/loading-button";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/convex/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  twoFactorPasswordSchema,
  type TwoFactorPasswordFormData,
} from "../../validation";

interface TwoFactorDisableProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  available?: boolean;
}

export function TwoFactorDisable({
  trigger,
  onSuccess,
  available = true,
}: TwoFactorDisableProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TwoFactorPasswordFormData>({
    resolver: zodResolver(twoFactorPasswordSchema),
    defaultValues: { password: "" },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !available) {
      toast.error(
        "Two-factor authentication is unavailable for OAuth-only accounts",
      );
      return;
    }

    if (!isLoading) {
      setOpen(nextOpen);
      if (!nextOpen) {
        form.reset();
      }
    }
  };

  const handleSubmit = async (data: TwoFactorPasswordFormData) => {
    if (!available) {
      toast.error(
        "Two-factor authentication is unavailable for OAuth-only accounts",
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.disable({
        password: data.password,
      });

      if (result.error) {
        toast.error(
          result.error.message ?? "Failed to disable two-factor authentication",
        );
        return;
      }

      toast.success("Two-factor authentication disabled");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to disable two-factor authentication", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Disable two-factor authentication
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the extra layer of security from your account. You
            can re-enable it at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <FormField
              id="disable-2fa-password"
              label="Enter your password to confirm"
              error={form.formState.errors.password?.message}
            >
              {({ controlProps }) => (
                <PasswordInput
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...controlProps}
                  {...form.register("password")}
                />
              )}
            </FormField>
          </FieldGroup>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <LoadingButton
              type="submit"
              variant="destructive"
              isLoading={isLoading}
            >
              Disable 2FA
            </LoadingButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
