# HamshiraGo — Выполненные задачи

> Хронологический лог завершённых фич и исправлений.

---

## 2026-03-08 — Этап 8: i18n услуг в mobile

- **[mobile]** `app/service/[id].tsx` — добавлен `useLanguage()`, показывает `titleUz`/`descriptionUz` если язык UZ; все строки интерфейса через `useTranslation()` (service.cost, service.duration, service.order, service.notFound)
- **[mobile]** `app/order/confirm.tsx` — добавлен `useLanguage()`, `service.title` → `titleUz` если UZ; все строки через i18n (confirm.title, confirm.address, confirm.phone, confirm.duration, confirm.total, confirm.submit, confirm.cancel, confirm.discountFirst, confirm.basePrice)
- **[mobile]** `components/ServiceCard.tsx` — "мин" → `t('service.min')` (RU: "мин" / UZ: "daq")
- **[mobile]** `i18n/ru.json` + `i18n/uz.json` — добавлены секции `service` и `confirm`
- `tsc --noEmit` = 0 ошибок

## 2026-03-08 — Этап 6: фото профиля медика

- **[backend]** `medic.entity.ts` — добавлена колонка `profilePhotoUrl` (nullable varchar 512)
- **[backend]** `medics.service.ts` — `profilePhotoUrl` добавлен в `toAuthResponse()` и `getProfile()`, добавлен метод `saveProfilePhotoUrl()`
- **[backend]** `medics.controller.ts` — новый endpoint `POST /medics/profile-photo` (FileInterceptor, single file, Cloudinary upload в папку `hamshirago/medic-profiles`)
- **[backend]** `orders.service.ts` — блокировка `acceptOrder` если `profilePhotoUrl` не загружен (`ForbiddenException`)
- **[medic]** `AuthContext.tsx` — `profilePhotoUrl: string | null` добавлен в интерфейс `MedicUser`
- **[medic]** `app/(tabs)/profile.tsx` — аватар медика заменён на фото профиля (если есть), нажатие открывает галерею для загрузки, индикатор загрузки, `expo-image-picker`
- **[medic]** `app/(tabs)/index.tsx` — баннер "Добавьте фото профиля" для одобренных медиков без фото (ведёт на профиль)
- **[mobile]** `app/order/track.tsx` — фото медика в карточке "Ваш медик" и на маркере карты (через `Image`, если `profilePhotoUrl` есть)
- `tsc --noEmit` = 0 ошибок (backend + mobile + medic)

## 2026-03-08 — Этап 5: баги + кастомные модалки

- **[medic]** BUG-A1: Статы профиля переведены через i18n — `profile.statExperience/statCompleted/statRating/statBalance` (ru + uz) вместо хардкода на русском (`medic/app/(tabs)/profile.tsx`, `medic/i18n/*.json`)
- **[mobile]** BUG-A2: UI звёзд при оценке заказа — `starsRow` теперь `justifyContent: center` + `gap: 12`; убран `marginTop: -8` у hint; в блоке "Ваша оценка" звёзды выше рейтинга отображаются `star-o` (outline) а не закрашенными (`mobile/app/order/track.tsx`)
- **[mobile/medic]** Создан компонент `AppModal` — кастомная замена системного `Alert.alert` (анимированный modal, кнопки cancel/destructive/default, overlay tap для закрытия) (`mobile/components/AppModal.tsx`, `medic/components/AppModal.tsx`)
- **[mobile]** `AppModal` внедрён: logout confirm в профиле клиента, отмена заказа в track.tsx
- **[medic]** `AppModal` внедрён: logout confirm, Telegram disconnect confirm, подтверждение принятия заказа
- **[medic]** i18n: добавлен ключ `dispatch.confirmAccept` (ru + uz)
- `tsc --noEmit` = 0 ошибок (mobile + medic)

## 2026-03-07 — Wallet system доработка (medic modal + admin UI)

- **[medic]** `app/(tabs)/index.tsx` — заменён `Alert.alert` на полноценный `Modal` при ошибке INSUFFICIENT_WALLET: показывает текущий баланс, требуемую сумму, кнопку «Связаться с администратором» (открывает Telegram), кнопку «Закрыть»
- **[medic]** `i18n/ru.json`, `i18n/uz.json` — добавлены ключи `wallet.insufficientDesc`, `wallet.current`, `wallet.required`, `wallet.contactAdmin`, `wallet.close`
- **[admin]** `lib/api.ts` — добавлено поле `walletBalance` в `AdminMedic`, добавлена функция `topupMedicWallet(id, amount)`
- **[admin]** `pages/Medics.tsx` — добавлена колонка «Кошелёк» с балансом (красный если < 10 000 UZS), кнопка «Пополнить» → Dialog с вводом суммы и подтверждением; добавлена карточка «Низкий кошелёк» в статистику
- `tsc --noEmit` = 0 ошибок (admin + medic)

## 2026-03-06 — Railway deployment fix

- **[backend]** Created `tsconfig.build.json` excluding `e2e/`, `test/`, `jest.config.ts`, `playwright.config.ts` — TypeScript now infers `rootDir=src`, outputting `dist/main.js` (not `dist/src/main.js`)
- **[backend]** `railway.toml` `buildCommand` changed from `npm run build` to `npm install && npm run build` — ensures devDependencies (`@nestjs/cli`) are available at build time

## 2026-03-06 — Landing SEO (bilingual RU + UZ, Uzbekistan #1)

- **[landing]** App Router i18n: `/` → redirect `/ru`; созданы `/app/[lang]/layout.tsx` и `/app/[lang]/page.tsx` с `generateStaticParams` — Google теперь раздельно индексирует `/ru` и `/uz`
- **[landing]** `generateMetadata` per lang — уникальные title/description/keywords для каждого языка (RU: «медик на дому Ташкент», UZ: «uyda hamshira Toshkent» и т.д.)
- **[landing]** hreflang alternates: `ru`, `ru-UZ`, `uz`, `uz-UZ`, `x-default` — Google Search Console будет правильно направлять трафик
- **[landing]** JSON-LD structured data: `MedicalBusiness` + `FAQPage` + `MobileApplication` для каждого языка (rich snippets в выдаче)
- **[landing]** `app/sitemap.ts` — `/sitemap.xml` с oboma URL + language alternates
- **[landing]** `app/robots.ts` — `/robots.txt` с ссылкой на sitemap
- **[landing]** `app/[lang]/opengraph-image.tsx` — автогенерация OG-картинки 1200×630 для каждого языка
- **[landing]** `LangContext` — добавлен `initialLang` prop для SSR-инициализации языка
- **[landing]** `Navbar` — переключатель языка теперь делает `router.push('/ru')` / `router.push('/uz')` — URL отражает язык
- `npm run build` — 0 ошибок, `/ru` и `/uz` статически пресгенерированы

