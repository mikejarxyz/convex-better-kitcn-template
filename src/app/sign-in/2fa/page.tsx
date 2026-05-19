"use client";

import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuthPageShell } from "@/components/auth-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LoadingButton } from "@/components/ui/loading-button";
import { AUTH_FEATURES } from "@/config/auth";
import { authClient } from "@/lib/convex/auth-client";
import { backupCodeFormSchema } from "@/lib/validation/forms";
import { REGEXP_ONLY_DIGITS } from "input-otp";

type Mode = "totp" | "backup";

export default function TwoFactorChallengePage() {
  if (!AUTH_FEATURES.twoFactor) {
    notFound();
  }

  const router = useRouter();
  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState("");
  const [backupFieldError, setBackupFieldError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function verifyTotp(value: string) {
    if (pending) return;
    setPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code: value });
      if (error) {
        throw new Error(error.message ?? "Invalid code.");
      }
      router.replace("/app");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not verify code.",
      );
      setCode("");
      setPending(false);
    }
  }

  async function verifyBackup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const parsed = backupCodeFormSchema.safeParse({ backup });
    if (!parsed.success) {
      setBackupFieldError(
        parsed.error.flatten().fieldErrors.backup?.[0] ??
          "Enter a backup code.",
      );
      return;
    }
    setBackupFieldError(null);
    setPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: parsed.data.backup,
      });
      if (error) {
        throw new Error(error.message ?? "Invalid backup code.");
      }
      router.replace("/app");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not verify backup code.",
      );
      setPending(false);
    }
  }

  return (
    <AuthPageShell>
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            {mode === "totp"
              ? "Enter the 6-digit code from your authenticator app."
              : "Enter one of your saved backup codes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "totp" ? (
            <div className="flex flex-col items-center gap-3">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (value.length === 6) {
                    void verifyTotp(value);
                  }
                }}
                disabled={pending}
                autoFocus
                autoComplete="one-time-code"
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
              <p className="text-muted-foreground text-xs">
                {pending ? "Verifying…" : "Verifies automatically when filled."}
              </p>
            </div>
          ) : (
            <form noValidate onSubmit={verifyBackup} className="space-y-3">
              <FormField
                id="sign-in-2fa-backup-code"
                label="Backup code"
                error={backupFieldError ?? undefined}
              >
                {({ controlProps }) => (
                  <Input
                    {...controlProps}
                    name="backupCode"
                    value={backup}
                    onChange={(e) => {
                      setBackupFieldError(null);
                      setBackup(e.target.value);
                    }}
                    autoComplete="one-time-code"
                    autoFocus
                    disabled={pending}
                  />
                )}
              </FormField>
              <LoadingButton
                type="submit"
                className="w-full"
                isLoading={pending}
              >
                Verify backup code
              </LoadingButton>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              setCode("");
              setBackup("");
              setBackupFieldError(null);
              setMode(mode === "totp" ? "backup" : "totp");
            }}
            disabled={pending}
          >
            {mode === "totp"
              ? "Use a backup code instead"
              : "Use authenticator code instead"}
          </Button>
        </CardFooter>
      </Card>
    </AuthPageShell>
  );
}
