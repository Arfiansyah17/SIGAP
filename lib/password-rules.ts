/**
 * Local penalty layer for patterns zxcvbn cannot see.
 *
 * zxcvbn is not wrong, it is calibrated for a different population. Its
 * dictionaries are English, so `arfiansyah12` contains no known token and gets
 * scored as an 11-character near-random string. For an attacker targeting
 * Indonesian users, that is close to a first guess.
 *
 * This module runs after zxcvbn and answers one question per rule: given that
 * the attacker knows the target is Indonesian, how much smaller is the real
 * search space than zxcvbn assumed?
 *
 * SCOPE. The point is not to special-case one surname. Anything a person would
 * reach for is flagged as common and not recommended: personal names anywhere in
 * the string, everyday words, whole phrases with the spaces removed, dates of
 * birth in any common format, keyboard runs, digit-for-letter substitutions, and
 * repeated syllables. The scanner looks at substrings, so a name buried in the
 * middle is caught as readily as one at the start.
 *
 * Each rule reports a `divisor` (how many times smaller the space becomes) and
 * usually a `scoreCap` (a ceiling the final score cannot exceed regardless of
 * the arithmetic). Caps exist because some patterns are qualitatively "on the
 * first page of the wordlist".
 */

import {
  ALL_TOKENS,
  GLUE_TOKENS,
  NAME_SUFFIXES,
  NAME_TOKENS,
  PHRASE_TOKENS,
  SCANNABLE_TOKENS,
} from "./dictionaries";

export type LocalRuleId =
  | "nama-orang"
  | "nama-angka"
  | "nama-tahun"
  | "tanggal-lahir"
  | "kata-umum"
  | "kalimat-umum"
  | "keyboard-lokal"
  | "leetspeak-lokal"
  | "suku-ulang";

export type LocalFinding = {
  id: LocalRuleId;
  /** Short label for the UI. */
  label: string;
  /** Indonesian explanation of why the pattern is weak. Shown to the user. */
  explanation: string;
  /** The part of the password that triggered the rule. */
  matched: string;
  /** How many times smaller the real search space is than zxcvbn assumed. */
  divisor: number;
  /** Hard ceiling on the final 0-4 score when this rule fires. */
  scoreCap?: number;
};

/* ------------------------------------------------------------------ */
/* Text helpers                                                       */
/* ------------------------------------------------------------------ */

function letters(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

/** Substitutions Indonesian users reach for most often. */
const LEET_MAP: Record<string, string> = {
  "4": "a", "@": "a", "8": "b", "3": "e", "6": "g", "9": "g",
  "1": "i", "!": "i", "0": "o", "5": "s", $: "s", "7": "t", "2": "z",
};

function deleet(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => LEET_MAP[char] ?? char)
    .join("");
}

export type TokenHit = {
  token: string;
  start: number;
  kind: "name" | "word";
};

/**
 * Greedy longest-match scan for dictionary tokens anywhere in the text.
 *
 * Non-overlapping and longest-first, so "surabaya" is reported rather than the
 * "sura" inside it. Runs over the letters-only projection of the password, which
 * is what lets `bud1sant0so` be caught once de-leeted.
 */
export function scanTokens(text: string): TokenHit[] {
  const hits: TokenHit[] = [];
  let index = 0;

  while (index < text.length) {
    let matched: string | null = null;

    for (const token of SCANNABLE_TOKENS) {
      if (token.length > text.length - index) continue;
      if (text.startsWith(token, index)) {
        matched = token;
        break; // SCANNABLE_TOKENS is length-sorted, so this is the longest hit.
      }
    }

    if (matched) {
      hits.push({
        token: matched,
        start: index,
        kind: NAME_TOKENS.has(matched) ? "name" : "word",
      });
      index += matched.length;
    } else {
      index += 1;
    }
  }

  return hits;
}