## 2026-03-06 — Web-medic bug fixes (3 консольных ошибки)

- **[web-medic]** `app/page.tsx` — убран `navigator.vibrate(...)` (Chrome блокирует без user gesture → бесполезный шум в консоли); добавлен `reconnectionAttempts: 5` в WebSocket
- **[web-medic]** `app/order/[id]/page.tsx` — добавлен `reconnectionAttempts: 5` в WebSocket
- **[web-medic]** `components/Map.tsx` — исправлен Leaflet `_leaflet_pos` TypeError: в async `import("leaflet").then(...)` добавлен `cancelled` флаг + `return () => { cancelled = true }` для обоих useEffect (medic position, route); `fitBounds` обёрнут в try-catch (защита от вызова после unmount при zoom-анимации)

## 2026-03-06 — Web bug fixes (Etap 3: W4, W5)

- **[web]** `app/orders/[id]/page.tsx` — W4: добавлен `reconnectionAttempts: 5` в `io()` опции, WebSocket больше не переподключается бесконечно
- **[web]** `app/order/confirm/page.tsx` — W5: добавлен `discountError` state; `.catch(() => {})` заменён на `.catch(() => { setDiscountError(true); })`; в UI показывается предупреждение «Не удалось проверить скидку» (amber цвет, не блокирующее); добавлены переводы `confirm.discountCheckFailed` в `i18n/ru.json` и `i18n/uz.json`

## 2026-03-06 — Admin bug fixes (Etap 2: A2, A3, A6)

- **[admin]** `Dashboard.tsx` — A2: параллельный `Promise.all` заменён на последовательный цикл с лимитом `REVENUE_LIMIT=500` заказов; A6: добавлен error banner с `AlertCircle` + кнопка «Повторить»; polling снижен с 30 сек до 2 мин (`REFRESH_MS=120_000`); добавлены константы `REVENUE_LIMIT`, `CHART_LIMIT`
- **[admin]** `Reports.tsx` — A3: `Promise.all` N параллельных страниц заменён на последовательный цикл с лимитом `ORDER_LIMIT=500`; добавлен `error` state + error banner с `AlertCircle`/`RefreshCw` + кнопка «Повторить»
- **[web]** `order/confirm/page.tsx` — W1: удалён `console.log("[confirm] sending order body:", ...)` с персональными данными
- **[admin]** `lib/api.ts` — A1: `API_BASE` читается из `import.meta.env.VITE_API_URL` с fallback на production URL

## 2026-03-06 — B6/B9/M3/M4 fixes + call patient feature

- **[backend]** B6: rate limit `/auth/login` и `/medics/login` → 5 req / 15 min (`ttl: 900_000, limit: 5`) вместо 10/min
- **[backend]** B9: `findNearby` — SQL bounding box фильтр (lat/lng ±delta) до загрузки в память вместо `find({ where: { isOnline: true } })` на всю таблицу (`medics.service.ts`)
- **[medic]** M3: `reconnectionAttempts: 10` добавлен в socket.io конфиг (`medic/app/order/[id].tsx`)
- **[medic]** M4: подтверждено — `STATUS_LABEL` уже заменён на `t('orders.status.*')` ранее
- **[medic]** Фича «Позвонить пациенту» — кнопка рядом с телефоном клиента в карточке адреса; `Linking.openURL('tel:...')`; видна только в активных статусах; i18n ключ `orders.callPatient` (RU + UZ)
- **[mobile]** Скрыт телефон медика из карточки «Ваш медик» на экране клиента (`mobile/app/order/track.tsx`) — `order.medic.phone` больше не отображается
- `tsc --noEmit` = 0 ошибок (backend + medic + mobile)

## 2026-03-06 — Medic map: OSRM route + loading overlay

- **[medic]** `OrderInviteModal.tsx` — заменена жёлтая пунктирная линия на реальный дорожный маршрут через OSRM API; добавлен `routeLoading` state + лоадинг-оверлей «Строим маршрут...» поверх карты; fallback на прямую линию если OSRM недоступен
- **[medic]** `app/order/[id].tsx` — добавлен `routeLoading` state; `fetchRoute` теперь показывает лоадинг-оверлей пока маршрут строится; `finally` гарантирует снятие лоадинга при ошибке/тайм-ауте
- `tsc --noEmit` = 0 ошибок

## 2026-03-06 — Backend security fixes (tech lead feedback)

- **[backend]** #5 fix: `initiatePayment` теперь считает `netPrice = priceAmount - discountAmount` вместо `priceAmount` (`payments.service.ts:28`)
- **[backend]** #8 fix: Swagger/OpenAPI открывается только при `NODE_ENV !== 'production'` (`main.ts:53-62`)
- **[backend]** #6 fix: WebSocket CORS `origin: true` → явный список allowed origins из `main.ts` (`order-events.gateway.ts:27-29`)
- **[backend]** #2 fix: `updateStatusByMedic` — атомарный `UPDATE ... WHERE status = :currentStatus`, проверка `affected > 0` вместо `findOne → save` (`orders.service.ts`)
- **[backend]** #3 fix: переход DONE + `addBalance` в одной транзакции через `DataSource.transaction()` + `manager.increment(Medic)` (`orders.service.ts`)
- **[backend]** #1 fix: `rateOrder` — атомарный `UPDATE ... WHERE clientRating IS NULL` устраняет гонку двойного рейтинга (`orders.service.ts`)
- **[backend]** #4 fix: `initiatePayment` — SELECT FOR UPDATE (`pessimistic_write`) в транзакции при upsert payment record (`payments.service.ts`)
- **[backend]** #9 fix: `dispatch.service.ts` — константа `MAX_DISPATCH_ATTEMPTS = 10`, проверка в `advanceDispatch` до выбора следующего медика (`dispatch.service.ts`)
- `tsc --noEmit` = 0 ошибок

