"use client";

import { useAuth } from "kitcn/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthPageShell } from "@/components/auth-page-shell";
import { BrandAuthLoading } from "@/components/brand-auth-loading";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AUTH_FEATURES } from "@/config/auth";
import { signInSchema, type SignInFormData } from "@/features/auth/validation";
import { authClient } from "@/lib/convex/auth-client";
import { ROUTES } from "@/lib/constants/routes";

export default function SignInPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [oauthPending, setOauthPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(ROUTES.APP.ROOT);
    }
  }, [isLoading, isAuthenticated, router]);

  async function onSubmit(data: SignInFormData) {
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Could not sign in.");
        return;
      }

      router.replace(ROUTES.APP.ROOT);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <AuthPageShell>
        <BrandAuthLoading layout="inline" />
      </AuthPageShell>
    );
  }

  const anyPending = isSubmitting || oauthPending;

  return (
    <AuthPageShell>
      {AUTH_FEATURES.credentials && (
        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link
            href={ROUTES.AUTH.SIGN_UP}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      )}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {AUTH_FEATURES.google && (
            <OAuthButtons
              callbackURL={ROUTES.APP.ROOT}
              disabled={anyPending}
              onLoadingChange={setOauthPending}
            />
          )}
          {AUTH_FEATURES.google && AUTH_FEATURES.credentials && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
          )}
          {AUTH_FEATURES.credentials && (
            <form noValidate onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup className="gap-4">
                <FormField
                  id="sign-in-email"
                  label="Email"
                  error={errors.email?.message}
                  required
                >
                  {({ controlProps }) => (
                    <Input
                      type="email"
                      autoComplete="email"
                      disabled={anyPending}
                      {...register("email")}
                      {...controlProps}
                    />
                  )}
                </FormField>
                <FormField
                  id="sign-in-password"
                  label="Password"
                  error={errors.password?.message}
                  required
                  description={<Link href={ROUTES.AUTH.FORGOT_PASSWORD}>Forgot password?</Link>}
                >
                  {({ controlProps }) => (
                    <PasswordInput
                      autoComplete="current-password"
                      disabled={anyPending}
                      {...register("password")}
                      {...controlProps}
                    />
                  )}
                </FormField>
                <div className="flex flex-col gap-2">
                  <Button type="submit" variant="secondary" disabled={anyPending}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
      <Button variant="ghost" className="w-full" asChild>
        <Link href={ROUTES.HOME}>Back to home</Link>
      </Button>
    </AuthPageShell>
  );
}
