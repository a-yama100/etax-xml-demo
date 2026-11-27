// 日本語（/）と英語（/en）の文言。ページの部品はここから文言を読む（2026-11-27 日本語版を追加）
export type Lang = "ja" | "en";

export const SITE_URL = "https://etax-xml-demo.phaiworks.com";

// 題名・説明（検索結果と SNS に出る文）と、その言語のページのパス
export const META: Record<Lang, { path: string; title: string; description: string }> = {
  ja: {
    path: "/",
    title: "確定申告データの XML 生成・検証デモ | PH AI Works",
    description:
      "所得税の確定申告データを題材にした、Python による XML の生成と検証の技術デモです。Pydantic による入力のチェック、lxml による XML の生成、XSD スキーマによる出力の検証を試せます。",
  },
  en: {
    path: "/en",
    title: "XML Generation & Schema Validation Demo | PH AI Works",
    description:
      "A Python pipeline that maps structured data onto specification-compliant XML and validates the generated document against an XSD schema. Pydantic input validation, lxml generation, XSD output validation.",
  },
};

// 見本の申告データ（架空）。tax_year は画面で今の年から計算する
export const SAMPLE: Record<Lang, { taxpayer_name: string; address: string }> = {
  // 「山田 太郎」は日本の書類の記入例でよく使われる架空の名前
  ja: { taxpayer_name: "山田 太郎", address: "東京都千代田区丸の内1-1-1" },
  // "Taro Yamada" is the standard placeholder name on Japanese forms —
  // the equivalent of "John Doe". No real person or filing is represented here.
  en: { taxpayer_name: "Taro Yamada", address: "1-1-1 Marunouchi, Chiyoda-ku, Tokyo" },
};

// 生成のモード（わざと入れる対応付けの誤り）の表示名。API（api/index.py）の英語の表示名を、id で日本語に置き換える
export const SABOTAGE_LABELS_JA: Record<string, string> = {
  none: "正しい XML を生成する",
  bad_id: "納税者番号を12桁にする（桁数の違反）",
  wrong_order: "Income の中の2つの要素の順序を入れ替える（順序の違反）",
  missing_field: "必須の TaxDue 要素を省く（必須要素の欠落）",
  bad_type: "GrossIncome に負の値を書く（0以上の整数の型の違反）",
};

type Text = {
  brandSuffix: string;
  phaiworksUrl: string;
  toggle: string;
  toggleHref: string;
  h1: string;
  heroImageAlt: string;
  lead: string;
  stepLabel: string;
  steps: { t: string; d: string }[];
  formTitle: string;
  formLead: string;
  name: string;
  id: string;
  idHint: string;
  address: string;
  taxYear: string;
  gross: string;
  deductions: string;
  mode: string;
  modeHint: string;
  fallbackMode: string;
  generate: string;
  generating: string;
  inputRejected: string;
  requestFailed: (status: number) => string;
  unreachable: string;
  valid: string;
  invalid: string;
  checkedAgainst: (label: string) => string;
  validatorTitle: string;
  line: (n: number | string) => string;
  generatedXml: string;
  download: string;
  mappingTitle: string;
  mappingLead: string;
  colKey: string;
  colTarget: string;
  colValue: string;
  xsdTitle: string;
  show: string;
  hide: string;
  aboutTitle: string;
  about: string;
  source: string;
};

