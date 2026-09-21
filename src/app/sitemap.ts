import type { MetadataRoute } from "next";

// Nexus CRM is an authenticated/private application. There are currently no public,
// indexable content pages, so the sitemap intentionally contains no URLs.
// Add public marketing/docs routes here when they become available.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
