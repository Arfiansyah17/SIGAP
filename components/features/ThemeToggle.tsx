"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { applyTheme, readTheme, type ThemePreference } from "@/lib/theme";
import { cx } from "@/lib/cx";

/**
 * Two-state theme control: terang (default) or gelap.
 *
 * Reads through `useSyncExternalStore` rather than syncing state in an effect,
 * so the server render and the first client render agree (both see `light`)
 * and hydration never mismatches. The pre-paint bootstrap script has already
 * applied the correct colours by then, so there is no visible flash even though
 * this component briefly renders the default state.
 */

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Terang", Icon: SunIcon },
  { value: "dark", label: "Gelap", Icon: MoonIcon },
];

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribe,
    readTheme,
    // Server snapshot: no storage access, so assume the default.
    () => "light" as ThemePreference,
  );

  function choose(next: ThemePreference) {
    applyTheme(next);
    listeners.forEach((listener) => listener());
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema tampilan"
      className="flex items-center gap-0.5 rounded-lg border border-line p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => choose(value)}
            className={cx(
              "grid size-7 place-items-center rounded-md transition-colors duration-200",
              active
                ? "bg-surface-hi text-fg"
                : "text-fg-faint hover:text-fg",
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
