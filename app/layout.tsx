import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XML Generation & Schema Validation Demo | PH AI Works",
  description:
    "A Python pipeline that maps structured data onto specification-compliant XML and validates the generated document against an XSD schema. Pydantic input validation, lxml generation, XSD output validation.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
