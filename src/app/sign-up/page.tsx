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
import { signUpSchema, type SignUpFormData } from "@/features/auth/validation";
import { authClient } from "@/lib/convex/auth-client";
import { ROUTES } from "@/lib/constants/routes";

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [oauthPending, setOauthPending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(ROUTES.APP.ROOT);
    }
  }, [isLoading, isAuthenticated, router]);

  async function onSubmit(data: SignUpFormData) {
    try {
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Could not create account.");
        return;
      }

      router.replace(ROUTES.APP.ROOT);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create account.");
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
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={ROUTES.AUTH.SIGN_IN}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <OAuthButtons
            callbackURL={ROUTES.APP.ROOT}
            disabled={anyPending}
            onLoadingChange={setOauthPending}
          />
          {AUTH_FEATURES.credentials && (
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
                id="sign-up-name"
                label="Name"
                error={errors.name?.message}
                required
              >
                {({ controlProps }) => (
                  <Input
                    autoComplete="name"
                    disabled={anyPending}
                    {...register("name")}
                    {...controlProps}
                  />
                )}
              </FormField>
              <FormField
                id="sign-up-email"
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
                id="sign-up-password"
                label="Password"
                error={errors.password?.message}
                required
              >
                {({ controlProps }) => (
                  <PasswordInput
                    autoComplete="new-password"
                    disabled={anyPending}
                    {...register("password")}
                    {...controlProps}
                  />
                )}
              </FormField>
              <Button type="submit" variant="secondary" disabled={anyPending}>
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
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
