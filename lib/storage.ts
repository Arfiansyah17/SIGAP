/**
 * localStorage keys, centralised.
 *
 * Everything this app remembers stays on the device. Keys are versioned so a
 * future change to the answer shape can be detected instead of crashing on
 * stale data.
 */
export const STORAGE_KEYS = {
  scorecard: "sigap.scorecard.v1",
  actionsDone: "sigap.actions-done.v1",
} as const;

/** Read and parse a JSON value, returning `null` on missing or corrupt data. */
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Persist a JSON value, ignoring quota or private-mode failures. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage being unavailable must never break the page.
  }
}
