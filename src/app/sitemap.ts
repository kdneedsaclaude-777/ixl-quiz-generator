import type { MetadataRoute } from "next";

// Public, indexable pages only. The authenticated app surfaces are excluded
// (they're also disallowed in robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const routes = ["", "/auth/login", "/auth/signup", "/privacy", "/terms", "/delete-account"];
  return routes.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));
}
