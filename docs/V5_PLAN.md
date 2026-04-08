# V5 — Голосовой AI Ассистент + Врачебная платформа

> **Бизнес-модель (DispatchHealth style):**
> AI Агент (голос) → Врач (видеозвонок + рецепт) → Медсестра (выезд на дом)
>
> **Наше преимущество:** первые в Узбекистане, 37M населения, 0 прямых конкурентов,
> государство вкладывает €3.2B в digital health, DMED пилотирует AI в 2 районах Ташкента.

---

## Этап 0 — Doctor Auth + Role System (фундамент)

> **Без этого этапа V5 невозможен — у врачей нет способа войти в систему.**
> **Срок: 2-3 дня**

### Абубакир (backend)

- [ ] **V5-0.1** Добавить Doctor auth:
  - `POST /doctors/register` — phone, password, name, specialization, experienceYears
  - `POST /doctors/login` → JWT с `role: "doctor"`
  - `GET /doctors/me` — профиль врача (из JWT)
  - `PATCH /doctors/profile` — обновление профиля
  - `PATCH /doctors/push-token` — push notifications
  - Пароль: bcrypt, токен: JWT с `{ sub: doctorId, role: "doctor" }`

- [ ] **V5-0.2** Doctor entity — расширить текущую `doctors` таблицу:
  - Добавить поля: `passwordHash`, `pushToken`, `isOnline`, `isBlocked`, `telegramChatId`
  - **НЕ создавать новую таблицу** — расширить существующую Doctor entity
  - `nullable: true` на новые колонки (Railway совместимость)

- [ ] **V5-0.3** DoctorAuthGuard — аналог MedicAuthGuard:
  - `backend/src/auth/guards/doctor-auth.guard.ts`
  - Проверяет JWT role === "doctor"
  - Декоратор `@DoctorId()` для извлечения ID из JWT

- [ ] **V5-0.4** Doctor consultation endpoints (вместо admin-only):
  - `GET /consultations/doctor/pending` — ожидающие консультации для врача
  - `POST /consultations/:id/accept` — врач принимает (status: PENDING → ACTIVE)
  - `POST /consultations/:id/decline` — врач отклоняет
  - `PATCH /consultations/:id/complete` — врач завершает + doctorNotes
  - `POST /consultations/:id/prescribe` — врач выписывает рецепт
  - Все под DoctorAuthGuard

- [ ] **V5-0.5** Doctor уведомления:
  - Push notification при новой консультации
  - Telegram bot: `/start doctor_{doctorId}` → привязка чата
  - WebSocket room: `doctor:{doctorId}` для real-time

### Абубакир (medic/ app)

- [ ] **V5-0.6** Doctor role в medic/ app:
  - При login определять role из JWT (`medic` или `doctor`)
  - Показывать разные табы:
    - **Medic:** Заказы | Мои заказы | Профиль
    - **Doctor:** Консультации | Мои пациенты | Профиль
  - Переиспользовать: auth, profile, push, settings, language

- [ ] **V5-0.7** Doctor tabs в medic/ app:
  - `medic/app/(doctor-tabs)/index.tsx` — Pending консультации (принять/отклонить)
  - `medic/app/(doctor-tabs)/my-patients.tsx` — Активные и завершённые
  - `medic/app/(doctor-tabs)/profile.tsx` — Профиль врача + расписание
  - `medic/app/doctor-consultation/[id].tsx` — Детали + видеозвонок + рецепт

### Диёр (web-medic)

- [ ] **V5-0.8** Doctor role в web-medic:
  - При login определять role, показывать разный sidebar:
    - **Medic sidebar:** Заказы, Кошелёк, Верификация, Профиль
    - **Doctor sidebar:** Консультации, Расписание, Рецепты, Пациенты, Профиль
  - Переиспользовать: auth page, layout, theme

- [ ] **V5-0.9** Doctor pages в web-medic:
  - `web-medic/app/doctor/consultations/page.tsx` — Список (pending/active/done)
  - `web-medic/app/doctor/consultation/[id]/page.tsx` — Детали + видеозвонок (LiveKit Web)
  - `web-medic/app/doctor/prescriptions/page.tsx` — Выписанные рецепты
  - `web-medic/app/doctor/profile/page.tsx` — Профиль + расписание

---

## Этап 1 — Voice Agent Backend (API)

> **Голосовой AI: STT → LLM → TTS pipeline**
> **Срок: 3-4 дня**

### Абубакир (backend)

- [ ] **V5-1.1** Модуль `voice-agent/`:
  - `voice-agent.module.ts`, `voice-agent.service.ts`, `voice-agent.controller.ts`
  - `VoiceSession` entity: `id`, `clientId`, `lang`, `messages` (jsonb), `status` (ACTIVE/COMPLETED), `recommendation` (DOCTOR/NURSE/NONE), `suggestedServiceId`, `suggestedSpecialization`, `createdAt`, `updatedAt`

