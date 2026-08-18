import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Form field scaffold: label above the control, helper text below it, error in
 * the same slot. The slot always exists so validation copy never shifts layout.
 */
export function Field({
  id,
  label,
  helper,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[0.8125rem] font-medium text-fg-muted">
        {label}
      </label>

      {children}

      <div className="min-h-5 text-xs leading-5">
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-danger">
            {error}
          </p>
        ) : (
          <p id={`${id}-helper`} className="text-fg-faint">
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-sm " +
  "text-fg placeholder:text-fg-faint transition-colors duration-200 " +
  "hover:border-fg-ghost focus:border-accent focus:outline-none";