## 2026-03-06 — Landing dark/light mode + web i18n

- **[landing]** Dark / Light mode — CSS vars (`--bg1..4`, `--card-bg/border`, `--text-primary..5`, `--hero-from/to`, `--phone-bg`, `--navbar-scrolled-bg`), `ThemeContext.tsx` с `localStorage("hamshira-theme")` + `document.documentElement.setAttribute("data-theme", ...)`, `ThemeProvider` в `layout.tsx`, `data-theme="dark"` на `<html>` (антифлеш), `IconSun`/`IconMoon` в `Icons.tsx`, кнопка переключения в `Navbar.tsx`, все хардкоженные цвета заменены на CSS vars в `Hero`, `HowItWorks`, `Services`, `Features`, `Download`, `Footer`; `.glass` обновлён на vars; Tailwind-overrides для light mode (`.text-white`, `.border-white\/8`, etc.); `npm run build` — 0 ошибок

## 2026-03-05 (сессия 4)

- **[web/web-medic/admin]** Полный i18n (RU + UZ) для всех трёх web-приложений — созданы i18n инфраструктура для admin (`admin/src/i18n/ru.json`, `uz.json`, `index.ts`, `context/LanguageContext.tsx`); все страницы и компоненты переведены через `useTranslation()`: `web/app/auth/page.tsx`, `web/app/page.tsx`, `web/app/profile/page.tsx`, `web/app/orders/page.tsx`, `web/app/orders/[id]/page.tsx`, `web/app/order/confirm/page.tsx`, `web/app/order/location/page.tsx`, `web-medic/app/auth/page.tsx`, `web-medic/app/page.tsx`, `web-medic/app/profile/page.tsx`, `web-medic/app/order/[id]/page.tsx`; `admin/src/pages/Login.tsx`, `admin/src/components/AdminSidebar.tsx`, `admin/src/components/AdminLayout.tsx`; LanguageProvider добавлен в layout.tsx web/web-medic и App.tsx admin; language switcher в хедере admin, web (главная + auth + профиль), web-medic (профиль + auth)
- **[mobile]** i18n auth.tsx — добавлен `useTranslation`; все ~17 хардкодных строк (ошибки, лейблы, кнопки, тэглайн) заменены на `t('auth.*')`; в `ru.json`/`uz.json` добавлены ключи `auth.tagline`, раздел `payment` (pay, choosePlatform, cancel, paid, errorFetch). `tsc --noEmit` = 0 ошибок (`mobile/app/auth.tsx`, `mobile/i18n/ru.json`, `mobile/i18n/uz.json`)
- **[mobile]** Payment UI в track.tsx — добавлен `expo-web-browser`; state `payStatus`; при DONE фетч `GET /payments/:orderId/status`; функция `handlePay` → Alert Payme/Click → `WebBrowser.openBrowserAsync`; кнопка «Оплатить» / текст «Оплачено ✓» перед кнопкой «К моим заказам»; стили `payBtn`/`payBtnText`/`payPaid` (`mobile/app/order/track.tsx`)
- **[medic]** i18n расширение — в `ru.json`/`uz.json` добавлены разделы `dispatch` (newOrder, accept, decline), ключи в `orders` (active, history, earnings, commission, netEarnings, openMap, noLocation, completeOrder, startService, arrived, onTheWay, accepted), раздел `verification` (11 ключей), ключи в `common` (locationPermission, alwaysAllow, openSettings, permissionDenied); обновлён `auth.errorDuplicate`, добавлены `auth.tagline`, `auth.experienceYears`, `auth.errorNameRequired` (`medic/i18n/ru.json`, `medic/i18n/uz.json`)
- **[medic]** i18n auth.tsx — все хардкодные строки заменены на `t()`; поле «Опыт работы» через `t('auth.experienceYears')` (`medic/app/auth.tsx`)
- **[medic]** i18n index.tsx — `NewOrderBanner.Принять` → `t('dispatch.accept')`; `AvailableOrderCard.Принять` → `t('dispatch.accept')`; строки empty/error через t() (`medic/app/(tabs)/index.tsx`)
- **[medic]** i18n my-orders.tsx — убран статичный `STATUS_LABEL`; статус через `t('orders.status.*')`; «Активные»/«История» через t(); empty через t() (`medic/app/(tabs)/my-orders.tsx`)
- **[medic]** i18n _layout.tsx — Alert геолокации через `t('common.locationPermission')` / `t('common.alwaysAllow')` / `t('common.openSettings')` (`medic/app/_layout.tsx`)
- **[medic]** i18n order/[id].tsx — убран `STATUS_LABEL`; `NEXT_STATUS` → `NEXT_STATUS_MAP` (labelKey вместо label); все кнопки, earnings, карта через t(); `tsc --noEmit` = 0 ошибок (`medic/app/order/[id].tsx`)
- **[medic]** i18n verification.tsx — статус-баннер, причина отказа, лейблы фото, кнопка submit через t() (`medic/app/verification.tsx`)

## 2026-03-05 (сессия 3)

- **[mobile]** Плавная интерполяция маркера медика — `AnimatedMedicMarker` через `Marker.Animated` / `createAnimatedComponent`; `AnimatedRegion.timing()` 900 мс для socket-событий, 0 мс для REST-polling; маркер инициализируется при первой позиции, затем плавно скользит к каждой новой (`mobile/app/order/track.tsx`)

## 2026-03-05 (сессия 2)

- **[mobile/medic]** Fix AsyncStorageError + language picker screen — заменён `@react-native-async-storage/async-storage` (сломан в Expo Go) на `expo-secure-store` в `LanguageContext.tsx`; добавлены `isLoaded`/`isFirstLaunch` в контекст; создан экран `app/language-picker.tsx` с флагами 🇺🇿/🇷🇺; `_layout.tsx` обновлён — при первом запуске редиректит на `/language-picker`, затем на `/auth`

## 2026-03-05

