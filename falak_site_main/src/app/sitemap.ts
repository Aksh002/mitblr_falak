import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const now = new Date();
  const pages = [
    "",
    "/passes",
    "/events",
    "/cultural",
    "/sports",
  ];
  return pages.map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1.0 : 0.6,
  }));
}
