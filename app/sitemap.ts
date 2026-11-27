import type { MetadataRoute } from "next";

// 検索エンジン向けのページ一覧（/sitemap.xml）。日本語と英語を対にする
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://etax-xml-demo.phaiworks.com";
  const languages = { ja: base + "/", en: base + "/en" };
  return [
    { url: base + "/", lastModified: new Date(), changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: base + "/en", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
  ];
}
