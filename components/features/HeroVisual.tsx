"use client";

import { memo, useEffect, useReducer } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cx } from "@/lib/cx";

/**
 * Looping demonstration of the k-anonymity flow: a password is typed, hashed,
 * and only its prefix leaves the device.
 *
 * Isolated and memoised on purpose. This component re-renders roughly a dozen
 * times a second while typing, so it must never share a tree with page layout.
 * The hashes are precomputed constants; this panel is illustrative and performs
 * no crypto of its own.
 */

type Sample = {
  password: string;
  hash: string;
  exposures: number;
};

const SAMPLES: Sample[] = [
  { password: "bandung1945", hash: "0D4F2A91C7E3B85D6A0F14C29E7B3A5D8F61C204", exposures: 1_284 },
  { password: "kopi.senja.02", hash: "7B1E9C4A2D80F53E6C19A7B4D2F08E5C3A96B172", exposures: 0 },
  { password: "P@ssw0rd!", hash: "3C41E6A0B85D7F29C104E3B76A9D2F58C0B41E37", exposures: 61_953 },
];

const STAGES = ["Diketik", "Di-hash", "Dikirim", "Hasil"] as const;

type Phase = "typing" | "hashing" | "sending" | "verdict";

const PHASE_STAGE: Record<Phase, number> = {
  typing: 0,
  hashing: 1,
  sending: 2,
  verdict: 3,
};

const TYPE_MS = 78;
const DURATIONS: Record<Phase, number> = {
  typing: 380,
  hashing: 560,
  sending: 620,
  verdict: 2100,
};

type State = { index: number; typed: number; phase: Phase };
type Action = { type: "tick" } | { type: "advance" };

function reducer(state: State, action: Action): State {
  const sample = SAMPLES[state.index];

  if (action.type === "tick") {
    return state.typed < sample.password.length
      ? { ...state, typed: state.typed + 1 }
      : state;
  }

  if (state.phase === "typing") return { ...state, phase: "hashing" };
  if (state.phase === "hashing") return { ...state, phase: "sending" };
  if (state.phase === "sending") return { ...state, phase: "verdict" };

  return { index: (state.index + 1) % SAMPLES.length, typed: 0, phase: "typing" };
}

export const HeroVisual = memo(function HeroVisual() {
  const [state, dispatch] = useReducer(reducer, {
    index: 0,
    typed: 0,
    phase: "typing",
  });

  const sample = SAMPLES[state.index];
  const typedOut = state.typed >= sample.password.length;

  useEffect(() => {
    if (state.phase !== "typing" || typedOut) return;
    const timer = setTimeout(() => dispatch({ type: "tick" }), TYPE_MS);
    return () => clearTimeout(timer);
  }, [state.phase, state.typed, typedOut]);

  useEffect(() => {
    if (state.phase === "typing" && !typedOut) return;
    const timer = setTimeout(
      () => dispatch({ type: "advance" }),
      DURATIONS[state.phase],
    );
    return () => clearTimeout(timer);
  }, [state.phase, typedOut]);

  const stage = PHASE_STAGE[state.phase];
  const showHash = stage >= 1;
  const showSend = stage >= 2;
  const exposed = sample.exposures > 0;

  return (
    <div className="relative">
      {/* Ambient accent wash, tinted to the background rather than glowing */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 55% at 70% 25%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%)",
        }}
      />

      <div className="glass overflow-hidden rounded-2xl">
        {/* Header: request line + live indicator */}
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <span className="truncate font-mono text-[0.6875rem] text-fg-faint">
            POST /hash
            <span className="mx-1.5 text-fg-ghost">/</span>
            GET /api/breach
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="size-1.5 animate-breathe rounded-full bg-accent" />
            <span className="font-mono text-[0.6875rem] text-fg-faint">live</span>
          </span>
        </div>

        {/* Stage tracker */}
        <div className="flex gap-1 px-5 pt-4">
          {STAGES.map((label, index) => (
            <div key={label} className="flex-1">
              <div className="h-[3px] overflow-hidden rounded-full bg-track">
                <motion.div
                  className="h-full origin-left rounded-full bg-accent"
                  initial={false}
                  animate={{ scaleX: index <= stage ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p
                className={cx(
                  "mt-2 font-mono text-[0.625rem] transition-colors duration-300",
                  index === stage ? "text-accent" : "text-fg-ghost",
                )}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Typewriter input */}
        <div className="px-5 pt-5">
          <div className="flex h-11 items-center rounded-lg border border-line bg-canvas/60 px-3.5">
            <span className="font-mono text-sm text-fg">
              {sample.password.slice(0, state.typed)}
            </span>
            <motion.span
              aria-hidden
              className="ml-px inline-block h-4 w-[2px] bg-accent"
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>

        {/* Hash reveal */}
        <div className="min-h-[92px] px-5 pt-5">
          <AnimatePresence mode="wait">
            {showHash ? (
              <motion.div
                key={`hash-${state.index}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 22 }}
              >
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-ghost">
                  SHA-1
                </p>
                <p className="mt-2 break-all font-mono text-[0.6875rem] leading-relaxed text-fg-ghost">
                  <span
                    className={cx(
                      "rounded px-1 py-0.5 transition-colors duration-500",
                      showSend
                        ? "bg-accent/20 text-accent"
                        : "bg-track text-fg-muted",
                    )}
                  >
                    {sample.hash.slice(0, 5)}
                  </span>
                  {sample.hash.slice(5)}
                </p>
                <p className="mt-2.5 font-mono text-[0.625rem] text-fg-ghost">
                  {showSend
                    ? "5 karakter dikirim, 35 sisanya tetap di sini"
                    : "40 karakter, semuanya masih lokal"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`idle-${state.index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 pt-7"
              >
                <span className="size-1 animate-breathe rounded-full bg-line" />
                <span className="font-mono text-[0.6875rem] text-fg-ghost">
                  menghitung hash
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Verdict */}
        <div className="mt-4 min-h-[68px] border-t border-line px-5 py-4">
          <AnimatePresence mode="wait">
            {state.phase === "verdict" ? (
              <motion.div
                key={`verdict-${state.index}`}
                initial={{ opacity: 0, scale: 0.97, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="flex items-center gap-3"
              >
                <span
                  className={cx(
                    "size-1.5 rounded-full",
                    exposed ? "bg-danger" : "bg-safe",
                  )}
                />
                <span
                  className={cx(
                    "tnum font-mono text-lg leading-none",
                    exposed ? "text-danger" : "text-safe",
                  )}
                >
                  {sample.exposures.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-fg-subtle">
                  {exposed ? "kali muncul di data bocor" : "kali, belum pernah bocor"}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={`waiting-${state.index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center"
              >
                <span className="font-mono text-[0.6875rem] text-fg-ghost">
                  menunggu hasil
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
