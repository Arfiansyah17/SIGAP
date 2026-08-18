import Link from "next/link";
import { ArrowRightIcon, ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "@/lib/cx";

/**
 * Statistic card with a dashed gradient stroke.
 *
 * The dashed edge does real work rather than decorating: it marks the figure as
 * a cited external claim, visually distinct from the solid panels elsewhere that
 * show values this app computed itself.
 *
 * WHY SVG AND NOT `border`. A dashed border and a gradient border are mutually
 * exclusive in CSS: `border-image` with a gradient overrides `border-style`, so
 * the dashes disappear. Mask tricks can build a gradient ring but cannot make
 * dashes follow a rounded perimeter. An SVG rect with `stroke-dasharray` is the
 * only way to get both, and it stays crisp because the SVG viewport is in CSS
 * pixels (no viewBox, so 1 user unit = 1px).
 *
 * The card renders as a link only when `href` is given, so the external-link
 * affordance never appears on something that cannot be opened.
 */

export type Stat = {
  /** The headline figure, e.g. "200 jt+". */
  value: string;
  /** What the figure counts. Kept to one line. */
  label: string;
  /**
   * Where the claim can be checked. External for cited news and datasets,
   * internal (starting with "/") for figures about how SIGAP itself works.
   * Every card must have one: an uncited number is a liability in front of
   * judges.
   */
  href: string;
  /** Publication or dataset the figure comes from, shown on hover. */
  source: string;
};

const RADIUS = 8;
const STROKE = 2.5;

/** Stable, collision-free gradient id derived from the label. */
function gradientId(label: string): string {
  return `stat-stroke-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function DashedFrame({ id }: { id: string }) {
  return (
    <svg
      aria-hidden
      // Inset by half the stroke width so the stroke, which straddles the path,
      // lands fully inside the card instead of clipping at the edge.
      className="pointer-events-none absolute"
      style={{ inset: STROKE / 2 }}
      width="100%"
      height="100%"
    >
      <defs>
        {/*
          The colours go through `style`, not the `stop-color` attribute.
          `var()` is only substituted in CSS declarations; SVG presentation
          attributes are parsed without variable substitution, so
          `stop-color="var(--x)"` silently renders black.
        */}
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--card-stroke-from)" }} />
          <stop offset="100%" style={{ stopColor: "var(--card-stroke-to)" }} />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={RADIUS - STROKE / 2}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={STROKE}
        strokeDasharray="7 5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StatCard({ value, label, href, source }: Stat) {
  const id = gradientId(label);
  const external = !href.startsWith("/");
  const Icon = external ? ArrowSquareOutIcon : ArrowRightIcon;

  const body = (
    <>
      <DashedFrame id={id} />

      <div className="relative flex items-start justify-between gap-3">
        <p className="tnum text-lg font-bold leading-none tracking-tight text-fg">
          {value}
        </p>
        <Icon
          size={14}
          className="mt-0.5 shrink-0 text-fg-faint transition-colors duration-200 group-hover:text-accent"
        />
      </div>
      <p className="relative mt-2 text-xs leading-snug text-fg-subtle">{label}</p>
    </>
  );

  const shell = cx(
    "group relative block bg-surface px-4 py-3.5",
    "transition-colors duration-200 hover:bg-surface-hi",
  );

  // Internal links go through next/link so navigation stays client-side; only
  // external sources open in a new tab.
  if (!external) {
    return (
      <Link href={href} title={source} className={shell} style={{ borderRadius: RADIUS }}>
        {body}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={source}
      className={shell}
      style={{ borderRadius: RADIUS }}
    >
      {body}
    </a>
  );
}
