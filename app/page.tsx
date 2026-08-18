import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/Button";
import { StatCard, type Stat } from "@/components/ui/StatCard";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { HeroVisual } from "@/components/features/HeroVisual";
import { CHECKLIST } from "@/lib/scoring";

const TOOLS = [
  {
    href: "/cek-password",
    label: "Cek Password",
    detail:
      "Satu password, dua pemeriksaan: seberapa lama bisa ditebak, dan apakah sudah pernah ikut bocor. Nama orang, kata umum, kalimat, dan tanggal lahir ditandai sebagai tidak disarankan.",
    meta: "2 pemeriksaan",
  },
  {
    href: "/scorecard",
    label: "🎮 SIGAMES",
    detail: `Checklist ${CHECKLIST.length} pertanyaan tentang kebiasaan kamu, dikemas jadi permainan singkat per kategori, lalu keluar sebagai skor dan rencana aksi.`,
    meta: `${CHECKLIST.length} pertanyaan`,
    highlight: true,
  },
];

/**
 * Headline figures. Indonesian cases first, because that is the audience.
 *
 * Every card carries a source that was opened and checked. Two figures dropped
 * along the way, and the reasoning is kept so the team can defend the choice:
 *
 *   - "200 jt+ kebocoran password Instagram" does not survive checking. The
 *     Instagram leaks at that scale were SCRAPED PROFILE DATA, not passwords.
 *   - The Meta plaintext-password case is real but is not an Indonesian story,
 *     so it lost its slot to Tokopedia and BPJS.
 *
 * Tokopedia is the strongest card SIGAP has: the passwords were hashed, and the
 * attacker publicly asked other hackers for help cracking the hash. A hash only
 * holds if the password behind it is hard to guess, which is exactly what the
 * localized strength analysis measures.
 */
const STATS: Stat[] = [
  {
    value: "91 juta",
    label: "Akun Tokopedia bocor, termasuk password ter-hash",
    href: "https://www.cnnindonesia.com/teknologi/20200503153210-185-499553/kronologi-lengkap-91-juta-akun-tokopedia-bocor-dan-dijual",
    source:
      "CNN Indonesia, Mei 2020. Peretas menjual 91 juta akun dan meminta bantuan membongkar hash passwordnya.",
  },
  {
    value: "279 juta",
    label: "Data penduduk Indonesia bocor dan dijual di forum peretas",
    href: "https://www.cnnindonesia.com/teknologi/20210903142047-185-689370/rentetan-kasus-dugaan-kebocoran-data-kesehatan-pemerintah",
    source:
      "CNN Indonesia, September 2021. Diduga dari BPJS Kesehatan: nama, KTP, nomor telepon, email, dan alamat.",
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Ambient depth behind the fold */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px] overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(900px 420px at 15% -5%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(var(--veil) 1px, transparent 1px), linear-gradient(90deg, var(--veil) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(70% 60% at 50% 0%, black, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(70% 60% at 50% 0%, black, transparent 75%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Hero */}
        <section className="grid items-center gap-x-16 gap-y-14 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-24">
          <Reveal onView={false} className="flex flex-col items-start">
            <RevealItem>
              <h1 className="mt-7 max-w-[26ch] text-4xl font-semibold leading-[1.06] tracking-tight text-fg sm:text-5xl lg:text-[3.25rem]">
                Semakin hari kasus password bocor dan hack bertambah di Indonesia
              </h1>
            </RevealItem>

            <RevealItem>
              <div className="mt-7 max-w-[60ch] space-y-4 text-[0.9375rem] leading-relaxed text-fg-subtle">
                <p>
                  SIGAP (Sistem Interaktif Gerbang Autentikasi &amp; Password) bantu kamu
                  mengenali kata sandi yang lemah, kebiasaan yang berisiko, dan celah yang
                  paling sering dipakai peretas, sebelum semua itu jadi masalah beneran.
                </p>
                  <RevealItem className="mt-12 w-full">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {STATS.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                      ))}
                    </div>
                  </RevealItem>
              </div>
            </RevealItem>

            <RevealItem className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/cek-password">
                Cek password sekarang
                <ArrowRightIcon size={15} weight="bold" />
              </ButtonLink>
              <ButtonLink href="/scorecard" variant="outline">
                Main SIGAMES
              </ButtonLink>
            </RevealItem>
          </Reveal>

          <div className="lg:pl-4">
            <HeroVisual />
          </div>
        </section>

        {/* Flow */}
        <section className="py-20 md:py-28">
          <div className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] md:gap-16">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-accent">
                Alurnya
              </p>
              <h2 className="mt-4 max-w-[22ch] text-2xl font-semibold leading-tight tracking-tight text-fg md:text-3xl">
                Dua pemeriksaan, satu rencana.
              </h2>
            </div>

            <p className="max-w-[64ch] text-sm leading-relaxed text-fg-subtle md:pt-9">
              Password kuat tidak menolong kalau sudah pernah bocor, dan password
              yang belum bocor pun tidak menolong kalau HP-nya tidak terkunci.
              Halaman pertama memeriksa passwordnya, halaman kedua memeriksa
              kebiasaannya lalu membenahi keduanya.
            </p>
          </div>

          <Reveal className="mt-14 border-t border-line">
            {TOOLS.map((tool, index) => (
              <RevealItem key={tool.href}>
                <Link
                  href={tool.href}
                  className="group relative grid gap-3 border-b border-line py-7 transition-colors duration-300 hover:bg-surface/60 md:grid-cols-[3rem_11rem_1fr_7rem] md:items-baseline md:gap-8 md:px-4"
                >
                  {/* Accent rail on hover, drawn from the row's own edge */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
                  />

                  <span className="tnum font-mono text-xs text-fg-ghost">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-fg">
                    {tool.label}
                    {tool.highlight && (
                      <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-accent">
                        inti
                      </span>
                    )}
                  </h3>

                  <p className="max-w-[68ch] text-sm leading-relaxed text-fg-subtle">
                    {tool.detail}
                  </p>

                  <span className="flex items-center gap-2.5 font-mono text-xs text-fg-ghost md:justify-end">
                    {tool.meta}
                    <ArrowRightIcon
                      size={13}
                      className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:text-accent"
                    />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        </section>
      </div>
    </div>
  );
}