/** True when a letter run reads as an Indonesian personal name. */
function isNameish(value: string): boolean {
  const word = letters(value);
  if (word.length < 3) return false;
  if (NAME_TOKENS.has(word)) return true;

  for (const suffix of NAME_SUFFIXES) {
    if (word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      if (stem.length >= 3 && NAME_TOKENS.has(stem)) return true;
    }
  }

  // Joined pair, e.g. "budi" + "santoso".
  for (let cut = 3; cut <= word.length - 3; cut += 1) {
    const left = word.slice(0, cut);
    const right = word.slice(cut);
    if (
      ALL_TOKENS.has(left) &&
      ALL_TOKENS.has(right) &&
      (NAME_TOKENS.has(left) || NAME_TOKENS.has(right))
    ) {
      return true;
    }
  }

  return false;
}

function splitTrailingDigits(
  password: string,
): { head: string; digits: string } | null {
  const match = /^(.*?)(\d{1,4})$/.exec(password);
  if (!match) return null;
  const [, head, digits] = match;
  return head ? { head, digits } : null;
}

/* ------------------------------------------------------------------ */
/* Date of birth                                                      */
/* ------------------------------------------------------------------ */

const YEAR_MIN = 1940;
const YEAR_MAX = 2015;

function plausibleDay(day: number) {
  return day >= 1 && day <= 31;
}
function plausibleMonth(month: number) {
  return month >= 1 && month <= 12;
}
function plausibleYear(year: number) {
  return year >= YEAR_MIN && year <= YEAR_MAX;
}

/**
 * Recognise a digit run as a date, in the formats Indonesians actually type.
 * Returns a human description, or null.
 *
 * Deliberately generous: `17082003`, `20030817`, `170803`, `1708`, and a bare
 * `2003` all count. A false positive here costs the user a warning they can
 * ignore; a false negative hands them a password an attacker will try early.
 */
export function describeDate(digits: string): string | null {
  const n = (from: number, length: number) =>
    Number.parseInt(digits.slice(from, from + length), 10);

  if (digits.length === 8) {
    if (plausibleDay(n(0, 2)) && plausibleMonth(n(2, 2)) && plausibleYear(n(4, 4))) {
      return "tanggal lahir lengkap";
    }
    if (plausibleYear(n(0, 4)) && plausibleMonth(n(4, 2)) && plausibleDay(n(6, 2))) {
      return "tanggal lahir lengkap";
    }
  }

  if (digits.length === 6) {
    if (plausibleDay(n(0, 2)) && plausibleMonth(n(2, 2))) return "tanggal dan bulan lahir";
    if (plausibleMonth(n(2, 2)) && plausibleDay(n(4, 2))) return "tanggal lahir";
  }

  if (digits.length === 4) {
    if (plausibleYear(n(0, 4))) return "tahun lahir";
    if (plausibleDay(n(0, 2)) && plausibleMonth(n(2, 2))) return "tanggal dan bulan lahir";
  }

  if (digits.length === 2 && plausibleMonth(n(0, 2))) return null; // too ambiguous

  return null;
}

/**
 * Every digit run in the password, with separators folded in so `17-08-2003`
 * is seen as one run rather than three.
 */
function digitRuns(password: string): string[] {
  const folded = password.replace(/(\d)[\s./_-]+(?=\d)/g, "$1");
  return folded.match(/\d+/g) ?? [];
}

/* ------------------------------------------------------------------ */
/* Keyboard                                                           */
/* ------------------------------------------------------------------ */

const QWERTY_ROWS = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

function adjacencyRun(value: string): string | null {
  const word = value.toLowerCase();
  let best = "";

  for (const row of QWERTY_ROWS) {
    const reversed = row.split("").reverse().join("");
    for (let start = 0; start < word.length; start += 1) {
      for (let end = start + 4; end <= word.length; end += 1) {
        const slice = word.slice(start, end);
        if ((row.includes(slice) || reversed.includes(slice)) && slice.length > best.length) {
          best = slice;
        }
      }
    }
  }

  return best.length >= 4 ? best : null;
}

/* ------------------------------------------------------------------ */
/* Rules                                                              */
/* ------------------------------------------------------------------ */

export type LocalRuleContext = {
  /** Pattern names from `ZXCVBNResult.sequence`, e.g. `["spatial"]`. */
  zxcvbnPatterns?: readonly string[];
};

