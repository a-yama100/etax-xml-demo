"use client";

import { useCallback, useEffect, useState } from "react";

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

// "Taro Yamada" is the standard placeholder name on Japanese forms —
// the equivalent of "John Doe". No real person or filing is represented here.
const INITIAL: FormState = {
  taxpayer_name: "Taro Yamada",
  taxpayer_id: "1234567890123",
  address: "1-1-1 Marunouchi, Chiyoda-ku, Tokyo",
  tax_year: 2025,
  gross_income: 5_000_000,
  deductions: 1_200_000,
};

const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;

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

export default function Demo() {
  const [form, setForm] = useState<FormState>(INITIAL);
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
      .catch(() => setOptions([{ id: "none", label: "Correct mapping" }]));
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
            ? `Input rejected by Pydantic: ${JSON.stringify(body.detail)}`
            : `Request failed (HTTP ${res.status})`
        );
        return;
      }
      setResult((await res.json()) as GenerateResponse);
    } catch {
      setError(
        "Cannot reach the backend. In local development, start it with `npm run api`."
      );
    } finally {
      setLoading(false);
    }
  }, [form, sabotage]);

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
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
          PH AI Works — Technical Demo
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          XML Generation &amp; Schema Validation
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          Structured data is mapped onto a specification-compliant XML document, and the
          generated file is then validated against an XSD schema. The backend is Python
          (Pydantic / lxml) — every action on this page calls the real generation and
          validation code, not a canned response.
        </p>
      </header>

      <section className="mb-8 grid gap-2 sm:grid-cols-4">
        {[
          { n: "1", t: "JSON input", d: "Sent from the browser" },
          { n: "2", t: "Pydantic", d: "Validates the input" },
          { n: "3", t: "lxml", d: "Maps fields into XML" },
          { n: "4", t: "XSD", d: "Validates the output" },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-xs font-bold text-sky-600">STEP {s.n}</span>
            <p className="mt-1 text-sm font-semibold text-slate-800">{s.t}</p>
            <p className="text-xs text-slate-500">{s.d}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Filing data</h2>
          <p className="mb-4 text-xs text-slate-500">
            Sample values. Edit any field and regenerate.
          </p>
          <div className="space-y-4">
            <Field label="Taxpayer name">
              <input
                className={inputClass}
                value={form.taxpayer_name}
                onChange={(e) => setForm({ ...form, taxpayer_name: e.target.value })}
              />
            </Field>
            <Field label="Taxpayer ID" hint="13 digits — enforced by an xs:pattern facet">
              <input
                className={inputClass}
                value={form.taxpayer_id}
                onChange={(e) => setForm({ ...form, taxpayer_id: e.target.value })}
              />
            </Field>
            <Field label="Address">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="Tax year">
              <input
                type="number"
                className={inputClass}
                value={form.tax_year}
                onChange={(e) => setForm({ ...form, tax_year: Number(e.target.value) })}
              />
            </Field>
            <Field label={`Gross income (${yen(form.gross_income)})`}>
              <input
                type="number"
                className={inputClass}
                value={form.gross_income}
                onChange={(e) =>
                  setForm({ ...form, gross_income: Number(e.target.value) })
                }
              />
            </Field>
            <Field label={`Deductions (${yen(form.deductions)})`}>
              <input
                type="number"
                className={inputClass}
                value={form.deductions}
                onChange={(e) =>
                  setForm({ ...form, deductions: Number(e.target.value) })
                }
              />
            </Field>

            <Field
              label="Generation mode"
              hint="Inject a known mapping bug to confirm the schema validation is real"
            >
              <select
                className={inputClass}
                value={sabotage}
                onChange={(e) => setSabotage(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <button
              onClick={() => void generate()}
              disabled={loading}
              className="w-full rounded-md bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate XML"}
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
                  {result.valid ? "✅ Valid against schema" : "❌ Invalid against schema"}
                </span>
                <span className="text-xs text-slate-600">
                  Checked against tax_return.xsd — mode: {result.sabotage_label}
                </span>
              </div>

              {!result.valid && (
                <div className="rounded-lg border border-rose-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold text-rose-800">
                    Reported by the XSD validator
                  </h3>
                  <ul className="space-y-1.5">
                    {result.errors.map((e, i) => (
                      <li key={i} className="font-mono text-xs text-slate-700">
                        <span className="mr-2 rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">
                          line {e.line ?? "-"}
                        </span>
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">Generated XML</h3>
                  <button
                    onClick={download}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Download .xtx
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
                  <h3 className="text-sm font-semibold text-slate-900">Field mapping</h3>
                  <p className="text-xs text-slate-500">
                    Input key to its exact position in the document. A production mapping
                    is this same table with several hundred rows.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Input key</th>
                        <th className="px-4 py-2 font-medium">Placement (XPath)</th>
                        <th className="px-4 py-2 font-medium">Value</th>
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
                  The XSD schema used for validation
                </h3>
                <span className="text-xs text-slate-500">
                  {showXsd ? "Hide" : "Show"}
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
        <p className="font-semibold text-slate-700">About this demo</p>
        <p className="mt-1.5">
          The schema here is an original, simplified structure written for this
          demonstration. It is not the Japanese NTA e-Tax specification, and no NTA
          material is reproduced. A real filing format requires several hundred fields to
          be placed exactly as the published specification dictates — but the pipeline
          (validate input, map, validate output) and the validation mechanism are the
          same. The tax rate is simplified to a flat 10%. All sample data is fictional.
        </p>
        <p className="mt-2">
          Source:{" "}
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
