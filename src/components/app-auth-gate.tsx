"use client";

import { useAuth } from "kitcn/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { BrandAuthLoading } from "@/components/brand-auth-loading";
import { ROUTES } from "@/lib/constants/routes";

export function AppAuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.AUTH.SIGN_IN);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <BrandAuthLoading layout="standalone" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
