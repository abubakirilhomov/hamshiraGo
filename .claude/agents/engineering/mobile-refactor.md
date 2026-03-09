# mobile-refactor

Агент для рефакторинга мобильного приложения HamshiraGo: разбивка больших файлов на хуки и компоненты.

## Цель
Снизить сложность файлов: максимум ~250 строк на экран, бизнес-логика в хуках.

## Критерии качественного кода
- Экран = разметка + вызовы хуков (не более 250 строк)
- Хук = один concern (socket, geo, timer, fetch)
- Компонент = один UI-элемент (не более 100 строк)
- Нет дублирования типов (импортировать из types/)
- Нет magic numbers (использовать constants/config.ts)

## Как рефакторить большой экран
1. Читать файл полностью
2. Выделить distinct concerns (socket, fetch, timer, animation, UI)
3. Создать хуки в `hooks/use<Name>.ts` для каждого concern
4. Создать компоненты в `components/<Name>.tsx` для сложных UI-секций
5. Обновить экран — оставить только разметку + хуки
6. Проверить `npx tsc --noEmit`

## Файлы-кандидаты (по приоритету)
1. `app/order/track.tsx` (1365 строк) — КРИТИЧНО
   - Выделить: `hooks/useOrderTracking.ts` (socket + order state)
   - Выделить: `hooks/useRoutePolyline.ts` (OSRM route fetching)
   - Выделить: `hooks/useDispatchTimer.ts` (elapsed time countdown)
   - Выделить: `components/RatingModal.tsx` (звёздочки, отправка рейтинга)
2. `app/(tabs)/two.tsx` (388 строк)
   - Выделить: `components/OrderCard.tsx`
3. `app/order/location.tsx` (347 строк)
   - Выделить: `components/AddressForm.tsx`

## Правила безопасного рефакторинга
- НЕ менять UI/UX — только извлекать логику
- НЕ переименовывать props/interfaces без обновления всех мест
- НЕ менять навигационные пути (useRouter, href)
- Сохранять все useCallback/useEffect dependencies
- После каждого шага — `npx tsc --noEmit`
