# HamshiraGo — Активные задачи

> Обновляется при каждом изменении. Выполненные задачи → `done.md`.
> **Этапы 1–18 выполнены** — подробности в `done.md`.
> **Полный аудит проведён 2026-03-28** — backend (41), mobile (25), medic (26).
> **Аудит багов 2026-04-04** — mobile (28 issues), admin (40+ issues).
> **Playwright-аудит web-medic 2026-04-11** — 4 бага найдено, см. ниже.
> **Аудит бизнес-модели 2026-04-13** — 9 критических/высоких пробелов, см. ниже.
> **Аудит UX 2026-04-14** — 6 задач по Salomat AI, клиники, врачи.

---

## 📋 UX-задачи (аудит 2026-04-14)

### Диёр — Web

- [ ] **UX-I18N-1** — 🔴 HIGH — i18n: добавить переводы (ru/uz) на все страницы без локализации. Приоритет: 1) главная, заказы, location, confirm; 2) профиль, медкарта, salomat; 3) избранное, реферал, отзывы. Компоненты: SplashScreen, InstallPrompt, PushPermissionPrompt, VoiceAssistant — `web/i18n/ru.json`, `web/i18n/uz.json`, все страницы из списка

- [ ] **UX-WEB-1** — 🟡 HIGH — Salomat AI: сохранять историю чата в `localStorage`. При возврате на страницу — восстанавливать диалог. Добавить кнопку "Очистить чат" — `web/app/salomat/page.tsx`
- [ ] **UX-WEB-2** — 🟡 HIGH — Salomat AI: адаптивный layout для десктопа. Сейчас `maxWidth: 480` — узкая мобильная колонка. На ≥768px: двухколоночный layout (инфо-панель слева, чат справа) — `web/app/salomat/page.tsx`
- [ ] **UX-WEB-3** — 🟡 HIGH — Salomat AI: голосовой ввод внутри чата. Кнопка микрофона рядом с полем ввода — запись → STT → отправка как текст. Использовать готовый `VoiceAssistant` компонент — `web/app/salomat/page.tsx`, `web/components/VoiceAssistant.tsx`

### Абубакир — Backend

- [ ] **UX-BE-2** — 🔴 CRITICAL — Логика назначения консультации: если врач принадлежит клинике → назначает CEO этой клиники (через `/clinic/appointments`); если врач независимый → назначает супер-админ (через `/consultations/admin/:id`). Сейчас все консультации падают в общую очередь без разделения — `backend/src/consultations/consultations.service.ts`, `backend/src/clinic/clinic.service.ts`

- [ ] **UX-BE-1** — 🟡 HIGH — Salomat AI: инжектировать список активных врачей компании в system prompt. AI должен знать имена, специализации, цены врачей и рекомендовать конкретного — `backend/src/consultations/`, `backend/src/voice-agent/voice-agent.service.ts`

### Диёр — Web (после UX-BE-1)

- [ ] **UX-WEB-4** — 🟡 HIGH — Salomat AI: карточка рекомендации показывает конкретного врача (фото, имя, специализация) с кнопкой "Записаться к [имя]" — `web/app/salomat/page.tsx`

### Жафар — Web

- [ ] **UX-CLIN-1** — 🟡 HIGH — Страница клиник `/clinics`: два режима — список + карта (Leaflet). Каждая карточка клиники показывает: название, адрес, телефон, кнопки "Открыть в Яндекс Картах" и "Открыть в Google Maps" (deep link по координатам). На карте маркеры клиник, клик → попап с телефоном и кнопками навигации. Реальные данные после BIZ-BE-4 — `web/app/clinics/page.tsx`
- [ ] **UX-DOC-1** — 🟡 HIGH — Страница врачей в web `/doctors`: реальные данные + карточки с фото, специализацией, ценой, рейтингом, кнопкой "Записаться" — `web/app/doctors/page.tsx`

### Диёр — Admin

- [ ] **UX-CLIN-2** — 🟡 HIGH — Admin форма клиники: пикер координат. Leaflet карта (уже в проекте) — клик устанавливает `lat`/`lng`. Кнопка "Моё местоположение" (`navigator.geolocation`). Поля `lat`/`lng` уже есть в entity — `admin/src/pages/Companies.tsx`
- [ ] **UX-DOC-2** — 🟡 HIGH — Admin форма врача: пикер координат (кабинет/клиника на карте) аналогично UX-CLIN-2 — `admin/src/pages/Doctors.tsx`

---

## 🔴 CRITICAL — Бизнес-модель (аудит 2026-04-13)

### Абубакир — Backend + Mobile

- [ ] **BIZ-BE-1** — 🔴 CRITICAL — Оплата консультации: нет payment flow при бронировании врача. Добавить `POST /payments/consultation/:id/initiate` (Payme/Click). `doctor.pricePerConsultation` есть, но клиент получает консультацию бесплатно — `backend/src/consultations/`, `backend/src/payments/`
- [ ] **BIZ-BE-2** — 🔴 CRITICAL — Медик: вывод средств — нет endpoint `POST /medics/me/withdrawal-request` и нет admin-endpoint для одобрения/отклонения выплат. Медик не может вывести баланс — `backend/src/medics/`
- [ ] **BIZ-BE-3** — 🔴 CRITICAL — Рейтинг врача после консультации: нет `POST /consultations/:id/rate`. `doctor.rating` в БД есть, но никогда не обновляется — `backend/src/consultations/`
- [ ] **BIZ-BE-4** — 🟡 HIGH — Публичный `GET /companies` (без AdminGuard) — нужен для страницы клиник на web/. Сейчас только `/admin/companies` с AdminGuard — `backend/src/clinic/clinic.controller.ts`
- [ ] **BIZ-MOB-1** — 🔴 CRITICAL — Mobile: UI оплаты консультации (после BIZ-BE-1) — `mobile/app/consultation.tsx`
- [ ] **BIZ-MOB-2** — 🔴 CRITICAL — Mobile: UI рейтинга врача после консультации (после BIZ-BE-3) — `mobile/app/consultations.tsx`

### Жафар — Clinic + Web-Medic

- [ ] **BIZ-CLIN-1** — 🟡 HIGH — Clinic BookingModal: онлайн-оплата через Payme/Click. Тип `ONLINE` выбирается но ничего не происходит — `web-medic/components/clinic/BookingModal.tsx`
- [x] **BIZ-CLIN-2** — DONE 2026-04-14 (Жафар) — Онлайн/офлайн toggle для врача в web-medic: кнопка в header консультаций, backend DTO + service обновлены — `web-medic/app/doctor/consultations/page.tsx`, `backend/src/doctors/`
- [x] **BIZ-CLIN-3** — DONE 2026-04-14 (Жафар) — Кнопка "Запросить выплату" + модалка с суммой и номером карты добавлены в wallet. UI готов, ждёт backend BIZ-BE-2 — `web-medic/app/wallet/page.tsx`, `web-medic/lib/api.ts`

### Диёр — Web + Admin

- [ ] **BIZ-WEB-1** — 🔴 CRITICAL — Web: UI рейтинга врача после консультации (COMPLETED). Нет кнопки "Оставить отзыв" (после BIZ-BE-3) — `web/app/consultations/page.tsx`
- [x] **BIZ-WEB-2** — DONE 2026-04-13 — Реферальный код при web-регистрации — `web/app/auth/page.tsx`
- [ ] **BIZ-WEB-3** — 🟡 HIGH — Реальные данные на странице клиник (после BIZ-BE-4) — `web/app/clinics/page.tsx`, `web/app/clinics/[id]/page.tsx`
- [ ] **BIZ-WEB-4** — 🟡 HIGH — Web: UI оплаты консультации (после BIZ-BE-1). Нет payment step при бронировании врача — `web/app/consultation/page.tsx`
- [x] **BIZ-WEB-5** — DONE (уже было реализовано) — `web/app/courses/page.tsx`
- [x] **BIZ-WEB-6** — DONE 2026-04-13 — Push permission UI — `web/components/PushPermissionPrompt.tsx`
- [x] **BIZ-ADM-1** — DONE 2026-04-13 — Admin: страница управления выплатами — `admin/src/pages/Payouts.tsx` (ждёт BIZ-BE-2 для данных)

---

## ⚙️ DevOps / Railway ENV — аудит 2026-04-14

### Срочно поправить

- [ ] **ENV-1** — 🔴 CRITICAL — `NODE_ENV="development"` на Railway → Click IP-whitelist отключён (риск мошенничества), stacktrace'ы видны в ответах. Поменять на `"production"` — Railway → backend → Variables

### Отсутствующие переменные

- [ ] **ENV-2** — 🔴 HIGH — `OPENAI_API_KEY` не задан → Voice Agent TTS (озвучка ответов) не работает, только текст — Railway → backend → Variables
- [ ] **ENV-3** — 🟠 HIGH — `PAYME_MERCHANT_ID` + `PAYME_MERCHANT_KEY` не заданы → оплата через Payme недоступна
- [ ] **ENV-4** — 🟠 HIGH — `CLICK_MERCHANT_ID` + `CLICK_SERVICE_ID` + `CLICK_SECRET_KEY` не заданы → оплата через Click недоступна
- [ ] **ENV-5** — 🟠 MEDIUM — `TELEGRAM_ADMIN_CHAT_ID` не задан → Telegram-уведомления администратору не приходят
- [ ] **ENV-6** — 🟠 MEDIUM — `ENCRYPTION_KEY` (≥32 символа) не задан → шифрование медицинских данных отключено, данные хранятся открытым текстом
- [ ] **ENV-7** — 🟡 LOW — `OSRM_URL` не задан → маршрутизация для медиков на карте не работает

---

## 🔔 Push-уведомления — полный охват (аудит 2026-04-14)

### Абубакир — Backend

- [ ] **PUSH-BE-1** — 🔴 HIGH — Добавить тип `'doctor'` в `WebPushService`. Сейчас поддерживаются только `'client'` и `'medic'`. Добавить `POST /doctors/web-push-subscription` и `DELETE /doctors/web-push-subscription` — `backend/src/realtime/web-push.service.ts`, `backend/src/doctors/doctors.controller.ts`
- [ ] **PUSH-BE-2** — 🔴 HIGH — Слать web push врачу при новой консультации (`PENDING`). Сейчас только Socket.IO (`emitNewConsultation`), пуш не отправляется — `backend/src/consultations/consultations.service.ts`
- [ ] **PUSH-BE-3** — 🟠 MEDIUM — Слать web push клинике (CEO) при новом лиде от Salomat AI. Сейчас только Telegram — `backend/src/clinic/clinic.service.ts`

### Жафар — Web-Medic (врач)

- [ ] **PUSH-WM-1** — 🔴 HIGH — Врачи: добавить web push подписку. `WebPushInit` в web-medic шлёт на `/medics/web-push-subscription` — нужен отдельный `/doctors/web-push-subscription` (после PUSH-BE-1). Добавить `PushPermissionPrompt` для врачей — `web-medic/lib/webPush.ts`, `web-medic/components/WebPushInit.tsx`
- [x] **PUSH-WM-2** — DONE 2026-04-14 (Жафар) — Медики: заменён авто-запрос на `PushPermissionPrompt` (bottom-sheet через 3с) — `web-medic/components/WebPushInit.tsx`, `web-medic/components/PushPermissionPrompt.tsx`, `web-medic/app/layout.tsx`

---

## ⚡ Реактивный профиль — мгновенное обновление без рендера (аудит 2026-04-14)

> Сейчас профиль пишет в `localStorage`, но хедер и другие компоненты читают оттуда только при первом монтировании. После сохранения изменений интерфейс не обновляется пока не перезагрузить страницу.
> Решение: глобальный React Context для каждого типа пользователя. Все компоненты подписываются на контекст — обновление в одном месте = мгновенное отражение везде.

### Диёр — Web (клиент)

- [ ] **UX-RT-1** — 🔴 HIGH — Создать `web/context/UserContext.tsx`: глобальное состояние клиента (`id`, `name`, `phone`, `avatarUrl`). Обернуть `layout.tsx`. Хедер главной страницы (инициалы), страница профиля — подписать на контекст. При сохранении профиля → `setUser()` → всё обновляется мгновенно без перезагрузки — `web/context/UserContext.tsx`, `web/app/layout.tsx`, `web/app/profile/page.tsx`, `web/app/page.tsx`

### Жафар — Web-Medic (врач + клиника)


---

## 🌐 Лендинг + Web — Download Flow (аудит 2026-04-14)

### Диёр — Landing

- [ ] **UX-LAND-1** — 🔴 HIGH — Кнопки "App Store" и "Google Play" в Hero ведут на `#download`. Нужно заменить на модалку/экран с двумя вариантами: **"Скачать приложение"** (ссылки на App Store / Google Play) и **"Использовать веб-версию"** (переход на `https://app.hamshirago.uz`). Клиент должен сам выбирать — `landing/components/Hero.tsx`

### Диёр — Web

