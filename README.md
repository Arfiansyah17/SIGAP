# SIGAP

**Sistem Interaktif Gerbang Autentikasi & Password**

Alat pemeriksaan privasi dan keamanan akun yang **tidak pernah mengirim kata
sandi kamu ke server**. Bedanya dengan alat sejenis: SIGAP tidak berhenti di
angka. Hasil pemeriksaan diubah jadi rencana aksi berurutan, di mana tiap
langkah menyebutkan menu persisnya dan tautan ke halaman setelan aslinya.

Dibuat untuk Lomba Web Development FTI FEST 2026, subtema Privasi Data dan
Perlindungan Identitas Digital.

## Fitur

| Halaman | Fitur | Fungsi |
| --- | --- | --- |
| `/cek-password` | F1 + F2 | Satu password, dua verdict: kekuatan (zxcvbn + aturan Indonesia) dan riwayat kebocoran (k-anonymity) |
| `/scorecard` | F3 + F4 | 10 pertanyaan berbobot, lalu rencana aksi personal dalam modal, lengkap dengan tautan setelan |

F1 dan F2 digabung dalam satu halaman karena keduanya menjawab pertanyaan tentang
password yang sama, dan pengguna perlu lulus dua-duanya: password kuat yang sudah
bocor tetap berbahaya. Kekuatan dihitung hidup sambil mengetik karena gratis;
kebocoran butuh jaringan jadi jalan lewat tombol eksplisit. Rute lama
`/breach-check` dan `/password-strength` di-redirect permanen ke `/cek-password`.

## Akun demo

**Website ini tidak memerlukan login, dan tidak menyediakan akun demo.** Itu
bukan kekurangan, tapi bagian dari desainnya: tidak ada akun berarti tidak ada
basis data pengguna, tidak ada sesi, dan tidak ada data yang bisa bocor dari
sisi kami. Juri bisa langsung memakai seluruh fitur tanpa mendaftar.

## Arsitektur k-anonymity (F1)

Ini bagian yang membuat klaim privasi bisa diverifikasi, bukan cuma dijanjikan.

1. Kata sandi di-hash **SHA-1 di browser** lewat Web Crypto
   (`crypto.subtle.digest`), hasilnya uppercase hex 40 karakter.
2. Hanya **5 karakter pertama** hash itu yang dikirim ke `/api/breach`.
3. API route meneruskan prefix tersebut ke
   `https://api.pwnedpasswords.com/range/{prefix}` dengan header
   `Add-Padding: true`, supaya ukuran balasan tidak membocorkan jumlah
   kecocokan yang sebenarnya.
4. Balasan HIBP berupa **plain text**, baris-baris `SUFFIX:COUNT`.
5. Pencocokan **35 karakter sisanya dilakukan di sisi klien**.

Kata sandi lengkap dan hash lengkapnya tidak pernah meninggalkan browser. Prefix
5 karakter dipakai bersama ratusan ribu kata sandi berbeda, jadi permintaannya
tidak menunjuk ke satu pun di antaranya.

Bisa dibuktikan sendiri: buka tab Network, ketik kata sandi, lalu lihat bahwa
satu-satunya permintaan keluar adalah `GET /api/breach?prefix=XXXXX`.

Endpoint `range` gratis dan tidak butuh API key, jadi tidak ada kredensial yang
perlu disimpan.

## Analisis kekuatan kata sandi terlokalkan (F2)

zxcvbn adalah standar de facto, tapi kamusnya berbahasa Inggris. Akibatnya nama
Indonesia dianggap string acak: `arfiansyah12` diberi skor **4 (sangat kuat)**
oleh zxcvbn standar, padahal untuk penyerang lokal itu tebakan halaman pertama.

SIGAP memperluas zxcvbn, bukan menggantinya:

1. **Kamus Indonesia** di [`lib/dictionaries/`](lib/dictionaries/) berisi nama
   depan, nama keluarga, kata umum, kota dan provinsi, klub bola, serta pola
   sandi yang lazim dipakai. Semuanya diumpankan lewat parameter `user_inputs`
   milik zxcvbn, jadi ikut diproses matcher bawaannya (pembalikan kata, l33t,
   kapitalisasi).
2. **Lapisan penalti lokal** di [`lib/password-rules.ts`](lib/password-rules.ts)
   menangkap pola gabungan yang tetap lolos, terutama nama + angka.

Rumus penggabungannya didokumentasikan di komentar `combineScore()`:

```
effectiveGuesses = baseGuesses / (divisor_1 x divisor_2 x ...)
skorAkhir        = min(skor zxcvbn, skor(effectiveGuesses), semua scoreCap)
```

