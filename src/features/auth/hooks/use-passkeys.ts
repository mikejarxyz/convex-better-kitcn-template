"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { authClient } from "@/lib/convex/auth-client";

type PasskeyData = Awaited<
  ReturnType<typeof authClient.passkey.listUserPasskeys>
>["data"];
type Passkey = NonNullable<PasskeyData>[number];

type PasskeyStore = {
  passkeys: Passkey[];
  isPending: boolean;
  error: Error | null;
};

let cache: PasskeyStore = {
  passkeys: [],
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

function getSnapshot(): PasskeyStore {
  return cache;
}

async function fetchPasskeys() {
  cache = { ...cache, isPending: true, error: null };
  emitChange();

  try {
    const result = await authClient.passkey.listUserPasskeys();
    if (result.data) {
      cache = { passkeys: result.data, isPending: false, error: null };
    } else if (result.error) {
      cache = {
        passkeys: [],
        isPending: false,
        error: new Error(result.error.message),
      };
    }
  } catch (error) {
    cache = {
      passkeys: [],
      isPending: false,
      error:
        error instanceof Error ? error : new Error("Failed to fetch passkeys"),
    };
  }

  emitChange();
}

let initialized = false;

export function resetPasskeysCache() {
  cache = {
    passkeys: [],
    isPending: true,
    error: null,
  };
  initialized = false;
}

export function usePasskeys() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    void fetchPasskeys();
  }, []);

  const refetch = useCallback(() => {
    void fetchPasskeys();
  }, []);

  return {
    passkeys: store.passkeys,
    isPending: store.isPending,
    error: store.error,
    refetch,
  };
}

export type { Passkey };
