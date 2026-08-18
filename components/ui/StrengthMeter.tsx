"use client";

import { motion } from "motion/react";
import { cx } from "@/lib/cx";

const FILL = [
  "bg-danger",
  "bg-danger",
  "bg-warn",
  "bg-safe",
  "bg-safe",
];

/**
 * Five-segment strength readout driven by a zxcvbn score.
 *
 * Segments animate `scaleX` rather than `width`, keeping the transition on the
 * compositor instead of triggering layout.
 */
export function StrengthMeter({
  score,
  active,
}: {
  /** zxcvbn score, 0 to 4. */
  score: number;
  /** False before any input, so segments stay neutral instead of implying failure. */
  active: boolean;
}) {
  return (
    <div className="flex gap-1.5" role="presentation">
      {[0, 1, 2, 3, 4].map((index) => {
        const lit = active && index <= score;

        return (
          <div
            key={index}
            className="relative h-1 flex-1 overflow-hidden rounded-full bg-track"
          >
            <motion.div
              className={cx(
                "absolute inset-0 origin-left rounded-full",
                FILL[Math.min(score, 4)],
              )}
              initial={false}
              animate={{ scaleX: lit ? 1 : 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 26,
                delay: lit ? index * 0.03 : 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
