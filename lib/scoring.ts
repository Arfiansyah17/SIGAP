/**
 * Privacy scorecard model (PRD F3).
 *
 * The ten questions and the four result categories are fixed by the PRD. Only
 * the weights are ours to choose, and they are defined here rather than in any
 * component so the team can point at one file when a judge asks how the number
 * is produced.
 *
 * Weights are ordinal, not empirical. They encode which control stops the most
 * common account-takeover paths first, so the ranking is defensible even though
 * the absolute number is not a measured risk percentage.
 *
 * POLARITY MATTERS. Some PRD questions are phrased so that "yes" is the bad
 * answer ("apakah password diulang?"). Every item therefore declares whether
 * "ya" is the safe answer or the unsafe one, and credit is derived from that.
 */

export type AnswerValue = "yes" | "partial" | "no";

export type Category = "auth" | "recovery" | "device" | "habit";

/** Which answer counts as secure for this item. */
export type Polarity = "yes-is-safe" | "no-is-safe";

export type ChecklistItem = {
  id: string;
  category: Category;
  question: string;
  /** Shown under the question, explains why the control matters. */
  rationale: string;
  /** Relative contribution to the final score. */
  weight: number;
  polarity: Polarity;
};

export const CATEGORY_LABELS: Record<Category, string> = {
  auth: "Autentikasi",
  recovery: "Pemulihan Akun",
  device: "Perangkat & Jaringan",
  habit: "Jejak & Kebiasaan",
};

export const CATEGORY_ORDER: Category[] = ["auth", "recovery", "device", "habit"];

/** The ten PRD questions, grouped by category. */
export const CHECKLIST: ChecklistItem[] = [
  {
    id: "mfa-email",
    category: "auth",
    question: "Verifikasi dua langkah aktif di email utama kamu?",
    rationale:
      "Email utama dipakai untuk mereset semua akun lain. Kalau yang ini jatuh, sisanya ikut jatuh.",
    weight: 10,
    polarity: "yes-is-safe",
  },
  {
    id: "password-reuse",
    category: "auth",
    question: "Kata sandi yang sama dipakai di lebih dari satu layanan?",
    rationale:
      "Kalau satu situs bocor, penyerang otomatis mencoba kombinasi yang sama ke email dan e-wallet kamu.",
    weight: 10,
    polarity: "no-is-safe",
  },
  {
    id: "password-manager",
    category: "auth",
    question: "Kamu pakai password manager?",
    rationale:
      "Kata sandi yang harus dihafal pasti pendek dan berulang. Itu batas manusia, bukan kurang niat.",
    weight: 6,
    polarity: "yes-is-safe",
  },
  {
    id: "recovery-phone",
    category: "recovery",
    question: "Nomor HP kamu terdaftar sebagai pemulihan di email utama?",
    rationale:
      "Tanpa jalur pemulihan yang kamu kuasai, akun yang hilang praktis tidak bisa diambil kembali.",
    weight: 5,
    polarity: "yes-is-safe",
  },
  {
    id: "recovery-email",
    category: "recovery",
    question: "Email pemulihan kamu masih aktif dan bisa kamu buka?",
    rationale:
      "Email pemulihan yang sudah mati justru jadi celah: kalau alamatnya didaftarkan ulang orang lain, jalur reset itu jadi milik mereka.",
    weight: 5,
    polarity: "yes-is-safe",
  },
  {
    id: "active-sessions",
    category: "recovery",
    question: "Kamu pernah memeriksa daftar sesi login yang masih aktif?",
    rationale:
      "Sesi lama tetap terbuka tanpa perlu kata sandi lagi, termasuk di perangkat yang sudah tidak kamu pegang.",
    weight: 4,
    polarity: "yes-is-safe",
  },
  {
    id: "sideload-apk",
    category: "device",
    question:
      "Kamu pernah instal aplikasi dari file APK kiriman orang lain atau link di luar Play Store / App Store?",
    rationale:
      "Aplikasi di luar Play Store atau App Store tidak diperiksa siapa pun, dan ini cara paling sering dipakai penipu buat mencuri kode OTP dan saldo e-wallet di Indonesia.",
    weight: 7,
    polarity: "no-is-safe",
  },
  {
    id: "public-wifi",
    category: "device",
    question: "Kamu pakai Wi-Fi publik tanpa perlindungan untuk akun penting?",
    rationale:
      "Di jaringan publik, orang lain bisa mengarahkan koneksi kamu ke halaman login palsu.",
    weight: 5,
    polarity: "no-is-safe",
  },
  {
    id: "exposed-personal-data",
    category: "habit",
    question: "Tanggal lahir, nama ibu, atau alamat kamu terbuka di media sosial?",
    rationale:
      "Data itu justru yang dipakai layanan sebagai pertanyaan keamanan, jadi membukanya sama dengan membocorkan kunci cadangan.",
    weight: 6,
    polarity: "no-is-safe",
  },
  {
    id: "clicked-unknown-link",
    category: "habit",
    question: "Kamu pernah mengklik tautan dari SMS atau WA yang tidak dikenal?",
    rationale:
      "Satu klik cukup untuk membuka halaman login palsu atau memasang aplikasi penyadap.",
    weight: 7,
    polarity: "no-is-safe",
  },
];

