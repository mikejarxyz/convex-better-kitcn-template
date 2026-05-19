import type { AuthAccount } from "../hooks/use-auth-accounts";

export function hasCredentialAccount(accounts: AuthAccount[]) {
  return accounts.some((account) => account.providerId === "credential");
}

export function getFirstClassAccountCount(accounts: AuthAccount[]) {
  return accounts.filter((account) => account.providerId !== "passkey").length;
}

export function canUnlinkOAuthAccount(accounts: AuthAccount[]) {
  return getFirstClassAccountCount(accounts) > 1;
}

export function isAppTwoFactorAvailable(accounts: AuthAccount[]) {
  return hasCredentialAccount(accounts);
}
