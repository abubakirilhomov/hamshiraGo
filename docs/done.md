# HamshiraGo — Выполненные задачи

## 2026-03-31 (Web-medic: Web Push уведомления)

- **[feat]** Добавлен `medicApi.webPush.subscribe` и `medicApi.webPush.unsubscribe` в `medicApi` — `web-medic/lib/api.ts`
- **[fix]** Исправлен `subscribeWebPush` — теперь вызывает `Notification.requestPermission()` вместо молчаливой проверки `permission !== "granted"` — `web-medic/lib/webPush.ts`
- **[verified]** `WebPushInit.tsx`, `webPush.ts`, `sw.js`, подключение в `layout.tsx` — уже существовали и корректно настроены для медиков (эндпоинт `/medics/web-push-subscription`, токен `medic_token`)

## 2026-03-31 (Admin: Reviews page, Settings urgent fields, Medic topup)

- **[feat]** Добавлены интерфейсы `Review`, `AppSettings` и функции `getMedicReviews`, `getClientReviews`, `topupMedic`, `getSettings`, `updateSettings` — `admin/src/lib/api.ts`
- **[feat]** Создана страница `Reviews` — поиск отзывов медика по ID, таблица с рейтингом звёздами, комментарием, ролью автора и датой — `admin/src/pages/Reviews.tsx`
- **[feat]** Добавлены поля `urgentFeePercent`, `urgentStartHour`, `urgentEndHour` на страницу настроек с отдельной кнопкой сохранения — `admin/src/pages/Settings.tsx`
- **[feat]** Добавлена кнопка «Пополнить» для каждого медика в таблице; Dialog с вводом суммы вызывает `topupMedic` + `toast.success` — `admin/src/pages/Medics.tsx`
- **[feat]** Добавлены маршруты `/reviews` и `/settings` — `admin/src/App.tsx`
- **[feat]** Добавлены nav items «Отзывы» (Star) и «Настройки» (Settings) в сайдбар — `admin/src/components/AdminSidebar.tsx`

## 2026-03-31 (Web-medic: экран геозоны рабочей зоны)

- **[feat]** Создан экран `/work-zone` — lat/lng инпуты, слайдер радиуса 0.5–50 км, кнопки «Сохранить зону» (PATCH /medics/work-zone) и «Убрать ограничение» (DELETE /medics/work-zone) — `web-medic/app/work-zone/page.tsx`
- **[feat]** При загрузке — GET /medics/me подгружает текущие workZoneLat/workZoneLng/workZoneRadius в поля формы — `web-medic/app/work-zone/page.tsx`
- **[feat]** Добавлена кнопка «Рабочая зона» в профиль медика — показывает статус зоны (активна / без ограничений) — `web-medic/app/profile/page.tsx`
- **[i18n]** Добавлена секция `workZone` (23 ключа) — `web-medic/i18n/ru.json`, `web-medic/i18n/uz.json`

## 2026-03-31 (Web-medic: оценка клиента после заказа)

- **[feat]** Добавлен блок «Оценить клиента» на странице заказа — показывается при `status === "DONE"`, проверяет через `GET /reviews/order/:id` нет ли уже отзыва с `authorRole=medic` — `web-medic/app/order/[id]/page.tsx`
- **[feat]** 5 интерактивных звёзд с hover-эффектом, textarea для комментария (необязательно), кнопки «Отправить» / «Пропустить» — `web-medic/app/order/[id]/page.tsx`
- **[feat]** После отправки/пропуска блок скрывается, показывается «Спасибо!» — `web-medic/app/order/[id]/page.tsx`
- **[feat]** Добавлен интерфейс `Review` — `web-medic/lib/api.ts`
- **[i18n]** Добавлены ключи `order.rateClient*` (rateClient, rateClientHint, rateClientComment, rateClientCommentPlaceholder, rateClientSubmit, rateClientSkip, rateClientThanks, rateClientSelectFirst) — `web-medic/i18n/ru.json`, `web-medic/i18n/uz.json`

## 2026-03-31 (Web: страница отзывов медика)

- **[feat]** Создана страница отзывов `/reviews/medic/[medicId]` — список отзывов с рейтингом, звёздами, датой, пагинацией и заглушкой — `web/app/reviews/medic/[medicId]/page.tsx`
- **[feat]** Добавлена кнопка «Отзывы» рядом с рейтингом медика на странице заказа — `web/app/orders/[id]/page.tsx`
- **[i18n]** Добавлена секция `reviews.*` (title, back, loading, error, retry, empty, emptyHint, avgRating, totalReviews, noComment, roleClient, roleMedic, prevPage, nextPage, pageOf) — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (Medic work zone / geofence settings screen — medic app)

- **[feat]** Created work zone screen with MapView + Circle overlay + radius slider (0.5-50 km) — `medic/app/work-zone.tsx`
- **[feat]** Added `workZoneLat`, `workZoneLng`, `workZoneRadius` fields to `MedicUser` interface — `medic/context/AuthContext.tsx`
- **[feat]** Added work zone navigation button to profile screen with active/inactive status display — `medic/app/(tabs)/profile.tsx`
- **[feat]** Registered `work-zone` Stack.Screen in root layout — `medic/app/_layout.tsx`
- **[i18n]** Added `geofence.*` keys (workZone, tapToSetCenter, radius, km, saveZone, clearZone, saved, cleared, zoneActive, noZone) — `medic/i18n/ru.json`, `medic/i18n/uz.json`
- **[deps]** Installed `@react-native-community/slider` — `medic/package.json`

## 2026-03-31 (Client rating in dispatch invite — backend + medic)

- **[feat]** `ReviewsService.getTargetRatingStats()` — aggregated AVG(rating) + COUNT for a target (medic or client) — `backend/src/reviews/reviews.service.ts`
- **[feat]** `DispatchService` injects `ReviewsService`, enriches `dispatch_invite` payload with `client.averageRating` and `client.reviewCount` (wrapped in try/catch) — `backend/src/orders/dispatch.service.ts`
- **[feat]** `OrdersModule` imports `ReviewsModule` for dispatch access — `backend/src/orders/orders.module.ts`
- **[feat]** `OrderInviteModal` displays client rating badge (gold star + score) or "New client" badge — `medic/components/OrderInviteModal.tsx`
- **[feat]** `DispatchInvitePayload` extended with optional `client` field — `medic/components/OrderInviteModal.tsx`
- **[i18n]** Added `rating.clientRating` and `rating.newClient` keys — `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-31 (Medic rates client after DONE — medic app)

- **[feat]** Created `ClientRatingModal` component (stars 1-5, comment, submit + skip buttons) — `medic/components/ClientRatingModal.tsx`
- **[feat]** Modified `useOrderStatus` hook: stores `doneEarnings` in state instead of showing Alert on DONE; returns `doneEarnings` — `medic/hooks/useOrderStatus.ts`
- **[feat]** Modified order detail screen: shows `ClientRatingModal` after DONE, submits review via `POST /reviews` with `targetRole: 'client'`, then shows earnings Alert and navigates — `medic/app/order/[id].tsx`
- **[i18n]** Added `rating.*` keys (rateClient, tapStar, selectRating, submit, reviewPlaceholder, skip) — `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-31 (Review reminder cron — backend)

- **[feat]** `ReviewsService.sendReviewReminders()` — cron every 15 min, sends push/Telegram reminders ~1 hour after order completion if review not left — `backend/src/reviews/reviews.service.ts`
- **[refactor]** `ReviewsModule` imports `RealtimeModule`, `UsersModule`, `MedicsModule` for push/telegram access — `backend/src/reviews/reviews.module.ts`

## 2026-03-31 (Geofence / work zone — backend)

- **[feat]** Добавлены 3 nullable поля `workZoneLat`, `workZoneLng`, `workZoneRadius` в сущность `Medic` — `backend/src/medics/entities/medic.entity.ts`
- **[feat]** Создан `SetWorkZoneDto` с валидацией (lat, lng, radius 0.5–50 km) — `backend/src/medics/dto/set-work-zone.dto.ts`
- **[feat]** `MedicsService.setWorkZone()` и `clearWorkZone()` — `backend/src/medics/medics.service.ts`
- **[feat]** `PATCH /medics/work-zone` и `DELETE /medics/work-zone` (MedicAuthGuard) — `backend/src/medics/medics.controller.ts`
- **[feat]** Geofence фильтр в `DispatchService.selectBestMedic()`: haversine-проверка от центра зоны медика до адреса заказа, если `workZoneRadius` задан — `backend/src/orders/dispatch.service.ts`

## 2026-03-31 (Reviews module — backend)

- **[feat]** Создан модуль `reviews` — `backend/src/reviews/`
- **[feat]** Сущность `Review` с составным UNIQUE по `(orderId, authorRole)` — `backend/src/reviews/entities/review.entity.ts`
- **[feat]** `CreateReviewDto` с валидацией (orderId UUID, rating 1–5, comment max 1000, targetRole) — `backend/src/reviews/dto/create-review.dto.ts`
- **[feat]** `PaginationQueryDto` (page, limit) — `backend/src/reviews/dto/pagination-query.dto.ts`
- **[feat]** `ReviewsService.create()` — проверяет: заказ DONE, автор участник заказа, не дублируется — `backend/src/reviews/reviews.service.ts`
- **[feat]** `ReviewsService.recalcAverageRating()` — обновляет `medics.rating` + `medics.reviewCount`; обновляет `users.averageRating` с try/catch (колонка может отсутствовать на Railway) — `backend/src/reviews/reviews.service.ts`
- **[feat]** `ReviewsService.findByMedic()`, `findByClient()`, `findByOrder()` — пагинация, сортировка по дате — `backend/src/reviews/reviews.service.ts`
- **[feat]** `ReviewsController` — `POST /reviews`, `GET /reviews/medic/:id`, `GET /reviews/client/:id`, `GET /reviews/order/:id` — `backend/src/reviews/reviews.controller.ts`
- **[feat]** `ReviewsModule` подключён в `AppModule` — `backend/src/app.module.ts`

## 2026-03-31 (Курсы лечения — web client)

