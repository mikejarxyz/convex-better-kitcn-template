"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { TwoFactorBackupCodesDisplay } from "./backup-codes-display";

interface TwoFactorRegenerateBackupCodesProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  available?: boolean;
}

type DialogStep = "password" | "codes";

export function TwoFactorRegenerateBackupCodes({
  trigger,
  onSuccess,
  available = true,
}: TwoFactorRegenerateBackupCodesProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

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
        setStep("password");
        setBackupCodes([]);
        form.reset();
      }
    }
  };

  const handlePasswordSubmit = async (data: TwoFactorPasswordFormData) => {
    if (!available) {
      toast.error(
        "Two-factor authentication is unavailable for OAuth-only accounts",
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.generateBackupCodes({
        password: data.password,
      });

      if (result.error) {
        toast.error(
          result.error.message ?? "Failed to generate backup codes",
        );
        return;
      }

      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        setStep("codes");
      }
    } catch (error) {
      toast.error("Failed to generate backup codes", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodesConfirmed = () => {
    toast.success("New backup codes saved");
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "password" && (
          <>
            <DialogHeader>
              <DialogTitle>Regenerate backup codes</DialogTitle>
              <DialogDescription>
                This will invalidate your existing backup codes and generate
                new ones. Make sure to save them in a safe place.
              </DialogDescription>
            </DialogHeader>

            <form noValidate onSubmit={form.handleSubmit(handlePasswordSubmit)}>
              <FieldGroup>
                <FormField
                  id="regenerate-2fa-password"
                  label="Enter your password to continue"
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <LoadingButton type="submit" isLoading={isLoading}>
                  Generate new codes
                </LoadingButton>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "codes" && (
          <>
            <DialogHeader>
              <DialogTitle>Your new backup codes</DialogTitle>
              <DialogDescription>
                Your previous backup codes have been invalidated. Save these new
                codes in a safe place.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <TwoFactorBackupCodesDisplay
                key={backupCodes.join(",")}
                codes={backupCodes}
                onConfirmSaved={handleCodesConfirmed}
                showConfirmation
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
