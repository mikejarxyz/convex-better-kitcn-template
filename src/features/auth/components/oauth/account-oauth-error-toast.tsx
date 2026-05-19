"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatLabelToken } from "@/lib/formatters/text";

export function AccountOauthErrorToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const hasShownRef = useRef(false);

  useEffect(() => {
    const rawError =
      searchParams.get("oauth_error") ?? searchParams.get("error");

    if (!rawError || hasShownRef.current) return;

    hasShownRef.current = true;

    const message =
      oauthErrorToMessage(rawError) ??
      "Something went wrong linking your account.";

    const params = new URLSearchParams(searchParams.toString());
    params.delete("oauth_error");
    params.delete("error");
    const next = params.toString();
    const nextUrl = next ? `${pathname}?${next}` : pathname;

    requestAnimationFrame(() => {
      toast.error("Couldn't link your account", { description: message });
      window.history.replaceState(null, "", nextUrl);
    });
  }, [searchParams, pathname]);

  return null;
}

function oauthErrorToMessage(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // ignore decode errors
  }

  const code = decoded.trim();
  if (!code) return null;

  const known: Record<string, string> = {
    "email_doesn't_match":
      "Your provider email doesn't match your account email.",
    account_already_linked_to_different_user:
      "That provider account is already linked to another user.",
    unable_to_link_account: "Unable to link that provider account.",
    provider_not_supported: "That provider is not supported.",
    oauth_provider_not_found: "That provider is not configured.",
  };

  if (known[code]) return known[code];

  const sentence = formatLabelToken(code, { case: "sentence" });
  if (!sentence) return null;
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}
