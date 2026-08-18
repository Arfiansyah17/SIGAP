import Image from "next/image";
import { cx } from "@/lib/cx";

/**
 * Theme-aware wordmark.
 *
 * Two files rather than one filtered image: the gate icon is a green gradient
 * that reads correctly on either background, but the "SIGAP" lettering is dark
 * green and disappears on the dark canvas. A CSS filter cannot fix only the
 * lettering without wrecking the icon's gradient, so each theme gets its own
 * artwork.
 *
 * Swapped in CSS, not JavaScript, so the correct variant is already painted on
 * first render and the choice survives the manual theme toggle. Both files are
 * the same 715x248, so the swap cannot shift layout.
 *
 * `inverted` is for surfaces that deliberately run against the page theme, like
 * the footer band: on a green light-theme footer the white artwork is the
 * readable one, which is the opposite of what the page itself wants.
 */
export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  const shared = cx("w-auto", className);

  return (
    <>
      <Image
        src="/logo-dark.png"
        alt="SIGAP"
        width={715}
        height={248}
        priority
        aria-hidden={inverted}
        className={cx(shared, inverted ? "logo-inv-on-dark" : "logo-on-dark")}
      />
      <Image
        src="/logo.png"
        alt="SIGAP"
        width={715}
        height={248}
        priority
        aria-hidden={!inverted}
        className={cx(shared, inverted ? "logo-inv-on-light" : "logo-on-light")}
      />
    </>
  );
}