- **[feat]** Добавлены интерфейс `TreatmentCourse`, `CreateTreatmentCourseDto` и функции `getTreatmentCourses()`, `createTreatmentCourse()`, `deleteTreatmentCourse()`, `patchTreatmentCourse()` — `web/lib/api.ts`
- **[feat]** Создана страница `web/app/courses/page.tsx`: список курсов с прогресс-баром, статус-бейджем, кнопкой удалить, inline-форма добавления
- **[feat]** Кнопка "Курсы лечения" (FaSyringe) в профиль — `web/app/profile/page.tsx`
- **[i18n]** Ключи секции `courses.*` — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (Favorites / My Medics — web client)

- **[feat]** Добавлен интерфейс `FavoriteMedic` и функции `getFavorites()`, `addFavorite(medicId)`, `removeFavorite(medicId)` — `web/lib/api.ts`
- **[feat]** Создана страница `web/app/favorites/page.tsx`: список карточек медиков (фото/инициалы, имя, рейтинг, опыт, кнопка "Удалить"), заглушка при пустом списке
- **[feat]** Кнопка "Закрепить медика" на странице заказа при `status === "DONE"` — `web/app/orders/[id]/page.tsx`
- **[feat]** Кнопка "Мои медики" в профиль — `web/app/profile/page.tsx`
- **[i18n]** Ключи секции `favorites.*` — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (Referral Program — web client)

- **[feat]** Добавлен интерфейс `ReferralInfo` и функция `getReferralInfo()` — `web/lib/api.ts`
- **[feat]** Создана страница `web/app/referral/page.tsx`: хедер с зелёным градиентом, реферальный код крупно с кнопкой "Копировать", ссылка для приглашения `https://app.hamshirago.uz?ref=КОД` с кнопками "Поделиться" и "Копировать ссылку", блок объяснения бонуса, статистика
- **[feat]** Добавлена кнопка "Пригласи друга" (FaGift) в профиль — `web/app/profile/page.tsx`
- **[i18n]** Добавлены ключи секции `referral.*` — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (MedicalCard — web-medic)

- **[feat]** Добавлен интерфейс `MedicalCard` и метод `medicApi.medicalCard.getByClient(clientId)` — `web-medic/lib/api.ts`
- **[feat]** В страницу деталей заказа добавлена секция "Медкарта клиента" (группа крови, аллергии, хронические болезни, заметки); показывается только если есть хотя бы одно непустое поле; загружается по `clientId` из заказа — `web-medic/app/order/[id]/page.tsx`
- **[i18n]** Добавлены ключи `order.medicalCard.*` (title, bloodType, allergies, chronicDiseases, notes) — `web-medic/i18n/ru.json`, `web-medic/i18n/uz.json`

## 2026-03-28 (Favorites + MedicalCard UI — mobile client)

- **[feat]** Добавлена кнопка "Закрепить медика / Открепить" на экране трекинга заказа (статус DONE, если есть медик); загружает список favorites при DONE и проверяет isFavorite — `mobile/app/order/track.tsx`, `mobile/app/order/trackStyles.ts`
- **[feat]** Создан экран `app/favorites.tsx` — список избранных медиков (фото, имя, рейтинг, телефон), empty state — `mobile/app/favorites.tsx`
- **[feat]** Создан экран `app/medical-card.tsx` — форма медкарты (bloodType, allergies, chronicDiseases, notes), GET/PUT /medical-card — `mobile/app/medical-card.tsx`
- **[feat]** Добавлены ссылки "Мои медики" и "Медкарта" в профиль клиента (раздел Quick links) — `mobile/app/(tabs)/profile.tsx`
- **[i18n]** Ключи `favorites.*` и `medcard.*` уже присутствовали в `mobile/i18n/ru.json` и `mobile/i18n/uz.json`

## 2026-03-28 (Referral Program + Treatment Courses UI — mobile client)

- **[feat]** Created referral screen — `mobile/app/referral.tsx`: fetches `GET /referrals/my`, shows large code, Clipboard copy, Share, stats (referredCount, bonusPaidCount), promo text
- **[feat]** Added optional referral code section to registration form — `mobile/app/auth.tsx`: collapsible "Есть реферальный код?" with TextInput, onBlur validation via `GET /referrals/validate/:code`, passes `referredByCode` in register call
- **[feat]** Updated `AuthContext.register()` signature to accept optional `referredByCode` — `mobile/context/AuthContext.tsx`
- **[feat]** Created treatment courses screen — `mobile/app/courses.tsx`: FlatList with progress bars, status badges, next date, FAB "+" → bottom sheet modal to create course, tap card → Alert with "Отметить выполненной" (PATCH markComplete) or delete
- **[feat]** Added post-DONE courses prompt in track screen — `mobile/app/order/track.tsx`: Alert fires once when order reaches DONE, offers to navigate to `/courses`
- **[feat]** Added "Пригласи друга" and "Курсы лечения" rows to profile — `mobile/app/(tabs)/profile.tsx`
- **[i18n]** Added `referral.*` and `courses.*` keys — `mobile/i18n/ru.json`, `mobile/i18n/uz.json`

## 2026-03-28 (MedCard client view — medic app)

- **[feat]** Added `clientId?: string` field to `OrderDetail` interface — `medic/hooks/useOrderStatus.ts`
- **[feat]** Added `medcard.*` i18n keys (ru + uz): clientCard, bloodType, allergies, chronicDiseases, notes, noCard, noAccess — `medic/i18n/ru.json`, `medic/i18n/uz.json`
- **[feat]** Added "Медкарта клиента" button in address card section; fetches `GET /medical-card/client/:clientId` with medic token; 404/403 → Alert — `medic/app/order/[id].tsx`
- **[feat]** Added inline Modal with MedCardData display (bloodType, allergies, chronicDiseases, notes) and "Закрыть" button — `medic/app/order/[id].tsx`

## 2026-03-30 (Referral Program + Treatment Courses — backend)

- **[feat]** Added `referralCode`, `referredBy`, `referralBonusUsed`, `pendingReferralDiscount` columns (all nullable) to `User` entity — `backend/src/users/entities/user.entity.ts`
- **[feat]** Added `findByReferralCode`, `setReferralCode`, `setPendingReferralDiscount`, `markReferralBonusUsed` methods to `UsersService` — `backend/src/users/users.service.ts`
- **[feat]** Added optional `referredByCode` field to `RegisterClientDto` — `backend/src/auth/dto/register-client.dto.ts`
- **[feat]** `registerClient()`: generates unique 8-char referral code, handles `referredByCode` lookup, creates `Referral` record — `backend/src/auth/auth.service.ts`
- **[feat]** Created `Referral` entity (`referrerId`, `referredId`, `bonusPaid`, `bonusAmount`) — `backend/src/referrals/entities/referral.entity.ts`
- **[feat]** Created `ReferralsService`: `getMyReferrals()`, `validateCode()` — `backend/src/referrals/referrals.service.ts`
- **[feat]** Created `ReferralsController`: `GET /referrals/my` (JWT), `GET /referrals/validate/:code` (public) — `backend/src/referrals/referrals.controller.ts`
- **[feat]** Created `ReferralsModule` — `backend/src/referrals/referrals.module.ts`
- **[feat]** `OrdersService.create()`: auto-applies `pendingReferralDiscount` from user and zeros it out — `backend/src/orders/orders.service.ts`
- **[feat]** `OrdersService.updateStatusByClient()`: calls `applyReferralBonusIfEligible()` on first DONE order — `backend/src/orders/orders.service.ts`
- **[feat]** `applyReferralBonusIfEligible()`: awards 10 000 UZS to both referrer and referee on first DONE order — `backend/src/orders/orders.service.ts`
- **[feat]** Installed `@nestjs/schedule`, added `ScheduleModule.forRoot()` to `AppModule` — `backend/src/app.module.ts`
- **[feat]** Created `TreatmentCourse` entity (`clientId`, `title`, `serviceId`, `totalProcedures`, `completedProcedures`, `intervalDays`, `nextDate`, `status`, `reminderSentToday`) — `backend/src/treatment-courses/entities/treatment-course.entity.ts`
- **[feat]** Created `TreatmentCoursesService`: CRUD + `@Cron('0 * * * *')` hourly reminder job — `backend/src/treatment-courses/treatment-courses.service.ts`
- **[feat]** Created `TreatmentCoursesController`: `POST`, `GET /my`, `PATCH /:id`, `DELETE /:id` (all JWT) — `backend/src/treatment-courses/treatment-courses.controller.ts`
- **[feat]** Created `TreatmentCoursesModule` — `backend/src/treatment-courses/treatment-courses.module.ts`
- **[feat]** Registered `ReferralsModule` and `TreatmentCoursesModule` in `AppModule` — `backend/src/app.module.ts`
- **[docs]** Added sections 13 (Referrals) and 14 (TreatmentCourses) to `docs/BACKEND_API.md`

## 2026-03-30 (Favorites + MedicalCard — backend)

- **[feat]** Создана сущность `FavoriteMedic` с уникальным индексом `(userId, medicId)` — `backend/src/favorites/entities/favorite-medic.entity.ts`
- **[feat]** Создан `FavoritesService` — методы `add` (upsert/orIgnore), `remove`, `findByUser` (с JOIN medic info), `isFavorite`, `findActiveFavoriteMedicId` (активный избранный медик) — `backend/src/favorites/favorites.service.ts`
- **[feat]** Создан `FavoritesController` — `POST /favorites/:medicId`, `DELETE /favorites/:medicId`, `GET /favorites` (JwtAuthGuard) — `backend/src/favorites/favorites.controller.ts`
- **[feat]** `FavoritesModule` зарегистрирован в `app.module.ts` и импортирован в `OrdersModule`
- **[feat]** `DispatchService` инжектирует `FavoritesService` — при диспатче проверяет избранного медика клиента; если онлайн/верифицирован/в радиусе — получает приглашение первым — `backend/src/orders/dispatch.service.ts`
- **[feat]** Создана сущность `MedicalCard` с unique `userId` — `backend/src/medical-card/entities/medical-card.entity.ts`
- **[feat]** Создан `MedicalCardService` — `upsert` (create/update), `findByUserId`, `findByUserIdForMedic` (проверяет активный заказ медика) — `backend/src/medical-card/medical-card.service.ts`
- **[feat]** Создан `MedicalCardController` — `GET /medical-card` (JwtAuthGuard), `PUT /medical-card` (JwtAuthGuard), `GET /medical-card/client/:clientId` (MedicAuthGuard + check active order) — `backend/src/medical-card/medical-card.controller.ts`
- **[feat]** `MedicalCardModule` зарегистрирован в `app.module.ts`
- **[docs]** Обновлён `docs/BACKEND_API.md` — добавлены секции 11 (Favorites) и 12 (MedicalCard)

