"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * React state backed by localStorage.
 *
 * Implemented with `useSyncExternalStore` rather than a read inside `useEffect`.
 * localStorage is an external store, so subscribing to it is the correct model:
 * it avoids the cascading render that a setState-in-effect causes, keeps server
 * and hydration renders consistent, and picks up changes made in other tabs.
 *
 * `fallback` MUST be a stable reference (module-level constant), because it is
 * returned directly when the key is absent and `getSnapshot` has to be stable.
 */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // `storage` only fires for other tabs, so same-tab writes notify manually.
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Parsed snapshots, keyed by storage key and validated against the raw string.
 * `getSnapshot` must return an identical reference until the value truly
 * changes, otherwise React re-renders forever.
 */
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;

  try {
    raw = localStorage.getItem(key);
  } catch {
    // Storage can be blocked entirely; behave as if the key were absent.
    return fallback;
  }

  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T;
  try {
    value = raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Corrupt payload: fall back rather than crash the page.
    value = fallback;
  }

  cache.set(key, { raw, value });
  return value;
}

export function useStoredState<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    // Server and hydration render see the fallback, so markup always matches.
    () => fallback,
  );

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (current: T) => T)(read(key, fallback))
          : next;

      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota or private mode; the in-memory snapshot below still updates.
      }

      cache.set(key, { raw: JSON.stringify(resolved), value: resolved });
      listeners.forEach((listener) => listener());
    },
    [key, fallback],
  );

  return [value, setValue] as const;
}
