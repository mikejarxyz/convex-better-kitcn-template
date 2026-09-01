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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LoadingButton } from "@/components/ui/loading-button";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/convex/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ChevronLeftIcon, ShieldIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  twoFactorPasswordSchema,
  twoFactorVerifySchema,
  type TwoFactorPasswordFormData,
  type TwoFactorVerifyFormData,
} from "../../validation";
import { TwoFactorBackupCodesDisplay } from "./backup-codes-display";
import { TwoFactorQrCode } from "./two-factor-qr-code";

type SetupStep = "password" | "scan" | "verify" | "backup";

function extractSecretFromTotpUri(uri: string): string | null {
  try {
    const url = new URL(uri);
    return url.searchParams.get("secret");
  } catch {
    return null;
  }
}

interface TwoFactorEnableProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  available?: boolean;
}

export function TwoFactorEnable({
  trigger,
  onSuccess,
  available = true,
}: TwoFactorEnableProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SetupStep>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [backupCodesConfirmed, setBackupCodesConfirmed] = useState(false);

  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const passwordForm = useForm<TwoFactorPasswordFormData>({
    resolver: zodResolver(twoFactorPasswordSchema),
    defaultValues: { password: "" },
  });

  const verifyForm = useForm<TwoFactorVerifyFormData>({
    resolver: zodResolver(twoFactorVerifySchema),
    defaultValues: { code: "" },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    if (nextOpen && !available) {
      toast.error(
        "Two-factor authentication is unavailable for OAuth-only accounts",
      );
      return;
    }

    if (!nextOpen && step === "backup" && !backupCodesConfirmed) {
      return;
    }

    setOpen(nextOpen);
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
      const result = await authClient.twoFactor.enable({
        method: "totp",
        password: data.password,
      });

      if (result.error) {
        toast.error(
          result.error.message ?? "Failed to enable two-factor authentication",
        );
        passwordForm.reset();
        return;
      }

      if (result.data?.method === "totp") {
        setTotpUri(result.data.totpURI);
        setSecret(extractSecretFromTotpUri(result.data.totpURI));
        setBackupCodes(result.data.backupCodes);
        setStep("scan");
      }
    } catch (error) {
      toast.error("Failed to enable two-factor authentication", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (data: TwoFactorVerifyFormData) => {
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: data.code,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Invalid verification code");
        return;
      }

      setStep("backup");
    } catch (error) {
      toast.error("Failed to verify code", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupConfirmed = () => {
    toast.success("Two-factor authentication enabled!");
    setOpen(false);
    onSuccess?.();
  };

  const handleBack = () => {
    if (step === "scan") {
      setStep("password");
    } else if (step === "verify") {
      setStep("scan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "password" && (
          <>
            <DialogHeader>
              <div className="bg-primary/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                <ShieldIcon className="text-primary size-6" />
              </div>
              <DialogTitle className="text-center">
                Enable two-factor authentication
              </DialogTitle>
              <DialogDescription className="text-center">
                Add an extra layer of security to your account by requiring a
                code from your authenticator app.
              </DialogDescription>
            </DialogHeader>

            <form noValidate onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
              <FieldGroup>
                <FormField
                  id="2fa-password"
                  label="Enter your password to continue"
                  error={passwordForm.formState.errors.password?.message}
                >
                  {({ controlProps }) => (
                    <PasswordInput
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...controlProps}
                      {...passwordForm.register("password")}
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
                  Continue
                </LoadingButton>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "scan" && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR code</DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <TwoFactorQrCode
                totpUri={totpUri}
                secret={secret}
                isLoading={false}
              />
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ChevronLeftIcon className="size-4" />
                Back
              </Button>
              <Button type="button" onClick={() => setStep("verify")}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>Verify your authenticator</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app to verify
                it&apos;s set up correctly.
              </DialogDescription>
            </DialogHeader>

            <form noValidate onSubmit={verifyForm.handleSubmit(handleVerifySubmit)}>
              <FieldGroup>
                <FormField
                  id="2fa-code"
                  label="Verification code"
                  error={verifyForm.formState.errors.code?.message}
                  className="items-center"
                >
                  {({ controlProps }) => (
                    <Controller
                      name="code"
                      control={verifyForm.control}
                      render={({ field }) => (
                        <InputOTP
                          maxLength={6}
                          pattern={REGEXP_ONLY_DIGITS}
                          disabled={isLoading}
                          autoFocus
                          {...field}
                          {...controlProps}
                          onChange={(value) => {
                            field.onChange(value);
                            if (value.length === 6 && !isLoading) {
                              void verifyForm.handleSubmit(
                                handleVerifySubmit,
                              )();
                            }
                          }}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      )}
                    />
                  )}
                </FormField>
              </FieldGroup>

              <DialogFooter className="flex-row justify-between sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <ChevronLeftIcon className="size-4" />
                  Back
                </Button>
                <LoadingButton type="submit" isLoading={isLoading}>
                  Verify
                </LoadingButton>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "backup" && (
          <>
            <DialogHeader>
              <DialogTitle>Save your backup codes</DialogTitle>
              <DialogDescription>
                These codes can be used to access your account if you lose your
                authenticator device.
              </DialogDescription>
            </DialogHeader>

            <TwoFactorBackupCodesDisplay
              codes={backupCodes}
              onConfirmSaved={handleBackupConfirmed}
              onActionTaken={() => setBackupCodesConfirmed(true)}
              showConfirmation
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
