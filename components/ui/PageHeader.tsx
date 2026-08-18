import type { ReactNode } from "react";

/**
 * Tool-page header. Eyebrow, title, and description stack in reading order
 * at every width, so the description never competes with the title for a
 * reader's first glance.
 */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header>
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-4 max-w-[26ch] text-3xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-4xl">
        {title}
      </h1>

      {children && (
        <div className="mt-5 max-w-[62ch] space-y-3 text-sm leading-relaxed text-fg-subtle">
          {children}
        </div>
      )}
    </header>
  );
}
