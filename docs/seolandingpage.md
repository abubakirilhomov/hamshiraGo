# HamshiraGo Landing — SEO чеклист

> Цель: выйти на #1 в Узбекистане по запросам на русском и узбекском языках.

---

## ✅ Уже сделано в коде

- `/ru` и `/uz` — отдельные SSR страницы (Google индексирует оба языка)
- `generateMetadata` — уникальные title/description/keywords per lang
- `hreflang` alternates — `ru`, `ru-UZ`, `uz`, `uz-UZ`, `x-default`
- JSON-LD: `MedicalBusiness` + `FAQPage` + `MobileApplication`
- `/sitemap.xml` — оба URL с language alternates
- `/robots.txt` — ссылка на sitemap
- OG-картинка 1200×630 автогенерация per lang
- Переключатель языка в Navbar обновляет URL (`/ru` ↔ `/uz`)

---

## 📋 Чеклист по этапам

### Этап 1 — Прямо сейчас (до деплоя)

- [ ] **Купить домен** — `hamshirago.uz` на [nic.uz](https://nic.uz) (~$20/год)
  - Альтернативы: `hamshirago.com`, `hamshira.uz`

- [ ] **Добавить `.env.local`** в `landing/`:
  ```
  NEXT_PUBLIC_SITE_URL=https://hamshirago.uz
  ```

- [ ] **Google My Business** — [business.google.com](https://business.google.com)
  - Название: HamshiraGo
  - Категория: Медицинские услуги / Служба неотложной медицинской помощи
  - Город: Ташкент, Узбекистан
  - Телефон, описание на RU и UZ
  - ➡ Начнёт показываться на Google Maps ещё до деплоя

- [ ] **Yandex Business** — [business.yandex.ru](https://business.yandex.ru)
  - То же самое (Яндекс ~30% поиска в Узбекистане)

---

### Этап 2 — После покупки домена (до деплоя)

- [ ] **Google Search Console** — верификация через DNS TXT запись
  - Зайти на [search.google.com/search-console](https://search.google.com/search-console)
  - Добавить домен → «Доменная запись» → скопировать TXT → добавить в DNS у регистратора
  - Не нужен живой сайт

- [ ] **Yandex Webmaster** — [webmaster.yandex.ru](https://webmaster.yandex.ru)
  - Аналогичная верификация через DNS

---

### Этап 3 — Сразу после деплоя

- [ ] Скормить sitemap в Google Search Console:
  `https://hamshirago.uz/sitemap.xml`

- [ ] Скормить sitemap в Yandex Webmaster:
  `https://hamshirago.uz/sitemap.xml`

- [ ] Запросить индексацию вручную:
  - В GSC: «Проверка URL» → `https://hamshirago.uz/ru` → «Запросить индексацию»
  - То же для `/uz`

- [ ] Проверить JSON-LD через [Google Rich Results Test](https://search.google.com/test/rich-results)

- [ ] Проверить hreflang через [hreflang.org checker](https://www.hreflang.org/checker/)

---

### Этап 4 — Внешние ссылки (обратные ссылки = главный фактор ранжирования)

- [ ] Написать в местные СМИ Ташкента (kun.uz, gazeta.uz, daryo.uz) — попросить обзор/упоминание
- [ ] Добавить сайт в узбекские каталоги бизнесов (olx.uz, tashkent.city и др.)
- [ ] Telegram-каналы Узбекистана — анонс запуска
- [ ] App Store и Google Play — ссылка на сайт в описании приложения

---

## 🔑 Ключевые запросы для отслеживания

### Русский
| Запрос | Приоритет |
|--------|-----------|
| медик на дому Ташкент | 🔴 Высокий |
| медсестра на дому Ташкент | 🔴 Высокий |
| укол на дому Ташкент | 🔴 Высокий |
| капельница на дому Ташкент | 🔴 Высокий |
| вызов медика на дом Узбекистан | 🟡 Средний |
| медицинская помощь на дому | 🟡 Средний |

### Узбекский
| Запрос | Приоритет |
|--------|-----------|
| uyda hamshira Toshkent | 🔴 Высокий |
| hamshira chaqirish | 🔴 Высокий |
| uyda ukol Toshkent | 🔴 Высокий |
| uyda tomchilatish Toshkent | 🔴 Высокий |
| uyga tibbiy yordam | 🟡 Средний |
| tibbiy xizmat uyga | 🟡 Средний |

---

## ⏱ Ожидаемые сроки

| Этап | Срок |
|------|------|
| Первая индексация | 1–3 дня после деплоя |
| Появление в топ-10 | 2–4 недели |
| Топ-3 по основным запросам | 1–3 месяца |
| #1 по всем ключевым запросам | 3–6 месяцев (зависит от ссылок) |

> Самый быстрый способ ускорить — обратные ссылки с авторитетных узбекских сайтов.
