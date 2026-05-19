"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";

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
import { AUTH_FEATURES } from "@/config/auth";
import { authClient } from "@/lib/convex/auth-client";
import { forgotPasswordFormSchema } from "@/lib/validation/forms";

export default function ForgotPasswordPage() {
  if (!AUTH_FEATURES.forgotPassword) {
    notFound();
  }

  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = forgotPasswordFormSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(
        parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email.",
      );
      return;
    }
    setEmailError(null);
    setPending(true);
    try {
      await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: "/reset-password",
      });
    } catch (error) {
      console.error("Forgot password failed", error);
    } finally {
      setPending(false);
      setSubmitted(true);
    }
  }

  return (
    <AuthPageShell>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Forgot password</CardTitle>
          <CardDescription>
            Enter the email for your account. We&apos;ll send a reset link if
            it matches.
          </CardDescription>
        </CardHeader>
        {submitted ? (
          <CardContent className="space-y-3">
            <p className="text-sm">
              If an account exists for that email, a reset link is on its way.
              Check your inbox.
            </p>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        ) : (
          <form noValidate onSubmit={onSubmit}>
            <CardContent className="space-y-4 pb-4">
              <FormField
                id="forgot-password-email"
                label="Email"
                error={emailError ?? undefined}
              >
                {({ controlProps }) => (
                  <Input
                    {...controlProps}
                    name="email"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmailError(null);
                      setEmail(e.target.value);
                    }}
                    disabled={pending}
                  />
                )}
              </FormField>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Sending…" : "Send reset link"}
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/sign-in">Back to sign in</Link>
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </AuthPageShell>
  );
}