- **[backend]** Платёжная система Payme + Click — создан модуль `backend/src/payments/`: `payment.entity.ts` (UUID PK, orderId FK, provider, status, amount, providerTransactionId, providerState, performTime, cancelTime, reason), `payme.service.ts` (6 JSON-RPC методов: CheckPerform/Create/Perform/Cancel/Check/GetStatement; Basic Auth validation; tiyin↔UZS конвертация), `click.service.ts` (prepare + complete webhooks; MD5 signature check), `payments.service.ts` (initiatePayment, getPaymentStatus), `payments.controller.ts` (5 endpoints: POST /:orderId/initiate, GET /:orderId/status, POST /payme, POST /click/prepare, POST /click/complete); `PaymentsModule` добавлен в `AppModule`; `.env.example` дополнен переменными PAYME_*/CLICK_*/APP_URL. `tsc --noEmit` = 0 ошибок, 15/15 тестов зелёные.

## 2026-03-04 (сессия 3)

- **[backend]** TypeScript strict mode — включён `strict: true` в `backend/tsconfig.json`; исправлены все 109 ошибок TS2564 (`strictPropertyInitialization`) — добавлен `!` (definite assignment assertion) на все class-level свойства в 12 entity файлах, 7 DTO файлах, 1 gateway; `tsc --noEmit` = 0 ошибок, 15/15 тестов зелёные

## 2026-03-04 (сессия 2)

- **[backend]** i18n поля в Service entity — добавлены nullable колонки `titleUz`, `descriptionUz`, `categoryUz`; seed обновлён с переводами на узбекский + back-fill для существующих записей (`backend/src/services/entities/service.entity.ts`, `backend/src/services/services.seed.ts`)
- **[mobile]** i18n инфраструктура — установлены `i18next`, `react-i18next`, `@react-native-async-storage/async-storage`; созданы `i18n/index.ts`, `i18n/ru.json`, `i18n/uz.json` (tabs, auth, profile, order, common ключи); `context/LanguageContext.tsx` с персистентностью через AsyncStorage; обёртка в `_layout.tsx`
- **[mobile]** Переводы UI — `tabs/_layout.tsx` (переводы вкладок), `index.tsx` (баннер, категории, заголовки услуг через titleUz), `profile.tsx` (все строки + language picker — кнопки 🇷🇺/🇺🇿)
- **[medic]** i18n инфраструктура — те же пакеты + `i18n/ru.json`, `i18n/uz.json`, `context/LanguageContext.tsx`, обёртка в `_layout.tsx`
- **[medic]** Переводы UI — `tabs/_layout.tsx` (переводы вкладок), `profile.tsx` (logout confirm + language picker)

## 2026-03-04

- **[backend]** Swagger/OpenAPI — установлен `@nestjs/swagger` + `swagger-ui-express`, настроен `SwaggerModule.setup('api/docs')` в `main.ts`; `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse` на auth/orders/medics контроллерах; `@ApiProperty` на всех DTO полях (`backend/src/main.ts`, `backend/src/auth/`, `backend/src/orders/`)
- **[backend]** Jest unit тесты — установлен `jest` + `ts-jest` + `@nestjs/testing` + `supertest` + `ts-node`; создан `jest.config.ts`; добавлены скрипты `test` / `test:cov` в `package.json`; написаны `auth.service.spec.ts` (4 теста) и `orders.service.spec.ts` (8 тестов) — 15 тестов, все зелёные (`backend/src/auth/`, `backend/src/orders/`)
- **[devops]** GitHub Actions CI — создан `.github/workflows/ci.yml`; два job-а: `backend` (npm ci → build → test) и `typecheck` (tsc --noEmit); триггер push/PR на main

## 2026-03-03 (сессия 6)

- **[devops]** Исправлены 404 ошибки на статических ассетах Railway — добавлены multi-stage `Dockerfile` и `railway.toml` для `web/` и `web-medic/`: multi-stage build (deps → builder → runner), правильное копирование `.next/static` и `public` в standalone директорию, `builder = "DOCKERFILE"` в railway.toml

## 2026-03-03 (сессия 5)

- **[medic]** `order/[id].tsx` — добавлена встроенная карта маршрута (240px) для статусов ASSIGNED/ACCEPTED/ON_THE_WAY/ARRIVED: маркер клиента 🏠 синий, маркер медика 🧑‍⚕️ зелёный, OSRM маршрут (зелёная линия, 8с таймаут, 12с троттл), `fitToCoordinates` для авто-фокуса при обновлении позиции медика; в `emitCurrentLocation` добавлен `setMedicPos` для обновления карты; отдельный location fetch при смене статуса (`medic/app/order/[id].tsx`)

## 2026-03-03 (сессия 4)

- **[mobile]** `track.tsx` — маркер медика зелёный (`#16a34a`) вместо красного; маршрут OSRM: AbortController таймаут 8с, троттл 20с→12с, маршрут не запрашивается во время CREATED (только после ASSIGNED+), сброс routeCoords при переходе в ASSIGNED; зелёная линия маршрута после поиска; принудительная оценка: `beforeRemove` + `BackHandler` блокируют выход до оценки, кнопка «К моим заказам» скрыта пока не поставлена оценка (`mobile/app/order/track.tsx`)

## 2026-03-03 (сессия 3)

- **[mobile]** `track.tsx` — таймер отсчёта в диспетч-баннере (`formatElapsed`), пульсирующий маркер клиента (синий, `Animated.loop`) во время поиска медика, кастомные маркеры с эмодзи (🏠 синий = клиент, 🩺 красный/оранжевый = медик), карта теперь показывается и без `medicLocation` (пока медик не найден), легенда маркеров (`mobile/app/order/track.tsx`)
- **[medic]** Установлен `react-native-maps` в medic-приложение; `OrderInviteModal.tsx` — добавлена мини-карта 170px (клиент 🏠 синий, медик 🩺 красный), расстояние через haversine, GPS медика через `expo-location`, пунктирная линия клиент↔медик (`medic/components/OrderInviteModal.tsx`)
- **[fix]** WebSocket не подключался в Expo Go — Expo Go отправляет `Origin: exp://...`, заблокировано CORS allowlist. Исправлено: `cors: { origin: true }` в `@WebSocketGateway()`; polling-fallback `['websocket', 'polling']` во всех Socket.IO клиентах (`backend/`, `mobile/`, `medic/`)

## 2026-03-03