- [ ] **V5-1.2** STT — `POST /voice-agent/transcribe`:
  - Принимает multipart audio (webm, m4a, wav)
  - Groq Whisper API (`whisper-large-v3`) — бесплатно
  - Query param `?lang=ru|uz` для подсказки языка
  - Fallback: OpenAI Whisper если Groq down
  - Return: `{ text, language, duration }`

- [ ] **V5-1.3** AI Chat — `POST /voice-agent/chat`:
  - Body: `{ sessionId?, message, lang }`
  - Системный промпт: медицинский ассистент, собирает симптомы, рекомендует услугу/врача
  - Промпт включает список услуг из DB (services table)
  - История диалога из VoiceSession.messages
  - После 3-5 обменов → `recommendation: DOCTOR | NURSE | NONE`
  - Return: `{ sessionId, reply, recommendation?, suggestedSpecialization?, sessionComplete }`

- [ ] **V5-1.4** TTS — `POST /voice-agent/synthesize`:
  - Body: `{ text, lang, voice? }`
  - RU: OpenAI TTS (`tts-1`, voice `nova`) — $15/1M chars
  - UZ: OpenAI TTS `nova` (MVP) → ElevenLabs custom voice (v2)
  - Return: audio stream `audio/mpeg`
  - Cache: частые фразы (приветствие) в memory

- [ ] **V5-1.5** Session management:
  - `GET /voice-agent/session/:id` — история
  - `DELETE /voice-agent/session/:id` — завершить
  - Cron: удалять сессии старше 24ч
  - `POST /voice-agent/session/:id/book-nurse` — создать заказ из сессии
  - `POST /voice-agent/session/:id/book-doctor` — создать консультацию из сессии

- [ ] **V5-1.6** ENV ключи:
  - `GROQ_API_KEY` — для Whisper STT
  - `OPENAI_API_KEY` — для TTS (и fallback STT)
  - Добавить в `.env.example` и Railway

---

## Этап 2 — Mobile Voice UI

> **Голосовой экран в клиентском приложении**
> **Срок: 3-4 дня**

### Абубакир (mobile/)

- [ ] **V5-2.1** Экран `app/voice-agent.tsx`:
  - Большая кнопка микрофона (центр) — hold to record
  - Запись через `expo-av` Audio.Recording (формат m4a)
  - При отпускании → POST /voice-agent/transcribe → получить текст
  - Показать распознанный текст → POST /voice-agent/chat → получить ответ
  - Воспроизвести TTS через Audio.Sound

- [ ] **V5-2.2** UI состояния:
  - IDLE: кнопка микрофона + "Нажмите и говорите"
  - RECORDING: пульсация, волны, таймер
  - PROCESSING: "Думаю..." спиннер
  - SPEAKING: анимация динамика + текст ответа
  - RESULT: карточка с рекомендацией + кнопки действий

- [ ] **V5-2.3** Chat history:
  - Bubble-чат (user right, AI left) под микрофоном
  - Текст синхронно с озвучкой
  - Scroll к последнему сообщению

- [ ] **V5-2.4** Переходы:
  - `recommendation: NURSE` → "Вызвать медсестру" → `/order/location` с предзаполненным serviceId
  - `recommendation: DOCTOR` → "Записаться к врачу" → `/doctors` с фильтром specialization
  - Передать симптомы через params

- [ ] **V5-2.5** Навигация:
  - Кнопка "Голосовой ассистент" на Home (баннер с микрофоном)
  - `_layout.tsx`: `<Stack.Screen name="voice-agent" options={{ headerShown: false }} />`

---

## Этап 3 — Doctor Schedule (расписание)

> **Врач управляет своими слотами, клиент записывается на конкретное время**
> **Срок: 2-3 дня**

### Абубакир (backend)

- [ ] **V5-3.1** DoctorSlot entity:
  - `id`, `doctorId`, `startsAt` (timestamp), `endsAt`, `isBooked`, `consultationId` (FK nullable)
  - Endpoints:
    - `POST /doctors/me/slots` — врач создаёт слоты (bulk: дата + интервал + количество)
    - `GET /doctors/:id/slots?date=YYYY-MM-DD` — клиент видит свободные слоты
    - При создании консультации → слот занимается
    - При отмене → слот освобождается

### Абубакир (mobile/)

- [ ] **V5-3.2** Выбор времени в consultation.tsx:
  - DatePicker (календарь) → загрузить слоты на дату
  - Сетка слотов: 09:00, 09:30, 10:00... — свободные зелёные, занятые серые
  - Выбранный слот → `slotId` в `POST /consultations`

### Абубакир (medic/ doctor tabs)