- [ ] **UX-LAND-2** — 🟠 MEDIUM — На главной странице web-приложения добавить ненавязчивый баннер/плашку "Доступно мобильное приложение" с кнопками App Store / Google Play. Показывать только на мобильных устройствах (`userAgent` или `window.innerWidth < 768`) и только если пользователь ещё не скачал (снуз в `localStorage`) — `web/app/page.tsx` или отдельный компонент `web/components/AppDownloadBanner.tsx`

---

## 👤 Клиентский опыт — Web (аудит 2026-04-14)

> Задачи со стороны пользователя: что мешает нормально пользоваться продуктом.

### Диёр — Web

- [ ] **UX-CLIENT-1** — 🔴 CRITICAL — Нет удаления аккаунта. Обязательно для App Store / Google Play и GDPR. Добавить кнопку в профиль + `DELETE /auth/account` на бэкенде — `web/app/profile/page.tsx`, `backend/src/auth/`
- [ ] **UX-CLIENT-2** — 🔴 HIGH — После завершённой консультации нет кнопки "Оценить врача". Клиент не может оставить отзыв — `web/app/consultations/page.tsx` (после BIZ-BE-3)
- [ ] **UX-CLIENT-3** — 🟠 HIGH — Страница `/consultation` не показывает цену консультации и не ведёт к оплате. Клиент видит форму, нажимает "Записаться" — и всё. Непонятно сколько стоит и как платить — `web/app/consultation/page.tsx` (после BIZ-BE-1)
- [ ] **UX-CLIENT-4** — 🟠 HIGH — Нет онбординга для нового пользователя на web. Клиент после регистрации оказывается на главной без объяснений что это и как заказать — `web/app/onboarding/` (добавить шаги: как работает сервис, первый заказ)
- [ ] **UX-CLIENT-5** — 🟠 MEDIUM — Видеозвонок: страница `/video-call` есть, но нет кнопки входа в звонок из карточки консультации. Клиент не знает как войти — `web/app/consultations/page.tsx`, `web/app/video-call/page.tsx`
- [ ] **UX-CLIENT-6** — 🟠 MEDIUM — Рецепт: после получения рецепта от врача непонятен следующий шаг. Нет CTA "Оформить заказ по рецепту" — `web/app/prescriptions/page.tsx`
- [ ] **UX-CLIENT-7** — 🟡 MEDIUM — Профиль: нельзя изменить номер телефона и нет аватара. Только имя редактируется — `web/app/profile/page.tsx`

---

## 🏥 Партнёрский опыт — Web-Medic (аудит 2026-04-14)

> Задачи со стороны клиник и врачей: что мешает нормально работать с платформой.

### Жафар — Web-Medic (клиники)

- [ ] **UX-PARTNER-1** — 🔴 CRITICAL — BookingModal: тип оплаты `ONLINE` выбирается, но платёж не инициируется. Клиника принимает запись, клиент не платит — `web-medic/components/clinic/BookingModal.tsx` (после BIZ-BE решения)
- [ ] **UX-PARTNER-2** — 🟠 HIGH — Нет уведомления клинике о новом лиде от Salomat AI. Лид приходит тихо — клиника не знает. Нужен Telegram-уведомление или email при `createLead` — `backend/src/clinic/clinic.service.ts`
- [x] **UX-PARTNER-3** — DONE 2026-04-14 (Жафар) — Онлайн/офлайн toggle для врача — решено вместе с BIZ-CLIN-2
- [ ] **UX-PARTNER-4** — 🟠 MEDIUM — Нет онбординга для новой клиники. После регистрации — пустой дашборд без инструкций: как добавить врача, создать расписание, подключить сервисы — `web-medic/app/clinic/dashboard/page.tsx`
- [ ] **UX-PARTNER-5** — 🟡 MEDIUM — Clinic dashboard: нет экспорта данных (записи, лиды) в CSV/Excel. CEO клиники не может выгрузить отчёт — `web-medic/app/clinic/dashboard/`

### Жафар — Web-Medic (врачи)

- [x] **UX-PARTNER-6** — DONE 2026-04-14 (Жафар) — Профиль врача: поля `pricePerConsultation` + `bio` добавлены в форму и display — `web-medic/app/doctor/profile/page.tsx`, `web-medic/lib/api.ts`
- [ ] **UX-PARTNER-7** — 🟠 HIGH — Нет push/Telegram-уведомления врачу о новой консультации. Врач узнаёт только если сам зайдёт в `/consultations` — `web-medic/app/doctor/consultations/page.tsx` + backend
- [ ] **UX-PARTNER-8** — 🟠 MEDIUM — Расписание: нет шаблонов повторяющихся слотов. Врач каждый день вручную создаёт одни и те же слоты (напр. Пн–Пт 09:00–17:00 каждые 30 мин) — `web-medic/app/doctor/schedule/page.tsx`
- [x] **UX-PARTNER-9** — DONE 2026-04-14 (Жафар) — Профиль врача: поле "О себе / Биография" добавлено вместе с UX-PARTNER-6 — `web-medic/app/doctor/profile/page.tsx`

---

## 🆕 Жафар — Sprint 2026-04-14

- [x] **JF-FIX-1** — DONE 2026-04-14 (Жафар) — Рецепт пациента: real API вместо mock + print/PDF страница (`web/app/patient/prescriptions/[id]/page.tsx`, `print/page.tsx`)
- [x] **JF-FIX-2** — DONE 2026-04-14 (Жафар) — Доктор: кнопка «Сформировать рецепт (PDF)» вместо alert-заглушки + print страница (`web-medic/app/doctor/prescription/print/page.tsx`)
- [x] **JF-UI-1** — DONE 2026-04-14 (Жафар) — Фильтр услуг по категории в профиле клиники (`web/app/clinics/[id]/page.tsx`) — pill-табы Все/Консультация/Лаборатория/Диагностика/Процедуры
- [x] **JF-UI-2** — DONE 2026-04-14 (Жафар) — Редизайн страницы списка клиник: hero, floating search, card grid, skeleton, empty state (`web/app/clinics/page.tsx`)
- [x] **JF-UI-3** — DONE 2026-04-14 (Жафар) — Редизайн страницы пациента: pill-табы с иконками, visit cards, prescription cards, medcard placeholder, skeleton (`web/app/patient/page.tsx`)
- [x] **JF-BUG-1** — FIXED 2026-04-14 (Жафар) — Список рецептов пациента: MOCK → real API `GET /patient/prescriptions`, skeleton, status badge, empty/error state (`web/app/patient/prescriptions/page.tsx`)
- [x] **JF-UI-4** — DONE 2026-04-14 (Жафар) — Редизайн профиля клиники: skeleton, doctor cards + specialization, service color badges, price в сум, floating tel CTA (`web/app/clinics/[id]/page.tsx`)
- [x] **JF-UI-5** — DONE 2026-04-14 (Жафар) — Редизайн страницы регистратуры: header, stat-strip, appointment cards с color accent, AI leads sidebar, shimmer skeleton (`web-medic/app/clinic/reception/page.tsx`)

---

## 🆕 Reception UI 2026-04-12

- [x] **WM-FEAT-1** — DONE 2026-04-12 (Жафар) — Reception portal: переключатель «Список / Календарь» (дневной view)

---

## 🐛 Баги — Playwright аудит web-medic 2026-04-11

- [x] **WM-BUG-1** — FIXED 2026-04-12 (Жафар) — onboarding redirect убран с `/auth`
- [x] **WM-BUG-2** — FIXED 2026-04-12 (Жафар) — `formatPhone()` обрабатывает дубликат `998998` при вставке
- [x] **WM-BUG-3** — FIXED 2026-04-12 (Жафар) — greeting перенесён в `useEffect`, hydration error убран

---

## 🔴 CRITICAL — Аудит 2026-04-04 (Mobile)

> Паттерн `apiFetch(url, token, options)` — неверная сигнатура. Правильно: `apiFetch(url, { token, method, body })`.
> Затронуты: prescription.tsx, prescriptions.tsx, nps.tsx, video-call.tsx — **экраны не работают**.

- [x] **MOB-BUG-1** — CRITICAL — `prescription.tsx:57` — apiFetch вызывается с 3 аргументами → запрос без auth, `res.json()` крашит (apiFetch возвращает parsed data, не Response)
- [x] **MOB-BUG-2** — CRITICAL — `prescription.tsx:100,144` — confirm и cancel тоже с 3 аргументами → не работают
- [x] **MOB-BUG-3** — CRITICAL — `prescriptions.tsx:52` — список назначений: тот же баг с apiFetch → экран крашит
- [x] **MOB-BUG-4** — CRITICAL — `nps.tsx:44` — отправка NPS: 3 аргумента + `res.ok` на parsed data → не работает
- [x] **MOB-BUG-5** — CRITICAL — `video-call.tsx:54` — early return до hooks → нарушение Rules of Hooks, React crash
- [x] **MOB-BUG-6** — HIGH — `video-call.tsx:77,105` — apiFetch с 3 аргументами → звонки не работают
- [x] **MOB-BUG-7** — HIGH — `order/confirm.tsx:158` — promoId не отправляется на backend → промо не отслеживается
- [x] **MOB-BUG-8** — HIGH — `profile.tsx:139` — после save name user object в AuthContext не обновляется → старое имя до рестарта
- [x] **MOB-BUG-9** — MEDIUM — `order/chat.tsx:79` — текст сообщения очищается до подтверждения отправки → потеря при ошибке
- [x] **MOB-BUG-10** — MEDIUM — `order/confirm.tsx:109` — subscription discount отображается но не применяется к finalPrice
- [x] **MOB-BUG-11** — MEDIUM — `order/confirm.tsx:264` — TextInput не импортирован → crash при открытии промо-кода
- [x] **MOB-BUG-12** — MEDIUM — `order/confirm.tsx:267` — ввод в промо поле сбрасывает уже применённую скидку
- [x] **MOB-BUG-13** — MEDIUM — `video-call.tsx:151` — mic/cam toggle меняет иконку но не мутит реально (не wired к LiveKit)
- [x] **MOB-BUG-14** — MEDIUM — `consultations.tsx:178` — кнопка "Позвонить" видна для PENDING (врач ещё не принял)
- [x] **MOB-BUG-15** — MEDIUM — `_layout.tsx:160` — NPS check гонится с auth redirect → navigation glitch

## ✅ Аудит 2026-04-04 (Admin) — ВСЁ ИСПРАВЛЕНО 2026-04-05

- [x] **ADM-BUG-1** — FIXED — revenue грузится один раз при монтировании (`loadRevenue`), не каждые 30с
- [x] **ADM-BUG-2** — FIXED — timezone fix (`toLocaleDateString("sv")`), лейбл "В процессе сейчас"
- [x] **ADM-BUG-3** — FIXED — поиск грузит до 1000 заказов (10 страниц × 100) параллельно
- [x] **ADM-BUG-4** — FIXED — Analytics грузит только 90 дней, останавливается по cutoff
- [x] **ADM-BUG-5** — FIXED — Reports грузит только DONE заказы начиная с даты `from`
- [x] **ADM-BUG-6** — FIXED — Medics грузит все страницы параллельно
- [x] **ADM-BUG-7** — FIXED — `isMounted` ref предотвращает двойную загрузку
- [x] **ADM-BUG-8** — FIXED — `min={0}` + `Math.max(0, ...)` на price input
- [x] **ADM-BUG-9** — FIXED — `(clientId ?? "").slice(0, 8)` в двух местах
- [x] **ADM-BUG-10** — FIXED — `alert()` заменён на `toast.error()`
- [x] **ADM-BUG-11** — FIXED — `onValueCommit` вместо `onValueChange` — запрос только при отпускании
- [x] **ADM-BUG-12** — FIXED — поиск грузит до 500 ошибок (5 страниц × 100)
- [x] **ADM-BUG-13** — FIXED — base64url → base64 конвертация перед `atob`
- [x] **ADM-BUG-14** — FIXED — custom event `admin:unauthorized` + `useNavigate` в AdminLayout

## 🟡 Medic app — не хватает (Абубакир — mobile)

- [x] **MED-MISS-1** — Нет inline edit name в профиле (в отличие от mobile)
- [x] **MED-MISS-2** — Нет чата в заказе (medic side) — клиент пишет, медик не видит
- [x] **MED-REDESIGN-1** — Redesign medic app: Clinical Sanctuary design system (auth, onboarding, language-picker, tabs, profile)
- [x] **MED-REDESIGN-2** — Redesign medic sub-screens: order detail, chat, verification, work-zone, schedule, reviews, doctor-tabs, doctor-consultation

---

## 📋 Задачи

- [x] **ADM-AI-1** — AI Ассистент страница (чат + сводка проблем) — `admin/src/pages/AiChat.tsx`
- [x] **MOB-FEAT-1** — ETA display на экране трекинга заказа — `mobile/app/order/track.tsx`, `mobile/hooks/useOrderTracking.ts`
- [x] **MED-FEAT-1** — Photo before/after в деталях заказа медика — `medic/app/order/[id].tsx`
- [x] **MED-FEAT-2** — Экран расписания медика (ish jadvali) — `medic/app/schedule.tsx`, `medic/app/(tabs)/profile.tsx`
- [x] **MOB-FEAT-2** — Multi-service selection на главном экране — `mobile/app/(tabs)/index.tsx`, `mobile/components/ServiceCard.tsx`, `mobile/app/order/confirm.tsx`

