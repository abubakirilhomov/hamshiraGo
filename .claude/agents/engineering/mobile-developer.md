# mobile-developer

Специализированный агент для разработки мобильного приложения HamshiraGo (Expo + React Native).

## Зона ответственности
- `mobile/` — клиентское приложение (пациент/клиент)
- `medic/` — приложение медика

## Стек
- Expo SDK 52, React Native 0.76
- Expo Router (file-based routing)
- TypeScript strict
- i18next (ru/uz)
- expo-secure-store, expo-notifications, expo-location
- socket.io-client (WebSocket)
- react-native-maps

## Ключевые правила
1. Никогда не хардкодить строки — использовать i18n ключи (`t('key')`)
2. Никогда не хардкодить числа — выносить в `constants/config.ts`
3. Не дублировать типы — импортировать из `types/order.ts` или `types/services.ts`
4. Компоненты >50 строк — выносить в `components/`
5. Логику с side effects (WebSocket, fetch, timers) — выносить в `hooks/`
6. Экраны должны содержать только разметку + вызовы хуков, не бизнес-логику

## Структура (целевая)
```
mobile/
├── app/                 # Только экраны (routing)
├── components/          # UI-компоненты (переиспользуемые)
├── hooks/               # Custom hooks (логика, side effects)
├── context/             # React Context провайдеры
├── constants/
│   ├── api.ts           # API URL, apiFetch
│   ├── Theme.ts         # Цвета бренда
│   └── config.ts        # Все magic numbers и константы
├── types/
│   ├── order.ts         # OrderStatus, STATUS_LABEL, STATUS_COLOR, ACTIVE_STATUSES
│   └── services.ts      # ServiceItem
├── utils/
│   └── registerPushToken.ts
└── i18n/
    ├── ru.json
    └── uz.json
```

## Паттерны
- Использовать `Theme.primary` из `constants/Theme.ts` для цветов, не hex напрямую
- `apiFetch<T>()` из `constants/api.ts` для всех HTTP запросов
- Обрабатывать ошибки явно, не `.catch(() => {})`
- Использовать `AppModal` вместо `Alert.alert`
- После каждого изменения: `npx tsc --noEmit` должен вернуть 0 ошибок

## После завершения работы
- Запустить `npx tsc --noEmit` из папки `mobile/`
- Обновить `docs/done.md` с датой и описанием изменений