- **[backend]** Yandex Taxi-style push-based dispatch: создана entity `DispatchAttempt` (`dispatch_attempts`), добавлен `dispatchStatus` (nullable varchar) в `Order`, создан `DispatchService` (in-memory timers, 60s инвайт, авто-отбор медика по расстоянию/radius 15km, recovery on restart, Telegram admin alerts, auto-cancel при 0 медиках), добавлен `findCandidatesForDispatch` в `MedicsService`, обновлён `OrderEventsGateway` (personal `medic:{id}` room, `emitDispatchInvite`, `emitDispatchInviteExpired`, `emitDispatchUpdate`), обновлён `OrdersService` (убран pull-broadcast, добавлен `startDispatch`/`cancelDispatch`/`declineOrder`), добавлен `POST /orders/:id/decline` в контроллер, обновлён `OrdersModule` (`backend/`)
- **[mobile]** Убраны nurse selection UI из `location.tsx` и `confirm.tsx`; в `track.tsx` добавлен `dispatch_update` listener, dispatch state banner («Связываемся с [Имя]...» / «Медики заняты, продолжаем поиск...»), маркер кандидата на карте (`mobile/app/order/`)
- **[medic]** Создан `OrderInviteModal.tsx` — полноэкранный модал с таймером 60s, деталями заказа, кнопками Accept/Decline; обновлён `index.tsx` — добавлены слушатели `dispatch_invite` (показывает модал + haptic) и `dispatch_invite_expired` (скрывает модал) (`medic/components/`, `medic/app/(tabs)/`)
- **[web]** Dispatch migration — убраны nurse selection UI из `location/page.tsx` и `confirm/page.tsx`; добавлен `dispatch_update` listener с 3 состояниями (searching/contacting/no_medics) на `orders/[id]/page.tsx`
- **[web-medic]** Dispatch migration — добавлен `medicApi.orders.decline(id)`, fullscreen invite overlay с таймером 60 сек, listeners `dispatch_invite`/`dispatch_invite_expired` (`web-medic/app/page.tsx`, `web-medic/lib/api.ts`)
- **[admin]** Логотип в сайдбаре — иконка `Stethoscope` (lucide-react), форма `rounded-lg` (`admin/src/components/AdminSidebar.tsx`)

## 2026-03-02 (сессия 2)

- **[web, web-medic]** Единый favicon — `app/icon.tsx` обновлён на букву **H** белым на бирюзовом градиенте `#0d9488→#0f766e` (было: крест у web, силуэт медсестры у web-medic) (`web/app/icon.tsx`, `web-medic/app/icon.tsx`)
- **[admin]** Исправлен favicon — добавлен `<link rel="icon" href="/favicon.ico">` в `admin/index.html` (было: не подключён, браузер показывал emoji-заглушку)
- **[admin]** Добавлен кастомный SVG favicon `admin/public/icon.svg` — буква H на бирюзовом градиенте `#0d9488→#0f766e`, единый стиль с web/web-medic; `index.html` переключён на `type="image/svg+xml"`

## 2026-03-02

- **[config]** Добавлены Claude sub-agents в `.claude/agents/` — 6 специализированных агентов: backend-architect, mobile-app-builder, api-tester, playwright-runner, sprint-prioritizer, docs-syncer
- **[tests]** Настроен Playwright API testing: `tests/package.json`, `tests/playwright.config.ts`, `tests/api/health.spec.ts`, `tests/api/auth.spec.ts`, `tests/api/orders.spec.ts`

## 2026-03-02 (Этап 4)

- **[backend]** BUG 1: Атомарный `acceptOrder` — `UPDATE WHERE status='CREATED'`, если `affected=0` → `BadRequestException`; исключает race condition при двойном принятии заказа (`backend/src/orders/orders.service.ts`)
- **[backend]** BUG 16: Удаление устаревших Web Push подписок через `In()` вместо массива `{ endpoint }` объектов — быстрее и корректнее (`backend/src/realtime/web-push.service.ts`)
- **[backend]** BUG 17: Добавлен `await` к `pushService.send()` и `webPushService.sendToSubscriber()` в `notifyClient` — ошибки больше не теряются молча (`backend/src/orders/orders.service.ts`)
- **[backend]** BUG 18: `JwtPayload` дополнен ролью `'admin'`; в `validate()` добавлена admin-ветка — возвращает `{ id, role: 'admin' }` без DB-запроса (`backend/src/auth/strategies/jwt.strategy.ts`)
- **[backend]** BUG 19: Тип `discountAmount` исправлен с `number` на `number | null` в соответствии с `nullable: true` в колонке (`backend/src/orders/entities/order.entity.ts`)
- **[backend]** BUG 35: Добавлен `unique: true` на колонку `phone` в `User` и `Medic` entity — DB теперь гарантирует уникальность телефона (`user.entity.ts`, `medic.entity.ts`)
- **[backend]** BUG 36: `adminCancelOrder` теперь передаёт в `notifyClient` перезагруженный из БД объект заказа (с relations), а не стейл-данные (`backend/src/orders/orders.service.ts`)
- **[backend]** BUG 37: Добавлен TypeORM-трансформер на колонку `balance` (`decimal(12,2)`) — `from: parseFloat(String(v))`, устраняет несоответствие типа string/number (`backend/src/medics/entities/medic.entity.ts`)
- **[mobile]** BUG 21: Файл `mobile/app/order/track.tsx` существует — маршрут `/order/track` корректен, баг не актуален
- **[mobile]** BUG 22+23: `fetchLocation` убран из `fetchNearbyMedics`-зависимости (устраняет дублирующий вызов); `useEffect` теперь имеет `[fetchLocation]` в deps — убирает lint-предупреждение и потенциальный цикл (`mobile/app/order/location.tsx`)
- **[mobile]** BUG 24: Главный экран показывает ошибку с кнопкой «Повторить» вместо пустого экрана при сбое загрузки услуг (`mobile/app/(tabs)/index.tsx`)
- **[medic]** BUG 25: Экран доступных заказов показывает ошибку с кнопкой «Повторить» вместо тихого ignore (`medic/app/(tabs)/index.tsx`)

## 2026-03-02 (Этап 3)

