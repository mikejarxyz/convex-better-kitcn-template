"use client";

import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { AuthPageShell } from "@/components/auth-page-shell";
import { BrandAuthLoading } from "@/components/brand-auth-loading";
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
import { PasswordInput } from "@/components/ui/password-input";
import { AUTH_FEATURES } from "@/config/auth";
import { authClient } from "@/lib/convex/auth-client";
import { resetPasswordFormSchema } from "@/lib/validation/forms";

export default function ResetPasswordPage() {
  if (!AUTH_FEATURES.resetPassword) {
    notFound();
  }

  return (
    <Suspense fallback={<ResetLoadingState />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = resetPasswordFormSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        password: flat.password?.[0],
        confirm: flat.confirm?.[0],
      });
      return;
    }
    setFieldErrors({});
    if (!token) {
      toast.error("Reset token missing or expired. Request a new link.");
      return;
    }
    setPending(true);
    let result: Awaited<ReturnType<typeof authClient.resetPassword>>;
    try {
      result = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token,
      });
    } catch (error) {
      setPending(false);
      console.error("Reset password failed", error);
      toast.error(
        error instanceof Error ? error.message : "Could not reset password.",
      );
      return;
    }
    setPending(false);
    const { error } = result;
    if (error) {
      toast.error(error.message ?? "Could not reset password.");
      return;
    }
    toast.success("Password reset. Sign in with your new password.");
    router.replace("/sign-in");
  }

  if (!token) {
    return (
      <AuthPageShell>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Invalid reset link</CardTitle>
            <CardDescription>
              The link is missing a reset token. Request a new one.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </CardFooter>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <FormField
              id="reset-password-new"
              label="New password"
              error={fieldErrors.password}
            >
              {({ controlProps }) => (
                <PasswordInput
                  {...controlProps}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                    setPassword(e.target.value);
                  }}
                  disabled={pending}
                />
              )}
            </FormField>
            <FormField
              id="reset-password-confirm"
              label="Confirm password"
              error={fieldErrors.confirm}
            >
              {({ controlProps }) => (
                <PasswordInput
                  {...controlProps}
                  name="confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setFieldErrors((current) => ({
                      ...current,
                      confirm: undefined,
                    }));
                    setConfirm(e.target.value);
                  }}
                  disabled={pending}
                />
              )}
            </FormField>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving…" : "Reset password"}
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AuthPageShell>
  );
}

function ResetLoadingState() {
  return (
    <AuthPageShell>
      <BrandAuthLoading />
    </AuthPageShell>
  );
}
