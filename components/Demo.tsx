"use client";

import { useCallback, useEffect, useState } from "react";
import { SABOTAGE_LABELS_JA, SAMPLE, TEXT, type Lang } from "@/lib/content";

type MappingRow = { source: string; target: string; value: string };
type XsdError = { line: number | null; message: string };

type GenerateResponse = {
  xml: string;
  valid: boolean;
  errors: XsdError[];
  mapping: MappingRow[];
  computed: { taxable_income: number; tax_due: number };
  sabotage: string;
  sabotage_label: string;
};

type SabotageOption = { id: string; label: string };

type FormState = {
  taxpayer_name: string;
  taxpayer_id: string;
  address: string;
  tax_year: number;
  gross_income: number;
  deductions: number;
};

// 見本の氏名と住所は言語ごと（lib/content.ts の SAMPLE。どちらも架空）
const initialForm = (lang: Lang): FormState => ({
  taxpayer_name: SAMPLE[lang].taxpayer_name,
  taxpayer_id: "1234567890123",
  address: SAMPLE[lang].address,
  // 申告の対象は前の年。固定の年にすると年が変わるたびに古くなるので、今の年から計算する
  tax_year: new Date().getFullYear() - 1,
  gross_income: 5_000_000,
  deductions: 1_200_000,
});

const yen = (lang: Lang, n: number) =>
  lang === "ja" ? `${n.toLocaleString("ja-JP")}円` : `¥${n.toLocaleString("en-US")}`;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

