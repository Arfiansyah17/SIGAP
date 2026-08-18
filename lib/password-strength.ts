/**
 * Single entry point for password analysis.
 *
 * Two layers, in order:
 *   1. zxcvbn, seeded with the Indonesian wordlist via `user_inputs`, so local
 *      names and words are matched by zxcvbn's own dictionary machinery
 *      (including its reversing, l33t, and capitalisation handling).
 *   2. `analyseLocal`, which catches the composite shapes zxcvbn still misses,
 *      most importantly "name + digits".
 *
 * Layer 1 alone is not enough: `user_inputs` makes zxcvbn recognise
 * `arfiansyah`, but `arfiansyah12` is scored as a dictionary word plus a
 * separate digit sequence, which is still generous. Layer 2 charges for the
 * combination, because the combination itself is the popular pattern.
 *
 * Everything here runs in the browser. No network calls, no telemetry.
 */

import type { ZXCVBNResult } from "zxcvbn";
import { INDONESIAN_DICTIONARY } from "./dictionaries";
import {
  analyseLocal,
  combineScore,
  type CombinedScore,
  type LocalFinding,
} from "./password-rules";

export type Zxcvbn = (password: string, userInputs?: string[]) => ZXCVBNResult;

export type StrengthReport = {
  /** Final 0-4 score, after local penalties. */
  score: number;
  /** What zxcvbn said on its own, before the local layer. */
  baseScore: number;
  /** True when the Indonesian rules lowered the score. */
  adjusted: boolean;
  /** Effective guess count used for the crack-time figures. */
  guesses: number;
  /** Crack time in seconds for the two scenarios the UI shows. */
  onlineSeconds: number;
  offlineSeconds: number;
  /** Which local rules fired, in the order they were detected. */
  findings: LocalFinding[];
  /** The raw zxcvbn result, for pattern chips and its own feedback strings. */
  raw: ZXCVBNResult;
};

/**
 * zxcvbn mutates nothing, but it does rebuild its user dictionary on each call,
 * so the frozen array is passed by reference rather than copied.
 */
const USER_INPUTS = INDONESIAN_DICTIONARY as unknown as string[];

/** Attack rates zxcvbn documents, reused so our figures stay comparable. */
const ONLINE_GUESSES_PER_SECOND = 10;
const OFFLINE_GUESSES_PER_SECOND = 1e10;

export function evaluatePassword(
  password: string,
  zxcvbn: Zxcvbn,
): StrengthReport {
  const raw = zxcvbn(password, USER_INPUTS);

  const findings = analyseLocal(password, {
    zxcvbnPatterns: raw.sequence.map((match) => match.pattern),
  });

  const combined: CombinedScore = combineScore(
    Number(raw.guesses),
    raw.score,
    findings,
  );

  return {
    score: combined.score,
    baseScore: combined.baseScore,
    adjusted: combined.adjusted,
    guesses: combined.guesses,
    // Recomputed from the penalised guess count rather than read off zxcvbn,
    // otherwise the headline score and the times would contradict each other.
    onlineSeconds: combined.guesses / ONLINE_GUESSES_PER_SECOND,
    offlineSeconds: combined.guesses / OFFLINE_GUESSES_PER_SECOND,
    findings,
    raw,
  };
}
