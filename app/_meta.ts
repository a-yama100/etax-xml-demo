import type { Metadata } from "next";
import { META, SITE_URL, type Lang } from "@/lib/content";

// ページの題名・説明・正規の URL・言語の対応（hreflang）・SNS の文
export function pageMetadata(lang: Lang): Metadata {
  const m = META[lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: m.title,
    description: m.description,
    robots: { index: true, follow: true },
    alternates: { canonical: m.path, languages: { ja: "/", en: "/en", "x-default": "/" } },
    openGraph: {
      type: "website",
      url: SITE_URL + m.path,
      siteName: "PH AI Works",
      locale: lang === "ja" ? "ja_JP" : "en_US",
      title: m.title,
      description: m.description,
    },
    twitter: { card: "summary", title: m.title, description: m.description },
  };
}
