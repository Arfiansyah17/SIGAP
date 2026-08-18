import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Grain } from "@/components/ui/Grain";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import { SiteNav } from "@/components/features/SiteNav";
import { SiteFooter } from "@/components/features/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SIGAP, Sistem Interaktif Gerbang Autentikasi & Password",
    template: "%s, SIGAP",
  },
  description:
    "Cek kekuatan password, apakah password kamu pernah bocor, dan seberapa aman kebiasaan online kamu. Semua diperiksa langsung di browser tanpa dikirim ke server.",
  applicationName: "SIGAP",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      /*
       * The bootstrap script below stamps `data-theme` on this element before
       * React hydrates, so the client DOM legitimately carries an attribute the
       * server never rendered. Without this, React reports an attribute
       * mismatch on <html>.
       *
       * Scoped to this element only: it does not suppress warnings for any
       * descendant, so a real mismatch inside the app still surfaces.
       */
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/*
          Runs synchronously during parse, before the browser paints, so the
          stored theme is applied without a flash of the default one.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <Grain />
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