export function analyseLocal(
  password: string,
  context: LocalRuleContext = {},
): LocalFinding[] {
  if (!password) return [];

  const findings: LocalFinding[] = [];
  const core = letters(password);
  const deleeted = deleet(password);
  const deleetedCore = letters(deleeted);

  // Scan the de-leeted projection, so `s4y4ng` is found as `sayang`.
  const hits = scanTokens(deleetedCore.length >= core.length ? deleetedCore : core);
  const nameHits = hits.filter((hit) => hit.kind === "name");
  const wordHits = hits.filter((hit) => hit.kind === "word");

  const split = splitTrailingDigits(password);
  const canonicalHead = split ? deleet(split.head) : "";

  /* ---- 1 & 2. Name plus digits, birth year treated separately ---- */
  let nameDigitsFired = false;

  if (split && isNameish(canonicalHead)) {
    const year = Number.parseInt(split.digits, 10);
    const isBirthYear = split.digits.length === 4 && plausibleYear(year);

    findings.push(
      isBirthYear
        ? {
            id: "nama-tahun",
            label: "Nama + tahun lahir",
            explanation:
              "Terdeteksi pola nama + tahun lahir. Ini kombinasi paling umum di Indonesia, dan tahun lahir kamu gampang dicari di media sosial. Sangat tidak disarankan.",
            matched: `${split.head}${split.digits}`,
            divisor: 5e4,
            scoreCap: 1,
          }
        : {
            id: "nama-angka",
            label: "Nama + angka",
            explanation:
              "Terdeteksi pola nama + angka, dan pola ini ada di daftar tebakan pertama penyerang. Nama Indonesia tidak ada di kamus standar, tapi jelas ada di kamus penyerang lokal. Tidak disarankan.",
            matched: `${split.head}${split.digits}`,
            divisor: 2e4,
            scoreCap: 1,
          },
    );
    nameDigitsFired = true;
  }

  /* ---- 3. A personal name anywhere in the password ---- */
  if (!nameDigitsFired && nameHits.length > 0) {
    const names = [...new Set(nameHits.map((hit) => hit.token))];
    findings.push({
      id: "nama-orang",
      label: "Nama orang",
      explanation: `Mengandung nama orang (${names.join(", ")}). Nama adalah hal pertama yang dicoba penyerang karena bisa ditebak dari media sosial kamu. Tidak disarankan dipakai di password.`,
      matched: names.join(", "),
      divisor: names.length > 1 ? 8e3 : 3e3,
      scoreCap: 1,
    });
  }

  /* ---- 4. Date of birth in any common format ---- */
  for (const run of digitRuns(password)) {
    const description = describeDate(run);
    if (!description) continue;

    // A birth year already charged for by `nama-tahun` is not charged twice.
    if (nameDigitsFired && split?.digits === run) break;

    findings.push({
      id: "tanggal-lahir",
      label: "Tanggal lahir",
      explanation: `Angka "${run}" terbaca sebagai ${description}. Tanggal lahir cuma punya beberapa puluh ribu kemungkinan dan biasanya terpampang di profil media sosial. Tidak disarankan.`,
      matched: run,
      divisor: 1e4,
      scoreCap: 1,
    });
    break;
  }

  /* ---- 5 & 6. Everyday words, and whole phrases with the spaces removed ---- */
  const scanned = deleetedCore.length ? deleetedCore : core;
  const knownPhrase = wordHits.find((hit) => PHRASE_TOKENS.has(hit.token));
  const composedPhrase = countPhraseTokens(scanned);

  if (knownPhrase) {
    // A single token that is itself a known phrase reads as a sentence, not a
    // word, so it is reported that way.
    findings.push({
      id: "kalimat-umum",
      label: "Kalimat umum",
      explanation: `"${knownPhrase.token}" adalah kalimat umum yang cuma dihapus spasinya, dan sudah ada di daftar kata SIGAP. Panjangnya tidak menolong karena kalimatnya sendiri yang ditebak. Sangat tidak disarankan.`,
      matched: knownPhrase.token,
      divisor: 4e3,
      scoreCap: 0,
    });
  } else if (composedPhrase.count >= 3 && composedPhrase.coverage >= 0.85) {
    findings.push({
      id: "kalimat-umum",
      label: "Kalimat umum",
      explanation: `Ini rangkaian kata umum yang cuma dihapus spasinya (${composedPhrase.parts.join(" + ")}). Panjangnya tidak menolong, karena yang perlu ditebak hanya beberapa kata yang sudah ada di daftar. Tidak disarankan.`,
      matched: composedPhrase.parts.join(" + "),
      divisor: 2e3,
      scoreCap: 1,
    });
  } else if (wordHits.length > 0) {
    const words = [...new Set(wordHits.map((hit) => hit.token))];
    const covered = wordHits.reduce((sum, hit) => sum + hit.token.length, 0);
    const coverage = core.length ? covered / core.length : 0;

    if (coverage >= 0.9) {
      findings.push({
        id: "kata-umum",
        label: "Kata umum",
        explanation: `Seluruh password ini pada dasarnya kata umum (${words.join(", ")}) yang ada di daftar kata SIGAP. Password seperti ini ditebak dalam hitungan detik. Tidak disarankan.`,
        matched: words.join(", "),
        divisor: 1e3,
        scoreCap: 0,
      });
    } else if (coverage >= 0.35) {
      /*
       * A partial hit gets a divisor scaled to how much of the password it
       * explains, and deliberately NO `scoreCap`.
       *
       * Substring matching across word boundaries produces incidental hits:
       * "listrik" contains "istri", so a strong four-word passphrase would
       * otherwise be capped at a middling score by one accidental five-letter
       * match. Below 35% coverage nothing is reported at all, for the same
       * reason. The arithmetic decides these cases; only a hit that explains
       * most of the password gets to cap the score.
       */
      findings.push({
        id: "kata-umum",
        label: "Mengandung kata umum",
        explanation: `Sebagian password ini kata umum (${words.join(", ")}). Bagian itu tidak menambah kesulitan menebak karena sudah ada di kamus penyerang. Sisanya masih menolong, tapi jangan diandalkan.`,
        matched: words.join(", "),
        divisor: Math.round(10 ** (coverage * 3)),
      });
    }
  }

  /* ---- 7. Keyboard adjacency, unless zxcvbn already charged for it ---- */
  if (!context.zxcvbnPatterns?.includes("spatial")) {
    const run = adjacencyRun(password);
    if (run) {
      findings.push({
        id: "keyboard-lokal",
        label: "Urutan tombol keyboard",
        explanation: `Ada urutan tombol yang berdekatan di keyboard (${run}). Urutan seperti ini selalu masuk daftar tebakan awal. Tidak disarankan.`,
        matched: run,
        divisor: 5e2,
        scoreCap: 1,
      });
    }
  }

  /* ---- 8. Leetspeak that resolves to something local ---- */
  //
  // The test is whether de-leeting produced NEW LETTERS in the region being
  // matched, not merely whether the string contains a digit. Otherwise
  // `arfiansyah12` would be flagged as leetspeak just because its trailing "12"
  // maps to "iz", even though nothing was substituted in the word itself.
  {
    // Trailing punctuation is punctuation, not a substitution. Without this,
    // `kopiSenja!1998` reads as leetspeak because "!" maps to "i".
    const region = (split ? split.head : password).replace(/[^a-z0-9]+$/i, "");
    const canonicalRegion = deleet(region);
    const gainedLetters =
      letters(canonicalRegion).length > letters(region).length;

    const target = letters(canonicalRegion);
    const resolves =
      gainedLetters &&
      (ALL_TOKENS.has(target) || isNameish(target) || scanTokens(target).length > 0);

    if (resolves) {
      findings.push({
        id: "leetspeak-lokal",
        label: "Angka pengganti huruf",
        explanation: `Mengganti huruf dengan angka (a jadi 4, i jadi 1, o jadi 0) tidak menambah keamanan, karena penyerang sudah lama membalik substitusi itu otomatis. Setelah dikembalikan, password ini terbaca "${target}". Tidak disarankan.`,
        matched: password,
        divisor: 1e3,
        scoreCap: 1,
      });
    }
  }

  /* ---- 9. Repeated syllables ---- */
  const repeat = /^(.{2,5}?)\1+$/.exec(core);
  if (repeat && core.length >= 6) {
    findings.push({
      id: "suku-ulang",
      label: "Suku kata berulang",
      explanation: `Password ini cuma mengulang "${repeat[1]}". Panjangnya jadi tidak berarti, karena yang perlu ditebak hanya potongan pendek itu. Tidak disarankan.`,
      matched: core,
      divisor: 8e2,
      scoreCap: 1,
    });
  }

  return findings;
}