Divisor dikalikan karena tiap aturan menggambarkan pengurangan ruang tebak yang
independen. `scoreCap` adalah pernyataan bahwa pola itu ada di halaman pertama
wordlist penyerang, seberapa besar pun hasil aritmetikanya. Lapisan ini **hanya
bisa menurunkan** skor, tidak pernah menaikkan.

Sembilan aturan lokal, dan semuanya memindai **di posisi mana pun** dalam
password, bukan hanya di awal atau akhir:

| Aturan | Contoh yang ditandai |
| --- | --- |
| `nama-orang` | nama depan atau nama keluarga di mana pun, termasuk gabungan |
| `nama-angka` | `arfiansyah12`, `setiawan99` |
| `nama-tahun` | `budi1995`, `sitinurhaliza1988` |
| `tanggal-lahir` | `17082003`, `170803`, `17-08-2003`, `1998` |
| `kata-umum` | kata sehari-hari, kota, klub bola |
| `kalimat-umum` | `akucintakamu`, rangkaian kata yang cuma dihapus spasinya |
| `keyboard-lokal` | `qwertyui`, `asdfgh` |
| `leetspeak-lokal` | `s4y4ngku`, `4rfi4nsy4h` |
| `suku-ulang` | `budibudi`, `kokokoko` |

Semuanya dilabeli "umum dan tidak disarankan" dalam bahasa Indonesia, lengkap
dengan potongan yang memicunya.

Dua penjagaan supaya tidak asal menuduh. Pertama, kecocokan sebagian di bawah 35%
panjang password tidak dilaporkan dan tidak pernah meng-cap skor, karena
pemindaian substring menghasilkan kecocokan insidental: `listrik` mengandung
`istri`, dan satu kecocokan lima huruf tidak boleh menjatuhkan passphrase empat
kata. Kedua, leetspeak hanya dihitung kalau pembalikannya benar-benar
menghasilkan huruf baru di bagian kata, sehingga `arfiansyah12` tidak dicap
leetspeak cuma karena angka `12` di belakangnya bisa dibaca `iz`.

Hasil untuk `arfiansyah12`: zxcvbn standar 4, dengan kamus lokal 1, setelah
penalti **0**. Passphrase yang benar-benar kuat seperti
`gerbong-mangga-listrik-payung` tetap 4.

Seluruh analisis berjalan di browser. Nol permintaan jaringan.

## Menjalankan secara lokal

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Tidak perlu API key atau variabel lingkungan, karena
endpoint Pwned Passwords yang dipakai bersifat publik.

```bash
npm run build      # build produksi
npm run lint       # eslint
npm test           # vitest, 26 kasus uji logika kata sandi
npx tsc --noEmit   # typecheck
```

## Teknologi

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**, token warna semantik di `app/globals.css`
- **zxcvbn** untuk analisis kekuatan kata sandi, dimuat lazy setelah paint
- **Web Crypto API** untuk SHA-1, bawaan browser
- **Motion** untuk transisi state
- **Phosphor Icons**
- **Vitest** untuk pengujian
- Deploy di **Vercel**

Alasan pemilihan: satu repo untuk frontend dan API route proxy, deploy otomatis
dari GitHub, HTTPS bawaan, dan URL production yang stabil sepanjang periode
penilaian.

## Tema terang dan gelap

Gelap adalah default. Tema terang dirancang terpisah, bukan hasil pembalikan
warna: canvas-nya putih hangat dengan panel putih murni (surface justru makin
terang saat makin ke depan, kebalikan dari tema gelap), dan warna aksen serta
status dibuat lebih gelap dan lebih pekat supaya tetap terbaca.

- Semua warna adalah token semantik (`--surface`, `--line`, `--fg-muted`,
  `--accent`), tidak ada kelas warna Tailwind yang di-hardcode di komponen.
- Preferensi sistem (`prefers-color-scheme`) dihormati saat pertama dibuka,
  setelah itu pilihan manual menang.
- Pilihan disimpan **hanya di localStorage**. Tidak ada cookie dan tidak ada
  state di server, jadi server tidak pernah tahu tema yang dipakai pengunjung.
- Skrip kecil di `app/layout.tsx` berjalan sebelum paint pertama, sehingga tidak
  ada kedipan tema yang salah saat halaman dimuat.
- Kontras diverifikasi, bukan dikira-kira. Rasio terendah di kedua tema adalah
  3.47:1 untuk teks sekunder (target AA untuk teks besar dan elemen UI: 3.0);
  seluruh teks utama, aksen, dan warna status melewati 4.5:1 baik di canvas
  maupun di panel. Warna hijau, kuning, dan merah tetap jelas berbeda di kedua
  tema.

