/** Shared route table. Kept free of client code so server components can read it. */
export const ROUTES = [
  { href: "/", label: "Beranda" },
  { href: "/cek-password", label: "Cek Password" },
  { href: "/scorecard", label: "SIGAMES" },
] as const;
