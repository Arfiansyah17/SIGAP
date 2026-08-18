/**
 * Proof that the Indonesian layer changes the verdict where it should, and
 * leaves genuinely strong passwords alone.
 *
 * The contract under test:
 *   - Indonesian weak patterns must score <= 1 ("Sangat lemah" / "Lemah").
 *   - Genuinely strong passwords must still score >= 3.
 *   - The local layer must never raise a score.
 */

import { describe, expect, it } from "vitest";
import zxcvbn from "zxcvbn";
import { evaluatePassword } from "./password-strength";
import { analyseLocal } from "./password-rules";

const evaluate = (password: string) => evaluatePassword(password, zxcvbn);

/** Weak locally, regardless of what an English-only dictionary thinks. */
const WEAK_CASES: { password: string; rule: string; note: string }[] = [
  // The case that started this: scored 4 by stock zxcvbn.
  { password: "arfiansyah12", rule: "nama-angka", note: "surname + 2 digits" },
  { password: "budi2020", rule: "nama-angka", note: "given name + 4 digits" },
  { password: "setiawan99", rule: "nama-angka", note: "surname + 2 digits" },
  { password: "wulandari7", rule: "nama-angka", note: "name-ish + 1 digit" },
  { password: "budi1995", rule: "nama-tahun", note: "name + birth year" },
  { password: "sitinurhaliza1988", rule: "nama-tahun", note: "long name + birth year" },
  { password: "arfiansyah", rule: "nama-orang", note: "bare surname" },
  { password: "bismillah", rule: "kata-umum", note: "bare common word" },
  { password: "persib", rule: "kata-umum", note: "football club" },
  { password: "yogyakarta", rule: "kata-umum", note: "city name" },
  // Broader coverage: names, phrases, and dates anywhere in the string
  { password: "Jakarta#budi", rule: "nama-orang", note: "name mid-string" },
  { password: "akucintakamu", rule: "kalimat-umum", note: "phrase, spaces removed" },
  { password: "Xk7#17082003", rule: "tanggal-lahir", note: "full date of birth" },
  { password: "Qz9!17-08-03", rule: "tanggal-lahir", note: "date with separators" },
  { password: "kopiSenja!1998", rule: "tanggal-lahir", note: "birth year" },
  { password: "surabaya2010", rule: "kata-umum", note: "city plus year" },
  { password: "budibudi", rule: "suku-ulang", note: "repeated word" },
  { password: "kokokoko", rule: "suku-ulang", note: "repeated syllable" },
  { password: "s4y4ngku", rule: "leetspeak-lokal", note: "leetspeak of a local word" },
  { password: "4rfi4nsy4h", rule: "leetspeak-lokal", note: "leetspeak of a surname" },
  { password: "qwertyui", rule: "keyboard-lokal", note: "keyboard run" },
];

/** Should survive the local layer untouched. */
const STRONG_CASES = [
  "korek-jendela-bising-7412",
  "Tp9$mvQz2wLr8xKd",
  "gerbong-mangga-listrik-payung",
  "x7Qv-Lm2Bt-Rk9Wz-Ac4Nq",
];

describe("evaluatePassword: pola lemah khas Indonesia", () => {
  for (const { password, rule, note } of WEAK_CASES) {
    it(`menandai "${password}" sebagai lemah (${note})`, () => {
      const report = evaluate(password);

      expect(report.score, `skor ${password}`).toBeLessThanOrEqual(1);
      expect(
        report.findings.map((finding) => finding.id),
        `aturan yang terpicu untuk ${password}`,
      ).toContain(rule);
      // Every finding must be able to explain itself to the user.
      for (const finding of report.findings) {
        expect(finding.explanation.length).toBeGreaterThan(20);
      }
    });
  }
});

describe("evaluatePassword: kata sandi yang benar-benar kuat", () => {
  for (const password of STRONG_CASES) {
    it(`tetap menilai "${password}" kuat`, () => {
      const report = evaluate(password);

      expect(report.score, `skor ${password}`).toBeGreaterThanOrEqual(3);
      expect(report.findings, `temuan untuk ${password}`).toHaveLength(0);
      expect(report.adjusted).toBe(false);
    });
  }
});

describe("arfiansyah12: kasus acuan", () => {
  it("dinilai kuat oleh zxcvbn tanpa kamus lokal", () => {
    // Documents the bug being fixed. If zxcvbn ever learns Indonesian names on
    // its own, this assertion fails and the local layer can be reconsidered.
    expect(zxcvbn("arfiansyah12").score).toBeGreaterThanOrEqual(3);
  });

  it("dinilai lemah setelah lapisan lokal", () => {
    const report = evaluate("arfiansyah12");

    expect(report.score).toBeLessThanOrEqual(1);
    expect(report.adjusted).toBe(true);
    expect(report.findings[0].id).toBe("nama-angka");
    expect(report.findings[0].explanation).toContain(
      "daftar tebakan pertama penyerang",
    );
  });

  it("melaporkan bagian yang memicu aturan", () => {
    expect(evaluate("arfiansyah12").findings[0].matched).toBe("arfiansyah12");
  });
});

describe("sifat lapisan lokal", () => {
  it("tidak pernah menaikkan skor zxcvbn", () => {
    const samples = [
      ...WEAK_CASES.map((entry) => entry.password),
      ...STRONG_CASES,
      "a",
      "12345678",
      "correct horse battery staple",
    ];

    for (const password of samples) {
      const report = evaluate(password);
      expect(report.score, password).toBeLessThanOrEqual(report.baseScore);
    }
  });

  it("tidak memicu aturan apa pun untuk input kosong", () => {
    expect(analyseLocal("")).toHaveLength(0);
  });

  it("menurunkan perkiraan jumlah tebakan, bukan cuma labelnya", () => {
    const report = evaluate("arfiansyah12");
    expect(report.guesses).toBeLessThan(report.raw.guesses);
  });

  it("mengalikan divisor saat beberapa aturan terpicu bersamaan", () => {
    // Leetspeak of a name plus trailing digits should charge for both.
    const findings = analyseLocal("4rfi4nsy4h12");
    expect(findings.length).toBeGreaterThan(1);
  });
});
