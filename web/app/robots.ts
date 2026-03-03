import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-production-d365f.up.railway.app";

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