- **[backend]** BUG 6+7: Добавлена валидация телефона `@Matches(/^\+998\d{9}$/)` в 4 DTO (RegisterClientDto, LoginDto, RegisterMedicDto, LoginMedicDto); добавлен `@IsOptional()` на `name` в RegisterClientDto (`backend/src/auth/dto/`, `backend/src/medics/dto/`)
- **[backend]** BUG 12: Создан `AdminLoginDto` с валидацией, подключён в `adminLogin` вместо сырого `body` (`backend/src/auth/dto/admin-login.dto.ts`, `backend/src/auth/auth.controller.ts`)
- **[backend]** BUG 5: Замена прямого сравнения паролей на `crypto.timingSafeEqual()` для защиты от timing-атак в admin login (`backend/src/auth/auth.service.ts`)
- **[medic]** BUG 8: Исправлен неправильный async-паттерн в `refreshProfile` — async apiFetch вынесен из setState callback (`medic/context/AuthContext.tsx`)
- **[mobile]** BUG 20: Установлен `expo-secure-store`, токен и профиль сохраняются между перезапусками приложения, `isLoading` блокирует редирект до завершения чтения SecureStore (`mobile/context/AuthContext.tsx`, `mobile/app/_layout.tsx`)
- **[medic]** BUG 20: Аналогично — SecureStore персистентность, medic + token в зашифрованном хранилище (`medic/context/AuthContext.tsx`, `medic/app/_layout.tsx`)

## 2026-03-02 (Этап 2)

- **[mobile]** Окно оценки медика теперь появляется при завершении заказа — при `order_status=DONE` вызывается `fetchOrder()` для обновления полных данных (включая `order.medic`) перед отключением сокета (`mobile/app/order/track.tsx`)
- **[medic]** Список "Мои заказы" авто-обновляется при переключении на таб — добавлен `useFocusEffect` аналогично экрану доступных заказов (`medic/app/(tabs)/my-orders.tsx`)
- **[mobile/medic]** Улучшены сообщения об ошибках при логине — маппинг английских сообщений бэкенда на читаемый русский текст в catch-блоке (`mobile/app/auth.tsx`, `medic/app/auth.tsx`)

## 2026-03-02

- **[web, web-medic, admin]** 12.3 Sentry error tracking — добавлен `@sentry/nextjs` (web/web-medic) и `@sentry/react` (admin); `sentry.client.config.ts` + `sentry.server.config.ts` + `withSentryConfig` в `next.config.ts`; `app/error.tsx` отправляет ошибки через `captureException`; admin `ErrorBoundary.tsx` отправляет в Sentry; Sentry init в `main.tsx`; DSN через `NEXT_PUBLIC_SENTRY_DSN` / `VITE_SENTRY_DSN` (пустой = отключён); добавлен `admin/.env.example`
- **[web-medic]** Применены изменения бэкенда: `lastSeenAt`, авто-оффлайн после 5ч — добавлен `onlineDisabledReason`, баннер INACTIVE_5H на дашборде (`web-medic/lib/api.ts`, `web-medic/app/page.tsx`)
- **[web-medic]** Исправлен BUG-14: загрузка заказа заменена с `my()+find()` на прямой `GET /orders/:id` (`web-medic/app/order/[id]/page.tsx`, `web-medic/lib/api.ts`)
- **[web-medic]** Добавлен OSRM роутинг на карте заказа медика — маршрут по дорогам с Polyline, маркеры медика и клиента, обновление каждые 30с (`web-medic/app/order/[id]/page.tsx`, `web-medic/components/Map.tsx`)
- **[web]** Исправлен BUG-27: `orders.list()` теперь корректно извлекает `.data` из пагинированного ответа (`web/lib/api.ts`)
- **[web]** Исправлен BUG-28: WebSocket отписка при unmount — добавлен `unsubscribe_order` перед `disconnect()` (`web/app/orders/[id]/page.tsx`)
- **[web]** Исправлен BUG-29: `confirmDone` заменил дырявый `updateStatus` — жёстко зафиксирован статус `DONE` (`web/lib/api.ts`)
- **[web]** Исправлен редирект после оценки заказа — клиент возвращается на `/` через 1.5с (`web/app/orders/[id]/page.tsx`)
- **[web, web-medic]** Исправлен BUG-26: `BASE_URL` вынесен в `NEXT_PUBLIC_API_URL` env var (`web/lib/api.ts`, `web-medic/lib/api.ts`, `web/lib/webPush.ts`, `web-medic/lib/webPush.ts`)
- **[web, web-medic]** Добавлены `.env.example` файлы (`web/.env.example`, `web-medic/.env.example`)
- **[admin]** Исправлен BUG-30/31: выручка и график за 7 дней загружают ВСЕ страницы заказов через параллельную пагинацию (`admin/src/pages/Dashboard.tsx`)
- **[admin]** Исправлен BUG-32: `hasAdminToken()` проверяет `exp` в JWT payload — истёкший токен больше не проходит (`admin/src/lib/api.ts`)
- **[admin]** Исправлен BUG-33: добавлен `vercel.json` с CSP, X-Frame-Options, X-Content-Type-Options и др. security headers (`admin/vercel.json`)
- **[admin]** Убран Lovable брендинг из `index.html` — заменён на HamshiraGo метаданные, добавлен `noindex` (`admin/index.html`)
- **[web]** Добавлен Error Boundary (4.4) — `app/error.tsx` + `app/global-error.tsx`, кнопки "Попробовать снова" и "На главную"
- **[web-medic]** Добавлен Error Boundary (4.4) — `app/error.tsx` + `app/global-error.tsx`
- **[admin]** Добавлен Error Boundary (4.4) — класс-компонент `ErrorBoundary.tsx`, обёрнут в `main.tsx`
- **[web]** Исправлен 8.5: SEO — `app/robots.ts`, `app/sitemap.ts`, canonical+OG+Twitter теги, root layout с `title.template`, `metadataBase`
- **[web, web-medic]** Исправлен 8.3: offline баннер — компонент `OfflineBanner` слушает `offline`/`online` события браузера
- **[web]** Исправлены 8.1 + 8.2: loading state + обработка ошибок на главной, `error` state с кнопкой "Попробовать снова"
- **[admin]** TypeScript strict mode — включён `strict: true`; все `any` заменены на строгие интерфейсы
- **[backend]** 10.1 DB индексы — добавлены `@Index()` на `User.phone`, `Medic.phone`, `Medic.isOnline`, `Medic.verificationStatus`, `Order.clientId`, `Order.medicId`, `Order.status`, `Order.created_at`
- **[web]** 10.3 Кэш услуг — `api.services.list()` кэширует результат в localStorage на 5 минут
- **[admin]** 10.4 Cloudinary оптимизация — хелпер `cloudinaryOpt()` добавляет `f_auto,q_auto,w_800` к URL
- **[web]** Добавлен поиск и фильтрация (9.7), профиль клиента (9.6), страница «Финансовые отчёты» в admin (9.5)
- **[web, web-medic]** Исправлен 8.6: PWA offline кэширование — `sw.js` с обработчиками install/activate/fetch; `InstallPrompt` компонент