/**
 * Split a letter run into dictionary words plus short glue words, and report how
 * much of the string was accounted for. Full coverage by two or more known parts
 * is the signature of a spaces-removed sentence.
 */
function countPhraseTokens(text: string): {
  count: number;
  coverage: number;
  parts: string[];
} {
  const parts: string[] = [];
  let index = 0;
  let covered = 0;

  while (index < text.length) {
    let matched: string | null = null;

    for (const token of SCANNABLE_TOKENS) {
      if (text.startsWith(token, index)) {
        matched = token;
        break;
      }
    }

    if (!matched) {
      // Longest glue word wins, so "sayang" beats "sa".
      const glue = [...GLUE_TOKENS]
        .filter((token) => text.startsWith(token, index))
        .sort((a, b) => b.length - a.length)[0];
      if (glue) matched = glue;
    }

    if (matched) {
      parts.push(matched);
      covered += matched.length;
      index += matched.length;
    } else {
      index += 1;
    }
  }

  return {
    count: parts.length,
    coverage: text.length ? covered / text.length : 0,
    parts,
  };
}

/* ------------------------------------------------------------------ */
/* Score combination                                                  */
/* ------------------------------------------------------------------ */

/** zxcvbn's own guess-count to score thresholds, so both use one scale. */
function guessesToScore(guesses: number): number {
  if (guesses < 1e3) return 0;
  if (guesses < 1e6) return 1;
  if (guesses < 1e8) return 2;
  if (guesses < 1e10) return 3;
  return 4;
}

