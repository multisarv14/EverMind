import type { MetadataRoute } from "next";

const base = process.env.APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/terms", "/privacy"], disallow: ["/api/", "/dashboard", "/chat", "/projects", "/settings", "/onboarding"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
