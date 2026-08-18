"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { cx } from "@/lib/cx";
import { ROUTES } from "./routes";
import { ThemeToggle } from "./ThemeToggle";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // A drawer that scrolls the page behind it feels broken on touch.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center transition-opacity duration-200 hover:opacity-80"
        >
          <Logo className="h-6" />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {ROUTES.map((route) => {
            const active = pathname === route.href;

            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative rounded-lg px-3 py-2 text-[0.8125rem] transition-colors duration-200",
                  active ? "text-fg" : "text-fg-subtle hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    // Shared element: the pill slides between routes
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg border border-line-strong bg-surface-hi"
                    transition={{ type: "spring", stiffness: 340, damping: 32 }}
                  />
                )}
                <span className="relative">{route.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="-mr-2 grid size-9 place-items-center rounded-lg text-fg-muted transition-colors duration-200 hover:bg-surface-hi hover:text-fg active:scale-[0.96] md:hidden"
          >
            {open ? <XIcon size={18} /> : <ListIcon size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-14 z-30 bg-canvas/75 md:hidden"
            />

            <motion.nav
              id="mobile-nav"
              aria-label="Navigasi utama"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="absolute inset-x-0 top-14 z-40 border-b border-line bg-surface px-4 pb-3 md:hidden"
            >
              {ROUTES.map((route) => {
                const active = pathname === route.href;

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    // Closing here rather than on a pathname effect: the tap is
                    // the intent, and tapping the current route should close too.
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center justify-between border-b border-line py-3.5 text-sm transition-colors duration-200 last:border-b-0",
                      active ? "text-accent" : "text-fg-muted active:text-fg",
                    )}
                  >
                    {route.label}
                    {active && (
                      <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                    )}
                  </Link>
                );
              })}

              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-fg-faint">Tema tampilan</span>
                <ThemeToggle />
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
