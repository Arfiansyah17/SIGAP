/**
 * Aggregated Indonesian wordlist, fed to zxcvbn through `user_inputs`.
 *
 * zxcvbn treats `user_inputs` as a ranked dictionary: entry 0 is the cheapest
 * guess, and it applies the same reversing, l33t, and capitalisation matchers
 * it uses on its built-in lists. Ordering therefore matters, so the list is
 * assembled cheapest-first: bare common passwords, then names, then words,
 * then places and clubs.
 *
 * The array is frozen at module scope. zxcvbn rebuilds its matcher from
 * `user_inputs` on every call, so handing it the same reference each time keeps
 * the cost predictable.
 */

import { GIVEN_NAMES, NAME_SUFFIXES, SURNAMES } from "./names";
import { COMMON_PASSWORDS, COMMON_WORDS } from "./words";
import { CITIES, PROVINCES } from "./places";
import { CLUBS, FOREIGN_CLUBS, SUPPORTER_GROUPS } from "./clubs";
import { COMMON_PHRASES, GLUE_WORDS } from "./phrases";

export { GIVEN_NAMES, SURNAMES, NAME_SUFFIXES };
export { COMMON_WORDS, COMMON_PASSWORDS };
export { CITIES, PROVINCES };
export { CLUBS, SUPPORTER_GROUPS, FOREIGN_CLUBS };
export { COMMON_PHRASES, GLUE_WORDS };

function unique(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const group of groups) {
    for (const entry of group) {
      const normalised = entry.toLowerCase().trim();
      if (!normalised || seen.has(normalised)) continue;
      seen.add(normalised);
      out.push(normalised);
    }
  }

  return out;
}

/** Ordered cheapest-guess-first, then handed to zxcvbn as `user_inputs`. */
export const INDONESIAN_DICTIONARY: readonly string[] = Object.freeze(
  unique(
    COMMON_PASSWORDS,
    COMMON_PHRASES,
    GIVEN_NAMES,
    SURNAMES,
    COMMON_WORDS,
    CITIES,
    CLUBS,
    SUPPORTER_GROUPS,
    PROVINCES,
    FOREIGN_CLUBS,
  ),
);

/** Every token that counts as "a name" for the name+digits rules. */
export const NAME_TOKENS: ReadonlySet<string> = new Set(
  unique(GIVEN_NAMES, SURNAMES),
);

/** Non-name vocabulary, used to explain a plain-dictionary hit. */
export const WORD_TOKENS: ReadonlySet<string> = new Set(
  unique(
    COMMON_WORDS,
    COMMON_PASSWORDS,
    COMMON_PHRASES,
    CITIES,
    PROVINCES,
    CLUBS,
    SUPPORTER_GROUPS,
    FOREIGN_CLUBS,
  ),
);

/**
 * Everything the substring scanner may match, longest first.
 *
 * Sorted by descending length so a greedy scan prefers "surabaya" over "sura",
 * which keeps the reported match readable. Tokens shorter than 4 characters are
 * excluded: a 3-letter match fires on almost any password and the finding stops
 * being informative.
 */
export const SCANNABLE_TOKENS: readonly string[] = Object.freeze(
  [...new Set(INDONESIAN_DICTIONARY)]
    .filter((token) => token.length >= 4)
    .sort((a, b) => b.length - a.length),
);

/** Whole phrases, so a hit can be reported as a sentence rather than a word. */
export const PHRASE_TOKENS: ReadonlySet<string> = new Set(unique(COMMON_PHRASES));

/** Phrase glue: too short to be a dictionary hit alone, useful for phrases. */
export const GLUE_TOKENS: ReadonlySet<string> = new Set(
  unique(GLUE_WORDS).filter((token) => token.length >= 2),
);

/** Anything in the local corpus, name or not. */
export const ALL_TOKENS: ReadonlySet<string> = new Set(INDONESIAN_DICTIONARY);
