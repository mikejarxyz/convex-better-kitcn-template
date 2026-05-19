"use client";

import { toast } from "sonner";
import { authClient } from "@/lib/convex/auth-client";
import {
  resetAuthAccountsCache,
} from "@/features/auth/hooks/use-auth-accounts";
import { resetPasskeysCache } from "@/features/auth/hooks/use-passkeys";

export async function signOut() {
  return await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        resetAuthAccountsCache();
        resetPasskeysCache();
        toast.success("Signed out");
      },
    },
  });
}

export async function updateUserName(name: string) {
  return await authClient.updateUser({ name });
}