export const TOTAL_WEIGHT = CHECKLIST.reduce((sum, item) => sum + item.weight, 0);

/**
 * Credit per answer before polarity is applied. "Sebagian" sits in the middle
 * because a partly-applied control is genuinely partly effective.
 */
const RAW_CREDIT: Record<AnswerValue, number> = {
  yes: 1,
  partial: 0.5,
  no: 0,
};

/** Fraction of an item's weight earned by this answer, polarity applied. */
export function creditFor(item: ChecklistItem, answer: AnswerValue): number {
  const raw = RAW_CREDIT[answer];
  return item.polarity === "yes-is-safe" ? raw : 1 - raw;
}

/** The four PRD result categories. */
export type Band = {
  id: "kritis" | "perlu-perbaikan" | "cukup-baik" | "kuat";
  label: string;
  summary: string;
  tone: "high" | "warn" | "safe";
};

const BANDS: (Band & { min: number })[] = [
  {
    min: 85,
    id: "kuat",
    label: "Kuat",
    tone: "safe",
    summary:
      "Kontrol dasarnya sudah lengkap. Sisanya cuma perlu ditinjau ulang tiap enam bulan.",
  },
  {
    min: 65,
    id: "cukup-baik",
    label: "Cukup Baik",
    tone: "safe",
    summary:
      "Fondasinya benar, tapi masih ada celah yang bisa dipakai kalau salah satu akun kamu bocor.",
  },
  {
    min: 40,
    id: "perlu-perbaikan",
    label: "Perlu Perbaikan",
    tone: "warn",
    summary:
      "Ada beberapa hal penting yang belum aktif. Satu kebocoran kemungkinan besar merembet ke akun lain.",
  },
  {
    min: 0,
    id: "kritis",
    label: "Kritis",
    tone: "high",
    summary:
      "Akun kamu bergantung pada satu lapis pertahanan saja. Mulai dari email utama, hari ini.",
  },
];

export function bandFor(score: number): Band {
  const match = BANDS.find((band) => score >= band.min) ?? BANDS[BANDS.length - 1];
  return { id: match.id, label: match.label, summary: match.summary, tone: match.tone };
}

export type CategoryResult = {
  category: Category;
  label: string;
  score: number;
  answered: number;
  total: number;
};

export type Gap = ChecklistItem & { answer: AnswerValue };

export type ScoreResult = {
  score: number;
  band: Band;
  answered: number;
  total: number;
  /** True once every item has an answer. The UI hides the score until then. */
  complete: boolean;
  categories: CategoryResult[];
  /** Every unsafe or partly-safe answer, biggest unearned weight first. */
  gaps: Gap[];
};

export type Answers = Partial<Record<string, AnswerValue>>;

/**
 * Score the checklist.
 *
 * Unanswered items are excluded from the denominator rather than counted as
 * failures. The UI only reveals the score once all ten are answered, so in
 * practice the denominator is the full weight; the guard exists so a partly
 * filled form can never report a misleading number.
 */
