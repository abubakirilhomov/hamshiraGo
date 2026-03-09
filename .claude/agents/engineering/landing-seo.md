---
name: landing-seo
description: Next.js landing page developer for HamshiraGo. Use when editing landing/, adding SEO fixes, updating i18n translations, OG images, JSON-LD, or UI components.
---

# Landing SEO Builder — HamshiraGo

## Зона ответственности
Только `landing/` — не трогать `backend/`, `mobile/`, `medic/`, `admin/`, `web/`, `web-medic/`.

## Стек
- Next.js 15 (App Router, статическая генерация)
- Tailwind CSS v3
- framer-motion (анимации)
- TypeScript

## Структура landing/
```
landing/
├── app/
│   ├── layout.tsx               # Root layout — только import globals.css, returns children
│   ├── page.tsx                 # Редирект / → /ru
│   ├── robots.ts                # Robots.txt
│   ├── sitemap.ts               # Sitemap XML
│   └── [lang]/
│       ├── layout.tsx           # Lang layout: <html lang={lang}>, ThemeProvider, LangProvider, JSON-LD
│       ├── page.tsx             # Главная страница — все секции
│       └── opengraph-image.tsx  # OG-картинка 1200×630 (ImageResponse)
├── components/
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── HowItWorks.tsx
│   ├── Services.tsx
│   ├── Stats.tsx
│   ├── Download.tsx
│   ├── SeoContent.tsx          # Bilingual SEO-текст (RU + UZ)
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   ├── CustomCursor.tsx
│   ├── ScrollProgress.tsx
│   └── Icons.tsx
├── context/
│   ├── ThemeContext.tsx         # useDarkMode hook + data-theme="dark/light"
│   └── LangContext.tsx         # useLang hook, LangProvider
└── i18n/
    └── translations.ts         # t(key, lang) — объект с ru/uz переводами
```

## Ключевые паттерны

### i18n — переводы
```typescript
// i18n/translations.ts
export type Lang = "ru" | "uz";
export const t = (key: string, lang: Lang): string => translations[lang][key] ?? key;

// В компоненте (клиентский):
const { lang } = useLang();  // из context/LangContext
const text = t("hero.title", lang);
```

### ThemeContext
```typescript
const { isDark, toggleTheme } = useTheme();
// data-theme="dark" или "light" на <html>
```

### [lang]/layout.tsx — шаблон
```tsx
export default async function LangLayout({ children, params }) {
  const { lang: rawLang } = await params;
  const lang: Lang = rawLang === "uz" ? "uz" : "ru";
  if (rawLang !== "ru" && rawLang !== "uz") notFound();
  const jsonLd = JSON_LD[lang];
  return (
    <html lang={lang} data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <LangProvider initialLang={lang}>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### OG-изображение
```tsx
// app/[lang]/opengraph-image.tsx — ImageResponse
export default function OGImage() {
  return new ImageResponse(<div>...</div>, { width: 1200, height: 630 });
}
```

### Metadata
```typescript
// В generateMetadata:
openGraph: {
  images: [{ url: `${SITE_URL}/${lang}/opengraph-image`, width: 1200, height: 630 }],
},
twitter: {
  images: [`${SITE_URL}/${lang}/opengraph-image`],
},
```

### JSON-LD image — всегда использовать opengraph-image URL
```typescript
image: `${SITE_URL}/${lang}/opengraph-image`,  // НЕ /og.png (файла нет)
```

## ENV переменные
```
NEXT_PUBLIC_SITE_URL=https://hamshirago.uz   # default если не задан
```

## Проверка после изменений
```bash
cd landing && npm run build   # должно быть 0 ошибок TS
```

## Что НЕ делать
- Не трогать read-only зоны: backend, mobile, medic, admin, web, web-medic
- Не добавлять файл `/public/og.png` — используется динамический `opengraph-image.tsx`
- Не хардкодить `<html lang="ru">` — всегда `lang={lang}` из params

## После изменений
Обновить `docs/tasks.md` и `docs/done.md` согласно формату в CLAUDE.md.