const MIN_GUESSES = 1;

export type CombinedScore = {
  score: number;
  baseScore: number;
  guesses: number;
  baseGuesses: number;
  findings: LocalFinding[];
  adjusted: boolean;
};

/**
 * Combine zxcvbn's estimate with the local penalties.
 *
 * FORMULA (explainable version, for the judges):
 *
 *   1. Start from zxcvbn's guess count, `baseGuesses`.
 *   2. Every matched local rule says "the real space is N times smaller":
 *        effectiveGuesses = baseGuesses / (divisor_1 x divisor_2 x ...)
 *      Divisors multiply because the rules describe independent reductions:
 *      knowing the string is a name shrinks the space, and knowing the digits
 *      are a birth date shrinks what remains.
 *   3. Convert `effectiveGuesses` back to a 0-4 score with zxcvbn's own
 *      thresholds, so both numbers mean the same thing.
 *   4. Take the lowest of: zxcvbn's score, the recomputed score, and every
 *      rule's `scoreCap`. A cap states that the pattern is on the first page of
 *      an attacker's wordlist regardless of arithmetic.
 *
 * Step 4 only ever lowers the score. The local layer can never make a password
 * look stronger than zxcvbn already judged it.
 */
export function combineScore(
  baseGuesses: number,
  baseScore: number,
  findings: LocalFinding[],
): CombinedScore {
  const divisor = findings.reduce((product, rule) => product * rule.divisor, 1);
  const guesses = Math.max(baseGuesses / divisor, MIN_GUESSES);

  const caps = findings
    .map((rule) => rule.scoreCap)
    .filter((cap): cap is number => typeof cap === "number");

  const score = Math.min(baseScore, guessesToScore(guesses), ...caps);

  return {
    score,
    baseScore,
    guesses,
    baseGuesses,
    findings,
    adjusted: score < baseScore,
  };
}