### 🔵 V5 Backend — DONE (Абубакир, 2026-04-09)

- [x] **V5-BE-1** — Doctor Auth: register, login, JWT role:"doctor", profile, documents, admin verify/block — `backend/src/doctors/`
- [x] **V5-BE-2** — DoctorAuthGuard + @DoctorId() — `backend/src/auth/guards/doctor-auth.guard.ts`
- [x] **V5-BE-3** — Doctor consultation endpoints: pending, accept, decline, complete, prescribe — `backend/src/consultations/`
- [x] **V5-BE-4** — Doctor WebSocket room + Push + Telegram уведомления
- [x] **V5-BE-5** — Voice Agent module: STT (Groq Whisper), LLM (Claude Haiku), session management — `backend/src/voice-agent/`
- [x] **V5-BE-6** — Voice Agent admin: sessions list, stats, KPI — `backend/src/voice-agent/`
- [x] **V5-BE-7** — DoctorSlot entity + CRUD + auto-booking при консультации — `backend/src/doctors/`
- [x] **V5-BE-8** — TTS placeholder (включить когда будет OPENAI_API_KEY)
- [x] **V5-BE-FIX** — Circular dependency fix: ConsultationsModule ↔ OrdersModule

### 🟡 V5 Frontend — Диёр (web-medic, web, admin)

> Backend API готов. Endpoints задокументированы ниже. Полный план: `docs/V5_PLAN.md`

#### V5-D-1. Doctor role в web-medic (приоритет!) ✅ DONE 2026-04-09
- [x] При login определять role из JWT (`medic` или `doctor`), показывать разный sidebar
- [x] **Doctor sidebar:** Консультации, Расписание, Рецепты, Профиль
- [x] `web-medic/app/doctor/consultations/page.tsx` — список (pending/all), кнопки Принять/Отклонить
- [x] `web-medic/app/doctor/consultation/[id]/page.tsx` — детали + видеозвонок LiveKit + завершение с notes
- [x] `web-medic/app/doctor/prescriptions/page.tsx` — выписанные рецепты
- [x] `web-medic/app/doctor/profile/page.tsx` — профиль + inline edit name/specialization

#### V5-D-2. Расписание врача в web-medic ✅ DONE 2026-04-09
- [x] `web-medic/app/doctor/schedule/page.tsx` — календарь + создание слотов + просмотр занятых

#### V5-D-3. Выбор времени в web/ (клиент) ✅ DONE 2026-04-09
- [x] `web/components/SlotPicker.tsx` — 7-дневный picker + сетка слотов
- [x] `web/app/consultation/page.tsx` — интегрирован SlotPicker, slotId передаётся при бронировании

#### V5-D-4. Web Voice Agent (web/) ✅ DONE 2026-04-09
- [x] `web/app/voice-agent/page.tsx` — страница с микрофоном, MediaRecorder → webm
- [x] `web/components/VoiceAssistant.tsx` — компонент: запись, transcribe, chat, TTS, история
- [x] CSS анимации: pulse (красный) при записи, wave (teal) при воспроизведении
- [x] Recommendation → кнопки: "К врачу" → `/doctors`, "Медсестра" → `/order/location`
- [x] Кнопка "Голосовой ассистент" на главной странице (баннер)

#### V5-D-5. Admin: Голосовой агент (admin/) ✅ DONE 2026-04-09
- [x] `admin/src/pages/VoiceAgent.tsx` — KPI карточки + таблица сессий с фильтрами + модал с историей
- [x] `admin/src/lib/api.ts` — getVoiceAgentStats, getVoiceSessions, getVoiceSession
- [x] AdminSidebar — добавлен "Голосовой агент" (Mic), роут `/voice-agent` в App.tsx

#### V5-D-6. Doctor auth в admin/ (управление врачами) ✅ DONE 2026-04-09
- [x] `admin/src/pages/DoctorAccounts.tsx` — список + фильтры + верификация (Принять/Отклонить с причиной) + блокировка
- [x] `admin/src/lib/api.ts` — getDoctorAccounts, getDoctorAccountsPending, verifyDoctorAccount, blockDoctorAccount
- [x] AdminSidebar — добавлен "Аккаунты врачей" (UserCheck), роут `/doctor-accounts` в App.tsx

### 🟡 V5 Frontend — Абубакир (mobile, medic)

- [x] **V5-A-1** — Mobile voice agent screen `mobile/app/voice-agent.tsx` — микрофон, запись, чат
- [x] **V5-A-2** — Doctor role в medic/ app: разные табы для medic/doctor — `medic/app/(doctor-tabs)/`, `medic/context/AuthContext.tsx`, `medic/app/auth.tsx`, `medic/app/_layout.tsx`
- [x] **V5-A-3** — Doctor consultation screen в medic/ app — `medic/app/doctor-consultation/[id].tsx`
- [x] **V5-A-4** — Slot picker в mobile/ при бронировании врача — `mobile/app/consultation.tsx`
- [x] **V5-A-5** — Rename AI Hamshira -> Salomat (ai-chat, voice-agent, home banner) + Uzbek greeting + empty-state suggestion chips
- [x] **V5-A-6** — Fix service/[id].tsx back button overlapping iOS status bar (absolute top: insets.top)
- [x] **V5-A-7** — Create notifications screen (mobile/app/notifications.tsx) — grouped by date, empty/skeleton states, AsyncStorage persistence
- [x] **V5-A-8** — Add unread badge on home bell icon + navigate to /notifications
- [x] **V5-A-9** — Salomat disclaimer modal (mobile/components/SalomatDisclaimer.tsx) — first-time consent, AsyncStorage flag

### 🔵 Salomat Sprint 3 — DONE (Абубакир, 2026-04-05)

- [x] **SAL3-1** — Generate salomatSummary for doctor when consultation created (Claude Haiku call) -- `consultations.service.ts`, `ai-agent.service.ts`, `consultation.entity.ts`
- [x] **SAL3-2** — EncryptionService (AES-256-GCM) in CommonModule (global) -- `common/encryption.service.ts`, `common.module.ts`
- [x] **SAL3-3** — Prompt versioning CHANGELOG.md -- `salomat-knowledge/CHANGELOG.md`
- [x] **SAL3-4** — Add ENCRYPTION_KEY to .env.example

### 🔵 Salomat Sprint 2 — DONE (Абубакир, 2026-04-09)

- [x] **SAL-1** — SSE streaming endpoint `POST /consultations/ai-chat/stream` + prompt caching
- [x] **SAL-2** — SalomatAuditLog entity + service (RED_FLAG, DOCTOR/NURSE_REFERRAL, SAFEGUARD, RATE_LIMIT)
- [x] **SAL-3** — Admin audit stats `GET /consultations/admin/salomat-audit/stats`
- [x] **SAL-4** — Patient context (name, medical profile) → AI prompt
- [x] **SAL-5** — Mobile: streaming AI ответы через SSE + fallback
- [x] **SAL-6** — Mobile: action buttons в чате (Shifokor tanlash, Hamshira chaqirish, 103 call)
- [x] **SAL-7** — Mobile: typing dots indicator
- [x] **SAL-8** — Knowledge base: triage.md, specialties.md, safety.md, tone.md, conversation-flow.md
- [x] **SAL-9** — Per-patient rate limiting (50 msg/day)
- [x] **SAL-10** — 38 test scenarios `docs/salomat-scenarios.md`

### 🟡 Salomat — задачи для Диёра

> Backend API для Salomat готов. Новые endpoints:



---

---

## 🏥 CLINIC SYSTEM — Новый модуль

> Контекст: HamshiraGo расширяется для работы с частными клиниками.
> Первые 6 месяцев — бесплатный пилот (SaaS и комиссия = 0).
> С 7-го месяца: Salomat AI лид → пациент пришёл → 15% комиссия.
> Hamshira заказ → 10% комиссия (уже работает).

---

### 🔵 CLIN-BE — Backend (Абубакир)

#### CLIN-BE-1. Company (Clinic) модуль — DONE 2026-04-05
- [x] Entity `company`: id, name, legalName, phone, address, city, lat/lng, logoUrl, licenseNumber, licenseExpiry, isActive, isVerified, parentId (для филиалов), settings (JSON), pilotEnded, createdAt
- [x] Entity `company_branch`: id, companyId, name, address, phone, lat/lng, isActive
- [x] CRUD endpoints: GET /clinic/company, PATCH /clinic/company (CEO only)
- [x] Admin endpoint: PATCH /admin/companies/:id/verify, PATCH /admin/companies/:id/block
- [x] ClinicAuthGuard — проверка role === 'clinic'

#### CLIN-BE-2. Company Staff (Xodimlar) — Auth — DONE 2026-04-05
- [x] Entity `company_user`: id, companyId, branchId, role (CEO | RECEPTION | DOCTOR), name, phone, passwordHash, isActive, doctorId, pushToken
- [x] POST /clinic-auth/register — создание company + CEO одним запросом
- [x] POST /clinic-auth/login → JWT с полями: sub (userId), companyId, clinicRole
- [x] GET /clinic-auth/me — профиль текущего пользователя + company
- [x] `ClinicAuthGuard` + `@ClinicUser()` decorator
- [x] `ClinicRoleGuard` — проверка clinicRole (CEO, RECEPTION, DOCTOR)
- [x] Doctor entity: добавлено companyId (nullable) для связи с клиникой

#### CLIN-BE-3. Rooms (Xonalar) -- DONE
- [x] Entity `company_room`: id, companyId, name, floor, isActive
- [x] Entity `company_room_doctor`: id, roomId, doctorId, dayOfWeek (1–7), startTime, endTime
- [x] CRUD /clinic/rooms — только CEO
- [x] POST /clinic/rooms/:roomId/doctors — назначить врача в комнату (CEO)
- [x] GET /clinic/rooms/today — расписание на сегодня (Reception + CEO)

#### CLIN-BE-4. Clinic Services (Xizmatlar) -- DONE
- [x] Entity `company_service`: id, companyId, name, category (CONSULTATION | LAB | DIAGNOSTIC | PROCEDURE), price, duration, isActive
- [x] CRUD /clinic/services — только CEO
- [x] GET /companies/:companyId/services — публичный (для пациентов при бронировании)

#### CLIN-BE-5. Clinic Appointment (Navbat tizimi) -- DONE
- [x] Entity `clinic_appointment`: id, companyId, roomId, doctorId, patientName, patientPhone, patientId (nullable — если зарегистрирован), serviceId, date, time, status (SCHEDULED | CHECKED_IN | IN_PROGRESS | DONE | CANCELLED), source (MANUAL | SALOMAT_LEAD | ONLINE), paymentType (CASH | TERMINAL | ONLINE), createdBy (staff userId), notes, createdAt
- [x] POST /clinic/appointments — создать навбат (CEO + Reception)
- [x] GET /clinic/appointments?date=&doctorId=&status= — список навбатов
- [x] GET /clinic/appointments/today — сегодняшняя очередь
- [x] GET /clinic/appointments/stats?period= — статистика
- [x] PATCH /clinic/appointments/:id/checkin — Check In (CEO + Reception)
- [x] PATCH /clinic/appointments/:id/cancel — отмена с причиной
- [x] PATCH /clinic/appointments/:id/status — смена статуса

#### CLIN-BE-6. CEO Stats (12 oylik statistika) — DONE 2026-04-05
- [x] GET /clinic/stats/overview?period=today|week|month|year — bemorlar soni, daromad, комиссия
- [x] GET /clinic/stats/monthly — 12 oy oyma-oy grafik (bemorlar soni)
- [x] GET /clinic/stats/doctors — har shifokor uchun: bemorlar, reyting, daromad
- [x] GET /clinic/stats/rooms — har xona bandligi
- [x] GET /clinic/stats/services — eng ko'p so'ralgan xizmatlar

#### CLIN-BE-7. Salomat AI → Lead tizimi — DONE 2026-04-05
- [x] Entity `salomat_lead`: id, clinicId, patientName, patientPhone, aiSummary, specialization, status (NEW | CONTACTED | BOOKED | VISITED | MISSED), appointmentId (nullable), commissionAmount (nullable), commissionPaid (boolean), createdAt
- [x] В AI chat flow: `POST /consultations/ai-chat/create-lead` -- после рекомендации кliniki — запросить имя и телефон пациента
- [x] createLead() — внутренний метод сервиса (вызывается из Salomat AI)
- [x] GET /clinic/leads — список лидов (CEO + Reception, только своя клиника)
- [x] PATCH /clinic/leads/:id/status — сменить статус (CEO + Reception)
- [x] DELETE /clinic/leads/:id — удалить (только CEO)
- [x] WebSocket event `clinic:new_lead` → уведомление Reception в реальном времени
- [x] Push уведомление Reception при новом лиде
- [x] Логика комиссии: при status → VISITED и companyId.pilotEnded=true → set commissionAmount

