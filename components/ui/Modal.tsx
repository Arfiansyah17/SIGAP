"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@phosphor-icons/react";
import { cx } from "@/lib/cx";

/**
 * Accessible modal dialog.
 *
 * Portalled to `document.body` so a parent's transform or overflow cannot clip
 * it. Only rendered while open, so there is nothing in the server output and no
 * hydration branch to worry about.
 *
 * Handles the four things a dialog has to get right: Escape closes it, the
 * backdrop closes it, the page behind it cannot scroll, and focus moves in on
 * open and returns to the trigger on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Returning focus is what keeps keyboard users from being dumped at the
      // top of the document when the dialog closes.
      restoreFocusTo.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface",
          "rounded-t-2xl border border-line-strong shadow-[0_24px_64px_-24px_rgb(0_0_0/0.45)]",
          "sm:max-w-3xl sm:rounded-2xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-line px-6 py-5 sm:px-8">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-fg"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-fg-subtle"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-lg text-fg-subtle transition-colors duration-200 hover:bg-surface-hi hover:text-fg"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
