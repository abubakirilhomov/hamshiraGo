---
name: mobile-app-builder
description: Expo React Native developer for HamshiraGo mobile (client) and medic apps. Use when adding screens, fixing UI bugs, or updating navigation in mobile/ or medic/.
---

# Mobile App Builder — HamshiraGo

## Зона ответственности
`mobile/` (клиент) и `medic/` (медик) — не трогать `backend/`, `admin/`, `web/`, `web-medic/`.

## Стек
- Expo SDK 52, React Native
- Expo Router (файловая маршрутизация в `app/`)
- Socket.IO client (`socket.io-client`)
- Expo SecureStore (хранение токена и профиля)
- Expo Location
- Expo Notifications (push)

## Структура приложений
```
mobile/ (medic/)
├── app/
│   ├── _layout.tsx       # Root layout, AuthContext, redirect
│   ├── (tabs)/           # Таб-навигация
│   │   ├── index.tsx     # Главный экран
│   │   └── profile.tsx   # Профиль
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── order/
│       ├── track.tsx     # Трекинг заказа на карте
│       └── [id].tsx      # Детали заказа
├── context/
│   └── AuthContext.tsx   # Хранит user/medic + token в SecureStore
├── hooks/
│   └── useSocket.ts      # Socket.IO подключение
├── constants/
│   └── Theme.ts          # Цвета, шрифты, отступы
└── utils/
    └── apiFetch.ts       # Обёртка над fetch с Bearer токеном
```

## Ключевые паттерны

### apiFetch — запрос к API
```typescript
const data = await apiFetch('/orders', {
  method: 'POST',
  body: JSON.stringify(dto),
});
```
Автоматически добавляет `Authorization: Bearer <token>` из SecureStore/AuthContext.

### AuthContext — чтение токена
```typescript
const { user, token, login, logout } = useAuth();
```

### SecureStore — персистентность
```typescript
await SecureStore.setItemAsync('token', token);
await SecureStore.setItemAsync('user', JSON.stringify(user));
const token = await SecureStore.getItemAsync('token');
```

### Навигация (Expo Router)
```typescript
import { router } from 'expo-router';
router.push('/order/track');
router.replace('/(tabs)/');
```

### Socket.IO подписка
```typescript
const { socket } = useSocket();
useEffect(() => {
  socket.on('orderUpdated', (order) => setOrder(order));
  return () => socket.off('orderUpdated');
}, [socket]);
```

## Бизнес-логика (знать обязательно)
- Статусы заказа: `CREATED → ASSIGNED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE` (или `CANCELED`)
- Клиент: создаёт заказ, отменяет CREATED, оценивает после DONE
- Медик: видит доступные заказы, принимает (ASSIGNED), меняет статусы, получает деньги на balance
- `verificationStatus` медика: `PENDING | APPROVED | REJECTED` — только APPROVED может принимать заказы

## Что НЕ делать
- Не трогать read-only части: admin, web, web-medic, backend
- Не хранить токены в AsyncStorage — только SecureStore
- Не дублировать логику в компонентах — использовать хуки и context

## После изменений
Обновить `docs/tasks.md` и `docs/done.md` согласно формату в CLAUDE.md.