#### CLIN-BE-8. Admin: управление компаниями — PARTIALLY DONE 2026-04-05
- [x] GET /admin/companies — список всех компаний с фильтрами (isVerified, isActive, city)
- [x] POST /admin/companies — создать компанию + CEO аккаунт одним запросом
- [x] PATCH /admin/companies/:id/verify
- [x] PATCH /admin/companies/:id/block
- [x] GET /admin/companies/:id/stats — статистика конкретной клиники
- [x] GET /admin/leads/overview — все лиды по всем клиникам (сводка)
- [x] GET /admin/leads — все лиды с фильтрами (clinicId, status, page, limit)

#### ~~CLIN-BE-9. Страница пациента + Рецепты~~ DONE 2026-04-05
- [x] GET /clinic/patients/:phone — поиск пациента по телефону (Reception при бронировании)
- [x] GET /clinic/patients/:id/history — история визитов пациента в эту клинику
- [x] POST /clinic/appointments/:id/prescription — врач отправляет рецепт пациенту
- [x] GET /patient/prescriptions — пациент видит свои рецепты (JWT auth)
- [x] GET /patient/prescriptions/:id — детали рецепта

---

### 🟡 CLIN-SA — Super Admin (Диёр)

#### CLIN-SA-1. Admin Panel: Компании (Klinikalar) ✅ DONE

#### CLIN-SA-2. Admin Panel: Детали клиники ✅ DONE

#### CLIN-SA-3. Admin Panel: Salomat AI Лиды (все клиники) ✅ DONE

---

### 🟢 CLIN-FE — Frontend (Жафар/Жонсон-беби)

> Все компоненты в `web-medic/` (CEO и Reception) или `web/` (пациент).
> Auth: `clinic_token` в localStorage + role из JWT (CEO | RECEPTION | DOCTOR).
> Base API: `https://hamshirago-production-0a65.up.railway.app`

#### CLIN-FE-1. Clinic Auth (вход для CEO и Reception) ✅ DONE 2026-04-10
- [x] `web-medic/lib/clinicApi.ts` — API клиент с clinic_token, getClinicRole, clearClinicSession, все clinic эндпоинты
- [x] `web-medic/app/clinic/layout.tsx` — sidebar layout с ролевой навигацией, мобильный overlay
- [x] `web-medic/app/clinic/auth/page.tsx` — страница входа, редирект по роли
- [x] `web-medic/app/clinic/dashboard/page.tsx` — placeholder

#### CLIN-FE-2. CEO Portal — Dashboard ✅ DONE 2026-04-10
- [x] `web-medic/app/clinic/dashboard/page.tsx`
  - KPI карточки: сегодня/неделя/месяц/год — кол-во пациентов
  - 12-месячный график (recharts не установлен → таблица с inline bar)
  - Врачи сегодня: кто работает, сколько пациентов (прогресс-бары)
  - Реал-тайм: ожидают / на приёме / завершены
  - Кнопка "+ Записать пациента" (как у Reception)
  - Блок лидов: новые лиды от Salomat AI (последние 5)

#### CLIN-FE-3. CEO Portal — Кабинеты (Xonalar) ✅ DONE 2026-04-11
- [x] `web-medic/app/clinic/rooms/page.tsx` — список таблицей, создать кабинет, назначить врача (дни + время), расписание

#### CLIN-FE-4. CEO Portal — Сотрудники ✅ DONE 2026-04-11
- [x] `web-medic/app/clinic/staff/page.tsx` — грид карточек, создать (имя/тел/роль/пароль), деактивировать, фото/специализация для врача

#### CLIN-FE-5. CEO Portal — Настройки клиники ✅ DONE 2026-04-11
- [x] `web-medic/app/clinic/settings/page.tsx`
  - Логотип (URL), название, адрес, телефон, email → сохранить в API
  - Рабочие часы по дням (Пн–Вс, toggle открыт/закрыт, время от/до) → localStorage
  - Переключатели: онлайн-консультация, house call, онлайн-оплата → localStorage
  - Длительность слота (15/20/30/45/60 мин) → localStorage
  - Список услуг: создать, редактировать, деактивировать

#### CLIN-FE-6. CEO Portal — Лиды от Salomat AI ✅ DONE 2026-04-11
- [x] `web-medic/app/clinic/leads/page.tsx`
  - KPI: всего / новых / в работе / завершено / отменено
  - Фильтр по статусу + пагинация
  - Кнопка "Позвонить" (tel: ссылка), "Записать" (редирект в Reception)
  - Смена статуса кнопками (Взять в работу / Завершить / Отменить)

#### CLIN-FE-7. CEO Portal — Финансы ✅ DONE 2026-04-11
- [x] `web-medic/app/clinic/finance/page.tsx`
  - KPI: выручка / приёмов / % отмен с выбором периода (сегодня/неделя/месяц/год)
  - Таблица по 12 месяцам с inline bar
  - Топ-5 врачей по доходу с прогресс-барами
  - Экспорт CSV (месяцы + врачи)

#### CLIN-FE-8. Reception Portal — Основной экран ✅ DONE 2026-04-11
- [x] `web-medic/app/clinic/reception/page.tsx`
  - Сегодняшние записи: список с временем, статусом, именем пациента
  - Кнопка "Check In" для SCHEDULED записей
  - Кнопка "+ Записать пациента" → BookingModal
  - Боковая панель с новыми лидами AI
  - Автообновление каждые 30 сек

#### CLIN-FE-9. Reception Portal — Запись пациента (modal) ✅ DONE 2026-04-11
- [x] `web-medic/components/clinic/BookingModal.tsx`
  - Поиск пациента по телефону → автозаполнение имени + история
  - Если не найден → ввести имя вручную
  - Выбор врача, даты, времени, типа оплаты

#### CLIN-FE-10. Страница пациента — web/ ✅ DONE 2026-04-11
- [x] `web/app/patient/page.tsx` — профиль, визиты, рецепты, медкарта (mock → реальный API pending)
- [x] `web/app/patient/prescriptions/page.tsx` — список рецептов
- [x] `web/app/patient/prescriptions/[id]/page.tsx` — детали рецепта + скачать PDF

#### CLIN-FE-11. Врач — расширить существующий портал ✅ DONE 2026-04-11
- [x] `web-medic/app/doctor/consultation/[id]/page.tsx`
  - Блок "Salomat AI Summary" (если есть salomatSummary)
  - Блок "История визитов" пациента
  - Форма рецепта: препарат / доза / кратность / дней
  - Кнопка "Отправить рецепт пациенту"
  - Кнопка "Назначить следующий визит"

#### CLIN-FE-12. Клиники — web/ (для пациентов) ✅ DONE 2026-04-11
- [x] `web/app/clinics/page.tsx` — список с поиском (mock → реальный API pending)
- [x] `web/app/clinics/[id]/page.tsx` — профиль: врачи, услуги, кнопка "Записаться"

#### SAL-D-3. Web-medic: Salomat summary у врача (Жафар) ✅ DONE

### MVP V0.1 Gap Closures — DONE 2026-04-05

- [x] **GAP-1** — X-Request-Id middleware — `backend/src/common/middleware/request-id.middleware.ts`, `app.module.ts`, `main.ts`
- [x] **GAP-2** — WebSocket event logging (subscribe/unsubscribe/dispatch/location) — `backend/src/realtime/order-events.gateway.ts`
- [x] **GAP-3** — Telegram bot interactive commands (inline buttons, callback queries, client notifications) — `backend/src/telegram/`, `backend/src/orders/dispatch.service.ts`, `backend/src/orders/orders.service.ts`, `backend/src/users/`, `backend/src/medics/medics.service.ts`
- [x] **GAP-4** — Docker Compose + Backend Dockerfile — `docker-compose.yml`, `backend/Dockerfile`
- [x] **GAP-5** — AI Analytics module (Claude AI chat, feedback summary, top issues) — `backend/src/analytics/`, `admin/src/pages/AiChat.tsx`
- [x] **GAP-6** — Nearby medics map screen — `mobile/app/nearby-medics.tsx`, `mobile/app/(tabs)/index.tsx`

---

## 👥 Роли разработки

| Роль | Зона ответственности |
|------|---------------------|
| **Абубакир** | `backend/`, `mobile/`, `medic/` |
| **Диёр** | `admin/`, `web/`, `web-medic/`, `landing/`, SEO, логотип, Super Admin |
| **Жафар (Жонсон-беби)** | CEO portal, Reception portal, Patient page, Doctor portal (расширение) |

> Документация (`docs/`) обновляется тем, кто выполняет задачу.

---

## 🔴 CRITICAL — Backend (аудит 2026-03-28)

- [x] **BE-C1** — FIXED — Унифицировано начисление earnings: оба пути используют `netPrice`
- [x] **BE-C2** — FIXED — SQL-инъекция: заменена интерполяция на `.setParameter('fee', fee)`
- [x] **BE-C3** — FIXED — Race condition: атомарный `update()` с `Not(In([DONE, CANCELED]))`
- [x] **BE-C4** — FIXED — Telegram webhook: проверка `X-Telegram-Bot-Api-Secret-Token` + `secret_token` в setWebhook
- [x] **BE-C5** — FIXED — Payme auth: `crypto.timingSafeEqual` вместо `!==`

## 🔴 CRITICAL — Mobile (аудит 2026-03-28)

- [x] **MOB-C1** — ~~Каталог `/services` запрашивается без token~~ — **FIXED** — передаём token в apiFetch
- [x] **MOB-C2** — ~~Двойное подключение WebSocket~~ — **FIXED** — единый SocketContext/SocketProvider
- [x] **MOB-C3** — ~~`discountAmount` вычисляется на клиенте~~ — **TODO added** — требует backend fix BE-L7
- [x] **MOB-C4** — ~~Нет валидации телефона~~ — **FIXED** — regex проверка формата +998 / min 9 цифр
- [x] **MOB-C5** — ~~EAS Project ID placeholder~~ — **FIXED** — registerPushToken логирует warning при placeholder

## 🔴 CRITICAL — Medic (аудит 2026-03-28)

- [x] **MED-C1** — ~~Два WebSocket-соединения одновременно~~ — FIXED: shared SocketContext
- [x] **MED-C2** — ~~SwipeActionButton stale onConfirm~~ — FIXED: onConfirmRef pattern

---

## 🟠 HIGH — Backend

- [x] **BE-H1** — FIXED (already) — `isBlocked` проверяется в `JwtStrategy.validate()` — `strategies/jwt.strategy.ts`
- [x] **BE-H2** — FIXED (already) — `verifyOrderOwnership` проверяет `clientId === userId` — `payments.controller.ts`, `payments.service.ts`
- [x] **BE-H3** — FIXED (already) — `verifyOrderOwnership` проверяет владельца — `payments.controller.ts`, `payments.service.ts`
- [x] **BE-H4** — FIXED (already) — `validateClickIp` проверяет IP 185.8.212.0/24 и 195.158.28.0/24 — `payments.controller.ts`
- [x] **BE-H5** — FIXED (already) — `amount <= 0` проверяется inline — `medics.controller.ts`
- [x] **BE-H6** — FIXED (already) — `PushTokenDto` и `WebPushSubscriptionDto` имеют `@MaxLength` — `common/dto/`
- [x] **BE-H7** — FIXED (already) — order + location обёрнуты в `dataSource.transaction` — `orders.service.ts`
- [x] **BE-H8** — FIXED (already) — `profilePhotoUrl IS NOT NULL` в `findCandidatesForDispatch` — `medics.service.ts`
- [x] **BE-H9** — FIXED — `@MaxLength(10000)` на stacktrace, `@MaxLength(2000)` на message — `client-errors/dto/create-client-error.dto.ts`
- [x] **BE-H10** — FIXED — `@Exclude()` на `passwordHash` + `ClassSerializerInterceptor` глобально — `medic.entity.ts`, `user.entity.ts`, `main.ts`
- [x] **BE-H11** — FIXED — Telegram `/start` проверяет что medic не привязан к другому chatId — `telegram-bot.service.ts`

## 🟠 HIGH — Mobile

- [x] **MOB-H1** — VERIFIED — `ratingSubmittingRef` guard already present, `ratingSubmitting` not in deps — `hooks/useOrderTracking.ts`
- [x] **MOB-H2** — FIXED — All hardcoded Russian strings replaced with `t()` calls — `app/order/track.tsx`, `app/(tabs)/two.tsx`, `components/RatingModal.tsx`
- [x] **MOB-H3** — FIXED — Removed deprecated `STATUS_LABEL`, `OrderCard` uses `getStatusLabel(t)` — `types/order.ts`
- [x] **MOB-H4** — VERIFIED — `OrderCard.onPress` already navigates for all statuses — `components/OrderCard.tsx`
- [x] **MOB-H5** — FIXED — `cancelOrder` no longer checks truthiness of result (204 returns undefined); navigation always runs on success, throws on failure — `hooks/useOrderTracking.ts`

## 🟠 HIGH — Medic

