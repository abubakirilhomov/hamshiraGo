import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "recharts", "lucide-react"],
  },
  async headers() {
    return [
      {
        // HTML страницы — не кэшировать, чтобы после редеплоя браузер брал свежую версию
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  sourcemaps: { disable: true },
});
