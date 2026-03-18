---
name: admin-ui-builder
description: React/Vite admin panel developer for HamshiraGo. Use when adding pages, fixing UI bugs, updating i18n, or modifying API calls in admin/.
---

# Admin UI Builder — HamshiraGo



## Зона ответственности
Только `admin/` — не трогать `backend/`, `mobile/`, `medic/`, `web/`, `web-medic/`, `landing/`.

## Стек
- React 18 + Vite
- shadcn/ui (компоненты в `@/components/ui/`)
- react-router-dom v6 (BrowserRouter, Routes, Route)
- i18next + react-i18next (`useTranslation`)
- framer-motion (анимации)
- Recharts (графики в Reports)
- Sentry (`@sentry/react`)
- PostHog (`posthog-js`)

## Структура admin/src/
```
admin/src/
├── main.tsx                    # Sentry init, PostHog init, ReactDOM.createRoot
├── App.tsx                     # BrowserRouter + Routes + PageTracker
├── lib/
│   ├── api.ts                  # Все API-вызовы (request helper + все функции)
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx           # KPI карточки + isPaidMode badge
│   ├── Verification.tsx        # Очередь верификации медиков с горячими клавишами
│   ├── Medics.tsx              # Список медиков + блокировка + пополнение кошелька
│   ├── Clients.tsx             # Список клиентов + блокировка
│   ├── Orders.tsx              # Таблица заказов с фильтрами
│   ├── Services.tsx            # CRUD услуг (RU + UZ поля)
│   ├── Reports.tsx             # Финансовые отчёты, CSV экспорт
│   ├── Settings.tsx            # Переключатель isPaidMode
│   └── NotFound.tsx
├── components/
│   ├── AdminLayout.tsx         # Обёртка: sidebar + main content
│   ├── AdminSidebar.tsx        # Навигация с иконками lucide-react
│   ├── KpiCard.tsx             # Карточка метрики
│   ├── StatusBadge.tsx         # Бейдж статуса заказа
│   ├── SplashScreen.tsx        # Лого-сплэш при загрузке
│   ├── CommandPalette.tsx      # Ctrl+K поиск по страницам
│   ├── ThemeToggle.tsx
│   ├── NavLink.tsx
│   └── ErrorBoundary.tsx
├── context/
│   └── LanguageContext.tsx     # useLanguage hook
├── hooks/
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   └── usePWAInstall.ts
└── i18n/
    ├── index.ts                # i18next init, resources
    ├── ru.json                 # Все переводы RU
    └── uz.json                 # Все переводы UZ
```

## Ключевые паттерны

### API запрос
```typescript
// lib/api.ts — request helper
const request = async <T>(method: string, path: string, body?: unknown, auth = true): Promise<T> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers["x-admin-secret"] = localStorage.getItem("admin_token") ?? "";
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(res.status.toString());
  return res.json();
};

// Пример функции:
export const getMedics = () => request<Medic[]>("GET", "/admin/medics");
export const updateSettings = (data: Partial<AppSettings>) => request<AppSettings>("PATCH", "/settings", data);
```

### i18n в компоненте
```typescript
const { t } = useTranslation();
// Ключи: "nav.dashboard", "dashboard.title", "medics.block" и т.д.
// Структура ключей см. i18n/ru.json
```

### Добавление новой страницы
1. Создать `src/pages/NewPage.tsx`
2. Добавить Route в `App.tsx`:
   ```tsx
   <Route path="/new-page" element={<AdminLayout><NewPage /></AdminLayout>} />
   ```
3. Добавить пункт в `AdminSidebar.tsx`:
   ```tsx
   { key: "newPage", url: "/new-page", icon: IconName }
   ```
4. Добавить ключи в `i18n/ru.json` и `i18n/uz.json`:
   ```json
   "nav": { "newPage": "Новая страница" }
   ```

### Добавление новых i18n ключей
Всегда обновлять оба файла синхронно: `i18n/ru.json` и `i18n/uz.json`.

### ENV переменные
```
VITE_API_URL=https://hamshirago-production-0a65.up.railway.app
VITE_SENTRY_DSN=...
VITE_POSTHOG_KEY=...
VITE_APP_VERSION=1.0.0
```

## Известные ограничения (read-only баги, не трогать)
- BUG 30/31: Dashboard считает доход только по первым 100 заказам
- BUG 32: Router проверяет только наличие токена, не его валидность
- BUG 33: JWT в localStorage — XSS уязвимость (accepted risk)

## Проверка после изменений
```bash
cd admin && npm run build   # 0 TypeScript ошибок
```

## Что НЕ делать
- Не трогать read-only зоны: backend, mobile, medic, web, web-medic, landing
- Не добавлять ключи только в одном языковом файле — всегда оба
- Не использовать прямой fetch — только через `request()` в api.ts

## После изменений
Обновить `docs/tasks.md` и `docs/done.md` согласно формату в CLAUDE.md.