## Keamanan yang diterapkan

- **Kata sandi tidak pernah dikirim utuh.** Hashing di browser, hanya 5 karakter
  prefix yang keluar. Tidak pernah masuk log, tidak pernah masuk state global.
- **Validasi input dua sisi.** Klien memvalidasi sebelum kirim; API route menolak
  apa pun yang bukan tepat 5 karakter heksadesimal (`isValidPrefix`).
- **Rate limiting** pada `/api/breach`: 20 permintaan per menit per klien, dengan
  header `Retry-After` saat diblokir. Lihat
  [`lib/rate-limit.ts`](lib/rate-limit.ts) untuk batasannya yang diakui jujur
  (in-memory, jadi per-instance di serverless).
- **Security headers global** di `next.config.ts`: `Content-Security-Policy`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, `Permissions-Policy`, dan
  `Strict-Transport-Security`. CSP-nya memakai `connect-src 'self'`, artinya
  browser dilarang mengirim apa pun ke host pihak ketiga. Ini yang membuat klaim
  privasi ditegakkan oleh browser, bukan sekadar dipercaya.
- **Tidak ada basis data, tidak ada autentikasi, tidak ada analytics, tidak ada
  cookie pihak ketiga.** Jawaban scorecard hanya di `localStorage`; centang
  rencana aksi hanya di React state.
- **Timeout upstream** 6 detik, supaya layanan sumber yang lambat tidak
  menggantung permintaan pengguna.

## Palet dan brand

| Peran | Nilai | Dipakai untuk |
| --- | --- | --- |
| Main | `#FDFDFD` | Teks di tema gelap, canvas di tema terang |
| Secondary | gradien `#8ACD65` ke `#0F847E` | Dekorasi saja, lihat catatan di bawah |
| Third | `#203734` | Canvas tema gelap |

Logo tersedia dua varian di `public/`: `logo.png` (wordmark hijau-gelap, untuk
tema terang) dan `logo-dark.png` (wordmark putih, untuk tema gelap). Keduanya
715x248 dan ditukar lewat CSS, bukan JavaScript, supaya varian yang benar sudah
tergambar sejak render pertama dan tetap ikut saat tema diganti manual.

Footer sengaja dibalik terhadap halaman: tema terang memakai band hijau Figma
`#155137` dengan teks putih, tema gelap memakai band putih `#FDFDFD` dengan teks
gelap. Karena band-nya berlawanan arah dengan tema halaman, logo di dalamnya
memakai `<Logo inverted />` supaya varian yang terbaca yang dipakai. Kontras
diverifikasi: 9.12:1 di band hijau, 16.25:1 di band putih.

Kartu statistik memakai stroke dashed bergradien. Nilai Figma
(`#30B77D` ke `#155137`) dipakai apa adanya di tema terang. Di tema gelap ujung
gelapnya cuma 1.20:1 terhadap surface, jadi gradiennya diangkat ke `#4AD497` ke
`#35A873` dengan arah terang-ke-gelap yang sama; kedua ujung lolos 3:1.

Aksen solid diambil dari ujung terang gradien (`#8ACD65` di tema gelap,
`#0D726D` di tema terang) karena **teks tidak bisa ditaruh di atas gradiennya**:
teks gelap lolos AA di ujung hijau muda (8.5:1) tapi gagal di ujung teal
(3.6:1), dan teks putih gagal sebaliknya. Jadi tombol memakai warna solid,
gradien dipakai untuk aksen dekoratif. Logo ada di `public/logo.png`.

## Atribusi lisensi

| Library | Lisensi |
| --- | --- |
| [Next.js](https://github.com/vercel/next.js) | MIT |
| [React](https://github.com/facebook/react) | MIT |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | MIT |
| [zxcvbn](https://github.com/dropbox/zxcvbn) | MIT |
| [Motion](https://github.com/motiondivision/motion) | MIT |
| [Phosphor Icons](https://github.com/phosphor-icons/react) | MIT |
| [Vitest](https://github.com/vitest-dev/vitest) | MIT |
| [Geist font](https://github.com/vercel/geist-font) | SIL OFL 1.1 |

Data kebocoran berasal dari [Have I Been Pwned Pwned
Passwords](https://haveibeenpwned.com/Passwords), dipakai lewat endpoint `range`
publik tanpa API key.

## Catatan

Bobot pertanyaan scorecard bersifat **urutan prioritas**, bukan hasil pengukuran
empiris. Angkanya berguna untuk menentukan apa yang dikerjakan lebih dulu, bukan
untuk diklaim sebagai persentase risiko yang sebenarnya. Ini disebutkan eksplisit
di halaman scorecard juga.
