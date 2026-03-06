import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/context/LangContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "HamshiraGo — Медик на дому | Uyda hamshira",
  description:
    "Профессиональные медицинские услуги на дому: уколы, капельницы, измерение давления. Медик приедет за 30 минут. | Uyda professional tibbiy xizmatlar.",
  keywords: "медик на дому, укол на дому, капельница, hamshira, toshkent, uyda tibbiy",
  openGraph: {
    title: "HamshiraGo — Медик на дому за 30 минут",
    description: "Закажите медика на дом через приложение. Быстро, безопасно, круглосуточно.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
