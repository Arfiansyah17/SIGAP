import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ROUTES } from "./routes";

/**
 * Footer band, inverted against the page.
 *
 * Light theme gets the Figma deep green, dark theme a near-white band, so the
 * footer always reads as a distinct closing block rather than fading into the
 * canvas. Its colours come from the `--footer-*` tokens, and the logo uses the
 * inverted variant because the band runs opposite to the page theme.
 */
export function SiteFooter() {
  return (
    <footer
      className="mt-28 text-footer-fg"
      style={{ backgroundImage: "var(--footer-gradient)" }}
    >
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-[52ch]">
          <Logo className="h-6" inverted />
          <p className="mt-3 text-sm font-medium">
            Sistem Interaktif Gerbang Autentikasi &amp; Password
          </p>
          <p className="mt-3 text-sm leading-relaxed text-footer-muted">
            Password yang kamu masukkan tidak dikirim ke server ini dan tidak
            disimpan di mana pun. Yang keluar dari browser cuma lima karakter
            pertama dari hash-nya, dan lima karakter itu cocok dengan ratusan ribu
            password berbeda.
          </p>
        </div>

        <nav aria-label="Navigasi footer" className="flex flex-col gap-2.5">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-footer-muted">
            Halaman
          </p>
          {ROUTES.filter((route) => route.href !== "/").map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="text-sm text-footer-muted transition-colors duration-200 hover:text-footer-fg"
            >
              {route.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-footer-muted">
            Sumber data
          </p>
          <a
            href="https://haveibeenpwned.com/Passwords"
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-footer-muted transition-colors duration-200 hover:text-footer-fg"
          >
            Have I Been Pwned
          </a>
          <a
            href="https://github.com/dropbox/zxcvbn"
            target="_blank"
            rel="noreferrer noopener"
            className="text-sm text-footer-muted transition-colors duration-200 hover:text-footer-fg"
          >
            zxcvbn
          </a>
        </div>
      </div>

      <div className="border-t border-footer-line">
        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6">
          <p className="text-xs text-footer-muted">
            Tidak perlu login. Tidak ada basis data. Tidak ada pelacakan.
          </p>
        </div>
      </div>
    </footer>
  );
}