## 2026-03-30 (Urgent Order UI — mobile + medic)

- **[feat]** Added `isUrgent` boolean state + fetch `GET /settings` for `urgentFeePercent` on confirm screen — `mobile/app/order/confirm.tsx`
- **[feat]** Urgent toggle row with Switch + description label on confirm screen — `mobile/app/order/confirm.tsx`
- **[feat]** `urgentFee` line in price breakdown; total updated to include `urgentFee`; `isUrgent` sent in POST /orders body — `mobile/app/order/confirm.tsx`
- **[feat]** Added `isUrgent?: boolean` to `OrderCardItem`; shows red "Срочный" badge when true — `mobile/components/OrderCard.tsx`
- **[feat]** Added `isUrgent?: boolean` and `urgentFee?: number` to `Order` interface — `mobile/hooks/useOrderTracking.ts`
- **[feat]** Track screen shows "🔴 Срочный" badge and `urgentFee` line in header when `order.isUrgent` is true — `mobile/app/order/track.tsx`
- **[feat]** Added `urgentBadge`, `urgentBadgeText`, `urgentFeeText` styles — `mobile/app/order/trackStyles.ts`
- **[feat]** Added `isUrgent?: boolean` and `urgentFee?: number` to `DispatchInvitePayload.order` in medic's invite modal — `medic/components/OrderInviteModal.tsx`
- **[feat]** Red urgent banner "🔴 СРОЧНЫЙ — доплата: X сум" shown at top of invite modal when `order.isUrgent` is true — `medic/components/OrderInviteModal.tsx`
- **[feat]** Added `isUrgent?: boolean` and `urgentFee?: number` to `OrderDetail` type — `medic/hooks/useOrderStatus.ts`
- **[feat]** Medic order detail screen shows red "Срочный" badge; `urgentFee` row in service/earnings card; `netPrice` calculation includes `urgentFee` — `medic/app/order/[id].tsx`
- **[i18n]** Added `urgent.label`, `urgent.badge`, `urgent.description`, `urgent.fee` keys — `mobile/i18n/ru.json`, `mobile/i18n/uz.json`, `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-30 (Global Error Boundary — mobile + medic)

- **[feat]** Created `reportError()` utility — sends error to `POST /client-errors` with userId, appType, screen, deviceInfo, appVersion — `mobile/utils/reportError.ts`, `medic/utils/reportError.ts`
- **[feat]** Created `ErrorBoundary` React class component — catches render errors, reports via `reportError()`, shows fallback UI with retry button — `mobile/components/ErrorBoundary.tsx`, `medic/components/ErrorBoundary.tsx`
- **[feat]** Wrapped root `RootLayout` JSX with `<ErrorBoundary appType="mobile">` — `mobile/app/_layout.tsx`
- **[feat]** Wrapped root `RootLayout` JSX with `<ErrorBoundary appType="medic">` — `medic/app/_layout.tsx`
- **[feat]** Added `ErrorUtils.setGlobalHandler` in `RootLayoutNav` to catch unhandled JS errors and report them via `reportError()` — `mobile/app/_layout.tsx`, `medic/app/_layout.tsx`

## 2026-03-29 (Rating & Reviews UI — mobile + medic)

- **[feat]** Added `clientReview?: string | null` and `rating`/`reviewCount` to `Medic` interface in `Order` type — `mobile/hooks/useOrderTracking.ts`
- **[feat]** Track screen shows submitted `clientReview` text after rating — `mobile/app/order/track.tsx`
- **[feat]** Track screen shows medic's `rating` + `reviewCount` (N отзывов) next to medic name — `mobile/app/order/track.tsx`
- **[feat]** Added `medicRatingRow`, `medicRatingText`, `medicReviewCount`, `clientReviewText` styles — `mobile/app/order/trackStyles.ts`
- **[feat]** Added `review.*` i18n keys (placeholder, reviews, noReviews, myReviews) — `mobile/i18n/ru.json`, `mobile/i18n/uz.json`
- **[feat]** Added `reviewCount: number` to `MedicUser` type — `medic/context/AuthContext.tsx`
- **[feat]** Medic profile header shows `reviewCount` next to rating stars — `medic/app/(tabs)/profile.tsx`
- **[feat]** Medic stats card for rating is now tappable, navigates to `/reviews` — `medic/app/(tabs)/profile.tsx`
- **[feat]** Created `app/reviews.tsx` — screen listing all DONE orders with non-empty `clientReview`, shows stars + review text + date — `medic/app/reviews.tsx`
- **[feat]** Added `review.*` i18n keys — `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-29 (Urgent Order feature)

- **[feat]** Added `isUrgent: boolean` (default false) and `urgentFee: decimal(10,0)` (default 0) columns to `Order` entity — `backend/src/orders/entities/order.entity.ts`
- **[feat]** Added `urgentFeePercent` (default 50), `urgentStartHour` (default 22), `urgentEndHour` (default 7) columns to `AppSettings` entity — `backend/src/app-settings/entities/app-settings.entity.ts`
- **[feat]** Added `@IsOptional() @IsBoolean() isUrgent?` field to `CreateOrderDto` — `backend/src/orders/dto/create-order.dto.ts`
- **[feat]** `create()`: auto-detects night window (UTC+5) or client flag; calculates `urgentFee`; updated `netPrice = priceAmount + urgentFee - discountAmount` and `platformFee` accordingly — `backend/src/orders/orders.service.ts`
- **[feat]** `updateStatusByClient` and `updateStatusByMedic` DONE transitions: earnings now use `netPrice - platformFee` (includes `urgentFee`) — `backend/src/orders/orders.service.ts`
- **[feat]** `acceptOrder` balance deduction uses `urgentFee`-inclusive `netPrice` — `backend/src/orders/orders.service.ts`
- **[feat]** `findAllAdmin()` accepts optional `isUrgent?: boolean` filter — `backend/src/orders/orders.service.ts`
- **[feat]** Admin `GET /orders/admin/all` accepts `?isUrgent=true|false` query param — `backend/src/orders/orders.controller.ts`
- **[feat]** `PatchSettingsDto` extended with `urgentFeePercent`, `urgentStartHour`, `urgentEndHour` — `backend/src/app-settings/dto/patch-settings.dto.ts`
- **[feat]** `AppSettingsService.patch()` persists new urgent settings — `backend/src/app-settings/app-settings.service.ts`
- **[feat]** `GET /settings` and `PATCH /settings` now return/accept urgent fee config fields — `backend/src/app-settings/app-settings.controller.ts`
- **[docs]** Updated Order model and commission formula in `docs/BACKEND_API.md`

## 2026-03-29 (Error Tracking backend extension)

- **[feat]** Created `ClientErrorStatus` enum (`NEW | IN_PROGRESS | FIXED | IGNORED`) — `backend/src/client-errors/entities/client-error-status.enum.ts`
- **[feat]** Extended `ClientError` entity with new nullable fields: `status` (default NEW), `deviceInfo`, `appVersion`, `errorCode`, `count` (default 1), `resolvedAt` — `backend/src/client-errors/entities/client-error.entity.ts`
- **[feat]** Extended `CreateClientErrorDto` with optional `deviceInfo` (MaxLength 200), `appVersion` (MaxLength 50), `errorCode` (MaxLength 100) — `backend/src/client-errors/dto/create-client-error.dto.ts`
- **[feat]** Added `findAll()` with paginated filtering by status/appType/userId/dateFrom/dateTo — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Added `updateStatus()` — sets `resolvedAt` when status becomes FIXED or IGNORED — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Added `getStats()` — returns `{ NEW, IN_PROGRESS, FIXED, IGNORED }` counts — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Auto-grouping in `save()` — if `errorCode` provided, increments `count` on matching NEW/IN_PROGRESS entry within 24 h instead of creating duplicate — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Added admin endpoints behind `AdminGuard`: `GET /client-errors/admin`, `PATCH /client-errors/admin/:id`, `GET /client-errors/admin/stats` — `backend/src/client-errors/client-errors.controller.ts`

## 2026-03-29 (LOW bugs BE-L1..L7)

- **[fix]** BE-L1: Added `findOneBasic(id)` without medic JOIN for internal use; all internal callers (cancelOrder, rateOrder, updateStatusByClient, updateStatusByMedic, acceptOrder) now use it — `orders.service.ts`
- **[fix]** BE-L2: Stored interval handle in `cleanupInterval` class property; implemented `OnModuleDestroy` to call `clearInterval` — `order-events.gateway.ts`
- **[fix]** BE-L3: Created `BlockUserDto` with `@IsBoolean() isBlocked` for admin block endpoint — `auth/dto/block-user.dto.ts`, `auth.controller.ts`
- **[fix]** BE-L4: Added `.catch(err => console.error('Notify error:', err))` to all fire-and-forget `notifyClient`/`notifyMedic` calls — `orders.service.ts`
- **[fix]** BE-L5: `GET /services/:id` now throws `NotFoundException` when service is null instead of returning 200 — `services.controller.ts`
- **[fix]** BE-L6: `broadcastToAll` processes recipients in chunks of 20 with 100ms delay between chunks — `telegram.service.ts`
- **[fix]** BE-L7: `discountAmount` capped at 20% of service price with `BadRequestException`; TODO comment for future promo-code validation — `orders.service.ts`

## 2026-03-29 (LOW bugs MOB-L1..L5, MED-L1..L3)