- [ ] **V5-3.3** Управление расписанием в doctor profile:
  - Врач выбирает рабочие дни и часы
  - Автогенерация слотов (30 мин каждый)
  - Просмотр занятых слотов

### Диёр (web-medic doctor pages)

- [ ] **V5-3.4** Расписание на web-medic:
  - `web-medic/app/doctor/schedule/page.tsx`
  - Календарь + drag-to-create слоты
  - Визуализация: занятые/свободные по дням

### Диёр (web/)

- [ ] **V5-3.5** Выбор времени на web клиенте:
  - SlotPicker компонент на странице `/consultation`
  - Сетка времени + DatePicker

---

## Этап 4 — Web Voice UI

> **Голосовой интерфейс в web клиенте**
> **Срок: 2-3 дня**

### Диёр (web/)

- [ ] **V5-4.1** Страница `/voice-agent`:
  - Кнопка микрофона (MediaRecorder → blob webm → POST /voice-agent/transcribe)
  - Chat UI (тот же паттерн что в mobile)
  - Воспроизведение TTS: `new Audio(blobUrl).play()`
  - Результат: карточки с кнопками перехода

- [ ] **V5-4.2** VoiceAssistant компонент:
  - `web/components/VoiceAssistant.tsx` — переиспользуемый
  - CSS анимации: pulse (запись), wave (воспроизведение)
  - Responsive (mobile web тоже)

- [ ] **V5-4.3** Навигация:
  - Кнопка "Голосовой ассистент" на главной
  - `recommendation: NURSE` → `/order/confirm`
  - `recommendation: DOCTOR` → `/doctors`

---

## Этап 5 — Admin мониторинг

> **Админ видит статистику голосовых сессий**
> **Срок: 1-2 дня**

### Абубакир (backend)

- [ ] **V5-5.1** Admin endpoints:
  - `GET /admin/voice-sessions` — список с фильтрами (дата, статус, recommendation)
  - `GET /admin/voice-sessions/stats` — всего сессий, конверсия, топ симптомы
  - `GET /admin/voice-sessions/:id` — полная история диалога

### Диёр (admin/)

- [ ] **V5-5.2** Страница "Голосовой агент":
  - `admin/src/pages/VoiceAgent.tsx`
  - Карточки KPI: сессий сегодня, конверсия в заказы (%), конверсия в консультации (%)
  - Таблица сессий: дата, клиент, длительность, обмены, рекомендация, результат
  - Клик → модал с историей диалога
  - Графики: сессии по дням, топ-5 симптомов (pie chart)

- [ ] **V5-5.3** Sidebar + роутинг:
  - Добавить "Голосовой агент" (иконка Mic) в AdminSidebar
  - Route `/voice-agent` в App.tsx

---

## Этап 6 — Интеграция с DMED (стратегический)

> **Подключение к государственной системе — долгосрочная цель**
> **Срок: зависит от переговоров с UZINFOCOM/Минздрав**

- [ ] **V5-6.1** Изучить DMED API (если открытый) — MED-ID, электронные рецепты
- [ ] **V5-6.2** Подать предложение в UZINFOCOM как партнёр по модулю "медсестра на дом"
- [ ] **V5-6.3** Интеграция рецептов: врач выписывает в HamshiraGo → синхронизация с DMED
- [ ] **V5-6.4** MED-ID авторизация: клиент входит через DMED ID

---

## Сводная таблица

| Этап | Абубакир | Диёр | Срок |
|------|----------|------|------|
| **0. Doctor Auth** | Backend auth + medic/ app doctor tabs | web-medic doctor pages | 2-3 дня |
| **1. Voice API** | Backend STT/LLM/TTS module | — | 3-4 дня |
| **2. Mobile Voice** | mobile/ voice-agent screen | — | 3-4 дня |
| **3. Schedule** | Backend slots + mobile picker | web-medic schedule + web picker | 2-3 дня |
| **4. Web Voice** | — | web/ voice-agent page | 2-3 дня |
| **5. Admin** | Backend stats endpoints | admin/ VoiceAgent page | 1-2 дня |
| **6. DMED** | Интеграция API | — | TBD |
| **Итого** | | | **~14-19 дней** |

## Стек и затраты

| Компонент | Провайдер | Цена |
|-----------|----------|------|
| STT | Groq Whisper (бесплатно 28.8K сек/день) | $0 |
| LLM | Claude Haiku (уже есть ключ) | ~$0.001/запрос |
| TTS RU | OpenAI TTS `nova` | ~$15/1M символов |
| TTS UZ | OpenAI TTS `nova` (MVP) → ElevenLabs (v2) | $0 MVP / $22/мес v2 |
| Video | LiveKit (уже настроен) | бесплатный tier |
| **Итого MVP** | | **~$30-50/мес** |
