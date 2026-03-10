import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.hamshirago.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/auth"],
        disallow: ["/", "/orders/", "/order/", "/service/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