- **[fix]** MOB-L1: Replaced `pin` dep in `fetchLocation` useCallback with `initialPinSetRef` ref to eliminate infinite loop — `mobile/app/order/location.tsx`
- **[fix]** MOB-L2: Removed unused `getServiceById` import and `service` variable (dead code) — `mobile/app/order/location.tsx`
- **[fix]** MOB-L3: Wrapped native `LocationMap` with `React.memo` to prevent MapView re-renders on address keystrokes — `mobile/app/order/location.tsx`
- **[fix]** MOB-L4: Removed duplicate `setNotificationChannelAsync('order_updates')` from `registerPushToken.ts`; channel setup kept only in `_layout.tsx` — `mobile/utils/registerPushToken.ts`
- **[fix]** MOB-L5: Changed `logout` type from `() => void` to `() => Promise<void>` in `AuthContextType` interface — `mobile/context/AuthContext.tsx`
- **[fix]** MED-L1: Added two `useEffect` hooks to sync `faceUri`/`licenseUri` state when `medic.facePhotoUrl`/`licensePhotoUrl` updates after profile refresh — `medic/app/verification.tsx`
- **[fix]** MED-L2: Replaced dynamic `(await import('@/constants/api')).API_BASE` with static `API_BASE` import at top of file — `medic/app/(tabs)/profile.tsx`
- **[fix]** MED-L3: Stored `token` in `tokenRef`, `pushLocation` now uses `tokenRef.current` with empty `useCallback` deps; removed `pushLocation` from socket effect deps to prevent unnecessary reconnects — `medic/hooks/useMedicOrderFeed.ts`

## 2026-03-28 (medic MEDIUM bugs MED-M1..M9)

- **[fix]** MED-M1: Replaced all hardcoded Russian strings with `t()` i18n calls — `app/(tabs)/index.tsx`, `profile.tsx`, `order/[id].tsx`, `verification.tsx`, `components/OrderInviteModal.tsx`, `app/(tabs)/my-orders.tsx`
- **[fix]** MED-M2: OrderInviteModal auto-dismisses after 2s when countdown reaches 0 — `components/OrderInviteModal.tsx`
- **[fix]** MED-M3: Reset `startingRef.current = false` after watchPositionAsync succeeds — `hooks/useMedicLocation.ts`
- **[fix]** MED-M4: Replaced hardcoded OSRM URL with import from `@/constants/config` — `components/OrderInviteModal.tsx`
- **[fix]** MED-M5: Added error state and retry UI to my-orders fetch — `app/(tabs)/my-orders.tsx`
- **[fix]** MED-M6: Profile uses `?status=DONE&limit=1` + `total` instead of fetching 100 orders — `app/(tabs)/profile.tsx`
- **[fix]** MED-M7: NewOrderBanner uses `onDismissRef` + `order.id` in effect deps to avoid stale closure — `components/NewOrderBanner.tsx`
- **[fix]** MED-M8: OSRM throttle increased from 12s to 30s + skip if medic moved <200m — `constants/config.ts`, `hooks/useMedicRoute.ts`
- **[fix]** MED-M9: Added `reconnectionAttempts: 15` to SocketContext — `context/SocketContext.tsx`
- **[i18n]** Added `common.close` key to ru.json and uz.json

## 2026-03-28 (backend MEDIUM bugs BE-M1..M12)

- **[fix]** BE-M9: Added composite `@Index(['orderId', 'medicId', 'result'])` on DispatchAttempt entity — `backend/src/orders/entities/dispatch-attempt.entity.ts`
- **[fix]** BE-M10: Replaced hardcoded WebSocket CORS origins with shared `ALLOWED_ORIGINS` from `cors.config.ts` — `backend/src/realtime/order-events.gateway.ts`
- **[fix]** BE-M11: Fixed Cloudinary timeout leak — `clearTimeout` via `.finally()` on Promise.race — `backend/src/common/cloudinary.service.ts`
- **[verified]** BE-M1..M8, BE-M12: Already fixed in prior commits (forbidNonWhitelisted, Payme refund state=-2, synchronize:false, pool max:20, dispatch recovery, findAvailable guard, WS caches, GetStatement take:1000)

## 2026-03-28 (mobile HIGH bugs MOB-H1..H5)

- **[verified]** MOB-H1: `submitRating` already uses `ratingSubmittingRef` guard, `ratingSubmitting` not in useCallback deps — no changes needed — `mobile/hooks/useOrderTracking.ts`
- **[fix]** MOB-H2: Replaced all hardcoded Russian strings with i18n `t()` calls on track, orders, and rating screens — Uzbek users now see correct translations — `mobile/app/order/track.tsx`, `mobile/app/(tabs)/two.tsx`, `mobile/components/RatingModal.tsx`
- **[fix]** MOB-H3: Removed deprecated `STATUS_LABEL` object with hardcoded Russian — `OrderCard` already uses `getStatusLabel(t)` — `mobile/types/order.ts`
- **[verified]** MOB-H4: `OrderCard.onPress` already navigates to track screen for all order statuses — no changes needed — `mobile/components/OrderCard.tsx`
- **[fix]** MOB-H5: `cancelOrder` removed `if (result)` guard — `apiFetch` returns undefined on 204 success, so navigation was skipped; now navigation always runs after successful await — `mobile/hooks/useOrderTracking.ts`

## 2026-03-28 (backend HIGH security fixes)

- **[fix]** BE-H9: Added `@MaxLength(10000)` to `stacktrace` and `@MaxLength(2000)` to `message` in `CreateClientErrorDto` — prevents database bloat via public endpoint — `backend/src/client-errors/dto/create-client-error.dto.ts`
- **[fix]** BE-H10: Added `@Exclude()` on `passwordHash` in both `Medic` and `User` entities, enabled `ClassSerializerInterceptor` globally — prevents password hash leaking in API responses — `backend/src/medics/entities/medic.entity.ts`, `backend/src/users/entities/user.entity.ts`, `backend/src/main.ts`
- **[fix]** BE-H11: Telegram `/start {medicId}` now rejects linking if medic already has a different `telegramChatId` — prevents hijacking another medic's notifications — `backend/src/telegram/telegram-bot.service.ts`
- **[verified]** BE-H1 through BE-H8: Already fixed in codebase — `isBlocked` check in JWT strategy, payment ownership verification, Click IP whitelist, admin topup validation, push token MaxLength, order creation transaction, dispatch profilePhotoUrl check

## 2026-03-28 (medic HIGH fixes)

- **[fix]** MED-H1: Removed `clearInterval` from `acceptOrder` — location interval continues running so medic stays visible to dispatch after completing an order — `medic/hooks/useMedicOrderFeed.ts`
- **[fix]** MED-H2: 401 now shows Alert before logout instead of silent auto-logout — medic sees "Session expired" message, gets chance to understand what happened — `medic/constants/api.ts`
- **[fix]** MED-H3: Used `fetchOrderRef` pattern to remove `fetchOrder` from WebSocket effect deps — prevents socket reconnect loop caused by `router` changing on every render — `medic/hooks/useOrderStatus.ts`
- **[fix]** MED-H4: Wrapped `confirmAccept` in try/catch — navigation to order screen only happens if `acceptOrder` succeeds; `acceptOrder` now re-throws after setting error state — `medic/app/(tabs)/index.tsx`, `medic/hooks/useMedicOrderFeed.ts`
- **[verified]** MED-H5: `.env` already in root `.gitignore` (lines 38-39), not tracked by git — no changes needed

## 2026-03-28 (medic critical fixes)

- **[fix]** MED-C1: Устранены двойные WebSocket-соединения в medic app — создан единый `SocketProvider`/`SocketContext`, `useMedicOrderFeed` и `useOrderStatus` используют общий сокет вместо создания собственных `io()` — `medic/context/SocketContext.tsx`, `medic/hooks/useMedicOrderFeed.ts`, `medic/hooks/useOrderStatus.ts`, `medic/hooks/useMedicLocation.ts`, `medic/app/order/[id].tsx`, `medic/app/_layout.tsx`
- **[fix]** MED-C2: Исправлен stale closure в `SwipeActionButton` — `onConfirm` теперь хранится в ref, PanResponder вызывает `onConfirmRef.current()` вместо замыкания первого рендера — `medic/components/SwipeActionButton.tsx`

## 2026-03-28

- **[fix]** MOB-C1: Каталог `/services` теперь запрашивается с auth token — предотвращает ложный auto-logout на 401 — `mobile/app/(tabs)/index.tsx`
- **[fix]** MOB-C2: Устранены двойные WebSocket-соединения — создан единый `SocketProvider`/`SocketContext`, orders list и track screen используют общий сокет — `mobile/context/SocketContext.tsx`, `mobile/app/(tabs)/two.tsx`, `mobile/hooks/useOrderTracking.ts`, `mobile/app/_layout.tsx`
- **[fix]** MOB-C3: Добавлен TODO-комментарий о необходимости серверной валидации `discountAmount` (связан с BE-L7) — `mobile/app/order/confirm.tsx`
- **[fix]** MOB-C4: Добавлена валидация телефона — проверка формата +998XXXXXXXXX или минимум 9 цифр — `mobile/app/order/location.tsx`
- **[fix]** MOB-C5: `registerPushToken` теперь логирует явное предупреждение при placeholder EAS projectId — `mobile/utils/registerPushToken.ts`
- **[fix]** BE-C1: Унифицировано начисление `earnings` медику — оба пути (client DONE и medic DONE) теперь используют `netPrice` — `orders.service.ts`
- **[fix]** BE-C2: SQL-инъекция в balance deduction — заменена строковая интерполяция на `.setParameter('fee', fee)` — `orders.service.ts`
- **[fix]** BE-C3: Race condition в `adminCancelOrder` — заменён read-then-write на атомарный `update()` с `Not(In([DONE, CANCELED]))` — `orders.service.ts`
- **[fix]** BE-C4: Telegram webhook authentication — добавлена проверка `X-Telegram-Bot-Api-Secret-Token` + `secret_token` в setWebhook — `telegram-bot.controller.ts`, `telegram-bot.service.ts`
- **[fix]** BE-C5: Payme auth timing attack — заменён `!==` на `crypto.timingSafeEqual` — `payme.service.ts`

## 2026-03-18

