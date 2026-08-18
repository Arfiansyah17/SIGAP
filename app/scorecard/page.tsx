import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScorecardWizard } from "@/components/features/ScorecardWizard";
import { CHECKLIST } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "SIGAMES",
  description:
    `SIGAMES (SIGAP Games): jawab ${CHECKLIST.length} pertanyaan singkat tentang kebiasaan keamanan akun kamu, lalu dapatkan skor dan daftar hal yang perlu dibenahi lebih dulu. Jawaban disimpan hanya di perangkat kamu.`,
};

export default function ScorecardPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 md:py-20">
      <PageHeader
        eyebrow="🎮 SIGAMES · SIGAP Games"
        title="Seberapa aman kebiasaan digital kamu?"
      >
        <p>
          {CHECKLIST.length} pertanyaan cepat, empat kategori, dikemas jadi
          permainan singkat daripada kuisioner biasa. Jawab semuanya dulu, baru
          skornya muncul beserta daftar hal yang paling berpengaruh untuk
          dibenahi lebih dulu. Jawaban kamu disimpan di browser ini saja.
        </p>
      </PageHeader>

      <div className="mt-14 md:mt-16">
        <ScorecardWizard />
      </div>

      <Card className="mt-20 grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
        <h2 className="max-w-[24ch] text-xl font-semibold leading-tight tracking-tight text-fg">
          Cara membaca skornya
        </h2>

        <div className="max-w-[68ch] space-y-4 text-sm leading-relaxed text-fg-subtle">
          <p>
            Tiap pertanyaan punya bobot berbeda. Yang paling berat adalah hal yang
            paling sering jadi pembeda saat akun benar-benar dibajak, misalnya
            memakai kata sandi yang sama di banyak tempat, atau verifikasi dua
            langkah yang masih lewat SMS.
          </p>
          <p>
            Bobotnya adalah urutan prioritas, bukan hasil pengukuran. Angkanya
            berguna untuk memutuskan apa yang dikerjakan lebih dulu, bukan untuk
            diklaim sebagai persentase risiko yang sebenarnya.
          </p>
          <p>
            Skornya sengaja ditahan sampai semua pertanyaan dijawab. Skor dari
            separuh jawaban bukan gambaran keadaan siapa pun, dan angka setengah
            matang justru bikin salah ambil keputusan.
          </p>
          <p>
            Jawaban tersimpan di penyimpanan lokal browser ini saja. Menekan
            &ldquo;Mulai ulang&rdquo; menghapusnya, dan tidak ada salinan di tempat
            lain.
          </p>
        </div>
      </Card>
    </div>
  );
}