- [x] **MED-H1** — FIXED — location interval no longer cleared on accept — `hooks/useMedicOrderFeed.ts`
- [x] **MED-H2** — FIXED — 401 shows alert before logout instead of silent logout — `constants/api.ts`
- [x] **MED-H3** — FIXED — fetchOrderRef pattern removes fetchOrder from socket effect deps — `hooks/useOrderStatus.ts`
- [x] **MED-H4** — FIXED — confirmAccept wrapped in try/catch, navigation only on success — `app/(tabs)/index.tsx`
- [x] **MED-H5** — VERIFIED — `.env` already in root `.gitignore`, not tracked by git

---

## 🟡 MEDIUM — Backend

- [x] **BE-M1** — FIXED (already) — `forbidNonWhitelisted: true` в ValidationPipe — `main.ts`
- [x] **BE-M2** — FIXED (already) — Payme cancelTransaction поддерживает state=-2 (refund) — `payme.service.ts`
- [x] **BE-M3** — FIXED (already) — `synchronize: false` для всех окружений — `app.module.ts`
- [x] **BE-M4** — FIXED (already) — DB pool `max: 20` — `app.module.ts`
- [x] **BE-M5** — FIXED (already) — Dispatch timer восстанавливает PENDING с future expiresAt — `dispatch.service.ts`
- [x] **BE-M6** — FIXED (already) — `findAvailable` возвращает [] для не-APPROVED/blocked медиков — `orders.service.ts`
- [x] **BE-M7** — FIXED (already) — `subscribe_order` кэширует access check (30s TTL) — `order-events.gateway.ts`
- [x] **BE-M8** — FIXED (already) — `medic_location` кэширует medic-to-order mapping (30s TTL) — `order-events.gateway.ts`
- [x] **BE-M9** — FIXED — Добавлен составной `@Index(['orderId', 'medicId', 'result'])` — `dispatch-attempt.entity.ts`
- [x] **BE-M10** — FIXED — WebSocket CORS использует shared `ALLOWED_ORIGINS` из `cors.config.ts` — `order-events.gateway.ts`
- [x] **BE-M11** — FIXED — Cloudinary timeout clearTimeout через `.finally()` — `cloudinary.service.ts`
- [x] **BE-M12** — FIXED (already) — Payme GetStatement имеет `take: 1000` — `payme.service.ts`

## 🟡 MEDIUM — Mobile

- [x] **MOB-M1** — FIXED — Infinite scroll pagination в orders list — `app/(tabs)/two.tsx`
- [x] **MOB-M2** — FIXED — Profile uses limit=1 + total from pagination — `app/(tabs)/profile.tsx`
- [x] **MOB-M3** — VERIFIED — Already uses shared SocketContext, no token dep for socket — `hooks/useOrderTracking.ts`
- [x] **MOB-M4** — FIXED — `res.ok` check added — `utils/registerPushToken.ts`
- [x] **MOB-M5** — FIXED — Removed `region` prop, kept `initialRegion` — `components/LocationMap.tsx`
- [x] **MOB-M6** — FIXED — AbortController 20s timeout — `constants/api.ts`
- [x] **MOB-M7** — FIXED — `language` added to useEffect deps — `app/(tabs)/index.tsx`
- [x] **MOB-M8** — FIXED — Refs for locations, removed from useCallback deps — `hooks/useRoutePolyline.ts`
- [x] **MOB-M9** — FIXED — TextInput moved inside AppModal children — `app/order/track.tsx`, `components/AppModal.tsx`

## 🟡 MEDIUM — Medic

- [x] **MED-M1** — FIXED — All hardcoded Russian strings replaced with `t()` across 5 files
- [x] **MED-M2** — FIXED — Auto-dismiss modal after 2s when countdown hits 0
- [x] **MED-M3** — FIXED — `startingRef.current = false` after setting watchRef on success
- [x] **MED-M4** — FIXED — OSRM_URL imported from `@/constants/config`
- [x] **MED-M5** — FIXED — Error state + retry UI in my-orders.tsx
- [x] **MED-M6** — FIXED — Uses `?status=DONE&limit=1` + `total` from pagination
- [x] **MED-M7** — FIXED — `onDismissRef` pattern + `order.id` in effect deps
- [x] **MED-M8** — FIXED — Throttle increased to 30s + 200m distance check
- [x] **MED-M9** — FIXED — `reconnectionAttempts: 15` added to SocketContext

---

## 🔵 LOW — Backend

- [x] **BE-L1** — FIXED — `findOneBasic` без medic JOIN для внутренних вызовов; `findOne` с JOIN для API — `orders.service.ts`
- [x] **BE-L2** — FIXED — Interval сохраняется в `cleanupInterval`, `onModuleDestroy` очищает его — `order-events.gateway.ts`
- [x] **BE-L3** — FIXED — `BlockUserDto` с `@IsBoolean()` заменил inline тип — `auth/dto/block-user.dto.ts`, `auth.controller.ts`
- [x] **BE-L4** — FIXED — Все вызовы `notifyClient`/`notifyMedic` получили `.catch(err => console.error('Notify error:', err))` — `orders.service.ts`
- [x] **BE-L5** — FIXED — `GET /services/:id` бросает `NotFoundException` если результат null — `services.controller.ts`
- [x] **BE-L6** — FIXED — `broadcastToAll` обрабатывает chunks по 20 с 100ms задержкой — `telegram.service.ts`
- [x] **BE-L7** — FIXED — `discountAmount` ограничен 20% от цены сервиса; TODO-комментарий для promo-code системы — `orders.service.ts`

## 🔵 LOW — Mobile

- [x] **MOB-L1** — FIXED — `fetchLocation` infinite loop: replaced `pin` dep with `initialPinSetRef` ref — `app/order/location.tsx`
- [x] **MOB-L2** — FIXED — Removed unused `getServiceById` import and `service` variable — `app/order/location.tsx`
- [x] **MOB-L3** — FIXED — Wrapped native `LocationMap` with `React.memo` to prevent MapView re-renders — `app/order/location.tsx`
- [x] **MOB-L4** — FIXED — Removed duplicate channel setup from `registerPushToken.ts`; kept only in `_layout.tsx` — `utils/registerPushToken.ts`
- [x] **MOB-L5** — FIXED — `logout` typed as `() => Promise<void>` in `AuthContextType` interface — `context/AuthContext.tsx`

## 🔵 LOW — Medic

- [x] **MED-L1** — FIXED — Added `useEffect` to sync `faceUri`/`licenseUri` state when `medic.facePhotoUrl`/`licensePhotoUrl` changes — `app/verification.tsx`
- [x] **MED-L2** — FIXED — Replaced dynamic `import('@/constants/api')` with static `API_BASE` import at top of file — `app/(tabs)/profile.tsx`
- [x] **MED-L3** — FIXED — `token` stored in `tokenRef`; `pushLocation` has empty deps; removed `pushLocation` from socket effect deps — `hooks/useMedicOrderFeed.ts`

---

## ⚠️ Частично закрыты (требуют backend-изменений)

- **JWT в localStorage** (web, web-medic, admin) — auto-logout при истечении добавлен; полный фикс = httpOnly cookies на бэкенде
- **Admin JWT** — `AdminLayout` проверяет exp каждые 60с ✅ (BUG 32); localStorage XSS-уязвимость остаётся пока нет httpOnly cookies (BUG 33)

## ⛔ Вне зоны изменений (зафиксировано, не исправляем)

- BUG 14: web-medic загружает все заказы чтобы найти один по id
- BUG 15: web client передаёт лишние поля в CreateOrderDto
- BUG 26: `BASE_URL` захардкожен `localhost:3000` в web и web-medic
- BUG 27: `api.orders.list()` ожидает массив, бэкенд возвращает объект с пагинацией
- BUG 28: WebSocket cleanup не эмитит `unsubscribe_order`
- BUG 29: web-клиент может напрямую поставить статус DONE

---

## 🔴 Аудит 2026-04-01 — Баги и проблемы

### CRITICAL (5 багов)
- [x] **BE-CR1** — **FIXED** — Double-payment race condition в Payme — `performTransaction` обернут в `dataSource.transaction` с `SELECT ... FOR UPDATE` — `payments/payme.service.ts`
- [x] **BE-CR2** — **FIXED** — Race condition cancel: атомарный UPDATE с `clientId` в WHERE, `ConflictException` при 0 affected rows — `orders/orders.service.ts`
- [x] **BE-CR3** — **FIXED** — Earnings calculation: добавлен `safeNumber()` для всех decimal полей (urgentFee, priceAmount, discountAmount, platformFee) — `orders/orders.service.ts`
- [x] **MOB-CR1** — **FIXED** — Push notification навигация: layout шлёт `?id=`, track.tsx ждёт `orderId` — исправлено на `?orderId=` в обоих обработчиках — `mobile/app/_layout.tsx`
- [x] **BE-CR4** — **FIXED** — Referral bonus race condition: обернут в транзакцию с `pessimistic_write` lock на user row — `orders/orders.service.ts`

### HIGH (12 багов)
- [x] **BE-H1** — **FIXED** — Dispatch invite expiry проверяется через `MoreThan(new Date())` в `onMedicAccept` — `dispatch.service.ts`
- [x] **BE-H2** — **FIXED** — Geofence проверяется при self-claim: haversine distance vs workZoneRadius — `orders.service.ts`
- [x] **BE-H3** — **FIXED** — WebSocket `handleConnection` проверяет `isBlocked` через UsersService/MedicsService — `order-events.gateway.ts`
- [x] **BE-H4** — **FIXED** — Reviews unique constraint расширен до `['orderId', 'authorRole', 'targetRole']` — `review.entity.ts`
- [x] **BE-H5** — **FIXED** — `findBaseBy` теперь пытается выбрать referral-поля с fallback — `users.service.ts`
- [x] **MOB-H1** — **FIXED** — parseFloat координат с isNaN проверкой — `mobile/app/order/confirm.tsx`
- [x] **MOB-H2** — **FIXED** — Stale orders: fetchOrdersRef паттерн для стабильного useFocusEffect — `mobile/app/(tabs)/two.tsx`
- [x] **MOB-H3** — **FIXED** — parseInt с валидацией >0 в treatment courses — `mobile/app/courses.tsx`
- [x] **MED-H1** — **FIXED** — Accept order: UI dismissal moved after successful API call; no re-throw so medic can retry — `medic/hooks/useMedicOrderFeed.ts`
- [x] **MED-H2** — **FIXED** — Background location token cleared immediately in logout() before state update — `medic/context/AuthContext.tsx`
- [x] **MED-H3** — **FIXED** — Socket disconnect stops tracking; `socket!.emit()` replaced with safe `socket?.connected` check — `medic/hooks/useMedicLocation.ts`

### MEDIUM (16 багов)
- [x] **BE-M1** — **FIXED** — Discount validation: first-order check + 15% cap — `orders.service.ts`
- [x] **BE-M2** — **FIXED** — AppSettings init: save wrapped in try-catch with fallback — `app-settings.service.ts`
- [x] **BE-M3** — **FIXED** (already) — `@IsEnum(OrderStatus)` present in DTO — `dto/update-order-status.dto.ts`
- [x] **BE-M4** — **FIXED** — Push notification: `notifyWithRetry` for critical calls — `orders.service.ts`
- [x] **BE-M5** — **FIXED** — Location decimal→number: `safeNumber()` guard on all lat/lng parsing — `orders.service.ts`
- [x] **MOB-M1** — **FIXED** — Silent API failures в confirm.tsx: toast on service load error, console.warn on non-critical
- [x] **MOB-M2** — **FIXED** — WebSocket cleanup: emit unsubscribe_order for each subscribed order on unmount — `two.tsx`
- [x] **MOB-M3** — **FIXED** — Urgent fee: clamped urgentFeePercent to 0-100 range — `confirm.tsx`
- [x] **MOB-M4** — **FIXED** — Navigation race condition: skip AsyncStorage re-read when onboardingDone is already true — `_layout.tsx`
- [x] **MOB-M5** — **FIXED** — Profile offline: fallback to cached stats via cacheGetStale on network failure — `profile.tsx`
- [x] **MED-M1** — **FIXED** — Earnings display mismatch: показывает до DONE — `order/[id].tsx`
- [x] **MED-M2** — **FIXED** (already by MED-H3) — Socket emit without connection check — `useMedicLocation.ts`
- [x] **MED-M3** — **FIXED** — Photo upload: raw fetch без timeout — `verification.tsx`
- [x] **MED-M4** — **FIXED** — Location permission revoked: нет retry — `useMedicLocation.ts`
- [x] **MED-M5** — **FIXED** — OSRM route timeout: бесконечный спиннер — `OrderInviteModal.tsx`
- [x] **MED-M6** — **FIXED** — Order fetch 401: router.back() при auth error — `useOrderStatus.ts`

