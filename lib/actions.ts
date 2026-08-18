/**
 * Action playbook (PRD F4): what to actually do about each scorecard gap.
 *
 * Centralised here rather than spread through JSX, so every settings link lives
 * in one auditable place.
 *
 * LINK POLICY. A step carries a `url` only where a stable public settings page
 * exists and we are confident of the address. Everything that lives inside a
 * mobile app (WhatsApp, DANA, GoPay, Shopee) is given as a menu path instead,
 * because those screens have no stable web URL and a plausible-looking guess
 * would send people to a dead page. Where a URL is likely but not confirmed it
 * is marked `verify: true` and rendered with a warning in the UI.
 *
 * The PRD requires the team to verify every URL manually before submission.
 * Call `unverifiedLinks()` to get the outstanding list.
 */

export type Step = {
  /** Where the step happens. */
  where: string;
  /** In-app menu path, written the way the app labels it. */
  menu?: string;
  /** Direct link, only where a stable settings URL exists. */
  url?: string;
  /** True when the URL still needs manual confirmation by the team. */
  verify?: boolean;
};

export type Recipe = {
  /** Matches a `ChecklistItem.id` in `lib/scoring.ts`. */
  id: string;
  /** Imperative and plain. This is the to-do title. */
  title: string;
  /** One sentence on the consequence of skipping it. */
  why: string;
  /** Rough time to finish, in minutes. */
  minutes: number;
  steps: Step[];
  /** Optional technical detail, shown behind a disclosure. */
  deeper?: string;
};

