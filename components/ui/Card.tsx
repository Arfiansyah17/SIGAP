import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Content card.
 *
 * Reads as a card rather than as a faint tinted rectangle: a full-strength
 * border, a 1rem radius, and a soft shadow that lifts it off the canvas. The
 * `panel` utility used elsewhere is intentionally quieter, for readouts that sit
 * beside a form. This is for standalone blocks of explanation.
 *
 * The shadow is tinted with the canvas colour rather than pure black, so it
 * stays subtle in the light theme instead of turning grey and muddy.
 */
export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={cx(
        "rounded-2xl border border-line-strong bg-surface",
        "shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_28px_-16px_rgb(0_0_0/0.22)]",
        "p-6 sm:p-8 lg:p-10",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
