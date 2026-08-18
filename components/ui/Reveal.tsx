"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * Staggered reveal primitive.
 *
 * `Reveal` owns the parent variants and `RevealItem` inherits them, so both must
 * stay inside the same client tree. That is the reason this pair lives in one
 * file rather than two.
 */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 22 },
  },
};

export function Reveal({
  children,
  className,
  onView = true,
}: {
  children: ReactNode;
  className?: string;
  /** Animate on scroll into view instead of on mount. */
  onView?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      {...(onView
        ? { whileInView: "show", viewport: { once: true, amount: 0.15 } }
        : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
