"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowsClockwiseIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import type { ZXCVBNResult } from "zxcvbn";
import { Field, inputClass } from "@/components/ui/Field";
import { StrengthMeter } from "@/components/ui/StrengthMeter";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatCrackTime, STRENGTH_LABELS } from "@/lib/scoring";
import { evaluatePassword, type StrengthReport } from "@/lib/password-strength";
import { countInRange, hashRange } from "@/lib/hash";
import type { BreachRangeResponse } from "@/app/api/breach/route";
import { generatePassword } from "@/lib/generate";
import { cx } from "@/lib/cx";

/**
 * One password, two verdicts (PRD F1 + F2, merged into a single page).
 *
 * The two checks answer different questions and a password can fail either one
 * independently, so they are shown side by side rather than as one blended
 * number:
 *
 *   - Strength: how long would guessing take? Runs locally on every keystroke,
 *     debounced. Free, so it is always live.
 *   - Breach: has this exact password already leaked? Needs the network, so it
 *     runs only when asked. PRD F1 requires debounce or an explicit submit; an
 *     explicit button is the clearer of the two.
 *
 * Neither check ever transmits the password. Strength analysis never leaves the
 * page at all, and the breach check sends five characters of a SHA-1 hash.
 */

type Engine = (password: string, userInputs?: string[]) => ZXCVBNResult;

type EngineState =
  | { status: "loading" }
  | { status: "ready"; run: Engine }
  | { status: "error"; message: string };

type Breach =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "done"; count: number; prefix: string; bucketSize: number; forPassword: string }
  | { status: "error"; message: string; forPassword: string };

/** Plain labels for the zxcvbn matcher names that appear in `sequence`. */
const PATTERN_LABELS: Record<string, string> = {
  dictionary: "kata umum",
  spatial: "pola papan ketik",
  repeat: "karakter berulang",
  sequence: "urutan berurut",
  regex: "pola angka",
  date: "tanggal",
  bruteforce: "acak",
};