export function scoreChecklist(answers: Answers): ScoreResult {
  let earned = 0;
  let possible = 0;
  let answered = 0;

  type Bucket = CategoryResult & { earned: number; possible: number };

  const perCategory = new Map<Category, Bucket>(
    CATEGORY_ORDER.map((category) => [
      category,
      {
        category,
        label: CATEGORY_LABELS[category],
        score: 0,
        answered: 0,
        total: 0,
        earned: 0,
        possible: 0,
      },
    ]),
  );

  for (const item of CHECKLIST) {
    const bucket = perCategory.get(item.category)!;
    bucket.total += 1;

    const answer = answers[item.id];
    if (!answer) continue;

    answered += 1;
    bucket.answered += 1;

    const credit = creditFor(item, answer) * item.weight;
    earned += credit;
    possible += item.weight;
    bucket.earned += credit;
    bucket.possible += item.weight;
  }

  for (const bucket of perCategory.values()) {
    bucket.score = bucket.possible
      ? Math.round((bucket.earned / bucket.possible) * 100)
      : 0;
  }

  const score = possible ? Math.round((earned / possible) * 100) : 0;

  // A gap is any answer that did not earn full credit, ranked by how much weight
  // is still unearned. That ordering is what PRD F4 means by "diurutkan
  // berdasarkan dampak, bukan urutan pertanyaan".
  const unearned = (gap: Gap) => (1 - creditFor(gap, gap.answer)) * gap.weight;

  const gaps: Gap[] = CHECKLIST.map((item) => {
    const answer = answers[item.id];
    if (!answer) return null;
    return creditFor(item, answer) < 1 ? { ...item, answer } : null;
  })
    .filter((gap): gap is Gap => gap !== null)
    .sort((a, b) => unearned(b) - unearned(a));

  return {
    score,
    band: bandFor(score),
    answered,
    total: CHECKLIST.length,
    complete: answered === CHECKLIST.length,
    categories: CATEGORY_ORDER.map((category) => {
      const bucket = perCategory.get(category)!;
      return {
        category: bucket.category,
        label: bucket.label,
        score: bucket.score,
        answered: bucket.answered,
        total: bucket.total,
      };
    }),
    gaps,
  };
}

/* ---------------------------------------------------------------------- */
/* Password signals (F2)                                                  */
/* ---------------------------------------------------------------------- */

export type StrengthLabel = {
  label: string;
  tone: "high" | "warn" | "safe";
  advice: string;
};

/** Maps a 0-4 score onto copy the user can act on. */
export const STRENGTH_LABELS: StrengthLabel[] = [
  {
    label: "Sangat lemah",
    tone: "high",
    advice: "Bisa ditebak hampir seketika. Sebaiknya jangan dipakai di akun apa pun.",
  },
  {
    label: "Lemah",
    tone: "high",
    advice: "Masih mudah ditebak komputer. Tambahkan panjangnya, bukan simbolnya.",
  },
  {
    label: "Sedang",
    tone: "warn",
    advice: "Cukup untuk akun biasa, tapi belum cukup untuk email atau m-banking.",
  },
  {
    label: "Kuat",
    tone: "safe",
    advice: "Sudah aman. Pastikan kata sandi ini tidak dipakai di akun lain.",
  },
  {
    label: "Sangat kuat",
    tone: "safe",
    advice: "Sangat aman. Simpan di password manager supaya tidak perlu dihafal.",
  },
];

/**
 * Format a crack-time estimate in seconds into short Indonesian copy.
 * Takes seconds so the caller decides which attack scenario to show.
 */
export function formatCrackTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "praktis tak terhingga";
  if (seconds < 1) return "kurang dari sedetik";

  const units: [number, string][] = [
    [60, "detik"],
    [60, "menit"],
    [24, "jam"],
    [365, "hari"],
    [100, "tahun"],
  ];

  let value = seconds;
  let unit = "detik";

  for (let i = 0; i < units.length; i += 1) {
    const [step, name] = units[i];
    if (value < step) {
      unit = name;
      break;
    }
    value /= step;
    unit = units[i + 1]?.[1] ?? "abad";
  }

  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `sekitar ${rounded.toLocaleString("id-ID")} ${unit}`;
}

/** Human-readable exposure count, e.g. 24567 becomes "24.567 kali". */
export function formatExposures(count: number): string {
  return `${count.toLocaleString("id-ID")} kali`;
}
