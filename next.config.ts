import type { NextConfig } from "next";

// ALLOW_FRAMING=true is for the hosted preview, which renders the app inside its own iframe.
const allowFraming = process.env.ALLOW_FRAMING === "true";
const basePath = process.env.BASE_PATH || undefined;

const securityHeaders = [
  ...(allowFraming ? [] : [{ key: "X-Frame-Options", value: "SAMEORIGIN" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    // Main application context: no external scripts, no inline event handlers. Lesson content
    // never runs here; it runs inside sandboxed iframes served from /api/preview/* with their own CSP.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(allowFraming ? [] : ["frame-ancestors 'self'"]),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? "" },
  output: "standalone",
  serverExternalPackages: ["argon2", "pg", "parse5", "cheerio"],
  async headers() {
    return [
      { source: "/((?!api/preview).*)", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