export const PLAYBOOK: Record<string, Recipe> = {
  "mfa-email": {
    id: "mfa-email",
    title: "Aktifkan verifikasi dua langkah di email utama",
    why: 'Email utama adalah kunci semua akun lain, karena semua tombol "lupa password" mengirim ke sana.',
    minutes: 10,
    steps: [
      {
        where: "Akun Google",
        menu: "Keamanan, Verifikasi 2 Langkah, Aplikasi Authenticator",
        url: "https://myaccount.google.com/signinoptions/two-step-verification",
      },
      {
        where: "Google",
        menu: "Jalankan Pemeriksaan Keamanan sekalian",
        url: "https://myaccount.google.com/security-checkup",
      },
      {
        where: "Akun Microsoft",
        menu: "Keamanan, Opsi keamanan lanjutan",
        url: "https://account.microsoft.com/security",
      },
    ],
    deeper:
      "Pakai aplikasi authenticator (TOTP), bukan SMS. Kode TOTP dibuat dari jam perangkat dan satu kunci rahasia, tanpa jaringan, jadi tidak ada yang bisa dialihkan. Nomor HP sebaliknya bisa diambil alih lewat penipuan ke gerai operator.",
  },

  "password-reuse": {
    id: "password-reuse",
    title: "Berhenti memakai satu kata sandi di banyak layanan",
    why: "Satu situs kecil yang bocor cukup untuk membuka email dan e-wallet kamu, karena penyerang mencoba kombinasi yang sama ke mana-mana.",
    minutes: 30,
    steps: [
      {
        where: "Akun Google",
        menu: "Keamanan, Pengelola Sandi, Pemeriksaan Sandi",
        url: "https://passwords.google.com/checkup",
      },
      { where: "DANA", menu: "Saya, Pengaturan, Ubah PIN" },
      { where: "GoPay", menu: "Akun, Pengaturan akun, Keamanan" },
      { where: "Shopee", menu: "Saya, Pengaturan Akun, Akun & Keamanan" },
    ],
    deeper:
      "Serangan ini disebut credential stuffing: daftar email dan sandi dari kebocoran lama dicoba otomatis ke ratusan layanan. Yang menahannya bukan kekuatan sandi, tapi fakta bahwa sandi itu tidak dipakai di tempat lain. Urutan penggantian yang benar: email dulu, lalu akun keuangan, lalu sisanya.",
  },

  "password-manager": {
    id: "password-manager",
    title: "Pasang password manager",
    why: "Kata sandi yang harus dihafal akan selalu pendek dan berulang, dan itu batas manusia, bukan soal disiplin.",
    minutes: 20,
    steps: [
      { where: "Bitwarden (gratis)", url: "https://bitwarden.com/" },
      { where: "KeePassXC (offline)", url: "https://keepassxc.org/" },
      {
        where: "Chrome",
        menu: "Setelan, Isi otomatis, Pengelola sandi, lalu kosongkan sandi tersimpan",
      },
    ],
    deeper:
      "Sandi yang disimpan di browser terbuka begitu profil browser kamu diakses. Password manager memisahkan penyimpanan itu di balik satu sandi utama yang bisa dikunci ulang kapan saja.",
  },

  "recovery-phone": {
    id: "recovery-phone",
    title: "Daftarkan nomor HP sebagai jalur pemulihan",
    why: "Tanpa jalur pemulihan yang kamu kuasai, akun yang hilang praktis tidak bisa diambil kembali.",
    minutes: 5,
    steps: [
      {
        where: "Akun Google",
        menu: "Info pribadi, Kontak, Nomor telepon pemulihan",
        url: "https://myaccount.google.com/signinoptions/rescuephone",
        verify: true,
      },
      {
        where: "WhatsApp",
        menu: "Setelan, Akun, Verifikasi dua langkah, tambahkan email",
      },
    ],
    deeper:
      "Nomor pemulihan berguna untuk memulihkan akses, tapi jangan dijadikan satu-satunya faktor kedua. Simpan juga kode cadangan luring, supaya kehilangan HP tidak berarti kehilangan akun.",
  },

  "recovery-email": {
    id: "recovery-email",
    title: "Pastikan email pemulihan masih hidup dan bisa kamu buka",
    why: "Email pemulihan yang mati bukan cuma tidak berguna, tapi bisa berbalik jadi celah kalau alamatnya didaftarkan ulang orang lain.",
    minutes: 10,
    steps: [
      {
        where: "Akun Google",
        menu: "Keamanan, Email pemulihan",
        url: "https://myaccount.google.com/recovery/email",
        verify: true,
      },
      {
        where: "Semua akun",
        menu: "Coba login ke email pemulihan itu sekarang, pastikan masih bisa dibuka",
      },
    ],
  },

  "active-sessions": {
    id: "active-sessions",
    title: "Periksa dan cabut sesi login yang tidak kamu kenali",
    why: "Sesi lama tetap terbuka tanpa perlu kata sandi lagi, termasuk di HP yang sudah kamu jual atau komputer warnet yang pernah kamu pakai.",
    minutes: 10,
    steps: [
      {
        where: "Akun Google",
        menu: "Keamanan, Perangkat kamu",
        url: "https://myaccount.google.com/device-activity",
      },
      { where: "WhatsApp", menu: "Setelan, Perangkat tertaut" },
      {
        where: "Instagram",
        menu: "Pusat Akun, Kata sandi dan keamanan, Tempat kamu masuk",
        url: "https://accountscenter.instagram.com/password_and_security/",
      },
      { where: "Shopee", menu: "Saya, Pengaturan Akun, Perangkat Login" },
    ],
    deeper:
      "Sekalian cabut akses aplikasi pihak ketiga di halaman Koneksi akun Google. Token OAuth tidak kedaluwarsa sendiri, jadi aplikasi yang kamu izinkan bertahun lalu masih bisa membaca data sesuai izin awalnya.",
  },

  "sideload-apk": {
    id: "sideload-apk",
    title: "Hapus aplikasi dari luar Play Store dan matikan izin instal sembarangan",
    why: "Aplikasi di luar Play Store tidak diperiksa siapa pun, dan ini cara paling sering dipakai penipu buat mencuri kode OTP dan saldo e-wallet.",
    minutes: 15,
    steps: [
      {
        where: "Android",
        menu: "Setelan, Aplikasi, Akses khusus aplikasi, Pasang aplikasi tak dikenal, matikan semua",
      },
      {
        where: "Android",
        menu: "Setelan, Aplikasi, hapus yang tidak kamu pasang dari Play Store",
      },
      {
        where: "Android",
        menu: "Setelan, Aksesibilitas, cabut izin aplikasi yang tidak kamu kenali",
      },
      { where: "Play Protect", menu: "Play Store, profil, Play Protect, Pindai perangkat" },
    ],
    deeper:
      "Aplikasi penyadap biasanya meminta izin Aksesibilitas atau akses Notifikasi, karena dua izin itu memungkinkan membaca kode OTP yang masuk tanpa perlu membuka SMS. Jadi yang perlu diperiksa adalah daftar izin itu, bukan cuma daftar aplikasinya.",
  },

  "public-wifi": {
    id: "public-wifi",
    title: "Jangan buka akun penting di Wi-Fi publik",
    why: "Di jaringan publik, orang lain bisa mengarahkan koneksi kamu ke halaman login palsu yang tampak asli.",
    minutes: 5,
    steps: [
      {
        where: "HP",
        menu: "Pakai hotspot pribadi, bukan Wi-Fi kafe, untuk m-banking dan e-wallet",
      },
      {
        where: "Android & iPhone",
        menu: "Matikan sambung otomatis untuk Wi-Fi publik yang pernah dipakai",
      },
      {
        where: "Chrome",
        menu: "Setelan, Privasi dan keamanan, Keamanan, Gunakan DNS aman",
      },
    ],
    deeper:
      "HTTPS sudah melindungi isi lalu lintas, jadi risiko terbesarnya bukan penyadapan langsung melainkan portal login palsu dan pengalihan DNS. Keduanya hilang kalau jaringan itu tidak dipakai untuk hal penting.",
  },

  "exposed-personal-data": {
    id: "exposed-personal-data",
    title: "Tutup tanggal lahir dan data pribadi di media sosial",
    why: "Data itu justru yang dipakai layanan sebagai pertanyaan keamanan, jadi membukanya sama dengan membocorkan kunci cadangan.",
    minutes: 15,
    steps: [
      {
        where: "Facebook",
        menu: "Pusat Akun, Informasi pribadi",
        url: "https://accountscenter.facebook.com/personal_info",
        verify: true,
      },
      {
        where: "Instagram",
        menu: "Pengaturan, Privasi akun, jadikan akun privat",
        url: "https://accountscenter.instagram.com/",
      },
      {
        where: "WhatsApp",
        menu: "Setelan, Privasi, Foto profil dan Info, batasi ke Kontak saya",
      },
    ],
    deeper:
      "Nama ibu, tanggal lahir, dan nama sekolah adalah bahan baku rekayasa sosial ke call center. Penyerang tidak perlu menembus sistem kalau bisa meyakinkan petugas bahwa dia adalah kamu.",
  },

  "clicked-unknown-link": {
    id: "clicked-unknown-link",
    title: "Amankan akun setelah mengklik tautan yang tidak dikenal",
    why: "Satu klik cukup untuk membuka halaman login palsu atau memasang aplikasi penyadap, dan efeknya sering baru terasa berhari-hari kemudian.",
    minutes: 20,
    steps: [
      {
        where: "Akun Google",
        menu: "Jalankan Pemeriksaan Keamanan, lalu ganti sandi",
        url: "https://myaccount.google.com/security-checkup",
      },
      {
        where: "Akun Google",
        menu: "Keamanan, Perangkat kamu, keluarkan perangkat asing",
        url: "https://myaccount.google.com/device-activity",
      },
      { where: "Android", menu: "Setelan, Aksesibilitas, cabut izin aplikasi asing" },
      {
        where: "Kebiasaan",
        menu: "Buka layanan lewat aplikasi resminya, jangan lewat tautan di pesan",
      },
    ],
    deeper:
      "Halaman phishing modern menyalin tampilan aslinya persis, jadi menilai dari tampilan sudah tidak cukup. Yang tidak bisa dipalsukan adalah cara kamu membukanya: kalau kamu mengetik sendiri alamatnya atau membuka aplikasi resminya, halaman palsu tidak akan pernah muncul.",
  },
};

/** Recipes for the given checklist ids, in the order supplied. */
export function recipesFor(ids: string[]): Recipe[] {
  return ids
    .map((id) => PLAYBOOK[id])
    .filter((recipe): recipe is Recipe => Boolean(recipe));
}

/** Every step whose URL the team still has to confirm before submission. */
export function unverifiedLinks(): { recipe: string; where: string; url: string }[] {
  const out: { recipe: string; where: string; url: string }[] = [];

  for (const recipe of Object.values(PLAYBOOK)) {
    for (const step of recipe.steps) {
      if (step.verify && step.url) {
        out.push({ recipe: recipe.id, where: step.where, url: step.url });
      }
    }
  }

  return out;
}
