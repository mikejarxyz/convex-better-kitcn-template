"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { authClient } from "@/lib/convex/auth-client";

type AccountData = Awaited<ReturnType<typeof authClient.listAccounts>>["data"];
type AuthAccount = NonNullable<AccountData>[number];

type AccountStore = {
  accounts: AuthAccount[];
  isPending: boolean;
  error: Error | null;
};

let cache: AccountStore = {
  accounts: [],
  isPending: true,
  error: null,
};

const listeners: Set<() => void> = new Set();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AccountStore {
  return cache;
}

async function fetchAccounts() {
  cache = { ...cache, isPending: true, error: null };
  emitChange();

  try {
    const result = await authClient.listAccounts();
    if (result.data) {
      cache = { accounts: result.data, isPending: false, error: null };
    } else if (result.error) {
      cache = {
        accounts: [],
        isPending: false,
        error: new Error(result.error.message),
      };
    } else {
      cache = { accounts: [], isPending: false, error: null };
    }
  } catch (error) {
    cache = {
      accounts: [],
      isPending: false,
      error:
        error instanceof Error ? error : new Error("Failed to fetch accounts"),
    };
  }

  emitChange();
}

let initialized = false;

export function resetAuthAccountsCache() {
  cache = {
    accounts: [],
    isPending: true,
    error: null,
  };
  initialized = false;
}

export function useAuthAccounts() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    void fetchAccounts();
  }, []);

  const refetch = useCallback(() => {
    void fetchAccounts();
  }, []);

  return {
    accounts: store.accounts,
    isPending: store.isPending,
    error: store.error,
    refetch,
  };
}

export type { AuthAccount };
