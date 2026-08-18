import { cx } from "@/lib/cx";

export type Tone = "safe" | "warn" | "high" | "idle" | "busy";

const TONE: Record<Tone, string> = {
  safe: "bg-safe",
  warn: "bg-warn",
  high: "bg-danger",
  idle: "bg-fg-ghost",
  busy: "bg-accent",
};

/**
 * Status indicator. The halo breathes only for live states, so a resting page
 * has no motion on it at all.
 */
export function StatusDot({
  tone = "idle",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const live = tone === "busy";

  return (
    <span className={cx("relative inline-flex size-2 shrink-0", className)}>
      {live && (
        <span
          aria-hidden
          className={cx("absolute inset-0 animate-breathe rounded-full", TONE[tone])}
        />
      )}
      <span className={cx("relative size-2 rounded-full", TONE[tone])} />
    </span>
  );
}
