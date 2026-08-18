import type { NextConfig } from "next";

/**
 * Security headers (PRD section 9).
 *
 * Applied to every route rather than per-response, so a new page cannot ship
 * without them by accident.
 *
 * The CSP is deliberately tight and reflects what this app actually does:
 *   - `connect-src 'self'` only. The browser talks to our own API route and
 *     nothing else; the HIBP call happens server-side. This is the header that
 *     makes the privacy claim enforceable rather than merely promised, because
 *     a script trying to exfiltrate a typed password to a third party would be
 *     blocked by the browser.
 *   - `script-src` needs 'unsafe-inline' for the theme bootstrap script, which
 *     must run before first paint to avoid a flash of the wrong theme. It also
 *     needs 'unsafe-eval' in development only, for React refresh.
 *   - `style-src` allows 'unsafe-inline' because Next injects critical CSS and
 *     next/font emits inline @font-face rules.
 *   - `frame-ancestors 'none'` duplicates X-Frame-Options for modern browsers.
 */
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  // No third-party endpoint is ever contacted from the browser.
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  /**
   * F1 and F2 used to live on separate routes and were merged into
   * /cek-password. These are permanent redirects so any link already shared, or
   * already indexed, keeps working instead of 404ing during judging.
   */
  async redirects() {
    return [
      { source: "/breach-check", destination: "/cek-password", permanent: true },
      { source: "/password-strength", destination: "/cek-password", permanent: true },
      { source: "/action-plan", destination: "/scorecard", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          // Nothing in this app needs these, so they are switched off.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
