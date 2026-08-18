import { isValidPrefix } from "@/lib/hash";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Proxy for the Pwned Passwords range API.
 *
 * The client sends five hex characters and nothing else. This handler forwards
 * them, requests padded results so the response size leaks nothing about how
 * many real matches exist, and returns the raw range for the client to match
 * locally.
 *
 * The proxy exists for two reasons: it keeps the upstream origin off the
 * client's connection log, and it lets us set `Add-Padding` reliably rather
 * than trusting a browser preflight.
 */

const UPSTREAM = "https://api.pwnedpasswords.com/range";
const UPSTREAM_TIMEOUT_MS = 6_000;

export type BreachRangeResponse = { range: string } | { error: string };

function json(
  body: BreachRangeResponse,
  status: number,
  cache?: string,
  extra?: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: {
      ...extra,
      // Ranges are public and change slowly; caching cuts upstream load.
      "Cache-Control": cache ?? "no-store",
      // Nothing here should ever be indexed or embedded.
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(request: Request) {
  // Rate limit before any parsing, so a flood costs us as little as possible.
  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      429,
      "no-store",
      { "Retry-After": String(limit.resetSeconds) },
    );
  }

  const prefix = new URL(request.url).searchParams
    .get("prefix")
    ?.trim()
    .toUpperCase();

  if (!prefix) {
    return json({ error: "Parameter `prefix` wajib diisi." }, 400);
  }

  if (!isValidPrefix(prefix)) {
    return json(
      { error: "`prefix` harus tepat 5 karakter heksadesimal (0-9, A-F)." },
      400,
    );
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/${prefix}`, {
      headers: {
        // Padding hides the real bucket size from anyone watching the wire.
        "Add-Padding": "true",
        "User-Agent": "SIGAP/1.0 (+edukasi keamanan akun)",
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: 86_400 },
    });

    if (upstream.status === 429) {
      return json(
        { error: "Terlalu banyak permintaan ke layanan sumber. Coba lagi sebentar." },
        429,
      );
    }

    if (!upstream.ok) {
      return json(
        { error: `Layanan sumber menolak permintaan (${upstream.status}).` },
        502,
      );
    }

    return json({ range: await upstream.text() }, 200, "public, max-age=86400");
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";

    return json(
      {
        error: timedOut
          ? "Layanan sumber tidak merespons dalam 6 detik."
          : "Tidak dapat menghubungi layanan sumber.",
      },
      504,
    );
  }
}