- **[fix]** `web/components/SplashScreen.tsx` — логотип больше не пульсирует (убрана анимация `splash-pulse`), теперь плавный fade-in; убирает эффект "песочных часов" при открытии клиентского web-приложения
- **[feat]** `web-medic/app/page.tsx` — в модальном окне принятия заказа добавлены: мини-карта (Leaflet, тот же Map компонент), расстояние до клиента (haversine); UI приведён в соответствие с нативным medic-приложением
- **[seo]** `landing/components/SeoContent.tsx` — FAQ аккордеон: ответы всегда в DOM (CSS max-height вместо conditional render), Google теперь индексирует все ответы + FAQPage schema работает
- **[seo]** `landing/components/Hero.tsx` — добавлен скрытый `<h1>` с полным текстом для поисковиков; анимированные `<h1>` → `<div>`, Google видит чистый заголовок
- **[seo]** `landing/app/[lang]/layout.tsx` — расширены keywords: добавлены 20+ long-tail запросов (по районам, по процедурам, на RU и UZ)
- **[seo]** `landing/app/[lang]/[service]/page.tsx` — созданы 8 страниц услуг (4 RU + 4 UZ): укол/ukol, капельница/tomchi, давление+ЭКГ/qon bosimi, уход/parvarish; каждая со своими meta, JSON-LD (MedicalProcedure + FAQPage + BreadcrumbList), hreflang
- **[seo]** `landing/app/sitemap.ts` — sitemap расширен: 2 → 10 URL (добавлены 8 страниц услуг с hreflang alternates)

## 2026-03-14 — Bearings fix: медик по правильной полосе (шаги 1-3)

- **[fix]** `medic/hooks/useMedicLocation.ts` — `heading` добавлен в pos объект emit и onLocationUpdate callback
- **[fix]** `backend/src/realtime/order-events.gateway.ts` — `heading` добавлен в MedicLocationPayload, принимается от медика и передаётся клиенту
- **[fix]** `medic/hooks/useMedicRoute.ts` — OSRM-запрос с `bearings` и `radiuses=25` — маршрут строится по правильной полосе
- **[fix]** `medic/app/order/[id].tsx` — тип medicPos расширен полем `heading`

## 2026-03-14 — Backend критичные фиксы (N1, N2, N4, N5, N6)

- **[fix]** `payments/payme.service.ts` — N1: `checkPerformTransaction` теперь сравнивает с `netPrice = priceAmount - discountAmount`; заказы со скидкой корректно оплачиваются
- **[fix]** `payments/click.service.ts` — N1: аналогичный фикс для Click
- **[fix]** `main.ts` — N4: добавлен `trust proxy 1` — Payme IP-whitelist теперь работает на Railway
- **[fix]** `auth/auth.controller.ts` — N6: `@Throttle({ ttl: 900_000, limit: 5 })` на `/auth/admin/login`
- **[fix]** `orders/dispatch.service.ts` — N2: NO_MEDICS retry-таймер сохраняется в `this.timers` — очищается при отмене заказа
- **[fix]** `medics/medics.service.ts` — N5: `findCandidatesForDispatch` ограничен `.take(50)`

## 2026-03-14 — Этап 18: веб-адаптация + BUG 32/33 (Диёр)

- **[web]** `app/orders/[id]/page.tsx` — убран `"ASSIGNED"` из `STATUS_FLOW` (шаги теперь: `CREATED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE`)
- **[web]** `app/orders/[id]/page.tsx` — `canCancel` теперь только `"CREATED"` (ASSIGNED больше не наступает)
- **[web]** `app/orders/[id]/page.tsx` — убран `"ASSIGNED"` из условия показа карты медика
- **[web-medic]** `lib/api.ts` — удалена строка `ASSIGNED → ACCEPTED ("Подтвердить принятие")` из `NEXT_STATUS`
- **[fix]** `admin/src/components/AdminLayout.tsx` — BUG 32: добавлена периодическая проверка токена каждые 60с через `setInterval` + `useState(hasAdminSecret())` → авто-logout при истечении JWT
- **[note]** BUG 33 (JWT localStorage XSS) — частично: auto-logout при истёкшем токене; полный фикс = httpOnly cookies на бэкенде

## 2026-03-13 — Перегрев: throttle GPS emit в useMedicLocation

- **[fix]** `medic/hooks/useMedicLocation.ts` — добавлен JS-level throttle `lastEmitRef` (Android игнорирует `timeInterval` в `watchPositionAsync` и шлёт тысячи GPS-фиксов в секунду); socket emit не чаще `LOCATION_EMIT_INTERVAL_MS` (5с); `distanceInterval` увеличен 8м→15м; карта обновляется на каждый фикс, emit — throttled

## 2026-03-13 — Убрано двойное принятие заказа медиком

- **[backend]** `orders/orders.service.ts` — `acceptOrder` теперь ставит статус ACCEPTED вместо ASSIGNED (пропускает промежуточный шаг)
- **[medic]** `medic/app/order/[id].tsx` — убраны: auto-advance useEffect, autoAcceptFailed state, 5с timeout, fallback SwipeButton для ASSIGNED

## 2026-03-13 — SwipeActionButton для medic (UX)

- **[ux]** `medic/components/SwipeActionButton.tsx` — создан swipe-to-confirm компонент (Animated + PanResponder + haptic)
- **[ux]** `medic/app/order/[id].tsx` — кнопка "следующий статус" и fallback "Принять заказ" заменены на SwipeActionButton

## 2026-03-13 — Этап 17: 4 бага medic (A, C, D, E)

- **[fix]** `medic/hooks/useMedicOrderFeed.ts` — Задача A: в `acceptOrder` после успешного принятия добавлен `clearInterval(locationIntervalRef.current)` — 2-минутный pushLocation интервал останавливается при переходе на экран заказа
- **[fix]** `medic/app/order/[id].tsx` — Задача C: добавлен `autoAcceptFailed` state; в `.catch` auto-advance ASSIGNED→ACCEPTED устанавливается флаг; добавлен useEffect с 5с setTimeout как доп. fallback; в рендере показывается кнопка "Принять заказ" если `order.status === 'ASSIGNED' && autoAcceptFailed`
- **[fix]** `medic/app/order/[id].tsx` — Задача D: из initial position effect убран `socketRef.current.emit('medic_location', ...)` — двойной emit устранён, остался только `setMedicPos(pos)` для карты
- **[fix]** `medic/hooks/useOrderStatus.ts` — Задача E шаг 1: в `OrderDetail` добавлены поля `clientRating`, `clientReview`, `cancelReason`
- **[fix]** `medic/hooks/useOrderStatus.ts` — Задача E шаг 2: в `order_status` WS-обработчике при DONE/CANCELED вызывается `fetchOrder()` для получения полных данных
- **[fix]** `medic/app/order/[id].tsx` — Задача E шаг 3: после блока `completedNote` добавлен рендер рейтинга со звёздами + текст отзыва клиента (DONE) и причина отмены (CANCELED)

## 2026-03-13 — BUG fix: cancelOrder без причины (mobile)

- **[fix]** `mobile/hooks/useOrderTracking.ts` — `cancelOrder` принимает `reason?: string`, передаёт `{ reason }` в body POST-запроса; тип в `UseOrderTrackingResult` обновлён
- **[fix]** `mobile/app/order/track.tsx` — добавлен `cancelReason` state, TextInput для ввода причины показывается поверх контента когда открыт cancelModal; `confirmCancel` передаёт `cancelReason.trim() || undefined`; `onClose` и кнопка "Нет" сбрасывают `cancelReason`

## 2026-03-13 — OSRM timeout + retry с exponential backoff (medic)

- **[feat]** `medic/constants/config.ts` — `FETCH_TIMEOUT_MS` увеличен с 8000 до 12000
- **[feat]** `medic/hooks/useMedicRoute.ts` — добавлен `retryCountRef`; при AbortError (timeout) exponential backoff 3s/6s/12s; при успехе и `resetRoute` счётчик сбрасывается

## 2026-03-12 — Bug fixes: BUG-03, BUG-12, BUG-17

- **[fix]** BUG-03: `medic/app/order/[id].tsx` — location tracking useEffect: removed `else stopTracking()` branch, cleanup now uses `return stopTracking` directly to avoid double-stop when status is non-tracking
- **[fix]** BUG-12: `mobile/hooks/useOrderTracking.ts` — `order_status` handler clears `pollingRef.current` interval before disconnecting on DONE/CANCELED
- **[fix]** BUG-17: `medic/hooks/useOrderStatus.ts` — WebSocket useEffect now guards on `!orderId` in addition to `!token`; `fetchOrder` useCallback also guards on `!orderId` to prevent requests with undefined orderId

## 2026-03-12 — BUG-20 + BUG-21: earnings overstated fix + rating transaction fix

- **[backend]** `orders/orders.service.ts` — BUG-20: `updateStatusByClient` now credits medic with `netPrice - platformFee` instead of full `netPrice`, correcting 10% earnings overstatement
- **[backend]** `orders/orders.service.ts` — BUG-21: `rateOrder` now wraps both `order.clientRating` update and medic rating recalculation in a single `dataSource.transaction`, preventing split-brain if process crashes between the two writes

## 2026-03-12 — BUG-01 & BUG-02: subscription leak + concurrent call guard in useMedicLocation

- **[fix]** `medic/hooks/useMedicLocation.ts` — BUG-01: added `startingRef` set synchronously before async work; `.then(sub => ...)` now calls `sub.remove()` immediately if `startingRef.current` is false when the subscription resolves, preventing a leaked subscription when `stopTracking` runs before `.then()` fires
- **[fix]** `medic/hooks/useMedicLocation.ts` — BUG-02: guard changed from `if (watchRef.current) return` to `if (watchRef.current || startingRef.current) return` to block concurrent `startTracking` calls before `watchRef.current` is set asynchronously; `stopTracking` resets `startingRef.current = false` to cancel any in-flight async chain

## 2026-03-11 — dispatch_update includes profilePhotoUrl

- **[backend]** `orders/dispatch.service.ts` — dispatch_update event now includes `profilePhotoUrl` for candidate medic
- **[backend]** `realtime/order-events.gateway.ts` — emitDispatchUpdate type updated with profilePhotoUrl

## 2026-03-11 — cancelReason отображение на веб-клиентах

