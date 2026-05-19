import { KeyIcon, MailIcon } from "lucide-react";
import { getOAuthProvider, OAuthProviderId } from "./oauth-providers";

export type AuthMethod =
  | { kind: "password"; email: string; connectedAt: string }
  | { kind: "passkey"; id: string; nickname: string; connectedAt: string }
  | {
      kind: "oauth";
      providerId: OAuthProviderId;
      accountId?: string;
      connectedEmail?: string;
      connectedAt?: string;
    };

const KIND_RANK: Record<AuthMethod["kind"], number> = {
  password: 0,
  oauth: 1,
  passkey: 2,
};

export function sortAuthMethods(methods: AuthMethod[]) {
  return [...methods].sort((a, b) => {
    const k = KIND_RANK[a.kind] - KIND_RANK[b.kind];
    if (k !== 0) return k;

    if (a.kind === "oauth" && b.kind === "oauth") {
      return a.providerId.localeCompare(b.providerId);
    }
    if (a.kind === "passkey" && b.kind === "passkey") {
      return b.connectedAt.localeCompare(a.connectedAt);
    }
    return 0;
  });
}

export function getAuthMethodMeta(method: AuthMethod): {
  label: string;
  sublabel?: string;
  Icon: React.ComponentType<{ className?: string }>;
} {
  switch (method.kind) {
    case "password":
      return { label: "Email & Password", sublabel: method.email, Icon: MailIcon };
    case "passkey":
      return { label: "Passkey", sublabel: method.nickname, Icon: KeyIcon };
    case "oauth": {
      const provider = getOAuthProvider(method.providerId);
      return {
        label: provider.label,
        sublabel: method.connectedEmail,
        Icon: provider.Icon,
      };
    }
  }
}
