import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hamshirago.uz";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/ru`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          ru: `${SITE_URL}/ru`,
          uz: `${SITE_URL}/uz`,
        },
      },
    },
    {
      url: `${SITE_URL}/uz`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          ru: `${SITE_URL}/ru`,
          uz: `${SITE_URL}/uz`,
        },
      },
    },
  ];
}
