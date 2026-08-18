import { cx } from "@/lib/cx";

/**
 * Placeholder sized by the caller so it occupies the footprint of the content
 * it stands in for. A shimmer sweep marks it pending; a spinner would hide the
 * shape of what is loading.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("relative overflow-hidden rounded-md bg-track", className)}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[var(--veil-strong)] to-transparent" />
    </div>
  );
}
