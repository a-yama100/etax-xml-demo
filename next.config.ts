import type { NextConfig } from "next";

// 'unsafe-eval' と ws: は開発サーバー（React の不具合の表示・HMR）だけで使う。本番では入れない。
const isDev = process.env.NODE_ENV !== "production";

// 外部から読み込むものは無い（フォントは next/font で自前配信、fetch はすべて同じ origin）ので 'self' だけにする。
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// /api/py/* is served by the Python function in api/index.py.
// In development the FastAPI app runs separately (npm run api) on :8001;
// in production Vercel routes the request to the serverless function, which
// receives the original path, so the FastAPI routes stay identical in both.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8001/api/py/:path*"
            : "/api/",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