## 2026-03-01

- **[backend]** Этап 1 (critical security) закрыт: `GET /orders/:id` теперь с ACL по роли/владельцу, `PATCH /orders/:id/status` ограничен для клиента (только `SERVICE_STARTED -> DONE`) (`backend/src/orders/orders.controller.ts`, `backend/src/orders/orders.service.ts`)
- **[backend]** WebSocket security hardening: `subscribe_order` и `medic_location` теперь с проверкой доступа к заказу/назначения медика; запрещены произвольные подписки и отправка чужих координат (`backend/src/realtime/order-events.gateway.ts`, `backend/src/realtime/realtime.module.ts`)
- **[backend]** WebSocket CORS переведён с `origin: '*'` на allowlist (синхронизирован с REST CORS) (`backend/src/realtime/order-events.gateway.ts`)
- **[backend]** Route conflict fix: `GET /orders/:id` ограничен UUID-паттерном, чтобы статические маршруты (`/orders/medic/*`, `/orders/admin/*`) не перехватывались (`backend/src/orders/orders.controller.ts`)
- **[backend]** Безопасность декораторов: `ClientId`/`MedicId` больше не возвращают пустую строку при отсутствии пользователя, теперь выбрасывают `UnauthorizedException` (`backend/src/auth/decorators/client-id.decorator.ts`, `backend/src/auth/decorators/medic-id.decorator.ts`)
- **[web]** Редизайн главной страницы — SVG-волна под шапкой, иконки по категориям, убран дублирующийся блок "Мои заказы" внизу (`web/app/page.tsx`)
- **[web]** Сортировка заказов новые-первыми — явный `.sort()` в рендере обеих секций (активные + история) (`web/app/orders/page.tsx`)
- **[web]** Карта трекинга медика на странице заказа — компонент `TrackingMap` (Leaflet), слушает `medic_location` Socket.IO, fallback из `order.medic.latitude/longitude` (`web/components/TrackingMap.tsx`, `web/app/orders/[id]/page.tsx`)
- **[web-medic]** Исправлен краш `orders.find is not a function` — нормализация ответа `medicApi.orders.my()` (поддержка `{data:[]}`, `{items:[]}`, plain array) (`web-medic/app/order/[id]/page.tsx`)
- **[admin]** Подключён `GET /medics/admin/all` — Medics страница переключена с `getPendingMedics` на `getAllMedics`, показывает всех медиков с пагинацией (`admin/src/lib/api.ts`, `admin/src/pages/Medics.tsx`)
- **[admin]** Подключён `GET /auth/admin/users` — добавлены `getUsers()` и `blockClient()`, реализована полноценная страница Clients с таблицей, поиском и блокировкой (`admin/src/lib/api.ts`, `admin/src/pages/Clients.tsx`)
- **[web]** Обработка истёкшего токена — при 401 ответе очищается `token` и выполняется редирект на `/auth` (`web/lib/api.ts`)
- **[web-medic]** Обработка истёкшего токена — при 401 ответе очищается `medic_token` + `medic` и выполняется редирект на `/auth` (`web-medic/lib/api.ts`)
- **[web]** Сплэш-скрин 2 сек — тил-градиент, иконка медицинского креста, пульсирующая анимация, плавное исчезновение (`web/components/SplashScreen.tsx`, `web/app/layout.tsx`)
- **[web-medic]** Сплэш-скрин 2 сек — аналогично web, подзаголовок "Панель медика" (`web-medic/components/SplashScreen.tsx`, `web-medic/app/layout.tsx`)

## 2026-02-28

- **[backend]** Добавлен `GET /medics/admin/all` (пагинация + фильтры `search`, `verificationStatus`, `isBlocked`, `isOnline`) для админки (`backend/src/medics/medics.controller.ts`, `backend/src/medics/medics.service.ts`)
- **[backend]** Добавлен `GET /auth/admin/users` (пагинация + фильтры `search`, `isBlocked`) для админки (`backend/src/auth/auth.controller.ts`, `backend/src/users/users.service.ts`)
- **[mobile]** На карте выбора адреса показываются маркеры медиков из `/medics/nearby`; тап по маркеру выбирает медика (`mobile/components/LocationMap.tsx`, `mobile/app/order/location.tsx`)
- **[mobile]** Popup маркера медика улучшен для читаемости взрослой аудитории: `🩺 Медик: ...` + явный CTA выбора (`mobile/components/LocationMap.tsx`)
- **[backend/medic/mobile]** Реализован live-трекинг “медик в пути”: socket-событие `medic_location`, отправка координат медиком каждые 5с в `ON_THE_WAY`, отображение клиенту на карте заказа (`backend/src/realtime/order-events.gateway.ts`, `medic/app/order/[id].tsx`, `mobile/app/order/track.tsx`)
- **[medic]** Добавлен background location tracking с напоминанием о разрешении `Always` и карточкой в профиле (`medic/utils/backgroundLocation.ts`, `medic/app/_layout.tsx`, `medic/app/(tabs)/profile.tsx`, `medic/app.json`)
- **[backend]** `GET /medics/me` теперь возвращает `telegramChatId` — мобильное приложение показывает статус подключения (`medics.service.ts`)
- **[backend]** `PATCH /medics/telegram-chat-id` принимает `null` для отключения Telegram (`medics.controller.ts`, `medics.service.ts`)
- **[medic]** Карточка Telegram в профиле — кнопка "Подключить" открывает `t.me/hamshirago_medic_bot`, кнопка "Отключить" сбрасывает chatId на бэкенде (`medic/app/(tabs)/profile.tsx`)
- **[medic]** `MedicUser` дополнен полем `telegramChatId` (`medic/context/AuthContext.tsx`)
- **[admin]** Исправлен лейбл "PENDING" → "Верификация" в блоке потока заказов на Dashboard — карточка показывала медиков на верификации, а не pending заказы (`admin/src/pages/Dashboard.tsx`)

