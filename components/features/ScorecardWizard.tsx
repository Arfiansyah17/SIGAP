"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  CheckIcon,
  DeviceMobileIcon,
  FootprintsIcon,
  LifebuoyIcon,
  LockKeyIcon,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ScoreDial } from "@/components/ui/ScoreDial";
import { ActionPlan } from "./ActionPlan";
import {
  bandFor,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CHECKLIST,
  creditFor,
  scoreChecklist,
  type Answers,
  type AnswerValue,
  type Category,
  type CategoryResult,
  type ChecklistItem,
} from "@/lib/scoring";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStoredState } from "@/lib/useStoredState";
import { cx } from "@/lib/cx";

/** Stable empty reference, required by `useStoredState`. */
const NO_ANSWERS: Answers = {};

const OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: "yes", label: "Ya" },
  { value: "partial", label: "Ragu-ragu" },
  { value: "no", label: "Tidak" },
];

/** One icon per category, used on the stage row. Purely decorative pattern-matching. */
const CATEGORY_ICONS: Record<Category, Icon> = {
  auth: LockKeyIcon,
  recovery: LifebuoyIcon,
  device: DeviceMobileIcon,
  habit: FootprintsIcon,
};

/** Group once at module scope, since the checklist is static. */
const GROUPED = CHECKLIST.reduce((map, item) => {
  const bucket = map.get(item.category) ?? [];
  bucket.push(item);
  map.set(item.category, bucket);
  return map;
}, new Map<Category, typeof CHECKLIST>());