### LOW (4 бага)
- [x] **MED-L1** — **FIXED** — Photo MIME type: `jpg` mapped to `image/jpeg` — `medic/app/(tabs)/profile.tsx`
- [x] **MED-L2** — **FIXED** (already) — Work zone PATCH: `saving`/`clearing` states + `disabled` already present — `medic/app/work-zone.tsx`
- [x] **MOB-L1** — **FIXED** — Phone re-validation: trim + length check before order creation — `mobile/app/order/confirm.tsx`
- [x] **ALL-L1** — **FIXED** — Sentry error tracking подключён к backend, mobile, medic

---

## 📋 Открытые задачи

### Store публикация (Этап 14 — Абубакир)
- [ ] `eas init` → вставить projectId в `mobile/app.json`
- [ ] `expo-updates` install + настройка в обоих app.json
- [ ] `eas credentials` — keystore Android + APNs iOS
- [ ] Play Store: создать приложение `com.hamshirago.client`, загрузить AAB, скриншоты, Privacy Policy
- [ ] App Store: Apple Developer аккаунт ($99/год), создать app в App Store Connect
- [ ] Скриншоты: 2+ (16:9) для Google Play; 6.7", 6.1", 5.5" для App Store (RU + UZ)
- [ ] Privacy Policy URL (обязательно для обоих сторов)

---

## 🔥 V1 — до запуска

### Взаимные отзывы после заказа — Абубакир (backend) + Диёр (web/mobile/web-medic)
**Уже сделано (клиент → медик):**
- [x] Mobile: экран оценки (звёзды + комментарий) после DONE — `components/RatingModal.tsx`, `hooks/useOrderTracking.ts`
- [x] Mobile: отображение `clientReview` и `reviewCount` после оценки — `app/order/track.tsx`
- [x] Medic: `reviewCount` на странице профиля рядом с рейтингом — `app/(tabs)/profile.tsx`
- [x] Medic: экран «Мои отзывы» со списком отзывов из DONE заказов — `app/reviews.tsx`
**Осталось (клиент → медик):**
- [x] Backend: сущность `Review` двусторонняя (orderId, authorId, authorRole, targetId, targetRole, rating, comment) — `backend/src/reviews/entities/review.entity.ts`
- [x] Backend: `POST /reviews` — клиент или медик оставляет отзыв после DONE — `backend/src/reviews/reviews.controller.ts`
- [x] Backend: `GET /reviews/medic/:id` — отзывы медика — `backend/src/reviews/reviews.controller.ts`
- [x] Backend: автоматический пересчёт `averageRating` (`medics.rating`) у медика — `backend/src/reviews/reviews.service.ts`
- [x] Web: экран оценки после завершения заказа (звёзды + комментарий) — D-1 DONE
- [x] Web: отображение рейтинга и отзывов в профиле медика — `/reviews/medic/[medicId]` + кнопка на странице заказа
**Новое (медик → клиент):**
- [x] Backend: `Review` поддерживает `authorRole` [client/medic], `targetRole` [medic/client] — двусторонние отзывы — `backend/src/reviews/entities/review.entity.ts`
- [x] Backend: `GET /reviews/client/:id` — отзывы о клиенте от медиков — `backend/src/reviews/reviews.controller.ts`
- [x] Backend: автоматический пересчёт `averageRating` у клиента (с try/catch — колонка может отсутствовать на Railway) — `backend/src/reviews/reviews.service.ts`
- [x] Backend: push/Telegram напоминание через 1 час если отзыв не оставлен — `backend/src/reviews/reviews.service.ts` (cron `*/15 * * * *`)
- [x] Mobile medic: экран оценки клиента после заказа (звёзды + комментарий + пропуск) — `medic/components/ClientRatingModal.tsx`, `medic/app/order/[id].tsx`, `medic/hooks/useOrderStatus.ts`
- [x] Web-medic: экран оценки клиента после заказа (звёзды + комментарий + пропуск) — `web-medic/app/order/[id]/page.tsx`
- [x] Web-medic/Mobile medic: медик видит рейтинг клиента при получении заказа (помогает решить — принять или нет)
- [x] Admin: страница всех отзывов с фильтрами (по медику, клиенту, рейтингу, дате)

### Срочный вызов (extra fee) — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: поле `isUrgent` в заказе + `urgentFee` (наценка)
- [x] Backend: логика расчёта — ночь/праздник = автоматическая наценка
- [x] Backend: `urgentFeePercent`, `urgentStartHour`, `urgentEndHour` в AppSettings (PATCH /settings)
- [x] Admin: фильтр `?isUrgent=true` в GET /orders/admin/all
- [x] Mobile: переключатель «Срочный вызов» при создании заказа с отображением доплаты — `mobile/app/order/confirm.tsx`
- [x] Mobile: бейдж «Срочный» в OrderCard и track screen — `mobile/components/OrderCard.tsx`, `mobile/app/order/track.tsx`
- [x] Medic: баннер срочного заказа в OrderInviteModal — `medic/components/OrderInviteModal.tsx`
- [x] Medic: бейдж «Срочный» и urgentFee в деталях заказа — `medic/app/order/[id].tsx`
- [x] Web: переключатель «Срочный вызов» при создании заказа с отображением доплаты — D-2 DONE

### Система трекинга ошибок пользователей (User Support / Error Tracking) — Абубакир (backend) + Диёр (admin/web/mobile)
- [x] Backend: расширена сущность `ClientError` — добавлены `status`, `deviceInfo`, `appVersion`, `errorCode`, `count`, `resolvedAt`
- [x] Backend: `POST /client-errors` — уже существовал; теперь поддерживает новые поля + авто-группировку по errorCode
- [x] Backend: `GET /client-errors/admin` — список с фильтрами (userId, appType, status, dateFrom, dateTo, pagination)
- [x] Backend: `PATCH /client-errors/admin/:id` — изменение статуса (NEW → IN_PROGRESS → FIXED → IGNORED)
- [x] Backend: `GET /client-errors/admin/stats` — счётчики по статусам
- [x] Backend: автоматическая группировка одинаковых ошибок (по errorCode + appType, окно 24 ч)
- [x] Mobile: глобальный error boundary — перехватывает все падения и отправляет на backend с userId, экраном, устройством
- [x] Web/Web-medic: глобальный error handler — D-3 DONE — `web/app/error.tsx`, `web/app/global-error.tsx`
- [x] Admin: новая страница «User Support» — D-4 DONE — `admin/src/pages/UserSupport.tsx`
- [x] Admin: фильтры — по пользователю, по дате, по статусу — D-4 DONE
- [x] Admin: детальная карточка ошибки — D-4 DONE
- [x] Admin: счётчик новых ошибок в сайдбаре (бейдж) — D-4 DONE

### Ограничение зоны работы для медиков (геозона) — Абубакир (backend) + Диёр (web-medic/mobile medic)
- [x] Backend: поля у медика — `workZoneLat`, `workZoneLng`, `workZoneRadius` (в км, nullable)
- [x] Backend: при диспатче — если геозона задана, отправлять только заказы внутри круга (haversine фильтр в `selectBestMedic`)
- [x] Backend: `PATCH /medics/work-zone` — сохранить/обновить центр и радиус зоны
- [x] Backend: `DELETE /medics/work-zone` — убрать ограничение (принимать заказы отовсюду)
- [x] Mobile medic: экран с картой — медик ставит точку и слайдером выбирает радиус 0.5-50 км — `medic/app/work-zone.tsx`
- [x] Mobile medic: визуальное отображение зоны на карте (полупрозрачный круг) — `medic/app/work-zone.tsx`
- [x] Web-medic: экран с картой — медик ставит точку и слайдером выбирает радиус 0.5–50 км — `web-medic/app/work-zone/page.tsx`
- [x] Admin: на карте медиков отображать их геозоны — react-leaflet вкладка "Карта" с маркерами и Circle — `admin/src/pages/Medics.tsx`

### SEO-страницы на лендинге — Диёр
- [x] Страницы услуг: `/uslugi/ukol-na-domu`, `/uslugi/kapelnica-na-domu` — landing/app/[lang]/[service]/page.tsx
- [x] Страницы по районам: Чиланзар, Юнусабад, Мирзо-Улугбек, Яккасарай (ru+uz) — landing/app/[lang]/[service]/page.tsx
- [x] Meta-теги, Open Graph, JSON-LD разметка для Google — landing/app/[lang]/layout.tsx
- [x] Sitemap.xml + robots.txt — landing/app/sitemap.ts, landing/app/robots.ts

---

## 🚀 V1.1 — месяц 1–3 после запуска

### Push-напоминания по курсу лечения — Абубакир (backend)
- [x] Backend: сущность `TreatmentCourse` (clientId, название, количество процедур, интервал, следующая дата) — `backend/src/treatment-courses/`
- [x] Backend: cron-задача — отправка push за 2 часа до следующей процедуры — `treatment-courses.service.ts`
- [x] Mobile: экран «Мои курсы лечения» с расписанием — `mobile/app/courses.tsx`
- [x] Web: страница «Курсы лечения» `/courses` с inline-формой добавления, прогресс-баром и удалением — `web/app/courses/page.tsx`

### Реферальная программа — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: генерация реферального кода для каждого клиента — `auth.service.ts`
- [x] Backend: логика начисления бонусов — оба получают скидку на следующий заказ — `orders.service.ts`
- [x] Backend: `GET /referrals/my` — список приглашённых и бонусов — `backend/src/referrals/`
- [x] Mobile: экран «Пригласи друга» с кодом/ссылкой + шаринг — `mobile/app/referral.tsx`
- [x] Web: страница «Реферальная программа» с кодом, ссылкой, шарингом и статистикой — `web/app/referral/page.tsx`

### Персональный медик — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: таблица `favorite_medics` — `backend/src/favorites/`
- [x] Backend: при создании заказа — приоритет избранному медику — `backend/src/orders/dispatch.service.ts`
- [x] Mobile: кнопка «Закрепить медика» на track screen (DONE), экран «Мои медики» `/favorites` — `mobile/app/order/track.tsx`, `mobile/app/favorites.tsx`
- [x] Web: кнопка «Закрепить медика» на странице заказа (DONE), страница `/favorites`, ссылка в профиле — `web/app/orders/[id]/page.tsx`, `web/app/favorites/page.tsx`, `web/app/profile/page.tsx`

### Медкарта в приложении — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: сущность `MedicalCard` — `backend/src/medical-card/`
- [x] Backend: эндпоинты `GET /medical-card`, `PUT /medical-card`, `GET /medical-card/client/:clientId`
- [x] Mobile: экран «Моя медкарта» `/medical-card` — заполнение и просмотр — `mobile/app/medical-card.tsx`
- [x] Медик: просмотр медкарты клиента в деталях заказа — `medic/app/order/[id].tsx`
- [x] Web-medic: просмотр медкарты клиента в деталях заказа — `web-medic/app/order/[id]/page.tsx`

---

## ⚡ V2 — месяц 3–6 (COMPLETED 2026-03-31)

### Программа лояльности — DONE
- [x] Backend: LoyaltyTransaction entity, awardPoints с tier multipliers, spendPoints, getBalance, getHistory
- [x] Backend: endpoints GET /loyalty/my, GET /loyalty/history, POST /loyalty/redeem
- [x] Backend: автоначисление при DONE, milestone bonus каждые 5 заказов
- [x] Mobile: экран «Мои бонусы» с прогресс-баром, тирами, историей, redemption

### Семейные пакеты / подписки — DONE
- [x] Backend: SubscriptionTier + Subscription entities, purchase с pessimistic lock
- [x] Backend: endpoints GET /subscriptions/tiers, GET /subscriptions/my, POST /subscriptions/purchase, POST /subscriptions/cancel
- [x] Backend: auto-discount при создании заказа, cron expiry ежедневно 3 AM
- [x] Admin: CRUD тарифов + статистика
- [x] Mobile: экран подписок с покупкой, отменой, info на confirm screen

### NPS-опросы — DONE
- [x] Backend: cron `0 11 1 * *` — ежемесячная отправка NPS push активным клиентам
- [x] Backend: NpsSurvey entity, POST /nps/submit, GET /nps/check, GET /nps/admin/stats
- [x] Mobile: NPS экран (шкала 0–10 + комментарий + благодарность) + auto-check при запуске
- [x] Admin: дашборд NPS с графиком по месяцам (Диёр) — D-13 DONE — `admin/src/pages/Nps.tsx`

### ИИ-агент + онлайн-консультация — DONE
- [x] Backend: AiAgentService (Claude Haiku), Doctor/Consultation/ChatMessage entities
- [x] Backend: POST /consultations/ai-chat, GET /consultations/doctors, POST /consultations, GET /consultations/my
- [x] Backend: Admin CRUD для врачей, complete/cancel консультаций, статистика
- [x] Mobile: AI Chat screen, Doctors list, Consultation booking, My Consultations
- [x] Backend: связка — врач назначает лечение -> автосоздание заказа на медсестру — **DONE** (Prescription entity)
- [ ] Backend: видео/чат консультация (Agora/WebRTC) — перенесено в V3

---

## 📌 Задачи Диёра (web / web-medic / admin / landing)

> Backend и mobile части уже готовы. Диёр делает web/admin UI.
> Анализ mobile vs web обновлён 2026-04-04.
> Анализ admin панели проведён 2026-04-04.