// 日本語（/）と英語（/en）の共通のページ
export default function Demo({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  // API の生成のモードの表示名は英語なので、日本語のページでは id で置き換える
  const modeLabel = (id: string, apiLabel: string) =>
    lang === "ja" ? (SABOTAGE_LABELS_JA[id] ?? apiLabel) : apiLabel;
  const [form, setForm] = useState<FormState>(() => initialForm(lang));
  const [sabotage, setSabotage] = useState("none");
  const [options, setOptions] = useState<SabotageOption[]>([]);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [xsd, setXsd] = useState("");
  const [showXsd, setShowXsd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/py/sabotage-options")
      .then((r) => r.json())
      .then((d) => setOptions(d.options))
      .catch(() => setOptions([{ id: "none", label: t.fallbackMode }]));
    fetch("/api/py/schema")
      .then((r) => r.json())
      .then((d) => setXsd(d.xsd))
      .catch(() => setXsd(""));
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/py/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form, sabotage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setResult(null);
        setError(
          body?.detail
            ? `${t.inputRejected}${JSON.stringify(body.detail)}`
            : t.requestFailed(res.status)
        );
        return;
      }
      setResult((await res.json()) as GenerateResponse);
    } catch {
      setError(t.unreachable);
    } finally {
      setLoading(false);
    }
  }, [form, sabotage, t]);

  useEffect(() => {
    void generate();
    // generate once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax_return_${form.tax_year}.xtx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
            <a href={t.phaiworksUrl} className="hover:text-sky-800 hover:underline">
              PH AI Works
            </a>{" "}
            — {t.brandSuffix}
          </p>
          <a
            href={t.toggleHref}
            hrefLang={lang === "ja" ? "en" : "ja"}
            lang={lang === "ja" ? "en" : "ja"}
            className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
          >
            {t.toggle}
          </a>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          {t.h1}
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element -- 同じ origin の静的ファイル。next/image の最適化は使わない */}
        <img
          src="/media/hero.webp"
          alt={t.heroImageAlt}
          width={1600}
          height={679}
          className="mt-5 aspect-[1600/679] w-full rounded-xl object-cover"
        />
        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          {t.lead}
        </p>
      </header>

      <section className="mb-8 grid gap-2 sm:grid-cols-4">
        {t.steps.map((s, i) => ({ n: String(i + 1), ...s })).map((s) => (
          <div
            key={s.n}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-xs font-bold text-sky-600">{t.stepLabel} {s.n}</span>
            <p className="mt-1 text-sm font-semibold text-slate-800">{s.t}</p>
            <p className="text-xs text-slate-500">{s.d}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">{t.formTitle}</h2>
          <p className="mb-4 text-xs text-slate-500">
            {t.formLead}
          </p>
          <div className="space-y-4">
            <Field label={t.name}>
              <input aria-label={t.name} name="taxpayer_name" autoComplete="name" maxLength={2048}
                className={inputClass}
                value={form.taxpayer_name}
                onChange={(e) => setForm({ ...form, taxpayer_name: e.target.value })}
              />
            </Field>
            <Field label={t.id} hint={t.idHint}>
              <input aria-label={t.id} name="taxpayer_id" autoComplete="off" maxLength={2048}
                className={inputClass}
                value={form.taxpayer_id}
                onChange={(e) => setForm({ ...form, taxpayer_id: e.target.value })}
              />
            </Field>
            <Field label={t.address}>
              <input aria-label={t.address} name="address" autoComplete="street-address" maxLength={2048}
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label={t.taxYear}>
              <input aria-label={t.taxYear} name="tax_year"
                type="number"
                className={inputClass}
                value={form.tax_year}
                onChange={(e) => setForm({ ...form, tax_year: Number(e.target.value) })}
              />
            </Field>
            <Field label={`${t.gross} (${yen(lang, form.gross_income)})`}>
              <input aria-label={t.gross} name="gross_income"
                type="number"
                className={inputClass}
                value={form.gross_income}
                onChange={(e) =>
                  setForm({ ...form, gross_income: Number(e.target.value) })
                }
              />
            </Field>
            <Field label={`${t.deductions} (${yen(lang, form.deductions)})`}>
              <input aria-label={t.deductions} name="deductions"
                type="number"
                className={inputClass}
                value={form.deductions}
                onChange={(e) =>
                  setForm({ ...form, deductions: Number(e.target.value) })
                }
              />
            </Field>

            <Field
              label={t.mode}
              hint={t.modeHint}
            >
              <select aria-label={t.mode} name="generation_mode"
                className={inputClass}
                value={sabotage}
                onChange={(e) => setSabotage(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {modeLabel(o.id, o.label)}
                  </option>
                ))}
              </select>
            </Field>

            <button
              onClick={() => void generate()}
              disabled={loading}
              className="w-full rounded-md bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? t.generating : t.generate}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          {error && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          )}

          {result && (
            <>
              <div
                className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${
                  result.valid
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-rose-300 bg-rose-50"
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    result.valid ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {result.valid ? t.valid : t.invalid}
                </span>
                <span className="text-xs text-slate-600">
                  {t.checkedAgainst(modeLabel(result.sabotage, result.sabotage_label))}
                </span>
              </div>

              {!result.valid && (
                <div className="rounded-lg border border-rose-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold text-rose-800">
                    {t.validatorTitle}
                  </h3>
                  <ul className="space-y-1.5">
                    {result.errors.map((e, i) => (
                      <li key={i} className="font-mono text-xs text-slate-700">
                        <span className="mr-2 rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">
                          {t.line(e.line ?? "-")}
                        </span>
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">{t.generatedXml}</h3>
                  <button
                    onClick={download}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {t.download}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <pre className="p-4 font-mono text-xs leading-relaxed text-slate-800">
                    {result.xml}
                  </pre>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">{t.mappingTitle}</h3>
                  <p className="text-xs text-slate-500">
                    {t.mappingLead}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">{t.colKey}</th>
                        <th className="px-4 py-2 font-medium">{t.colTarget}</th>
                        <th className="px-4 py-2 font-medium">{t.colValue}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.mapping.map((m) => (
                        <tr key={m.target}>
                          <td className="px-4 py-1.5 font-mono text-slate-500">
                            {m.source}
                          </td>
                          <td className="px-4 py-1.5 font-mono text-slate-800">
                            {m.target}
                          </td>
                          <td className="px-4 py-1.5 text-slate-700">{m.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {xsd && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setShowXsd(!showXsd)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {t.xsdTitle}
                </h3>
                <span className="text-xs text-slate-500">
                  {showXsd ? t.hide : t.show}
                </span>
              </button>
              {showXsd && (
                <div className="overflow-x-auto border-t border-slate-200">
                  <pre className="p-4 font-mono text-xs leading-relaxed text-slate-700">
                    {xsd}
                  </pre>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="mt-10 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">{t.aboutTitle}</p>
        <p className="mt-1.5">
          {t.about}
        </p>
        <p className="mt-2">
          {t.source}{" "}
          <a
            className="font-medium text-sky-700 underline"
            href="https://github.com/a-yama100/etax-xml-demo"
          >
            github.com/a-yama100/etax-xml-demo
          </a>
        </p>
      </footer>
    </main>
  );
}