- **[web]** `lib/api.ts` — добавлен `cancelReason?: string | null` в `Order` interface
- **[web]** `app/orders/[id]/page.tsx` — `StatusStepper` показывает `cancelReason` под надписью "Отменён"
- **[web-medic]** `lib/api.ts` — добавлен `cancelReason?: string | null` в `Order` interface
- **[web-medic]** `app/order/[id]/page.tsx` — блок CANCELED показывает причину отмены + кнопку домой

## 2026-03-09 — Cancellation reason feature (backend)

- **[backend]** `orders/entities/order.entity.ts` — добавлено поле `cancelReason` (nullable varchar 500)
- **[backend]** `orders/dto/cancel-order.dto.ts` — создан DTO с `reason?` (`@IsOptional @IsString @MaxLength(500)`)
- **[backend]** `orders/orders.service.ts` — `cancelOrder`/`adminCancelOrder` сохраняют причину, включают в push
- **[backend]** `orders/orders.controller.ts` — эндпоинты cancel принимают `CancelOrderDto`
- **[backend]** `orders/dispatch.service.ts` — авто-отмена сохраняет `cancelReason: 'Нет доступных медиков в вашем районе'`

## 2026-03-09 — mobile: причина отмены + BUG-17, connection pool, JWT, Map TTL

- **[mobile]** `hooks/useOrderTracking.ts` — добавлено поле `cancelReason?` в интерфейс `Order`
- **[mobile]** `app/order/track.tsx` — показывает причину отмены при статусе CANCELED
- **[mobile]** `components/OrderCard.tsx` — показывает причину отмены под бейджем
- **[backend]** `orders/orders.service.ts` — BUG-17: push ошибки логируются вместо тихого проглатывания
- **[backend]** `app.module.ts` — TypeORM connection pool `extra: { max:10, min:2 }`
- **[backend]** `auth/auth.module.ts` — JWT expiry `1d` (было `7d`), env `JWT_EXPIRES_IN`
- **[backend]** `realtime/order-events.gateway.ts` — `clientOrderRooms` TTL cleanup каждые 5 мин

## 2026-03-09 — Self-hosted OSRM (Абубакир)

- **[osrm]** `osrm/Dockerfile` — создан сервис на базе `osrm/osrm-backend`, данные Узбекистана с Geofabrik, MLD алгоритм, порт 5000
- **[medic]** `constants/config.ts` — `OSRM_URL` читает `EXPO_PUBLIC_OSRM_URL` env var, fallback на публичный сервер
- **[mobile]** `hooks/useRoutePolyline.ts` — аналогично читает `EXPO_PUBLIC_OSRM_URL`

## 2026-03-10 — Performance оптимизации + аудит (Диёр)

- **[web-medic]** `app/page.tsx` — убран `setInterval(fetchOrders, 15000)` (polling). Теперь доступные заказы приходят через WebSocket `new_order` (уже был подключён). При reconnect — одиночный REST запрос для sync.
- **[admin]** `pages/Dashboard.tsx` — `recharts` переведён на `React.lazy` + `Suspense`. Initial bundle −~400KB.
- **[admin]** `pages/Reports.tsx` — то же: `recharts` lazy-loaded.
- **[BUG-28]** `web/app/orders/[id]/page.tsx` — `unsubscribe_order` уже эмитится в cleanup (баг уже был исправлен ранее).
- **[docs]** `docs/PERFORMANCE_AUDIT.md` — создан полный аудит производительности и безопасности.

## 2026-03-09 — Backend: BUG-1 fix + Performance + Security (Абубакир)

- **[backend]** `orders/orders.service.ts` — `acceptOrder` атомарный с транзакцией, race condition устранён; `findAvailable` добавлен `take: 50`
- **[backend]** `orders/entities/dispatch-attempt.entity.ts` — `@Index()` на `orderId` и `medicId`
- **[backend]** `orders/dispatch.service.ts` — NO_MEDICS auto-retry через 5 мин
- **[backend]** `common/cloudinary.service.ts` — `Promise.race` 30s timeout на upload
- **[backend]** `payments/payme.service.ts` — IP whitelist `185.8.212.0/24` в продакшне
- **[backend]** `payments/payments.controller.ts` — webhook передаёт `req.ip` в `validateIp()`

## 2026-03-09 — web-medic: обработка dispatch_invite_expired

- **[web-medic]** WebSocket событие `dispatch_invite_expired` — убирает заказ из списка доступных + показывает уведомление "Предложение заказа истекло"
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — web + web-medic: типы earnings и platformFee

- **[web-medic]** `lib/api.ts` — `Medic` интерфейс: добавлено поле `earnings: number`
- **[web]** `lib/api.ts` — `Order` интерфейс: добавлено поле `platformFee?: number`
- **[web-medic]** `lib/api.ts` — `Order` интерфейс: добавлено поле `platformFee?: number`
- `npm run build` = 0 ошибок (web ✅, web-medic ✅)

## 2026-03-09 — Рефакторинг mobile + medic: хуки, компоненты, типы (Этап 15)

### mobile/
- **[mobile]** `types/order.ts` — добавлены `OrderStatus`, `STATUS_LABEL`, `STATUS_COLOR`, `ACTIVE_STATUSES` (единый источник)
- **[mobile]** `constants/config.ts` — `GPS_ACCURACY_THRESHOLD_METERS`, `FIRST_ORDER_DISCOUNT_RATE`, `ORDERS_PAGE_LIMIT`
- **[mobile]** `hooks/useOrderTracking.ts` — WebSocket + order state + notifications + cancel/rating (из `track.tsx`)
- **[mobile]** `hooks/useRoutePolyline.ts` — OSRM route fetching (из `track.tsx`)
- **[mobile]** `hooks/useDispatchTimer.ts` — elapsed timer (из `track.tsx`)
- **[mobile]** `components/RatingModal.tsx` — звёзды рейтинга (из `track.tsx`)
- **[mobile]** `app/order/trackStyles.ts` — стили вынесены из `track.tsx`
- **[mobile]** `app/order/track.tsx` — **1365 → 514 строк** (−63%) ✅
- **[mobile]** `components/OrderCard.tsx` — извлечён из `two.tsx`
- **[mobile]** `app/(tabs)/two.tsx` — дублирующиеся типы удалены, импорт из `types/order`
- **[mobile]** `app/order/location.tsx` + `confirm.tsx` — magic numbers → `constants/config`
- `tsc --noEmit` = 0 ошибок ✅

### medic/
- **[medic]** `types/order.ts` — `OrderStatus`, `OrderLocation`, `ACTIVE_STATUSES`, `MAP_ACTIVE_STATUSES`
- **[medic]** `constants/config.ts` — интервалы, таймауты, `OSRM_URL`
- **[medic]** `components/NewOrderBanner.tsx` — извлечён из `index.tsx`
- **[medic]** `hooks/useMedicOrderFeed.ts` — WebSocket + orders feed (из `index.tsx`)
- **[medic]** `app/(tabs)/index.tsx` — **649 → ~430 строк** ✅
- **[medic]** `app/(tabs)/my-orders.tsx` — `OrderStatus` импортируется из `types/order`

### Агент-файлы
- **[docs]** `.claude/agents/engineering/mobile-developer.md` — соглашения для mobile/medic разработки
- **[docs]** `.claude/agents/engineering/mobile-refactor.md` — гайд по рефакторингу больших экранов

---

## 2026-03-09 — Рефакторинг medic order/[id].tsx: разбивка на хуки

- **[medic]** `medic/hooks/useMedicLocation.ts` — создан: foreground permission, интервальная отправка геолокации через WebSocket (`medic_location`), `startTracking` / `stopTracking`, импорт `LOCATION_EMIT_INTERVAL_MS` из `@/constants/config`
- **[medic]** `medic/hooks/useMedicRoute.ts` — создан: получение маршрута OSRM, состояние `routeCoords` / `routeLoading`, тротлинг `ROUTE_FETCH_THROTTLE_MS`, таймаут `FETCH_TIMEOUT_MS`, `fetchRoute` / `resetRoute`
- **[medic]** `medic/hooks/useOrderStatus.ts` — создан: начальная загрузка заказа, WebSocket подписка (`order_status`), `OrderDetail` / `NEXT_STATUS_MAP` экспортированы, `updateOrderStatus(cb)`, фоновые уведомления
- **[medic]** `medic/app/order/[id].tsx` — переписан: 838 → ~310 строк; импортирует 3 хука; локальные типы удалены (используются `OrderStatus`, `OrderLocation`, `MAP_ACTIVE_STATUSES` из `@/types/order`); UI/UX не изменён

## 2026-03-09 — Архитектурные фиксы backend (race conditions, CORS, geo, cache)

- **[backend]** `orders/orders.service.ts` — атомарное списание баланса (`UPDATE WHERE balance >= fee`, affected=0 → ошибка); `updateStatusByClient(DONE)` теперь зачисляет `earnings` в транзакции; `cancelOrder` использует `WHERE status IN (cancellable)` с проверкой `affected`
- **[backend]** `realtime/order-events.gateway.ts` — добавлены production домены в WebSocket CORS (`hamshirago.uz`, `app.`, `medic.`, `admin.`)
- **[backend]** `app-settings/app-settings.service.ts` — 30-секундный TTL кэш для `get()`, инвалидируется при `patch()`
- **[backend]** `utils/geo.ts` — создан общий модуль с функцией `haversineKm`; удалена дублированная реализация из `orders.service.ts`, `dispatch.service.ts`, `medics.service.ts`

---

## 2026-03-09 — admin: колонка Заработок в таблице медиков

- **[admin]** `pages/Medics.tsx` — `AdminMedic` интерфейс: добавлено поле `earnings?: number`; колонка "Заработок" в таблице (после "Кошелёк")
- **[admin]** `i18n/ru.json`, `uz.json` — ключ `medics.colEarnings`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — admin: настройка commissionRate в Settings

- **[admin]** `lib/api.ts` — `AppSettings` интерфейс: добавлено поле `commissionRate: number`
- **[admin]** `pages/Settings.tsx` — слайдер commissionRate (1–50%), disabled когда isPaidMode выключен, сохранение через `updateSettings`
- **[admin]** `i18n/ru.json`, `uz.json` — ключи `commissionRate`, `commissionRateDesc`, `commissionRateValue`, `commissionRateHint`, `toastRateSaved`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — web + web-medic: логирование клиентских ошибок