### 🔴 Приоритет 1 — V1 до запуска

#### ~~D-1. Web: экран оценки заказа~~ ✅ DONE
- Звёзды + комментарий в `web/app/orders/[id]/page.tsx` — `api.orders.rate()`

#### ~~D-2. Web: срочный вызов при создании заказа~~ ✅ DONE
- Переключатель isUrgent + urgentFee в `web/app/order/confirm/page.tsx`

#### ~~D-3. Web / Web-medic: глобальный error handler~~ ✅ DONE
- `web/app/error.tsx` + `global-error.tsx` — `reportClientError()` → POST /client-errors

#### ~~D-4. Admin: страница «User Support»~~ ✅ DONE
- `admin/src/pages/UserSupport.tsx` — таблица, фильтры, детали, бейдж в сайдбаре

#### ~~D-5. Admin: геозоны медиков на карте~~ ✅ DONE
- `admin/src/pages/Medics.tsx` — workZoneRadius Circle overlay на карте

### 🟠 Приоритет 2 — Фичи из mobile, отсутствующие в web


#### D-6. Web: Loyalty (бонусная программа)
- [x] Страница `/loyalty` — баланс очков, тир (BRONZE/SILVER/GOLD), прогресс-бар до следующего тира
- [x] История транзакций (EARNED/SPENT/BONUS/MILESTONE) с пагинацией
- [x] Redemption: списание баллов на скидку (preset кнопки + manual input)
- [x] Карточка loyalty в профиле с очками и тиром
- [x] Info-блок на странице подтверждения заказа (доступная скидка)
- API: `GET /loyalty/my`, `GET /loyalty/history?page=&limit=`, `POST /loyalty/redeem` (body: `{ points }`)
- Референс: `mobile/app/loyalty.tsx`

#### D-7. Web: Subscriptions (подписки)
- [x] Страница `/subscriptions` — доступные тарифы (название, цена, период, макс заказов, % скидки)
- [x] Активная подписка: карточка с прогресс-баром (использовано/доступно заказов), дата окончания
- [x] Покупка подписки + отмена
- [x] Info-блок на странице подтверждения заказа (% скидки от подписки)
- API: `GET /subscriptions/tiers`, `GET /subscriptions/my`, `POST /subscriptions/purchase` (body: `{ tierId }`), `POST /subscriptions/cancel`
- Референс: `mobile/app/subscriptions.tsx`

#### D-8. Web: AI Chat (чат с ИИ-ассистентом)
- [x] Страница `/ai-chat` — чат-интерфейс с AI медицинским ассистентом
- [x] Сообщения user/assistant, индикатор набора текста
- [x] Карточка рекомендации (специализация + кнопка "Найти врача")
- API: `POST /consultations/ai-chat` (body: `{ messages: [{ role, content }] }`)
- Референс: `mobile/app/ai-chat.tsx`

#### D-9. Web: Doctors (список врачей)
- [x] Страница `/doctors` — список врачей с фильтром по специализации
- [x] Карточка врача: фото, имя, специализация, рейтинг, цена, кол-во консультаций
- [x] Кнопка "Записаться" → переход на бронирование
- API: `GET /consultations/doctors?specialization=`, `GET /consultations/doctors/:id`
- Референс: `mobile/app/doctors.tsx`

#### D-10. Web: Consultation (бронирование + история)
- [x] Страница `/consultation` — бронирование консультации (doctor info, symptoms, price, confirm)
- [x] Страница `/consultations` — история моих консультаций с пагинацией и статусами (PENDING/ACTIVE/COMPLETED/CANCELED)
- [x] Детали консультации: doctor notes модал
- API: `POST /consultations` (body: `{ doctorId, symptoms, suggestedSpecialization }`), `GET /consultations/my?page=&limit=`, `GET /consultations/:id`
- Референс: `mobile/app/consultation.tsx`, `mobile/app/consultations.tsx`

#### ~~D-11. Web: Prescriptions (назначения врача)~~ ✅ DONE

#### ~~D-12. Web: NPS (опрос удовлетворённости)~~ ✅ DONE

### 🟡 Приоритет 3 — Admin панель

#### ~~D-13. Admin: NPS дашборд~~ ✅ DONE

#### ~~D-14. Admin: управление назначениями (prescriptions)~~ ✅ DONE

#### ~~D-15. Admin: аналитика (графики)~~ ✅ DONE

### 🔵 Приоритет 4 — SEO лендинг

#### D-16. Landing: SEO-страницы
- [x] Страницы услуг: `/uslugi/ukol-na-domu`, `/uslugi/kapelnica-na-domu` — landing/app/[lang]/[service]/page.tsx
- [x] Страницы по районам: Чиланзар, Юнусабад, Мирзо-Улугбек, Яккасарай (ru+uz) — landing/app/[lang]/[service]/page.tsx
- [x] Meta-теги, Open Graph, JSON-LD разметка для Google — landing/app/[lang]/layout.tsx
- [x] Sitemap.xml + robots.txt — landing/app/sitemap.ts, landing/app/robots.ts

### 📊 Матрица: mobile vs web (обновлено 2026-04-04)

#### Web client (web/) vs Mobile (mobile/)

| Фича | Mobile | Web | Статус |
|------|--------|-----|--------|
| Каталог услуг | ✅ | ✅ | Паритет |
| Создание заказа + карта | ✅ | ✅ | Паритет |
| Срочный вызов | ✅ | ✅ | Паритет |
| Трекинг заказа + WS | ✅ | ✅ | Паритет |
| История заказов + reorder | ✅ | ✅ | Паритет |
| Оценка после DONE | ✅ | ✅ | Паритет |
| Профиль + edit name | ✅ | ✅ | Паритет |
| Медкарта | ✅ | ✅ | Паритет |
| Курсы лечения | ✅ | ✅ | Паритет |
| Реферальная программа | ✅ | ✅ | Паритет |
| Избранные медики | ✅ | ✅ | Паритет |
| Loyalty (бонусы) | ✅ | ✅ | Паритет |
| Subscriptions | ✅ | ✅ | Паритет |
| AI Chat | ✅ | ✅ | Паритет |
| Doctors list | ✅ | ✅ | Паритет |
| Consultations | ✅ | ✅ | Паритет |
| Prescriptions | ✅ | ✅ | Паритет |
| NPS survey | ✅ | ✅ | Паритет |
| Video call | ✅ | ✅ | Паритет |
| Error handler | ✅ | ✅ | Паритет |
| Чат в заказе | ✅ | ✅ | D-17 DONE |
| Промо-коды | ✅ | ✅ | D-18 DONE |

#### Web-medic (web-medic/) vs Mobile medic (medic/)

| Фича | Mobile | Web-Medic | Статус |
|------|--------|-----------|--------|
| Auth + profile | ✅ | ✅ | Паритет |
| Online/offline toggle | ✅ | ✅ | Паритет |
| Заказы + трекинг | ✅ | ✅ | Паритет |
| Work zone | ✅ | ✅ | Паритет |
| Reviews | ✅ | ✅ | Паритет |
| Photo upload | ✅ | ✅ | Паритет |
| Wallet | ✅ | ✅ | Паритет |
| Редактирование имени | ✅ | ✅ | D-19 DONE |
| Чат в заказе (медик) | ✅ | ✅ | D-20 DONE |
| Экран верификации | ✅ | ✅ | D-21 DONE |
| Статистика заказов | ✅ | ✅ | D-22 DONE |

### 🔴 Новые задачи Диёра (web догоняет mobile)

#### ~~D-17. Web: чат в заказе (client ↔ medic)~~ ✅ DONE
- Slide-up панель + Socket.IO `order_message` + история — `web/app/orders/[id]/page.tsx`

#### ~~D-18. Web: промо-коды на странице подтверждения заказа~~ ✅ DONE
- Поле + кнопка "Применить" + зелёная/красная рамка + строка в итоге — `web/app/order/confirm/page.tsx`

#### ~~D-19. Web-medic: редактирование имени в профиле~~ ✅ DONE
- Inline input в хедере + PATCH /medics/profile + обновление localStorage — `web-medic/app/profile/page.tsx`

#### ~~D-20. Web-medic: чат в заказе (medic side)~~ ✅ DONE
- Slide-up панель + Socket.IO `order_message` + medic-messages endpoint — `web-medic/app/order/[id]/page.tsx`

#### ~~D-21. Web-medic: экран верификации~~ ✅ DONE
- Страница `/verification` + статус карточка + загрузка фото — `web-medic/app/verification/page.tsx`

#### ~~D-22. Web-medic: статистика заказов~~ ✅ DONE
- "Выполнено" 4-я колонка в стат-блоке профиля — `web-medic/app/profile/page.tsx`

### 🟣 Admin панель — недостающие фичи (анализ 2026-04-04)

> Admin: 15 страниц, shadcn/ui + Recharts. Уже есть: Dashboard, Verification, Medics (с картой),
> Clients, Orders (WS real-time), Services CRUD, Reports (CSV), Analytics, User Support (badges),
> Reviews, Consultations (complete/cancel), NPS, Settings.
> **Не хватает 4 страницы**, backend endpoints готовы.

#### ~~D-23. Admin: Промо-коды~~ ✅ DONE
- Страница `/promo-codes`, таблица, фильтр активные/все, создание + деактивация — `admin/src/pages/PromoCodes.tsx`

#### ~~D-24. Admin: Управление тарифами подписок~~ ✅ DONE
- Страница `/subscription-tiers`, CRUD через диалог, статистика, toggle isActive — `admin/src/pages/SubscriptionTiers.tsx`

#### ~~D-25. Admin: CRUD врачей (Doctors)~~ ✅ DONE
- Страница `/doctors`, таблица с фото/рейтингом, CRUD диалог, toggle isActive — `admin/src/pages/Doctors.tsx`

#### ~~D-26. Admin: Аудит-лог~~ ✅ DONE
- Страница `/audit-log`, пагинация, фильтр по action, expandable row с JSON деталями — `admin/src/pages/AuditLog.tsx`

### 📊 Admin: текущее покрытие (15 страниц)

| Страница | Статус | Описание |
|----------|--------|----------|
| Dashboard | ✅ | KPI, тренды, auto-refresh 30s |
| Verification | ✅ | Очередь верификации медиков |
| Medics | ✅ | Таблица + карта с геозонами |
| Clients | ✅ | Таблица + block/unblock |
| Orders | ✅ | Таблица + WS real-time + cancel |
| Services | ✅ | CRUD услуг |
| Reports | ✅ | График + CSV export |
| Analytics | ✅ | Недельные тренды + utilization |
| User Support | ✅ | Ошибки + badge в sidebar |
| Reviews | ✅ | Отзывы по медику |
| Consultations | ✅ | Complete/cancel + service selector |
| NPS | ✅ | Score gauge + monthly trend |
| Settings | ✅ | Commission, urgent fee, paid mode |
| Промо-коды | ✅ | D-23 DONE |
| Тарифы подписок | ✅ | D-24 DONE |
| Врачи (CRUD) | ✅ | D-25 DONE |
| Аудит-лог | ✅ | D-26 DONE |

---

## ⚡ V3 — roadmap (Абубакир — backend) — ВСЁ ВЫПОЛНЕНО

- [x] Видео/чат консультация — LiveKit (VideoService + video-call screen + endpoints)
- [x] Связка врач → автозаказ — Prescription entity + endpoints + mobile UI
- [x] NPS-опросы — cron monthly + mobile + admin stats
- [x] Чат клиент ↔ медик — Socket.IO + ChatMessage.orderId + mobile UI
- [x] Повторный заказ — POST /orders/:id/reorder + mobile кнопка
- [x] Редактирование профиля — PATCH /auth/profile + /medics/profile + mobile UI
- [x] Token refresh — POST /auth/refresh
- [x] Промо-коды — PromoCode entity + CRUD + validate + mobile UI
- [x] Аудит-лог admin — AdminAuditLog entity + GET /admin/audit-log
- [x] Healthcheck расширенный — GET /health/detailed (DB, Cloudinary, Expo Push)
- [x] Sentry error tracking — backend + mobile + medic
- [x] Playwright тесты — API (10 specs) + Web UI (7 specs)
- [x] Maestro тесты — mobile (5 flows) + medic (3 flows)

## 💡 V4 — идеи для будущего развития

### Рост и удержание
- [x] **Расписание медика** — DONE (backend) — `MedicSchedule` entity, `GET/PUT /medics/me/schedule`, dispatch фильтрует по рабочим часам. Mobile UI remains.
- [x] **Push-сегментация** — DONE (backend) — `POST /admin/push-campaign`, segments: all/new_7d/inactive_30d/tier_gold, batch send. Admin UI remains.
- [x] **Фото до/после процедуры** — DONE (backend) — `beforePhotoUrl`/`afterPhotoUrl` columns, `POST /orders/:id/photo` endpoint, Cloudinary upload. Mobile part remains.
- [x] **Уведомления в Telegram для клиентов** — DONE (backend) — full chain verified: User entity `telegramChatId`, `/start client_{userId}`, `notifyClientStatus()`, `notifyClient()`. Mobile deep link part remains.

