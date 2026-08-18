"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cx } from "@/lib/cx";

export type FlaggedTerm = { term: string; detail: string };

/**
 * Click-to-reveal list: the explanation only shows once its term is tapped.
 *
 * Five always-open paragraphs read as a wall of text before anyone has asked
 * a question. One at a time, opened on demand, turns the same content into
 * something closer to browsing a FAQ.
 */
export function FlaggedTermsList({ items }: { items: FlaggedTerm[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ol className="divide-y divide-line border-t border-line">
      {items.map((item, index) => {
        const open = openIndex === index;

        return (
          <li key={item.term}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center gap-5 py-5 text-left transition-colors duration-200 hover:text-fg"
            >
              <span className="tnum shrink-0 font-mono text-xs text-fg-faint">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-medium tracking-tight text-fg">
                {item.term}
              </span>
              <CaretDownIcon
                size={14}
                className={cx(
                  "shrink-0 text-fg-faint transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  open && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-5 pb-5">
                    <span
                      aria-hidden
                      className="shrink-0 font-mono text-xs opacity-0"
                    >
                      00
                    </span>
                    <p className="max-w-[64ch] text-sm leading-relaxed text-fg-subtle">
                      {item.detail}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
