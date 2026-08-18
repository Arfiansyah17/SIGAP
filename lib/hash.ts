/**
 * SHA-1 hashing + k-anonymity helpers.
 *
 * The privacy contract of this app: a password is NEVER transmitted, in any
 * form, complete or encrypted. It is hashed inside the browser, and only the
 * first five hex characters of that hash leave the device. Those five
 * characters are shared by hundreds of thousands of distinct passwords, so the
 * request carries no usable information about which one was typed.
 *
 * Runs unchanged in the browser and on the server, both expose Web Crypto.
 */

/** A SHA-1 hash split for a range query: 5-char prefix, 35-char suffix. */
export type HashRange = {
  /** Full uppercase hex digest. Never send this anywhere. */
  full: string;
  /** The only fragment safe to transmit. */
  prefix: string;
  /** Compared locally against the range response. */
  suffix: string;
};

const HEX = "0123456789ABCDEF";

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (const byte of bytes) {
    out += HEX[byte >> 4] + HEX[byte & 15];
  }
  return out;
}

/**
 * SHA-1 of a UTF-8 string, uppercase hex.
 *
 * SHA-1 is used here because the Pwned Passwords range API is keyed by it, not
 * as a security primitive. Nothing is stored, and the digest never leaves the
 * caller.
 */
export async function sha1Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error(
      "Web Crypto tidak tersedia. Halaman ini harus dibuka melalui HTTPS atau localhost.",
    );
  }

  const encoded = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-1", encoded);
  return toHex(digest);
}

/** Hash a password and split it into a transmittable prefix and a local suffix. */
export async function hashRange(password: string): Promise<HashRange> {
  const full = await sha1Hex(password);
  return {
    full,
    prefix: full.slice(0, 5),
    suffix: full.slice(5),
  };
}

/** True when the string is exactly five uppercase hex characters. */
export function isValidPrefix(value: string): boolean {
  return /^[0-9A-F]{5}$/.test(value);
}

/**
 * Parse a Pwned Passwords range body (`SUFFIX:COUNT` per line) and return the
 * breach count for our suffix. Absent suffix means zero known exposures.
 *
 * Matching happens on the client so the server never learns which suffix we
 * cared about, the padded response looks identical for every password in the
 * bucket.
 */
export function countInRange(body: string, suffix: string): number {
  const target = suffix.toUpperCase();

  for (const line of body.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    if (line.slice(0, separator).trim().toUpperCase() === target) {
      const count = Number.parseInt(line.slice(separator + 1).trim(), 10);
      // Padded decoy entries are returned with a count of 0.
      return Number.isFinite(count) ? count : 0;
    }
  }

  return 0;
}
