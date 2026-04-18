import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hamshirago.uz";

const SERVICE_SLUGS = {
  ru: ["ukol-na-domu", "kapelnica-na-domu", "izmerenie-davleniya", "uxod-na-domu"],
  uz: ["ukol-uyda", "tomchi-uyda", "qon-bosimi-ekz", "uyda-parvarish"],
};

const DISTRICT_SLUGS = {
  ru: ["tashkent-chilanzar", "tashkent-yunusabad", "tashkent-mirzo-ulugbek", "tashkent-yakkasaray"],
  uz: ["toshkent-chilonzor", "toshkent-yunusobod", "toshkent-mirzo-ulugbek", "toshkent-yakkasaroy"],
};

export default function sitemap(): MetadataRoute.Sitemap {
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/ru`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: { ru: `${SITE_URL}/ru`, uz: `${SITE_URL}/uz` },
      },
    },
    {
      url: `${SITE_URL}/uz`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: { ru: `${SITE_URL}/ru`, uz: `${SITE_URL}/uz` },
      },
    },
  ];

  const servicePages: MetadataRoute.Sitemap = [
    ...SERVICE_SLUGS.ru.map((slug) => ({
      url: `${SITE_URL}/ru/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          ru: `${SITE_URL}/ru/${slug}`,
          uz: `${SITE_URL}/uz/${SERVICE_SLUGS.uz[SERVICE_SLUGS.ru.indexOf(slug)]}`,
        },
      },
    })),
    ...SERVICE_SLUGS.uz.map((slug) => ({
      url: `${SITE_URL}/uz/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          uz: `${SITE_URL}/uz/${slug}`,
          ru: `${SITE_URL}/ru/${SERVICE_SLUGS.ru[SERVICE_SLUGS.uz.indexOf(slug)]}`,
        },
      },
    })),
  ];

  const districtPages: MetadataRoute.Sitemap = [
    ...DISTRICT_SLUGS.ru.map((slug, i) => ({
      url: `${SITE_URL}/ru/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          ru: `${SITE_URL}/ru/${slug}`,
          uz: `${SITE_URL}/uz/${DISTRICT_SLUGS.uz[i]}`,
        },
      },
    })),
    ...DISTRICT_SLUGS.uz.map((slug, i) => ({
      url: `${SITE_URL}/uz/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          uz: `${SITE_URL}/uz/${slug}`,
          ru: `${SITE_URL}/ru/${DISTRICT_SLUGS.ru[i]}`,
        },
      },
    })),
  ];

  return [...mainPages, ...servicePages, ...districtPages];
}