- **[web]** `lib/api.ts` — добавлена `reportClientError(message, stack)` → `POST /client-errors`
- **[web]** `app/error.tsx`, `app/global-error.tsx` — вызов `reportClientError` при рендере ошибки
- **[web-medic]** `lib/api.ts` — добавлена `reportClientError(message, stack)`
- **[web-medic]** `app/error.tsx`, `app/global-error.tsx` — вызов `reportClientError` при рендере ошибки
- `npm run build` = 0 ошибок (web ✅, web-medic ✅)

## 2026-03-09 — web: платёжная интеграция Payme/Click

- **[web]** `lib/api.ts` — добавлены `initiatePayment()`, `getPaymentStatus()`, типы `PaymentProvider`, `PaymentInitResponse`, `PaymentStatusResponse`
- **[web]** `app/orders/[id]/page.tsx` — блок оплаты при статусе DONE: кнопки Payme и Click, redirect на paymentUrl
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Backend: топап кошелька медика через admin

- **[backend]** `medics/medics.controller.ts` — добавлен `POST /medics/admin/:id/topup` (AdminGuard, 204); вызывает `medicsService.addBalance(id, amount)`
- `tsc --noEmit` = 0 ошибок ✅

## 2026-03-09 — Двойной баланс медика + настраиваемая комиссия

- **[backend]** `medics/entities/medic.entity.ts` — добавлено поле `earnings` (decimal, nullable, default 0): заработанные деньги из выполненных заказов
- **[backend]** `app-settings/entities/app-settings.entity.ts` — добавлено поле `commissionRate` (int, default 10): процент комиссии 1–50
- **[backend]** `app-settings/dto/patch-settings.dto.ts` — оба поля (`isPaidMode`, `commissionRate`) теперь опциональны
- **[backend]** `app-settings/app-settings.service.ts` — добавлены `patch(dto)` и `getCommissionRate()`
- **[backend]** `app-settings/app-settings.controller.ts` — GET и PATCH возвращают оба поля; убран лишний импорт `JwtModule`
- **[backend]** `orders/orders.service.ts` — удалён хардкод `COMMISSION_RATE=0.10`; `create()` и `acceptOrder()` используют `getCommissionRate()` из настроек; DONE теперь зачисляет `netPrice` в `earnings` (не в `balance`)
- **[backend]** `medics/medics.service.ts` — `toAuthResponse()` и `getProfile()` возвращают `earnings`
- **[medic]** `context/AuthContext.tsx` — `MedicUser` интерфейс: добавлено поле `earnings: number`
- **[medic]** `app/(tabs)/profile.tsx` — два блока баланса рядом: "Рабочий депозит" (`balance`) и "Заработок" (`earnings`); новые стили `balancesRow`, `balanceHalf`, `earningsCard`, `earningsValue`, `walletHint`
- **[docs]** `BACKEND_API.md` — задокументированы `GET/PATCH /settings` с `commissionRate`, таблица двух полей баланса медика
- `tsc --noEmit` = 0 ошибок (backend ✅, medic ✅)

## 2026-03-09 — web-medic: фото профиля медика

- **[web-medic]** `lib/api.ts` — добавлено поле `profilePhotoUrl` в интерфейс `Medic`; добавлена функция `medicApi.photo.upload(file)` → `POST /medics/profile-photo`
- **[web-medic]** `app/profile/page.tsx` — аватар теперь показывает `profilePhotoUrl` (если есть) или иконку; иконка 📷 открывает выбор файла; после загрузки профиль обновляется без перезагрузки страницы
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — SEO фиксы landing (JSON-LD image)

- **[landing]** `app/[lang]/layout.tsx` — JSON-LD `MedicalBusiness.image`: заменён несуществующий `/og.png` на `/${lang}/opengraph-image` (динамический генератор)
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Фиксы: галерея, env, уведомления, CORS, документация

- **[medic]** `app/(tabs)/profile.tsx` — при отказе от доступа к галерее: если `canAskAgain=false` показывается алерт с кнопкой "Открыть настройки" (`Linking.openSettings()`), иначе — обычный алерт
- **[mobile]** `constants/api.ts` — `API_BASE` читается из `EXPO_PUBLIC_API_BASE` env, fallback на Railway URL; добавлены `.env` и `.env.example`
- **[medic]** `constants/api.ts` — то же самое
- **[mobile]** `app/_layout.tsx` — Android notification channels: `order_updates` (HIGH, звук+вибро), `tracking_status` (LOW, тихий)
- **[medic]** `app/_layout.tsx` — Android notification channels: `new_orders` (MAX, bypassDnd), `order_updates` (HIGH), `tracking_status` (LOW)
- **[backend]** `main.ts` — CORS whitelist: добавлены `hamshirago.uz`, `app.hamshirago.uz`, `medic.hamshirago.uz`, `admin.hamshirago.uz`
- **[docs]** `STORE_PUBLISH.md` — создана инструкция по публикации в App Store и Google Play

## 2026-03-09 — Security & UX улучшения

- **[backend]** `admin.guard.ts` — B-NEW-1: замена `===` на `crypto.timingSafeEqual()` при проверке X-Admin-Secret (защита от timing-атаки)
- **[admin]** `pages/Dashboard.tsx` — isPaidMode бейдж в шапке: показывает текущий режим (платный/бесплатный), ссылка на `/settings`
- **[admin]** `src/main.tsx` — Sentry: добавлены `environment`, `release` (VITE_APP_VERSION), `beforeSend` (фильтр localhost), tracesSampleRate=0 в dev
- **[admin]** `.env.example`, `.env` — добавлен `VITE_APP_VERSION=1.0.0`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Этап 10: Переключатель "Платный режим" в admin

- **[admin]** `src/lib/api.ts` — добавлены `AppSettings` interface, `getSettings()`, `updateSettings()`
- **[admin]** `src/pages/Settings.tsx` — новая страница: toggle "Платный режим" с инфо-блоком (что изменится), статус-бейдж текущего режима
- **[admin]** `src/App.tsx` — маршрут `/settings` → `<Settings />`
- **[admin]** `src/components/AdminSidebar.tsx` — пункт "Настройки" с иконкой `Settings2`
- **[admin]** `i18n/ru.json`, `uz.json` — секция `settings.*` + ключ `nav.settings`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Этап 12: PostHog аналитика + Этап 13: Lighthouse оптимизация

- **[admin]** `src/main.tsx` — инициализация PostHog: `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST`, отключён в dev-режиме
- **[admin]** `src/App.tsx` — добавлен компонент `PageTracker` (useLocation + posthog.capture('$pageview') при смене маршрута)
- **[admin]** `.env.example`, `.env` — добавлены `VITE_POSTHOG_KEY` и `VITE_POSTHOG_HOST`
- **[web]** `app/layout.tsx` — `<link rel="preconnect">` и `<link rel="dns-prefetch">` для Railway API и Cloudinary
- **[web-medic]** `app/layout.tsx` — аналогичные preconnect/dns-prefetch hints
- **[web]** `next.config.ts` — добавлены: `compress: true`, `images.formats: ["avif","webp"]`, `images.remotePatterns: cloudinary`, `experimental.optimizePackageImports`
- **[web-medic]** `next.config.ts` — аналогичные оптимизации
- `npm run build` = 0 ошибок (admin ✅, web ✅, web-medic ✅)

## 2026-03-09 — Этап 7: Сплэш "by tezcode.ai" + Этап 8: Admin UZ-поля услуг

- **[web]** `components/SplashScreen.tsx` — добавлена строка "by tezcode.ai" под логотипом (малый шрифт, полупрозрачный)
- **[web-medic]** `components/SplashScreen.tsx` — аналогично web
- **[admin]** `src/components/SplashScreen.tsx` — создан новый компонент: логотип, "HamshiraGo", "Панель администратора", "by tezcode.ai", анимированные точки загрузки, fade-out через 2с
- **[admin]** `src/App.tsx` — `<SplashScreen />` добавлен в дерево компонентов
- **[admin]** `src/lib/api.ts` — добавлены поля `titleUz/descriptionUz/categoryUz` в `AdminService` и `ServiceFormData`; восстановлен недостающий экспорт `topupMedicWallet`
- **[admin]** `src/pages/Services.tsx` — форма разделена на 2 блока 🇷🇺/🇺🇿; таблица получила колонку "Название (UZ)"; `emptyForm` + `openEdit` обновлены для UZ-полей
- **[admin]** `src/i18n/ru.json`, `uz.json` — добавлены ключи `colTitleUz`, `labelTitleUz`, `labelDescUz`, `labelCategoryUz`
- `npm run build` = 0 ошибок (web ✅, web-medic ✅, admin ✅)

## 2026-03-08 — Landing: кнопка «Попробовать» + SEO-секция

- **[landing]** `i18n/translations.ts` — добавлены `hero.try`, `hero.tryWeb` (RU+UZ); полная секция `seo` (intro, who×6, procedures×4, faq×7, areas×10, cta) на русском и узбекском
- **[landing]** `components/Hero.tsx` — добавлена кнопка «Попробовать / Sinab ko'ring» с ссылкой `https://app.hamshirago.uz`, магнитный эффект, над store-кнопками
- **[landing]** `components/Download.tsx` — добавлена кнопка «Попробовать» в веб-секцию
- **[landing]** `components/SeoContent.tsx` — новый компонент: intro-абзац, 6 карточек «Кому подходит», 4 процедуры с ценами, 7 FAQ (accordion), 10 районов Ташкента, CTA-карточка → `app.hamshirago.uz`
- **[landing]** `app/[lang]/page.tsx` — `<SeoContent />` добавлен между Features и Download
- `npm run build` = 0 ошибок

## 2026-03-08 — Landing SEO-фиксы (OG-картинка + html lang)