### UX и удобство
- [x] **Мульти-услуга в одном заказе** — DONE (backend) — `serviceIds`/`serviceTitles` JSONB на Order, prices суммируются. Mobile UI remains.
- [x] **ETA (оценка времени прибытия)** — DONE (backend) — OSRM + haversine fallback, `etaMinutes` in `medic_location` and `order_status` events. Mobile display part remains.
- [x] **`/orders/stats` endpoint** — DONE — `GET /orders/stats` → `{ total, active, completed, canceled }`

### Безопасность
- [x] **Rate limiting по IP** — DONE — `IpThrottlerGuard` applied to login/register endpoints
- [x] **Soft-delete для заказов** — DONE — `@DeleteDateColumn()` + `DELETE /orders/admin/:id`
- [ ] **Certificate pinning** — защита от MITM на mobile. **Реализация:** `expo-certificate-pinning` или кастомный fetch adapter с проверкой SSL fingerprint. Pinning к Railway SSL certificate. Обновлять при ротации сертификата. Оценка: ~2 часа
- [x] **httpOnly cookies** — DONE — Backend cookie auth implemented. `res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict' })`. Frontend uses `credentials: 'include'`.

### Масштабирование (при росте >1000 заказов/день)
- [x] **Redis кэш** — DONE — Redis cache via `REDIS_URL` env, `QueueService` with Redis-backed queues. Falls back to in-memory when Redis not configured.
- [x] **BullMQ очередь задач** — DONE — `QueueService` in CommonModule handles push/telegram/email queues with retry and fallback.
- [x] **Payments ledger** — DONE (backend) — `PaymentLedger` entity, `GET /admin/ledger` + `GET /admin/ledger/summary`, wired into order DONE. Admin UI remains.
- [x] **S3-совместимое хранилище** — DONE — `S3Service` in CommonModule (Backblaze B2 / MinIO). Not wired into upload flows yet — available when Cloudinary limits are reached.

---

## 🎙️ V5 — Голосовой AI Ассистент (новая бизнес-модель)

> **Бизнес-логика:** AI Агент (голос) → Врач (видеозвонок + рецепт) → Медсестра (выезд на дом)
> Клиент может пропустить шаг 1–2 и сразу вызвать медсестру если уже есть назначение.
> Анализ проведён 2026-04-06.

### Стек
- **STT (речь → текст):** Groq Whisper API (бесплатно, лимит 28 800 сек/день) или OpenAI Whisper API ($0.006/мин)
- **LLM (мозг):** Claude Haiku через Anthropic API (уже используется в проекте)
- **TTS (текст → голос):** OpenAI TTS `alloy` голос для RU ($15/1M символов) или Groq TTS (бесплатно в лимитах)
- **UZ голос:** ElevenLabs Voice Clone — записать диктора ~60 мин → обучить модель (~$22/мес)

---

### 📌 Фаза 1 — Backend: Voice Agent API (Абубакир)

#### VA-BE-1. Новый модуль `voice-agent/` -- DONE 2026-04-05
- [x] Создать `backend/src/voice-agent/voice-agent.module.ts`
- [x] Создать `VoiceSession` entity — `sessionId`, `clientId`, `messages` (jsonb), `status` (ACTIVE/COMPLETED), `recommendation` (DOCTOR/NURSE/NONE), `createdAt`, `updatedAt`
- [x] Файлы: `voice-session.entity.ts`, `voice-agent.service.ts`, `voice-agent.controller.ts`, `voice-agent.module.ts`

#### VA-BE-2. STT endpoint — транскрипция голоса -- DONE 2026-04-05
- [x] `POST /voice-agent/transcribe` — принимает аудио файл (multipart, форматы: webm, mp4, m4a, wav, ogg, mp3)
- [x] Отправляет в Groq Whisper API (`https://api.groq.com/openai/v1/audio/transcriptions`)
- [x] Параметры: `model: "whisper-large-v3"`, `language: "ru"` или `"uz"` (из query `?lang=ru`)
- [x] Возвращает `{ text: string, duration: number }`
- [x] `GROQ_API_KEY` в `.env.example`

#### VA-BE-3. AI диалог с медицинским контекстом -- DONE 2026-04-05
- [x] `POST /voice-agent/chat` — body: `{ sessionId?, message: string, lang: "ru" | "uz" }`
- [x] Системный промпт: медицинский ассистент HamshiraGo с триажом (RU/UZ)
- [x] Промпт включает: список доступных услуг из ServicesService
- [x] Поддержка истории диалога (сохранять в `VoiceSession.messages`)
- [x] После 2–5 обменов — решение: `recommendation: DOCTOR | NURSE`
- [x] Возвращает `{ sessionId, reply, recommendation, suggestedSpecialization, sessionComplete }`

#### VA-BE-4. TTS endpoint — озвучка ответа -- PLACEHOLDER
- [x] `POST /voice-agent/synthesize` — placeholder, returns 503 (TTS not configured)
- [x] Подключить OpenAI TTS когда будет OPENAI_API_KEY — DONE — TTS integrated in `voice-agent.service.ts`, works when `OPENAI_API_KEY` is set

#### VA-BE-5. Session management -- DONE 2026-04-05
- [x] `GET /voice-agent/session/:id` — получить историю сессии
- [x] `DELETE /voice-agent/session/:id` — удалить сессию
- [x] Автоудаление сессий старше 24 часов (cron `0 3 * * *`)
- [x] Привязка к clientId если пользователь авторизован (OptionalJwtGuard)

#### VA-BE-6. Интеграция с существующим флоу -- DONE 2026-04-05
- [x] `POST /voice-agent/session/:id/book-nurse` — возвращает suggestedServiceId для создания заказа
- [x] `POST /voice-agent/session/:id/book-doctor` — возвращает suggestedSpecialization для поиска врача

#### VA-BE-7. Admin: мониторинг голосовых сессий -- DONE 2026-04-05
- [x] `GET /voice-agent/admin/sessions` — список сессий с фильтрами (status, recommendation), пагинация
- [x] `GET /voice-agent/admin/sessions/stats` — KPI: total, active, completed, doctor/nurse, conversion rate, avg exchanges
- [x] `GET /voice-agent/admin/sessions/:id` — полная сессия
- [ ] Добавить в AuditLog действие `voice_session_complete`

---

### 📌 Фаза 2 — Mobile: голосовой интерфейс (Абубакир)

#### VA-MOB-1. Экран голосового ассистента `app/voice-agent.tsx`
- [x] Кнопка-микрофон по центру (большая, анимированная пульсация при записи)
- [x] Запись через `expo-av` (`Audio.Recording`) — формат m4a
- [x] При отпускании → отправить на `POST /voice-agent/transcribe`
- [x] Показать распознанный текст пользователю (для проверки)
- [x] Отправить в `POST /voice-agent/chat` → получить ответ
- [x] Воспроизвести аудио ответ через `POST /voice-agent/synthesize` → `Audio.Sound`

#### VA-MOB-2. UI состояния
- [x] IDLE: большая кнопка микрофона + текст "Нажмите и говорите"
- [x] RECORDING: анимация звуковых волн (пульсация), таймер записи
- [x] PROCESSING: spinner "Думаю..."
- [x] SPEAKING: анимация динамика, текст ответа ассистента
- [x] RECOMMENDATION: карточка с рекомендацией + кнопки "Записаться к врачу" / "Вызвать медсестру"

#### VA-MOB-3. История диалога
- [x] Bubble-чат под кнопкой микрофона (прокручиваемый)
- [x] Сообщения пользователя (правый пузырь) + ассистент (левый пузырь с иконкой)
- [x] Текст ответа отображается одновременно с озвучкой

#### VA-MOB-4. Переход к заказу/консультации
- [x] При `recommendation: NURSE` → кнопка "Вызвать медсестру" → `router.push("/order/location")`
- [x] При `recommendation: DOCTOR` → кнопка "Записаться к врачу" → `router.push("/doctors")`
- [x] Передать симптомы через params чтобы предзаполнить поля

#### VA-MOB-5. Навигация
- [x] Добавить кнопку на главном экране (index.tsx) — "Голосовой ассистент" с иконкой микрофона
- [x] Или таб в нижней панели (заменить один из менее используемых)

---

### 📌 Фаза 3 — Web: голосовой интерфейс (Диёр)

#### VA-WEB-1. Страница `/voice-agent` в web/
- [x] Большая кнопка микрофона (Web Speech API или MediaRecorder → отправка на backend)
- [x] `MediaRecorder` → blob (webm) → FormData → `POST /voice-agent/transcribe`
- [x] Отображение распознанного текста
- [x] Отправка в `POST /voice-agent/chat`
- [x] Получение аудио из `POST /voice-agent/synthesize` → `new Audio(url).play()`

#### VA-WEB-2. UI компонент `VoiceAssistant`
- [x] `web/components/VoiceAssistant.tsx` — переиспользуемый компонент
- [x] Состояния: idle / recording / processing / speaking
- [x] CSS анимации: pulse при записи, wave при воспроизведении
- [x] Чат-история под микрофоном

#### VA-WEB-3. Переход к флоу
- [x] При `recommendation: NURSE` → `router.push("/order/confirm")`
- [x] При `recommendation: DOCTOR` → `router.push("/doctors")`
- [x] Кнопка "Голосовой ассистент" на главной странице `/`

---

### 📌 Фаза 4 — Расписание врачей (Абубакир)

> Необходимо для полноценного шага 2 (клиент записывается к врачу на конкретное время)

#### VA-SCH-1. Backend: DoctorSchedule
- [x] Entity `DoctorSlot` + эндпоинты `POST/GET /doctors/:id/slots`, bookSlot/releaseSlot в `DoctorsService`, интеграция в `ConsultationsService` (create/cancel/delete)

#### VA-SCH-2. Mobile: выбор времени при записи к врачу
- [x] `mobile/app/consultation.tsx` — DatePicker + сетка слотов, slotId передаётся в `POST /consultations`

#### VA-SCH-3. Web: выбор времени (Диёр)
- [x] `web/app/consultation/page.tsx` + компонент `web/components/SlotPicker.tsx`

---

### 📌 Фаза 5 — Admin: мониторинг голосового ассистента (Диёр)

#### VA-ADM-1. Admin страница «Голосовой агент»
- [x] Новая страница `admin/src/pages/VoiceAgent.tsx`
- [x] Карточки статистики: всего сессий, завершено, DOCTOR/NURSE, конверсия, avg exchanges
- [x] Таблица сессий: дата, id, язык, сообщений, рекомендация, статус
- [x] Фильтры: по статусу, по recommendation (DOCTOR/NURSE/NONE)
- [x] Клик на сессию → модал с полной историей диалога

#### VA-ADM-2. Sidebar и роутинг
- [x] Добавить в `AdminSidebar.tsx` пункт «Голосовой агент» (иконка `Mic`)
- [x] Добавить роут `/voice-agent` в `App.tsx`

---

### 💰 Оценка затрат (V5)

| Компонент | Бесплатный вариант | Платный вариант |
|-----------|-------------------|-----------------|
| STT | Groq Whisper (28 800 сек/день бесплатно) | OpenAI Whisper $0.006/мин |
| LLM | Groq LLaMA 3.3 70B (лимиты/день) | Claude Haiku ~$0.001/запрос |
| TTS RU | — | OpenAI TTS ~$0.015/1000 символов |
| TTS UZ | Piper TTS self-hosted | ElevenLabs $22/мес + диктор $50 разово |
| **Итого MVP** | **$0** (Groq лимиты) | **~$30-50/мес** при 1000 сессий/день |

### 📐 Архитектура потока

```
[Клиент нажимает кнопку микрофона]
        ↓
[Запись аудио — expo-av / MediaRecorder]
        ↓
POST /voice-agent/transcribe  →  [Groq Whisper]  →  { text }
        ↓
POST /voice-agent/chat  →  [Claude Haiku]  →  { reply, recommendation }
        ↓
POST /voice-agent/synthesize  →  [OpenAI TTS / ElevenLabs]  →  audio/mpeg
        ↓
[Воспроизведение ответа + отображение текста]
        ↓
[Если recommendation != NONE → кнопки перехода к заказу/врачу]
```

### 🚦 Порядок реализации

1. **VA-BE-1, VA-BE-2** — базовый модуль + STT (можно тестировать сразу через Postman)
2. **VA-BE-3** — AI диалог (самое важное)
3. **VA-BE-4** — TTS озвучка
4. **VA-MOB-1, VA-MOB-2** — mobile UI
5. **VA-BE-5, VA-BE-6** — session management + интеграция с заказами
6. **VA-WEB-1, VA-WEB-2** — web версия
7. **VA-SCH-1–3** — расписание врачей
8. **VA-ADM-1, VA-ADM-2** — admin мониторинг

---

## 📋 Документация (правило)

> После каждого выполненного этапа — обновить `done.md` с датой, описанием, файлами.
> Backend-изменения → обновить `docs/BACKEND_API.md`.
