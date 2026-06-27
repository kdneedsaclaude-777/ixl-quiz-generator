import type { NextConfig } from "next";

// Security headers applied to every response. Kept deliberately conservative so
// they don't break the app:
//  • X-Frame-Options: SAMEORIGIN (not DENY) — the /admin/import screen embeds the
//    same-origin PDF tool in an iframe, so DENY would break it.
//  • No strict CSP yet — the inline theme-bootstrap script would need a nonce;
//    adding CSP is tracked as a follow-up (see the deploy guide).
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // HSTS — only enforced over HTTPS; harmless on http during local dev.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // pdfkit ships .afm font data files that Next's bundler doesn't trace.
  // Keeping it (and exceljs) external lets them load from node_modules with
  // their data assets intact at runtime.
  serverExternalPackages: ["pdfkit", "exceljs"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