- **[landing]** `app/layout.tsx` — упрощён до минимума (только импорт `globals.css`); `<html>/<body>/<ThemeProvider>` перенесены в lang-layout
- **[landing]** `app/[lang]/layout.tsx` — `LangLayout` теперь возвращает `<html lang={lang}>` + `<body>` + `<ThemeProvider>`: Google видит правильный lang для `/ru` и `/uz`
- **[landing]** OG URL исправлен: `/og.png` (несуществующий файл) → `${SITE_URL}/${lang}/opengraph-image` (динамический генератор); исправлено в `openGraph.images` и `twitter.images`
- **[landing]** `themeColor: "#0d9488"` вынесен в `export const viewport: Viewport` (Next.js 16 API)
- `npm run build` = 0 ошибок, 0 предупреждений

---

> Хронологический лог завершённых фич и исправлений.

---

## 2026-03-08 — Web: category filter + reorder + BUG 15

- **[web]** `app/page.tsx` — добавлен горизонтальный скролл с фильтром по категориям (chips), локализация категорий UZ через `CATEGORY_UZ`
- **[web]** `app/orders/page.tsx` — добавлена кнопка "Заказать снова" (reorder) для DONE/CANCELED заказов, переход на `/order/location?serviceId=...`
- **[web]** `lib/api.ts`, `app/order/confirm/page.tsx` — BUG 15: убраны лишние поля `serviceTitle` и `priceAmount` из `CreateOrderDto` (бэкенд их не принимал)
- **[web]** `i18n/ru.json`, `i18n/uz.json` — добавлены ключи `allCategories`, `reorder`

---

## 2026-03-08 — Admin i18n + PWA + логотип

- **[admin]** `i18n/ru.json`, `i18n/uz.json` — добавлены все недостающие ключи для всех страниц: dashboard, medics, orders, clients, services, verification, reports, common.downloadApp
- **[admin]** `pages/Dashboard.tsx`, `Medics.tsx`, `Orders.tsx`, `Clients.tsx`, `Services.tsx`, `Verification.tsx`, `Reports.tsx` — все строки переведены через `t()`, добавлен `useTranslation`
- **[admin]** `components/AdminLayout.tsx` — добавлен PWA install button (`NavbarInstallButton` + `usePWAInstall`)
- **[admin]** Logo — кастомный логотип заменён во всех проектах (admin sidebar, landing Navbar/Footer/Hero, web/web-medic SplashScreen/auth/header); favicon обновлён через `app/icon.png` и явный `<link rel="icon">` в layout.tsx
- `npm run build` = 0 TypeScript ошибок

---

## 2026-03-08 — Этап 14: конфигурация Store публикации

- **[mobile]** `app.json` — добавлены `ios.bundleIdentifier: com.hamshirago.client`, `android.package`, `versionCode: 1`, `buildNumber: 1`, `owner`, `extra.eas.projectId` (placeholder)
- **[mobile]** `eas.json` — создан: профили `development` / `preview` (APK) / `production` (AAB, autoIncrement), `submit.production` с секциями android + ios
- **[medic]** `eas.json` — обновлён: добавлены `buildType`, `env`, `submit.production`
- Ручные шаги задокументированы в `tasks.md` (EAS init, credentials, сторы, OTA, скриншоты)

## 2026-03-08 — Этап 11: Telegram deep link + webhook + канал

- **[backend]** `telegram/telegram-bot.service.ts` — обработчик `/start {medicId}`: автоматически привязывает `chat_id` к медику, отправляет welcome-сообщение + ссылку на канал (`TELEGRAM_CHANNEL_LINK` env)
- **[backend]** `telegram/telegram-bot.controller.ts` — `POST /telegram/webhook` (публичный, Telegram присылает обновления)
- **[backend]** `telegram/telegram-bot.module.ts` — модуль, зарегистрирован в `AppModule`; webhook регистрируется автоматически при старте (`BACKEND_URL` env → `setWebhook`)
- **[medic]** `app/(tabs)/profile.tsx` — кнопка "Подключить" открывает `tg://resolve?domain=hamshirago_medic_bot&start={medicId}` (fallback: https); бот получает ID и сам привязывает аккаунт
- **[medic]** `app/(tabs)/profile.tsx` — баннер канала "Вы часть команды HamshiraGo!" → `t.me/hamshirago_medics`, виден когда Telegram подключён
- `tsc --noEmit` = 0 ошибок (backend + medic)
- **Env переменные для Railway**: `BACKEND_URL` (напр. `https://hamshirago-api.railway.app`), `TELEGRAM_CHANNEL_LINK` (ссылка на канал)

## 2026-03-08 — Этап 10: платный режим (backend + medic)

- **[backend]** `app-settings/` — новый модуль: entity `app_settings` (singleton row), `AppSettingsService.isPaidMode()`, `GET /settings` (публичный), `PATCH /admin/settings` (AdminGuard)
- **[backend]** `orders.service.ts` — `acceptOrder`: если `isPaidMode=true`, проверяет `balance >= platformFee`, списывает комиссию, иначе 402 INSUFFICIENT_WALLET
- **[backend]** `orders.service.ts` — DONE: если `isPaidMode=true`, кредитует полный `netPrice` (комиссия уже списана при accept); иначе `netPrice - fee` как раньше
- **[medic]** `app/(tabs)/profile.tsx` — баланс кошелька вынесен в отдельную карточку, всегда виден независимо от рейтинга
- `tsc --noEmit` = 0 ошибок (backend + medic)

## 2026-03-08 — Этап 7: сплэш-экран mobile + medic

- **[mobile]** `components/SplashOverlay.tsx` — кастомный сплэш: логотип (icon.png), "HamshiraGo", "by tezcode.ai"; фон `#f8fafc`
- **[medic]** `components/SplashOverlay.tsx` — аналог, фон `#0d9488` (зелёный), текст белый
- **[mobile]** `app/_layout.tsx` — после загрузки шрифтов нативный сплэш скрывается, показывается `SplashOverlay` на 1.5s, затем приложение
- **[medic]** `app/_layout.tsx` — та же логика
- `tsc --noEmit` = 0 ошибок

## 2026-03-08 — Этап 12: POST /client-errors (backend)

- **[backend]** `client-errors/entities/client-error.entity.ts` — новая таблица `client_errors` (userId, appType, screen, message, stacktrace, meta)
- **[backend]** `client-errors/dto/create-client-error.dto.ts` — DTO с валидацией (все поля опциональны)
- **[backend]** `client-errors/client-errors.service.ts` — метод `save(dto)`
- **[backend]** `client-errors/client-errors.controller.ts` — `POST /client-errors` публичный, без авторизации, throttle 20 req/min
- **[backend]** `client-errors/client-errors.module.ts` — модуль, зарегистрирован в `AppModule`
- `tsc --noEmit` = 0 ошибок

---

## 2026-03-08 — Этап 9: пуш-уведомления + персистентное уведомление

- **[backend]** `orders.service.ts` — добавлены `MEDIC_PUSH_MESSAGES` + метод `notifyMedic()`: медик получает push при отмене клиентом (CANCELED) и подтверждении DONE
- **[mobile]** `app/order/track.tsx` — персистентное локальное уведомление при активном заказе: появляется при уходе в фон, обновляется при смене статуса, исчезает при DONE/CANCELED. Использует `AppState` + `expo-notifications` с фиксированным `identifier`
- **[medic]** `app/order/[id].tsx` — персистентное локальное уведомление при активном заказе (аналог mobile); добавлен WebSocket-слушатель `order_status` — медик видит статус CANCELED в реальном времени, если клиент отменил заказ
- `tsc --noEmit` = 0 ошибок (backend + mobile + medic)

---

## 2026-03-08 — Этап 8: i18n услуг в mobile

- **[mobile]** `app/service/[id].tsx` — добавлен `useLanguage()`, показывает `titleUz`/`descriptionUz` если язык UZ; все строки интерфейса через `useTranslation()` (service.cost, service.duration, service.order, service.notFound)
- **[mobile]** `app/order/confirm.tsx` — добавлен `useLanguage()`, `service.title` → `titleUz` если UZ; все строки через i18n (confirm.title, confirm.address, confirm.phone, confirm.duration, confirm.total, confirm.submit, confirm.cancel, confirm.discountFirst, confirm.basePrice)
- **[mobile]** `components/ServiceCard.tsx` — "мин" → `t('service.min')` (RU: "мин" / UZ: "daq")
- **[mobile]** `i18n/ru.json` + `i18n/uz.json` — добавлены секции `service` и `confirm`
- `tsc --noEmit` = 0 ошибок

---

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

---

## 2026-03-08 — Этап 5: баги + кастомные модалки

- **[medic]** BUG-A1: Статы профиля переведены через i18n — `profile.statExperience/statCompleted/statRating/statBalance` (ru + uz) вместо хардкода на русском (`medic/app/(tabs)/profile.tsx`, `medic/i18n/*.json`)
- **[mobile]** BUG-A2: UI звёзд при оценке заказа — `starsRow` теперь `justifyContent: center` + `gap: 12`; убран `marginTop: -8` у hint; в блоке "Ваша оценка" звёзды выше рейтинга отображаются `star-o` (outline) а не закрашенными (`mobile/app/order/track.tsx`)
- **[mobile/medic]** Создан компонент `AppModal` — кастомная замена системного `Alert.alert` (анимированный modal, кнопки cancel/destructive/default, overlay tap для закрытия) (`mobile/components/AppModal.tsx`, `medic/components/AppModal.tsx`)
- **[mobile]** `AppModal` внедрён: logout confirm в профиле клиента, отмена заказа в track.tsx
- **[medic]** `AppModal` внедрён: logout confirm, Telegram disconnect confirm, подтверждение принятия заказа
- **[medic]** i18n: добавлен ключ `dispatch.confirmAccept` (ru + uz)
- `tsc --noEmit` = 0 ошибок (mobile + medic)

---

## 2026-03-07 — Wallet system портирован в web-medic

- **[web-medic]** `lib/api.ts` — добавлен обработчик 402 INSUFFICIENT_WALLET: создаёт Error с полями `required` и `current`
- **[web-medic]** `app/page.tsx` — добавлены состояние `walletModal`, обработка в `acceptOrder` и `acceptInvite`, модальное окно с текущим балансом и требуемой суммой
- **[web-medic]** `i18n/ru.json`, `i18n/uz.json` — добавлена секция `wallet.*` с ключами `insufficientTitle`, `insufficientDesc`, `current`, `required`, `contactAdmin`, `close`

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