export const TEXT: Record<Lang, Text> = {
  ja: {
    brandSuffix: "技術デモ",
    phaiworksUrl: "https://www.phaiworks.com/",
    toggle: "English",
    toggleHref: "/en",
    // h1 の文字はここだけ（仮の案）
    h1: "確定申告データの XML 生成・検証",
    heroImageAlt:
      "入力したデータが XML の文書になり、スキーマの検証の門を通る図。誤った部品が1つ見つかり、外に出されている",
    lead:
      "このデモでは、入力した確定申告データから XML の文書を生成し、構造と値が仕様に合っているかを XSD スキーマで検証します。処理には Python の Pydantic と lxml を使っています。「XML を作成」を押すたびにサーバーで生成と検証が実行され、その結果を表示します。あらかじめ用意した結果ではありません。",
    stepLabel: "処理の流れ",
    steps: [
      { t: "JSON", d: "入力をブラウザから送信" },
      { t: "Pydantic", d: "入力データを検証" },
      { t: "lxml", d: "項目を XML の決まった位置に配置" },
      { t: "XSD", d: "生成した XML を検証" },
    ],
    formTitle: "申告データ",
    formLead: "見本の値で作成した結果を表示しています。項目を変えてから、もう一度「XML を作成」を押してください。",
    name: "氏名",
    id: "納税者番号",
    idHint: "このデモでは13桁の数字と定めています。桁数が違うと、XSD のパターン（xs:pattern）の検証でエラーになります。",
    address: "住所",
    taxYear: "申告の対象の年",
    gross: "総所得金額",
    deductions: "所得控除の合計額",
    mode: "生成モード",
    modeHint: "わざと誤りを含む XML を生成し、XSD の検証でエラーが見つかることを確かめられます",
    fallbackMode: "正しい XML を生成する",
    generate: "XML を作成",
    generating: "作成中…",
    inputRejected: "入力に不備があります（Pydantic の検証エラー）: ",
    requestFailed: (status) => `サーバーからエラーが返されました（HTTP ${status}）`,
    unreachable: "サーバーに接続できません。少し時間をおいて、もう一度お試しください。",
    valid: "✅ スキーマに適合しています",
    invalid: "❌ スキーマに適合していません",
    checkedAgainst: (label) => `使用したスキーマ: tax_return.xsd ／ 生成モード: ${label}`,
    validatorTitle: "XSD の検証で見つかったエラー",
    line: (n) => (n === "-" ? "行番号なし" : `${n} 行目`),
    generatedXml: "生成した XML",
    download: "XML をダウンロード（.xtx の見本）",
    mappingTitle: "入力項目と XML の配置先の対応表",
    mappingLead:
      "入力した各項目を、XML 文書のどこ（XPath）に置いたかを示しています。実際の申告の形式でも同じ種類の対応表を使い、項目は数百になります。",
    colKey: "入力項目のキー",
    colTarget: "配置先（XPath）",
    colValue: "値",
    xsdTitle: "検証に使った XSD スキーマ",
    show: "表示",
    hide: "閉じる",
    aboutTitle: "このデモについて",
    about:
      "このデモのスキーマは、XML の生成と検証の流れを示すために作った簡略なものです。国税庁の e-Tax の仕様に準拠したものではなく、国税庁の資料も転載していません。実際の申告の形式では数百の項目を、公開された仕様のとおりの位置に置く必要があります。それでも、入力データを検証し、仕様に沿って XML を生成し、生成した XML を検証するという流れは同じです。税額は、総所得金額から所得控除の合計額を引いた課税所得に、一律10%を掛けて計算しています。見本のデータはすべて架空で、生成したファイルは実際の確定申告には使えません。",
    source: "ソースコード:",
  },
  en: {
    brandSuffix: "Technical Demo",
    phaiworksUrl: "https://www.phaiworks.com/en",
    toggle: "日本語",
    toggleHref: "/",
    h1: "XML Generation & Schema Validation",
    heroImageAlt:
      "Illustration of form data flowing into a structured document that passes a schema check gate, with one wrong block caught and set aside",
    lead:
      "This demo turns form data into an XML document that follows a fixed specification, then checks the finished file against an XSD schema (the rulebook for the format). The backend is written in Python (Pydantic and lxml). Every button on this page runs the real generation and checking code; nothing is pre-recorded.",
    stepLabel: "STEP",
    steps: [
      { t: "JSON input", d: "Sent from the browser" },
      { t: "Pydantic", d: "Validates the input" },
      { t: "lxml", d: "Maps fields into XML" },
      { t: "XSD", d: "Validates the output" },
    ],
    formTitle: "Filing data",
    formLead: "These are sample values. Change any field and click Generate XML again.",
    name: "Taxpayer name",
    id: "Taxpayer ID",
    idHint: "13 digits. The schema rejects any other length (xs:pattern).",
    address: "Address",
    taxYear: "Tax year",
    gross: "Gross income",
    deductions: "Deductions",
    mode: "Generation mode",
    modeHint: "Add a known mapping bug on purpose to see the schema check catch it",
    fallbackMode: "Correct mapping",
    generate: "Generate XML",
    generating: "Generating...",
    inputRejected: "Input rejected by Pydantic: ",
    requestFailed: (status) => `Request failed (HTTP ${status})`,
    unreachable: "Cannot reach the server. Please try again in a moment.",
    valid: "✅ Valid against schema",
    invalid: "❌ Invalid against schema",
    checkedAgainst: (label) => `Checked against tax_return.xsd — mode: ${label}`,
    validatorTitle: "Reported by the XSD validator",
    line: (n) => `line ${n}`,
    generatedXml: "Generated XML",
    download: "Download .xtx",
    mappingTitle: "Field mapping",
    mappingLead:
      "Where each input field is placed in the document. A real filing format uses the same kind of table, with several hundred rows.",
    colKey: "Input key",
    colTarget: "Placement (XPath)",
    colValue: "Value",
    xsdTitle: "The XSD schema used for validation",
    show: "Show",
    hide: "Hide",
    aboutTitle: "About this demo",
    about:
      "The schema here is a simplified structure written only for this demo. It is not the Japanese National Tax Agency (NTA) e-Tax specification, and no NTA material is copied. A real filing format needs several hundred fields, each placed exactly where the published specification says. The process, though, is the same: check the input, map it into XML, then check the output. The tax rate is simplified to a flat 10%. All sample data is fictional.",
    source: "Source:",
  },
};
