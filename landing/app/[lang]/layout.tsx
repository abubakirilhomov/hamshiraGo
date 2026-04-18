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
      "медик на дому Ташкент, медсестра на дому Ташкент, укол на дому Ташкент, капельница на дому Ташкент, вызов медика на дом, медицинская помощь на дому Узбекистан, медсестра укол дома, вызов медсестры на дом Ташкент, внутримышечный укол на дому, подкожный укол на дому, укол антибиотик на дому, укол цефтриаксон на дому, укол диклофенак на дому, укол кеторол на дому, укол мильгамма на дому, укол витамин б12 на дому, укол обезболивающего на дому, укол витаминов на дому Ташкент, капельница глюкоза на дому, капельница физраствор на дому, капельница магнезия на дому, капельница актовегин на дому, капельница церебролизин на дому, капельница витамины на дому, прокапаться дома Ташкент, поставить капельницу на дому, уход за больным на дому Ташкент, медсестра для пожилых Ташкент, медсестра для лежачих больных, уход за лежачим больным Ташкент, перевязка на дому Ташкент, обработка швов на дому, реабилитация на дому Ташкент, послеоперационный уход дома, ЭКГ на дому Ташкент, измерение давления на дому, медсестра на дом цена, сколько стоит медсестра на дом, медик на дом недорого, медбрат на дому Ташкент, частная медсестра Ташкент, выездная медсестра Ташкент, медик на дом Юнусабад, медик на дом Чиланзар, медик на дом Мирзо-Улугбек, медик на дом Яккасарай, медик на дом Шайхантаур, медик на дом Алмазар, медик на дом Сергели, медик на дом Учтепа, медицинская сестра на дом 24/7, вызов медика срочно, медсестра ночью Ташкент, срочный вызов медсестры, заказать медсестру онлайн, медик на дом приложение, поставить укол на дому, вызвать медсестру, HamshiraGo цена, hamshira uyga chaqirish, HamshiraGo",
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
      "uyda hamshira Toshkent, hamshira chaqirish, uyga tibbiy yordam, uyda ukol Toshkent, mushak ukoli uyda, teri osti ukoli uyda, antibiotik ukol uyda, seftriakson ukol uyda, B12 ukol uyda, vitamin ukoli uyda, og'riq qoldiruvchi ukol uyda, diklofenok ukol uyda, uyda tomchilatish Toshkent, glyukoza tomchi uyda, fiziologik eritma tomchi uyda, magniy sulfat tomchi uyda, aktovegyn tomchi uyda, vitamin tomchi uyda, uyda kapelnitsa Toshkent, tibbiy xizmat uyga, hamshira uyga narxi, hamshira chaqirish narxi, uyga tibbiy xizmat narxi, Yunusobodda uyda hamshira, Chilonzorda uyda hamshira, hamshira uyga Yakkasaroy, hamshira uyga Mirzo Ulugbek, hamshira Shayxontohur, hamshira Olmazor, hamshira Sergeli, hamshira Uchtepa, uyda parvarish Toshkent, keksalar uchun uyda hamshira, yotib qolgan bemor uchun hamshira, operatsiyadan keyin uyda parvarish, bog'lam almashtirish uyda, reabilitatsiya uyda Toshkent, uyda EKG Toshkent, arterial bosim uyda o'lchash, kechasi hamshira chaqirish, shoshilinch hamshira Toshkent, tez hamshira chaqirish, onlayn hamshira chaqirish, xususiy hamshira Toshkent, hamshira ilovasi Toshkent, toshkent uyda tibbiy yordam, medik na domu Tashkent, HamshiraGo narxi, HamshiraGo",
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
        image: `${SITE_URL}/ru/opengraph-image`,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        priceRange: "50 000 – 200 000 UZS",
        areaServed: { "@type": "City", name: "Ташкент", sameAs: "https://www.wikidata.org/wiki/Q269" },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tashkent",
          addressCountry: "UZ",
        },
        openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "00:00", closes: "23:59" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "500", bestRating: "5" },
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
          { "@type": "Question", name: "Работаете ли вы ночью?", acceptedAnswer: { "@type": "Answer", text: "Да, мы работаем круглосуточно 24/7, включая ночное время, выходные и праздники Узбекистана." } },
          { "@type": "Question", name: "Как убедиться, что медик настоящий?", acceptedAnswer: { "@type": "Answer", text: "Все медики проходят обязательную верификацию документов и лицензий. Рейтинг и отзывы доступны в приложении." } },
          { "@type": "Question", name: "Как оплатить услугу?", acceptedAnswer: { "@type": "Answer", text: "Оплата через Payme или Click — удобно и безопасно прямо в приложении." } },
          { "@type": "Question", name: "Сколько стоит вызов медика на дом?", acceptedAnswer: { "@type": "Answer", text: "Стоимость зависит от процедуры: укол — от 80 000 сум, капельница — от 150 000 сум, измерение давления и ЭКГ — от 50 000 сум, уход на дому — от 200 000 сум. Точная цена отображается при оформлении заказа в приложении HamshiraGo." } },
          { "@type": "Question", name: "В каких районах Ташкента работает HamshiraGo?", acceptedAnswer: { "@type": "Answer", text: "Мы работаем во всех районах Ташкента: Юнусабад, Чиланзар, Мирзо-Улугбек, Яккасарай, Шайхантаур, Сергели, Алмазар, Бектемир, Учтепа, Яшнобод. Также выезжаем в ближайшие пригороды — уточняйте при заказе." } },
          { "@type": "Question", name: "Можно ли вызвать медика без рецепта?", acceptedAnswer: { "@type": "Answer", text: "Да, для оформления заказа в приложении рецепт не нужен. Достаточно указать нужную процедуру и адрес. Медик выполняет процедуры по назначению вашего врача." } },
          { "@type": "Question", name: "Какие уколы делает медик на дому?", acceptedAnswer: { "@type": "Answer", text: "Медик сделает любой укол по назначению врача: антибиотики (цефтриаксон, пенициллин), витамины (B12, B6, мильгамма), противовоспалительные (диклофенак, кеторол), обезболивающие, инсулин, актовегин и другие — внутримышечно и подкожно." } },
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
        image: `${SITE_URL}/uz/opengraph-image`,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        priceRange: "50 000 – 200 000 UZS",
        areaServed: { "@type": "City", name: "Toshkent", sameAs: "https://www.wikidata.org/wiki/Q269" },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tashkent",
          addressCountry: "UZ",
        },
        openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "00:00", closes: "23:59" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "500", bestRating: "5" },
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
          { "@type": "Question", name: "Kechasi ham ishlaymisiz?", acceptedAnswer: { "@type": "Answer", text: "Ha, biz 24/7 ishlaydi — kechasi, dam olish kunlari va O'zbekiston bayramlarida ham." } },
          { "@type": "Question", name: "Hamshira haqiqiy mutaxassis ekanligiga qanday ishonaman?", acceptedAnswer: { "@type": "Answer", text: "Barcha hamshiralar hujjatlar va litsenziyalarni majburiy tekshirishdan o'tadi. Reyting va sharhlar ilovada mavjud." } },
          { "@type": "Question", name: "Xizmat uchun qanday to'lov qilish mumkin?", acceptedAnswer: { "@type": "Answer", text: "Payme yoki Click orqali — ilovada qulay va xavfsiz to'lov." } },
          { "@type": "Question", name: "Hamshira xizmati qancha turadi?", acceptedAnswer: { "@type": "Answer", text: "Narx muolajaga qarab: ukol — 80 000 so'mdan, tomchi — 150 000 so'mdan, qon bosimi va EKG — 50 000 so'mdan, parvarish — 200 000 so'mdan. Aniq narx HamshiraGo ilovasida buyurtmada ko'rsatiladi." } },
          { "@type": "Question", name: "HamshiraGo Toshkentning qaysi tumanlarida ishlaydi?", acceptedAnswer: { "@type": "Answer", text: "Biz Toshkentning barcha tumanlarida ishlaymiz: Yunusobod, Chilonzor, Mirzo Ulug'bek, Yakkasaroy, Shayxontohur, Sergeli, Olmazor, Bektemir, Uchtepa, Yashnobod. Shuningdek, yaqin atroflarga ham chiqamiz." } },
          { "@type": "Question", name: "Retseptsiz hamshira chaqirish mumkinmi?", acceptedAnswer: { "@type": "Answer", text: "Ha, ilovada buyurtma berish uchun retsept talab qilinmaydi. Faqat kerakli muolaja va manzilingizni ko'rsating. Hamshira shifokor ko'rsatmasi asosida muolajani bajaradi." } },
          { "@type": "Question", name: "Hamshira uyda qanday ukollarni qiladi?", acceptedAnswer: { "@type": "Answer", text: "Hamshira shifokor buyrug'i asosida istalgan ukol qiladi: antibiotiklar (seftriakson, penitsillin), vitaminlar (B12, milgamma), yallig'lanishga qarshi (diklofenok, ketorol), og'riq qoldiruvchilar, insulin, aktovegyn va boshqalar." } },
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
