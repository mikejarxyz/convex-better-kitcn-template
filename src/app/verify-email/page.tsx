"use client";

import { useAuth } from "kitcn/react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthPageShell } from "@/components/auth-page-shell";
import { BrandAuthLoading } from "@/components/brand-auth-loading";
import { Button } from "@/components/ui/button";
import { AUTH_FEATURES } from "@/config/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/convex/auth-client";

export default function VerifyEmailPage() {
  if (!AUTH_FEATURES.verifyEmail) {
    notFound();
  }

  return (
    <Suspense fallback={<VerifyLoadingState />}>
      <VerifyEmail />
    </Suspense>
  );
}

function VerifyEmail() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/app");
    }
  }, [isLoading, isAuthenticated, router]);

  async function onResend() {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }
    setResending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/app",
      });
      if (error) throw new Error(error.message ?? "Could not resend email.");
      setResentAt(Date.now());
      toast.success("Verification email sent.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resend email.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthPageShell>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            {email ? (
              <>
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click it to finish creating your account.
              </>
            ) : (
              <>
                We sent a verification link to your email. Click it to finish
                creating your account.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Once verified, you&apos;ll be signed in automatically. You can
            close this tab.
          </p>
          {resentAt !== null && (
            <p className="text-xs text-muted-foreground">
              Sent again at {new Date(resentAt).toLocaleTimeString()}.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => void onResend()}
            disabled={resending || !email}
          >
            {resending ? "Resending…" : "Resend verification email"}
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </AuthPageShell>
  );
}

function VerifyLoadingState() {
  return (
    <AuthPageShell>
      <BrandAuthLoading layout="inline" />
    </AuthPageShell>
  );
}
