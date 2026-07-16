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

const INITIAL: FormState = {
  taxpayer_name: "山村 敦",
  taxpayer_id: "1234567890123",
  address: "東京都千代田区丸の内1-1-1",
  tax_year: 2025,
  gross_income: 5_000_000,
  deductions: 1_200_000,
};

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

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
      .catch(() => setOptions([{ id: "none", label: "正常な生成" }]));
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
            ? `入力検証エラー (Pydantic): ${JSON.stringify(body.detail)}`
            : `リクエストが失敗しました (HTTP ${res.status})`
        );
        return;
      }
      setResult((await res.json()) as GenerateResponse);
    } catch {
      setError(
        "バックエンドに接続できません。開発時は別ターミナルで `npm run api` を起動してください。"
      );
    } finally {
      setLoading(false);
    }
  }, [form, sabotage]);

  useEffect(() => {
    void generate();
    // 初回のみ自動生成
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
          XML生成 &amp; スキーマ検証パイプライン
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          構造化データを仕様準拠のXMLへマッピングし、生成物をXSDスキーマで自動検証するデモです。
          バックエンドはPython（Pydantic / lxml）で、ブラウザ上の操作がそのまま実際の生成・検証処理を呼び出しています。
        </p>
      </header>

      <section className="mb-8 grid gap-2 sm:grid-cols-4">
        {[
          { n: "1", t: "JSON入力", d: "クライアントから送信" },
          { n: "2", t: "Pydantic検証", d: "入力の型・制約チェック" },
          { n: "3", t: "lxml でXML生成", d: "フィールドマッピング" },
          { n: "4", t: "XSD検証", d: "生成物を仕様と照合" },
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
          <h2 className="mb-4 text-base font-semibold text-slate-900">申告データ（入力）</h2>
          <div className="space-y-4">
            <Field label="氏名">
              <input
                className={inputClass}
                value={form.taxpayer_name}
                onChange={(e) => setForm({ ...form, taxpayer_name: e.target.value })}
              />
            </Field>
            <Field label="納税者ID" hint="13桁の数字（XSDで pattern 検証）">
              <input
                className={inputClass}
                value={form.taxpayer_id}
                onChange={(e) => setForm({ ...form, taxpayer_id: e.target.value })}
              />
            </Field>
            <Field label="住所">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="年分">
              <input
                type="number"
                className={inputClass}
                value={form.tax_year}
                onChange={(e) => setForm({ ...form, tax_year: Number(e.target.value) })}
              />
            </Field>
            <Field label={`総収入 (${yen(form.gross_income)})`}>
              <input
                type="number"
                className={inputClass}
                value={form.gross_income}
                onChange={(e) =>
                  setForm({ ...form, gross_income: Number(e.target.value) })
                }
              />
            </Field>
            <Field label={`控除額 (${yen(form.deductions)})`}>
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
              label="生成モード"
              hint="意図的にマッピングを壊し、XSD検証が本当に機能することを確認できます"
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
              {loading ? "生成中..." : "XMLを生成"}
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
                  tax_return.xsd で検証 / モード: {result.sabotage_label}
                </span>
              </div>

              {!result.valid && (
                <div className="rounded-lg border border-rose-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold text-rose-800">
                    XSDバリデーターが検出したエラー
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
                  <h3 className="text-sm font-semibold text-slate-900">
                    生成されたXML
                  </h3>
                  <button
                    onClick={download}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    .xtx をダウンロード
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
                  <h3 className="text-sm font-semibold text-slate-900">
                    フィールドマッピング
                  </h3>
                  <p className="text-xs text-slate-500">
                    入力キー → XPath上の配置先。実仕様ではこの表が数百行になります。
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">入力キー</th>
                        <th className="px-4 py-2 font-medium">配置先 (XPath)</th>
                        <th className="px-4 py-2 font-medium">値</th>
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
                  検証に使用しているXSDスキーマ
                </h3>
                <span className="text-xs text-slate-500">
                  {showXsd ? "隠す" : "表示"}
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
        <p className="font-semibold text-slate-700">このデモについて</p>
        <p className="mt-1.5">
          本デモのスキーマは技術実証のために独自に定義した簡略版であり、国税庁が公開するe-Tax仕様そのものではありません。
          実際の申告フォーマットでは数百のフィールドを仕様書に従って正確な位置へ配置する必要がありますが、
          「入力検証 → マッピング → スキーマ検証」というパイプラインと、生成物を機械的に検証する仕組みは同一です。
          税率は一律10%に簡略化しています。
        </p>
      </footer>
    </main>
  );
}
