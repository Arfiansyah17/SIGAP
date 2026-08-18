import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PasswordAudit } from "@/components/features/PasswordAudit";
import { FlaggedTermsList } from "@/components/features/FlaggedTermsList";

export const metadata: Metadata = {
  title: "Cek Password",
  description:
    "Cek kekuatan password dan riwayat kebocorannya sekaligus. Nama orang, kata umum, kalimat, dan tanggal lahir ditandai sebagai tidak disarankan. Password tidak pernah dikirim utuh ke server.",
};

const FLAGGED = [
  {
    term: "Nama orang",
    detail:
      "Nama depan, nama keluarga, atau gabungannya, di posisi mana pun dalam password. Nama adalah hal pertama yang dicoba karena bisa dibaca dari profil media sosial kamu.",
  },
  {
    term: "Kata dan kalimat umum",
    detail:
      "Kata sehari-hari, nama kota, klub bola, sampai kalimat yang cuma dihapus spasinya seperti akucintakamu. Panjang tidak menolong kalau kalimatnya sendiri yang ditebak.",
  },
  {
    term: "Tanggal lahir",
    detail:
      "Dalam format apa pun: 17082003, 170803, 17-08-2003, atau cuma tahunnya. Seluruh kemungkinan tanggal lahir cuma beberapa puluh ribu, dan biasanya terpampang di profil.",
  },
  {
    term: "Pola keyboard dan angka pengganti huruf",
    detail:
      "Urutan tombol berdekatan seperti qwerty atau asdf, dan substitusi a jadi 4 atau i jadi 1. Penyerang sudah lama membalik substitusi itu otomatis.",
  },
  {
    term: "Suku kata berulang",
    detail:
      "Pola seperti budibudi atau kokokoko. Panjangnya jadi tidak berarti karena yang perlu ditebak hanya potongan pendeknya.",
  },
];

const STEPS = [
  "Password diubah jadi kode acak (hash SHA-1) di browser kamu.",
  "Cuma 5 karakter pertama kode itu yang dikirim ke server.",
  "Server balas semua kode yang awalannya sama, ditambah entri palsu.",
  "35 karakter sisanya dicocokkan lagi di browser kamu.",
];

export default function CekPasswordPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20">
      <PageHeader eyebrow="Cek Password" title="Seberapa aman password kamu?">
        <p>
          Satu password, dua pemeriksaan sekaligus: seberapa lama bisa ditebak, dan
          apakah sudah pernah ikut bocor. Keduanya perlu lulus, karena password
          kuat yang sudah bocor tetap berbahaya.
        </p>
      </PageHeader>

      <div className="mt-14 md:mt-16">
        <PasswordAudit />
      </div>

      <Card className="mt-20 grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
        <div className="max-w-[30ch]">
          <h2 className="text-xl font-semibold leading-tight tracking-tight text-fg">
            Apa saja yang ditandai umum?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-subtle">
            Kebanyakan pengecekan kekuatan password cuma mengandalkan kamus
            bahasa Inggris, jadi hal-hal berikut ini lolos begitu saja di alat
            lain. SIGAP menandai semuanya sebagai umum dan tidak disarankan
            dipakai sebagai password.
          </p>
        </div>

        <FlaggedTermsList items={FLAGGED} />
      </Card>

      <Card className="mt-8 grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
        <div className="max-w-[30ch]">
          <h2 className="text-xl font-semibold leading-tight tracking-tight text-fg">
            Kok bisa dicek tanpa tahu passwordnya?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-subtle">
            Caranya disebut k-anonymity. Semua langkahnya bisa kamu lihat sendiri
            di tab Network browser kamu.
          </p>
        </div>

        <div>
          <ol className="divide-y divide-line border-t border-line">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-5 py-4 text-sm leading-relaxed text-fg-subtle"
              >
                <span className="tnum mt-0.5 shrink-0 font-mono text-xs text-fg-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-[64ch] text-sm leading-relaxed text-fg-faint">
            Lima karakter itu dipakai bareng ratusan ribu password lain, jadi server
            tidak tahu yang mana punya kamu. Analisis kekuatan bahkan tidak
            mengirim apa pun sama sekali.
          </p>
        </div>
      </Card>
    </div>
  );
}
