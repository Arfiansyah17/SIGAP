/**
 * Cryptographically random password generation.
 *
 * Uses rejection sampling over `crypto.getRandomValues` rather than `% length`,
 * which would bias the tail of the alphabet toward the low bytes.
 */

const ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_=+.@#";

export function generatePassword(length = 20): string {
  const alphabet = ALPHABET;
  const limit = 256 - (256 % alphabet.length);
  const out: string[] = [];
  const buffer = new Uint8Array(length * 2);

  while (out.length < length) {
    crypto.getRandomValues(buffer);

    for (const byte of buffer) {
      if (out.length === length) break;
      // Discard bytes in the uneven remainder to keep the draw uniform.
      if (byte >= limit) continue;
      out.push(alphabet[byte % alphabet.length]);
    }
  }

  return out.join("");
}

/** Shannon entropy of a uniformly random string over the generator alphabet. */
export function entropyBits(length: number): number {
  return Math.round(length * Math.log2(ALPHABET.length));
}
