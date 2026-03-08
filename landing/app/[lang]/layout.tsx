import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { LangProvider } from "@/context/LangContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Lang } from "@/i18n/translations";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hamshirago.uz";

const META: Record<Lang, {
  htmlLang: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
}> = {
  ru: {
    htmlLang: "ru",
    title: "Медик на дому в Ташкенте за 30 минут | HamshiraGo",
    description:
      "Вызовите медика на дом в Ташкенте: уколы, капельницы, измерение давления, ЭКГ. Верифицированные медики приедут за 30 минут. Работаем 24/7. Оплата через Payme и Click.",
    keywords:
      "медик на дому Ташкент, медсестра на дому Ташкент, укол на дому Ташкент, капельница на дому Ташкент, вызов медика на дом, медицинская помощь на дому Узбекистан, hamshira, uyda tibbiy yordam",
    ogTitle: "HamshiraGo — Медик на дому за 30 минут",
    ogDescription:
      "Закажите медика на дом в Ташкенте через приложение. Быстро, безопасно, круглосуточно.",
  },
  uz: {
    htmlLang: "uz",
    title: "Uyda hamshira Toshkentda 30 daqiqada | HamshiraGo",
    description:
      "Toshkentda uyga hamshira chaqiring: in'ektsiya, tomchi, qon bosimi, EKG. Tasdiqlangan hamshiralar 30 daqiqada keladi. 24/7 ishlaydi. Payme va Click orqali to'lov.",
    keywords:
      "uyda hamshira Toshkent, hamshira chaqirish, uyga tibbiy yordam, uyda ukol Toshkent, uyda tomchilatish Toshkent, tibbiy xizmat uyga, медик на дому Ташкент, HamshiraGo",
    ogTitle: "HamshiraGo — Uyda hamshira 30 daqiqada",
    ogDescription:
      "Toshkentda ilovalar orqali uyga hamshira chaqiring. Tez, xavfsiz, 24/7.",
  },
};

const JSON_LD: Record<Lang, object> = {
  ru: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalBusiness",
        "@id": `${SITE_URL}/ru#business`,
        name: "HamshiraGo",
        url: `${SITE_URL}/ru`,
        description: "Профессиональные медицинские услуги на дому в Ташкенте — уколы, капельницы, измерение давления.",
        image: `${SITE_URL}/og.png`,
        areaServed: { "@type": "City", name: "Ташкент", sameAs: "https://www.wikidata.org/wiki/Q269" },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tashkent",
          addressCountry: "UZ",
        },
        openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "00:00", closes: "23:59" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "500" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Медицинские услуги на дому",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Укол на дому" }, priceSpecification: { "@type": "PriceSpecification", price: "80000", priceCurrency: "UZS" } },
            { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Капельница на дому" }, priceSpecification: { "@type": "PriceSpecification", price: "150000", priceCurrency: "UZS" } },
            { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Измерение давления и ЭКГ" }, priceSpecification: { "@type": "PriceSpecification", price: "50000", priceCurrency: "UZS" } },
          ],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Как быстро приедет медик?", acceptedAnswer: { "@type": "Answer", text: "Медик приезжает в течение 30 минут после оформления заказа через приложение HamshiraGo." } },
          { "@type": "Question", name: "Работаете ли вы ночью?", acceptedAnswer: { "@type": "Answer", text: "Да, мы работаем круглосуточно 24/7, включая ночное время, выходные и праздники." } },
          { "@type": "Question", name: "Как убедиться, что медик настоящий?", acceptedAnswer: { "@type": "Answer", text: "Все медики проходят обязательную верификацию документов и лицензий. Рейтинг и отзывы доступны в приложении." } },
          { "@type": "Question", name: "Как оплатить услугу?", acceptedAnswer: { "@type": "Answer", text: "Оплата через Payme или Click — удобно и безопасно прямо в приложении." } },
        ],
      },
      {
        "@type": "MobileApplication",
        name: "HamshiraGo",
        operatingSystem: ["iOS", "Android"],
        applicationCategory: "HealthApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "500" },
      },
    ],
  },
  uz: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalBusiness",
        "@id": `${SITE_URL}/uz#business`,
        name: "HamshiraGo",
        url: `${SITE_URL}/uz`,
        description: "Toshkentda professional tibbiy xizmatlar uyingizga — in'ektsiya, tomchi, qon bosimi.",
        image: `${SITE_URL}/og.png`,
        areaServed: { "@type": "City", name: "Toshkent", sameAs: "https://www.wikidata.org/wiki/Q269" },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tashkent",
          addressCountry: "UZ",
        },
        openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "00:00", closes: "23:59" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "500" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Uyda tibbiy xizmatlar",
          itemListElement: [
            { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Uyda in'ektsiya" }, priceSpecification: { "@type": "PriceSpecification", price: "80000", priceCurrency: "UZS" } },
            { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Uyda tomchilatish" }, priceSpecification: { "@type": "PriceSpecification", price: "150000", priceCurrency: "UZS" } },
            { "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: "Qon bosimi va EKG" }, priceSpecification: { "@type": "PriceSpecification", price: "50000", priceCurrency: "UZS" } },
          ],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Hamshira qancha vaqtda keladi?", acceptedAnswer: { "@type": "Answer", text: "HamshiraGo ilovasida buyurtma berganingizdan so'ng 30 daqiqa ichida hamshira keladi." } },
          { "@type": "Question", name: "Kechasi ham ishlaymisiz?", acceptedAnswer: { "@type": "Answer", text: "Ha, biz 24/7 ishlaydi — kechasi, dam olish kunlari va bayramlarda ham." } },
          { "@type": "Question", name: "Hamshira haqiqiy mutaxassis ekanligiga qanday ishonaman?", acceptedAnswer: { "@type": "Answer", text: "Barcha hamshiralar hujjatlar va litsenziyalarni majburiy tekshirishdan o'tadi. Reyting va sharhlar ilovada mavjud." } },
          { "@type": "Question", name: "Xizmat uchun qanday to'lov qilish mumkin?", acceptedAnswer: { "@type": "Answer", text: "Payme yoki Click orqali — ilovada qulay va xavfsiz to'lov." } },
        ],
      },
      {
        "@type": "MobileApplication",
        name: "HamshiraGo",
        operatingSystem: ["iOS", "Android"],
        applicationCategory: "HealthApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "500" },
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export async function generateStaticParams() {
  return [{ lang: "ru" }, { lang: "uz" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Lang = rawLang === "uz" ? "uz" : "ru";
  const m = META[lang];

  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: {
      canonical: `${SITE_URL}/${lang}`,
      languages: {
        "ru": `${SITE_URL}/ru`,
        "ru-UZ": `${SITE_URL}/ru`,
        "uz": `${SITE_URL}/uz`,
        "uz-UZ": `${SITE_URL}/uz`,
        "x-default": `${SITE_URL}/ru`,
      },
    },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: `${SITE_URL}/${lang}`,
      siteName: "HamshiraGo",
      type: "website",
      locale: lang === "uz" ? "uz_UZ" : "ru_RU",
      images: [
        {
          url: `${SITE_URL}/${lang}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: m.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: m.ogTitle,
      description: m.ogDescription,
      images: [`${SITE_URL}/${lang}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Lang = rawLang === "uz" ? "uz" : "ru";

  if (rawLang !== "ru" && rawLang !== "uz") notFound();

  const jsonLd = JSON_LD[lang];

  return (
    <html lang={lang} data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <LangProvider initialLang={lang}>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