export function ScorecardWizard() {
  // Answers never leave the device.
  const [answers, setAnswers] = useStoredState<Answers>(
    STORAGE_KEYS.scorecard,
    NO_ANSWERS,
  );
  const [planOpen, setPlanOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const wasComplete = useRef(false);

  const result = useMemo(() => scoreChecklist(answers), [answers]);
  const tone = result.complete ? result.band.tone : "idle";
  const pct = result.answered / result.total;
  const progressLine =
    pct === 0
      ? "Yuk mulai, cuma butuh beberapa menit."
      : pct < 0.5
        ? "Baru mulai, lanjutkan sedikit lagi."
        : "Tinggal sedikit lagi, hampir kelar."

  // The last answer completes the quiz further down the page, so the score
  // panel above is out of view. Jump back up to it instead of leaving the
  // user to scroll and find it themselves.
  useEffect(() => {
    if (result.complete && !wasComplete.current) {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasComplete.current = result.complete;
  }, [result.complete]);

  function scrollToCategory(category: Category) {
    document
      .getElementById(`cat-${category}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      {/*
        Progress, and the score once every question is answered. Deliberately not
        sticky: the questionnaire is the task, and a rail that follows the scroll
        competes with it for attention.
      */}
      <div ref={summaryRef} className="panel scroll-mt-20 px-6 py-5 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="flex items-baseline gap-4">
            <p className="tnum font-mono text-3xl leading-none tracking-tighter text-fg">
              {result.answered}
              <span className="text-fg-ghost">/{result.total}</span>
            </p>
            <p className="text-sm text-fg-subtle">
              {result.complete ? "semua terjawab" : "pertanyaan terjawab"}
            </p>
          </div>

          {!result.complete && (
            <p className="max-w-[46ch] text-xs leading-relaxed text-fg-faint">
              <span className="font-medium text-fg-muted">{progressLine}</span>{" "}
              Skornya baru muncul setelah semua pertanyaan dijawab.
            </p>
          )}
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-track">
          <motion.div
            className={cx(
              "h-full w-full origin-left rounded-full",
              result.complete ? "bg-safe" : "bg-accent",
            )}
            initial={false}
            animate={{ scaleX: pct }}
            transition={{ type: "spring", stiffness: 120, damping: 24 }}
          />
        </div>

        {/* Stage row: one tile per category, each a small quest marker. */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CATEGORY_ORDER.map((category) => {
            const bucket = result.categories.find((c) => c.category === category)!;
            return (
              <CategoryStage
                key={category}
                category={category}
                bucket={bucket}
                onClick={() => scrollToCategory(category)}
              />
            );
          })}
        </div>

        {result.complete && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-5 border-t border-line pt-6"
          >
            <ScoreDial value={result.score} tone={tone} label={result.band.label} />

            <div className="min-w-[16rem] max-w-[52ch] flex-1">
              <p className="text-sm leading-relaxed text-fg-muted">
                {result.band.summary}
              </p>

              {result.gaps.length > 0 && (
                <Button onClick={() => setPlanOpen(true)} className="mt-5">
                  Lihat rencana aksi
                  <ArrowRightIcon size={15} weight="bold" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {result.answered > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAnswers(NO_ANSWERS)}
            className="-ml-2 mt-4"
          >
            <ArrowCounterClockwiseIcon size={14} />
            Mulai ulang
          </Button>
        )}
      </div>

      {/* Questions */}
      <div className="mt-12 flex flex-col gap-14">
        {[...GROUPED.entries()].map(([category, items]) => {
          const bucket = result.categories.find((c) => c.category === category)!;
          const CategoryIcon = CATEGORY_ICONS[category];

          return (
            <section key={category} id={`cat-${category}`} className="scroll-mt-20">
              <div className="flex items-baseline justify-between gap-6 border-b border-line pb-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-fg">
                  <CategoryIcon size={16} weight="bold" className="text-accent" />
                  {CATEGORY_LABELS[category]}
                </h2>
                <span className="tnum font-mono text-xs text-fg-faint">
                  {bucket.answered}/{bucket.total}
                </span>
              </div>

              <div className="divide-y divide-line">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 py-6 md:flex-row md:items-start md:justify-between md:gap-10"
                  >
                    <div className="max-w-[48ch]">
                      <p className="text-[0.9375rem] font-semibold leading-snug text-fg">
                        {item.question}
                      </p>
                      <p className="mt-2 text-[0.8125rem] leading-relaxed text-fg-faint">
                        {item.rationale}
                      </p>
                    </div>

                    <Segmented
                      item={item}
                      value={answers[item.id]}
                      onChange={(value) =>
                        setAnswers((current: Answers) => ({
                          ...current,
                          [item.id]: value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {result.complete && result.gaps.length === 0 && (
          <section className="border-t border-line pt-8">
            <h2 className="text-sm font-semibold tracking-tight text-safe">
              🏆 Semuanya sudah aman
            </h2>
            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-fg-subtle">
              Tidak ada yang perlu dibenahi sekarang. Cek ulang sekitar enam bulan
              lagi, karena izin aplikasi dan sesi lama biasanya menumpuk lagi tanpa
              disadari.
            </p>
          </section>
        )}
      </div>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="Rencana aksi"
        description={`${result.gaps.length} langkah, diurutkan dari yang paling berdampak. Tiap langkah menyebutkan menu persisnya.`}
      >
        <ActionPlan gaps={result.gaps} />
      </Modal>
    </div>
  );
}

/**
 * Ya / Ragu-ragu / Tidak.
 *
 * The colour follows the credit the answer earns for THIS question, not the
 * literal word. Several PRD questions are phrased so that "Tidak" is the safe
 * answer ("apakah password diulang di lebih dari satu layanan?"), and painting
 * that red would tell the user the opposite of the truth.
 */
function Segmented({
  item,
  value,
  onChange,
}: {
  item: ChecklistItem;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Jawaban untuk: ${item.question}`}
      className="flex shrink-0 gap-1 rounded-lg border border-line-strong bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const active = value === option.value;
        const credit = creditFor(item, option.value);
        const fill = credit === 1 ? "bg-safe" : credit === 0 ? "bg-danger" : "bg-warn";

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "relative rounded-md px-3 py-2 text-xs transition-colors duration-200 active:scale-[0.97]",
              active ? "text-on-accent" : "text-fg-subtle hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                // One shared pill per question, sliding between the options
                layoutId={`segment-${item.id}`}
                className={cx("absolute inset-0 rounded-md", fill)}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * One quest marker per category: an icon ring that fills as the category is
 * answered, and turns solid with a checkmark once it is. Clicking jumps the
 * page to that section, so the row doubles as a map of the four stages.
 */
function CategoryStage({
  category,
  bucket,
  onClick,
}: {
  category: Category;
  bucket: CategoryResult;
  onClick: () => void;
}) {
  const StageIcon = CATEGORY_ICONS[category];
  const complete = bucket.total > 0 && bucket.answered === bucket.total;
  const tone = complete ? bandFor(bucket.score).tone : "idle";
  const pct = bucket.total ? bucket.answered / bucket.total : 0;

  const ring =
    tone === "safe" ? "var(--color-safe)" : tone === "warn" ? "var(--color-warn)" : "var(--color-danger)";

  const RADIUS = 18;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-2 py-4 text-center transition-colors duration-200 hover:border-line-strong hover:bg-surface-hi"
    >
      <span className="relative grid size-11 place-items-center">
        <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="3"
          />
          <motion.circle
            cx="22"
            cy="22"
            r={RADIUS}
            fill="none"
            stroke={complete ? ring : "var(--color-accent)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={false}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - pct) }}
            transition={{ type: "spring", stiffness: 140, damping: 26 }}
          />
        </svg>
        {complete ? (
          <CheckIcon size={16} weight="bold" style={{ color: ring }} />
        ) : (
          <StageIcon
            size={16}
            weight="bold"
            className={bucket.answered > 0 ? "text-accent" : "text-fg-faint"}
          />
        )}
      </span>

      <span className="text-[0.6875rem] font-medium leading-tight text-fg-muted group-hover:text-fg">
        {CATEGORY_LABELS[category]}
      </span>
      <span className="tnum font-mono text-[0.625rem] text-fg-faint">
        {bucket.answered}/{bucket.total}
      </span>
    </button>
  );
}
