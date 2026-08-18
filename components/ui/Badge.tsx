import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { StatusDot, type Tone } from "./StatusDot";

const TONES: Record<Tone, string> = {
  safe: "text-safe border-safe/25 bg-safe/10",
  warn: "text-warn border-warn/25 bg-warn/10",
  high: "text-danger border-danger/25 bg-danger/10",
  idle: "text-fg-subtle border-line-strong bg-surface-hi",
  busy: "text-accent border-accent/25 bg-accent/10",
};

export function Badge({
  tone = "idle",
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {dot && <StatusDot tone={tone} />}
      {children}
    </span>
  );
}