export function PasswordAudit() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [engine, setEngine] = useState<EngineState>({ status: "loading" });
  const [breach, setBreach] = useState<Breach>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  // zxcvbn ships a large dictionary bundle. Loading it after paint keeps the
  // first render fast and avoids shipping it to visitors who never type.
  useEffect(() => {
    let alive = true;

    import("zxcvbn")
      .then((module) => {
        if (alive) setEngine({ status: "ready", run: module.default });
      })
      .catch(() => {
        if (alive) {
          setEngine({
            status: "error",
            message: "Mesin analisis gagal dimuat. Muat ulang halaman ini.",
          });
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  // Debounce so long passwords are not re-analysed on every keystroke.
  const [settled, setSettled] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSettled(password), 140);
    return () => clearTimeout(timer);
  }, [password]);

  const report = useMemo(() => {
    if (engine.status !== "ready" || !settled) return null;
    return evaluatePassword(settled, engine.run);
  }, [engine, settled]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // Editing invalidates the breach verdict. Derived, not reset in an effect: a
  // stale result beside changed input is worse than no result.
  const breachView: Breach =
    (breach.status === "done" || breach.status === "error") &&
    breach.forPassword !== password
      ? { status: "idle" }
      : breach;

  async function checkBreach() {
    if (!password) {
      setBreach({
        status: "error",
        message: "Isi passwordnya dulu.",
        forPassword: password,
      });
      return;
    }

    const id = ++requestId.current;
    setBreach({ status: "checking" });

    try {
      // Step 1: SHA-1 in the browser. The full digest never leaves this tab.
      const { prefix, suffix } = await hashRange(password);
      if (id !== requestId.current) return;

      // Step 2: only the 5-char prefix is transmitted.
      const response = await fetch(`/api/breach?prefix=${prefix}`, {
        headers: { Accept: "application/json" },
      });
      const payload: BreachRangeResponse = await response.json();
      if (id !== requestId.current) return;

      if (!response.ok || "error" in payload) {
        setBreach({
          status: "error",
          message: "error" in payload ? payload.error : "Gagal mengecek. Coba lagi.",
          forPassword: password,
        });
        return;
      }

      // Step 3: the remaining 35 characters are matched locally.
      const lines = payload.range.split("\n").filter((line) => line.includes(":"));

      setBreach({
        status: "done",
        count: countInRange(payload.range, suffix),
        prefix,
        bucketSize: lines.length,
        forPassword: password,
      });
    } catch (error) {
      if (id !== requestId.current) return;
      setBreach({
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengecek. Coba lagi.",
        forPassword: password,
      });
    }
  }

  async function handleGenerate() {
    const next = generatePassword(20);
    setPassword(next);
    setVisible(true);

    try {
      await navigator.clipboard.writeText(next);
      setCopied(true);
    } catch {
      inputRef.current?.select();
    }
  }

  const analysing =
    Boolean(password) && (engine.status === "loading" || settled !== password);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-14">
      <div>
        <Field
          id="password"
          label="Password"
          helper="Tidak pernah dikirim utuh ke server."
          error={
            engine.status === "error"
              ? engine.message
              : breachView.status === "error"
                ? breachView.message
                : null
          }
        >
          <div className="relative">
            <input
              ref={inputRef}
              id="password"
              type={visible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") checkBreach();
              }}
              placeholder="Mulai mengetik"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              className={cx(inputClass, "pr-11 font-mono")}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Sembunyikan" : "Tampilkan"}
              className="absolute right-1 top-1 grid size-9 place-items-center rounded-md text-fg-subtle transition-colors duration-200 hover:bg-track hover:text-fg"
            >
              {visible ? <EyeSlashIcon size={17} /> : <EyeIcon size={17} />}
            </button>
          </div>
        </Field>

        <StrengthMeter score={report?.score ?? 0} active={Boolean(report)} />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={checkBreach} disabled={breachView.status === "checking"}>
            {breachView.status === "checking" ? "Mengecek" : "Cek kebocoran"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <ArrowsClockwiseIcon size={14} />
            Buatkan yang kuat
          </Button>
          {copied && <span className="text-xs text-safe">Tersalin</span>}
        </div>

        <div className="mt-8 max-w-[58ch] space-y-3 border-t border-line pt-6 text-sm leading-relaxed text-fg-subtle">
          <p>
            Kekuatan dihitung langsung sambil kamu mengetik, tanpa jaringan. Cek
            kebocoran perlu jaringan, jadi jalan cuma saat kamu menekan tombolnya.
          </p>
          <p>
            Dua-duanya perlu lulus. Password kuat yang sudah bocor tetap berbahaya,
            dan password yang belum bocor bisa jadi tetap gampang ditebak.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6" aria-live="polite">
        {analysing ? (
          <AnalysingPanel />
        ) : report ? (
          <StrengthPanel report={report} />
        ) : (
          <IdlePanel />
        )}

        <BreachPanel state={breachView} hasPassword={Boolean(password)} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Strength                                                         */
/* ---------------------------------------------------------------- */

function IdlePanel() {
  return (
    <div className="panel flex min-h-[15rem] flex-col justify-center px-6 py-8 sm:px-7">
      <div className="flex items-center gap-2.5">
        <StatusDot tone="idle" />
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
          Belum dianalisis
        </p>
      </div>
      <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-fg-subtle">
        Ketik password di sebelah kiri. Panel ini menampilkan perkiraan waktu
        tebak, lalu menandai bagian mana yang dianggap umum: nama orang, kata
        sehari-hari, kalimat, tanggal lahir, dan pola keyboard.
      </p>
    </div>
  );
}

function AnalysingPanel() {
  return (
    <div className="panel min-h-[15rem] px-6 py-8 sm:px-7">
      <div className="flex items-center gap-2.5">
        <StatusDot tone="busy" />
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
          Menganalisis
        </p>
      </div>
      <Skeleton className="mt-7 h-6 w-32" />
      <Skeleton className="mt-5 h-3.5 w-full max-w-[52ch]" />
      <div className="mt-8 space-y-3.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}

function StrengthPanel({ report }: { report: StrengthReport }) {
  const result = report.raw;
  const meta = STRENGTH_LABELS[report.score];
  const tone = report.score <= 1 ? "high" : report.score === 2 ? "warn" : "safe";

  const patterns = result.sequence
    .filter((match) => match.pattern !== "bruteforce")
    .slice(0, 5);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3.5 sm:px-7">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
          Kekuatan password
        </p>
        <Badge tone={tone} dot>
          {meta.label}
        </Badge>
      </div>

      <div className="px-6 py-6 sm:px-7">
        <p className="max-w-[66ch] text-[0.9375rem] leading-relaxed text-fg">
          {meta.advice}
        </p>

        {report.adjusted && (
          <div className="mt-5 rounded-lg border border-warn/25 bg-warn/[0.07] px-4 py-3">
            <p className="text-xs font-medium text-warn">
              Diturunkan oleh aturan lokal Indonesia
            </p>
            <p className="mt-1.5 max-w-[64ch] text-xs leading-relaxed text-fg-muted">
              Penilaian dasarnya cuma{" "}
              <span className="font-medium text-fg">
                {STRENGTH_LABELS[report.baseScore].label.toLowerCase()}
              </span>{" "}
              karena kamus standarnya berbahasa Inggris. Setelah SIGAP memeriksa
              pola khas Indonesia, skornya jadi{" "}
              <span className="font-medium text-fg">{meta.label.toLowerCase()}</span>.
            </p>
          </div>
        )}

        {report.findings.length > 0 && (
          <ul className="mt-4 space-y-3">
            {report.findings.map((finding) => (
              <li key={finding.id} className="border-l-2 border-danger/50 pl-4">
                <p className="flex flex-wrap items-baseline gap-x-2.5 text-xs font-medium text-fg">
                  {finding.label}
                  <span className="font-mono text-[0.6875rem] text-fg-faint">
                    {finding.matched}
                  </span>
                </p>
                <p className="mt-1 max-w-[64ch] text-xs leading-relaxed text-fg-subtle">
                  {finding.explanation}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="divide-y divide-line border-t border-line">
        <Row term="Ditebak lewat halaman login" value={formatCrackTime(report.onlineSeconds)} />
        <Row term="Ditebak setelah datanya bocor" value={formatCrackTime(report.offlineSeconds)} />
        <Row
          term="Perkiraan jumlah percobaan"
          value={`10^${Math.log10(Math.max(report.guesses, 1)).toFixed(1)}`}
          mono
        />
      </dl>

      {patterns.length > 0 && (
        <div className="border-t border-line px-6 py-5 sm:px-7">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
            Pola yang dikenali SIGAP
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {patterns.map((match, index) => (
              <span
                key={`${match.pattern}-${index}`}
                className="rounded-md border border-line-strong bg-surface-hi px-2.5 py-1.5 text-xs"
              >
                <span className="font-mono text-fg">{String(match.token)}</span>
                <span className="ml-2 text-fg-faint">
                  {PATTERN_LABELS[match.pattern] ?? match.pattern}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {result.feedback.suggestions.length > 0 && (
        <div className="border-t border-line bg-surface-hi/50 px-6 py-5 sm:px-7">
          <ul className="space-y-1.5">
            {result.feedback.suggestions.map((suggestion) => (
              <li key={suggestion} className="text-xs leading-relaxed text-fg-subtle">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Breach                                                           */
/* ---------------------------------------------------------------- */

function BreachPanel({
  state,
  hasPassword,
}: {
  state: Breach;
  hasPassword: boolean;
}) {
  if (state.status === "checking") {
    return (
      <div className="panel px-6 py-6 sm:px-7">
        <div className="flex items-center gap-2.5">
          <StatusDot tone="busy" />
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
            Mengecek kebocoran
          </p>
        </div>
        <Skeleton className="mt-6 h-10 w-36" />
        <Skeleton className="mt-4 h-3.5 w-full max-w-[44ch]" />
      </div>
    );
  }

  if (state.status !== "done") {
    return (
      <div className="panel px-6 py-6 sm:px-7">
        <div className="flex items-center gap-2.5">
          <StatusDot tone="idle" />
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
            Kebocoran belum dicek
          </p>
        </div>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-fg-subtle">
          {hasPassword
            ? "Tekan tombol Cek kebocoran untuk membandingkannya dengan data yang sudah pernah bocor."
            : "Bagian ini butuh jaringan, jadi jalan hanya kalau kamu menekan tombolnya."}
        </p>
      </div>
    );
  }

  const exposed = state.count > 0;
  const severe = state.count > 1000;
  const tone = exposed ? (severe ? "high" : "warn") : "safe";

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3.5 sm:px-7">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
          Riwayat kebocoran
        </p>
        <Badge tone={tone} dot>
          {exposed ? "Ditemukan" : "Tidak ditemukan"}
        </Badge>
      </div>

      <div className="px-6 py-6 sm:px-7">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={cx(
              "tnum font-mono text-4xl leading-none tracking-tighter",
              exposed ? (severe ? "text-danger" : "text-warn") : "text-safe",
            )}
          >
            {state.count.toLocaleString("id-ID")}
          </span>
          <span className="text-sm text-fg-subtle">
            {exposed ? "kali muncul di data yang bocor" : "kemunculan"}
          </span>
        </div>

        <p className="mt-4 max-w-[66ch] text-sm leading-relaxed text-fg-muted">
          {exposed
            ? "Password ini sudah beredar di kebocoran yang tercatat publik, jadi pasti ada di daftar yang dipakai untuk mencoba masuk ke akun orang secara otomatis. Ganti sekarang di semua akun yang memakainya, mulai dari email."
            : "Password ini tidak ditemukan di kebocoran yang tercatat. Itu berarti belum pernah bocor, bukan berarti sulit ditebak. Perhatikan juga panel kekuatan di atas."}
        </p>

        {exposed && (
          <ButtonLink href="/scorecard" className="mt-6">
            Susun rencana perbaikan
          </ButtonLink>
        )}
      </div>

      <dl className="divide-y divide-line border-t border-line">
        <Row term="Dikirim ke server" value={state.prefix} mono />
        <Row
          term="Hash yang ikut diterima"
          value={state.bucketSize.toLocaleString("id-ID")}
          mono
        />
        <Row term="Lokasi pencocokan" value="browser kamu" />
      </dl>
    </div>
  );
}

function Row({
  term,
  value,
  mono = false,
}: {
  term: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-6 py-3 sm:px-7">
      <dt className="text-xs text-fg-faint">{term}</dt>
      <dd className={cx("text-right text-xs text-fg", mono && "tnum font-mono")}>
        {value}
      </dd>
    </div>
  );
}