- **[web]** Список медиков на экране адреса — горизонтальный скролл с карточками медиков (имя, рейтинг, расстояние), клик = выбор; выбранная медсестра передаётся на confirm (`web/app/order/location/page.tsx`)
- **[web]** Карточка медсестры на экране подтверждения — показывается имя, рейтинг, расстояние если медик выбран на предыдущем шаге (`web/app/order/confirm/page.tsx`)

---

## 2026-02-27

- **[backend]** Фильтр заказов по расстоянию — `findAvailable(medicId)` возвращает только заказы в радиусе 10 км от медика, отсортированные от ближнего к дальнему (`orders.service.ts`)
- **[backend]** Добавлен `helmet` — защита HTTP-заголовков (`main.ts`)
- **[backend]** Структурированное логирование — `nestjs-pino` + `pino-pretty` в dev, JSON в production; пароли и Authorization автоматически [REDACTED] (`app.module.ts`, `main.ts`)
- **[mobile]** Скидка 10% на первый заказ — проверяется история заказов при открытии confirm-экрана; при 0 заказов применяется скидка и UI показывает бейдж со скидкой (`mobile/app/order/confirm.tsx`)
- **[medic]** Исправлен импорт `Text` в `verification.tsx` — заменён `@/components/Themed` (несуществующий) на стандартный `Text` из `react-native`

---

## 2026-02-26

- **[backend]** Telegram Bot уведомления — при создании нового заказа рассылка онлайн-медикам у которых сохранён `telegramChatId` (`telegram.service.ts`, `orders.service.ts`)
- **[backend]** Добавлен `telegramChatId` в таблицу медиков (`medic.entity.ts`)
- **[backend]** Новый эндпоинт `PATCH /medics/telegram-chat-id` — медик сохраняет свой Telegram chat ID (`medics.controller.ts`)
- **[backend]** Admin JWT login — `POST /auth/admin/login` с username/password, возвращает JWT; `AdminGuard` поддерживает оба метода (JWT + X-Admin-Secret fallback) (`auth.service.ts`, `admin.guard.ts`)
- **[admin]** Переход с `X-Admin-Secret` на JWT Bearer токен — `adminLogin()`, `getAdminToken/setAdminToken/clearAdminToken` (`api.ts`, `Login.tsx`, `AdminSidebar.tsx`)
- **[backend]** CORS — явный список разрешённых origins включая Vercel URLs (`main.ts`)
- **[backend]** Исправлена ошибка TypeORM `nullable` — `serviceId`, `serviceTitle`, `priceAmount`, `discountAmount` теперь nullable (`order.entity.ts`)
- **[backend]** Исправлена ошибка TypeScript `priceAmount possibly null` — добавлен `?? 0` (`orders.service.ts`)
- **[backend]** Admin API для заказов — `GET /orders/admin/all` (пагинация + фильтр по статусу), `PATCH /orders/admin/:id/cancel` (`orders.controller.ts`, `orders.service.ts`)
- **[docs]** Создан `docs/BACKEND_API.md` — полная документация API
- **[docs]** Создан `docs/ADMIN_PANEL.md` — документация для разработчиков admin панели

---

## 2026-02-25

- **[medic]** Экран верификации — загрузка фото лица и лицензии, отображение статуса PENDING/APPROVED/REJECTED, причина отказа (`medic/app/verification.tsx`)
- **[medic]** Статус верификации в профиле — карточка с цветовой индикацией и переходом на `/verification` (`medic/app/(tabs)/profile.tsx`)
- **[medic]** Баннер для неверифицированных медиков на главном экране — предупреждение о невозможности принять заказ (`medic/app/(tabs)/index.tsx`)
- **[medic]** `AuthContext` обновлён — добавлены поля верификации в `MedicUser`, метод `refreshProfile()` (`medic/context/AuthContext.tsx`)
- **[medic]** Отображение заработка медика с учётом комиссии платформы 10% — `Стоимость услуги`, `Скидка клиента`, `Комиссия платформы`, `Ваш заработок` (`medic/app/order/[id].tsx`)
- **[medic]** `app.json` — добавлен `expo-image-picker` плагин и Android permissions

---

## Ранее (MVP core)

- **[backend]** NestJS API — полная архитектура: Auth (client/medic/admin), Orders, Medics, Users, Services, Locations
- **[backend]** TypeORM + PostgreSQL — все entity, автосинхронизация схемы
- **[backend]** JWT аутентификация — отдельные токены для client/medic/admin
- **[backend]** WebSocket gateway — real-time события заказов (`order:status`, `order:location`)
- **[backend]** Expo Push Notifications — уведомления клиенту по всем статусам заказа
- **[backend]** Web Push (VAPID) — уведомления в браузер клиенту и медику
- **[backend]** Каталог услуг — `Service` entity, seed-данные, `GET /services`
- **[backend]** Платформенная комиссия 10% — `platformFee` хранится в заказе, вычитается из заработка медика
- **[backend]** Рейтинг медика — взвешенное среднее при оценке заказа клиентом
- **[backend]** Верификация медиков — `verificationStatus`, `facePhotoUrl`, `licensePhotoUrl`, `POST /medics/documents` (Cloudinary)
- **[backend]** Блокировка users/medics — `isBlocked` флаг, проверка при принятии заказа
- **[backend]** Rate limiting — `@nestjs/throttler` на auth эндпоинтах
- **[mobile]** Полный flow клиента — регистрация/логин, каталог услуг, выбор адреса, создание заказа, трекинг, история, профиль, оценка медика
- **[mobile]** Push-уведомления — запрос разрешения, сохранение токена, in-app баннеры
- **[mobile]** Real-time трекинг — Socket.IO, статус-степпер, местоположение медика на карте
- **[medic]** Полный flow медика — регистрация/логин, список заказов, принятие, смена статусов, история, профиль, баланс
- **[medic]** Online/offline toggle с GPS — геолокация передаётся на бэкенд при включении
- **[admin]** Admin панель — управление медиками (верификация, блокировка), клиентами, заказами, услугами
- **[web]** Next.js web клиент — все страницы MVP
- **[web-medic]** Next.js web медик — все страницы MVP
