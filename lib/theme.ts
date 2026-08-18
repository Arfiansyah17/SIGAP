/**
 * Theme preference, stored on the device only.
 *
 * No cookie and no server state, so the choice never travels with a request.
 * That keeps theming consistent with the project's privacy-by-design principle:
 * the server learns nothing about the visitor, not even their colour scheme.
 */

export const THEME_KEY = "sigap.theme";

/**
 * Only two themes: no "follow the OS" mode. Light is always the default for a
 * first-time visitor, regardless of `prefers-color-scheme`; dark is opt-in and
 * remembered once chosen.
 */
export type ThemePreference = "light" | "dark";

/**
 * Bootstrap script, injected inline and run before first paint.
 *
 * This must stay dependency-free and synchronous. It reads the stored choice
 * and stamps `data-theme="dark"` on <html> before the browser paints, which is
 * what stops a flash of the wrong theme. The CSS default is already light, so
 * light needs no attribute at all: only an explicit "dark" choice writes one.
 */
export const THEME_BOOTSTRAP = `
(function () {
  try {
    if (localStorage.getItem('${THEME_KEY}') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {
    /* Storage blocked: fall through to the CSS default (light). */
  }
})();
`.trim();

/** Apply a preference to the document and persist it. */
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;

  if (preference === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }

  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Preference simply will not survive a reload; the page still works.
  }
}

/** Read the stored preference. Returns `light` when nothing is stored. */
export function readTheme(): ThemePreference {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
