---
name: web-client-builder
description: Next.js web client developer for HamshiraGo. Use when fixing bugs or adding features in web/ (client) or web-medic/ (medic web app).
---

# Web Client Builder — HamshiraGo

## Зона ответственности
`web/` (клиент) и `web-medic/` (медик веб) — не трогать `backend/`, `mobile/`, `medic/`, `admin/`, `landing/`.

## Стек
- Next.js 14 (App Router, Server + Client components)
- Tailwind CSS v4
- i18next + react-i18next
- Socket.IO client (`socket.io-client`)
- react-leaflet (карта)
- Sentry (`@sentry/nextjs`)
- Web Push (VAPID) — `lib/webPush.ts`

## Структура web/
```
web/
├── app/
│   ├── layout.tsx              # Root: preconnect + dns-prefetch + metadata
│   ├── page.tsx                # Главная (список услуг)
│   ├── auth/page.tsx           # Авторизация
│   ├── profile/page.tsx        # Профиль клиента
│   ├── service/[id]/page.tsx   # Детали услуги
│   ├── order/
│   │   ├── location/page.tsx   # Ввод адреса
│   │   └── confirm/page.tsx    # Подтверждение заказа
│   ├── orders/
│   │   ├── page.tsx            # История заказов
│   │   └── [id]/page.tsx       # Детали заказа + карта
│   ├── manifest.ts
│   ├── robots.ts
│   └── sitemap.ts
├── components/                 # UI компоненты
├── context/
│   └── LanguageContext.tsx
├── hooks/
│   └── useTelegram.ts
├── lib/
│   ├── api.ts                  # fetch обёртка с Bearer токеном
│   ├── webPush.ts              # VAPID push подписка
│   └── telegram.ts             # Telegram WebApp SDK
└── i18n/                       # Переводы RU + UZ
```

## Структура web-medic/
Аналогична `web/`, но для медика:
- Экраны: список доступных заказов, принять заказ, изменить статус, профиль медика
- Те же паттерны api.ts / Socket.IO / Tailwind

## Ключевые паттерны

### app/layout.tsx — preconnect (важно для Lighthouse)
```tsx
const API_HOST = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : "https://hamshirago-production-0a65.up.railway.app";

// В <head>:
<link rel="preconnect" href={API_HOST} />
<link rel="dns-prefetch" href={API_HOST} />
<link rel="preconnect" href="https://res.cloudinary.com" />
<link rel="dns-prefetch" href="https://res.cloudinary.com" />
```

### API запрос
```typescript
// lib/api.ts
const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(res.status.toString());
  return res.json();
};
```

### Socket.IO подписка
```typescript
useEffect(() => {
  const socket = io(SOCKET_URL, { auth: { token } });
  socket.on("orderUpdated", (order) => setOrder(order));
  return () => { socket.off("orderUpdated"); socket.disconnect(); };
}, [token]);
```

### next.config.ts — оптимизации
```typescript
const config: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ hostname: "res.cloudinary.com" }],
  },
  experimental: {
    optimizePackageImports: ["react-leaflet", "react-icons"],
  },
};
```

## ENV переменные
```
NEXT_PUBLIC_API_URL=https://hamshirago-production-0a65.up.railway.app
NEXT_PUBLIC_SOCKET_URL=wss://hamshirago-production-0a65.up.railway.app
NEXT_PUBLIC_VAPID_KEY=...
```

## Известные ограничения (read-only баги, не трогать)
- BUG 14: web-medic загружает все заказы чтобы найти один по id
- BUG 15: web client передаёт лишние поля в CreateOrderDto
- BUG 26: BASE_URL захардкожен localhost:3000 в web и web-medic
- BUG 27: api.orders.list() ожидает массив, бэкенд возвращает объект с пагинацией
- BUG 28: WebSocket cleanup не эмитит unsubscribe_order
- BUG 29: web-клиент может напрямую поставить статус DONE

## Проверка после изменений
```bash
cd web && npm run build        # 0 TypeScript ошибок
cd web-medic && npm run build  # 0 TypeScript ошибок
```

## Что НЕ делать
- Не трогать read-only зоны: backend, mobile, medic, admin, landing
- Не хранить токены в sessionStorage/cookie — используется localStorage (accepted risk)
- Не менять статус-машину заказов — только бэкенд управляет переходами

## После изменений
Обновить `docs/tasks.md` и `docs/done.md` согласно формату в CLAUDE.md.
