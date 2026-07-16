import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XML Generation & Schema Validation Demo | PH AI Works",
  description:
    "構造化データからスキーマ準拠のXMLを生成し、XSDで自動検証するPythonパイプラインのデモ。入力検証(Pydantic) → XML生成(lxml) → XSD検証の3段構成。",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
