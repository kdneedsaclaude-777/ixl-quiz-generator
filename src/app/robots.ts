import type { MetadataRoute } from "next";

// Allow indexing of public marketing/auth pages; keep the authenticated app
// surfaces and APIs out of search results.
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/parent/", "/child/", "/tutor/", "/quiz/", "/student/", "/live/", "/ops"],
    },
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
