# HamshiraGo — Changelog April 14-18, 2026

## Что изменилось за 5 дней

---

### Архитектура

**До:** Монолит — один NestJS процесс с 27 модулями, один Railway сервис.

**После:** NestJS Monorepo — 4 независимых микросервиса на Railway:

| Сервис | URL | Что делает |
|--------|-----|------------|
| **API** | hamshirago-production-0a65.up.railway.app | Auth, orders, medics, doctors, consultations, все остальное |
| **Voice Agent** | voice-agent-production-e01d.up.railway.app | Salomat AI: STT (Groq Whisper), chat (Claude Haiku), TTS (OpenAI) |
| **Payments** | payments-production-7853.up.railway.app | Payme/Click webhooks, payment initiation |
| **Clinic** | clinic-production-baa2.up.railway.app | Clinic management, appointments, staff, rooms, leads |

Все сервисы используют одну PostgreSQL и один JWT_SECRET.

---

### Новые Backend Endpoints (14-18 апреля)

#### Бизнес-логика
- `POST /consultations/:id/rate` — рейтинг врача (1-5 + комментарий)
- `GET /companies` + `GET /companies/:id` — публичный список клиник (без auth)
- `POST /medics/me/withdrawal-request` — запрос вывода средств
- `GET/POST /medics/admin/withdrawal-requests/*` — админ управление выплатами
- `POST /payments/consultation/:id/initiate` — оплата консультации (Payme/Click)
- `GET /payments/consultation/:id/status` — статус оплаты консультации
- `PATCH /orders/:id/final-price` — итоговая цена для операций с диапазоном
- `DELETE /auth/account` — удаление аккаунта (soft-delete + анонимизация)
- `POST /doctors/web-push-subscription` — web push для врачей
- `POST /doctors/login` — единый логин (independent + clinic doctors)

#### Поля в Entity
- **Service:** `priceMin`, `priceMax` — диапазон цен для операций
- **CompanyService:** `priceMin`, `priceMax` — переопределение для клиники
- **Order:** `priceMin`, `priceMax`, `finalPrice` — snapshot + итоговая цена
- **Consultation:** `clientRating`, `clientComment`, `paymentStatus`
- **Doctor:** `ratingCount`
- **User:** `deletedAt` (soft-delete)
- **Payment:** `consultationId` (nullable FK to Consultation)
- **WithdrawalRequest** — новая entity целиком

---

### Исправленные баги (35+ fixes)

#### Финансовые (CRITICAL)
- Врач принимал неоплаченную консультацию → теперь проверка paymentStatus
- Завершение консультации не начисляло врачу деньги → начисляет balance + earnings
- Отмена консультации не возвращала деньги → revert paymentStatus + cancel ClinicAppointment
- Отмена заказа не возвращала комиссию медику → refund platformFee
- Order DONE не начислял medic.balance → теперь balance + earnings
- Payme/Click cancel не сбрасывал paymentStatus → сбрасывает

#### Безопасность
- `GET /consultations/:id` — ownership check (только свой клиент/врач)
- Withdrawal — pessimistic_write внутри transaction
- Click complete — pessimistic_write lock
- Voice agent endpoints — JwtAuthGuard + Throttle (были публичные)
- Rate limit 30→5 req/min на registration
- CORS ограничен до `hamshirago-production*.up.railway.app`
- Raw SQL `RETURNING *` → конкретные колонки (без passwordHash)
- Blocked doctor check в createConsultation + doctorAccept
- `health/detailed` защищён AdminGuard

#### Целостность
- Consultation cancel: отменяет ClinicAppointment + декрементирует consultationCount
- Account delete: отменяет consultations + full UUID для phone анонимизации
- Order DONE: оба пути (client/medic) делают ledger + loyalty + referral
- Referral code: `crypto.randomBytes` вместо `Math.random`
- JWT expiry унифицирован (7d для всех модулей)
- Consultation platformFee из AppSettings (не hardcoded 15%)
- Payment entity: FK `@ManyToOne` к Consultation

#### Производительность
- Dispatch N+1: batch `filterAvailableMedicsNow` (1 запрос вместо 50)
- Multi-service order N+1: batch `getActiveServicesByIds`
- Composite indexes на `chat_messages` (orderId + createdAt)
- `@Index` на `referrals.referrerId/referredId`
- `take(100)` safety cap на admin list endpoints
- `console.error` → structured Logger

#### Mobile
- Rating API: `JSON.stringify` для body
- Push handlers: добавлены `consultation` и `video_call` типы
- Token validation на cold start (`/auth/me`)
- WS disconnect: жёлтый "Connecting..." индикатор
- Hardcoded UZ строки → i18n
- Medic phone placeholder: убран дублирующийся +998

---

### Документация
- `docs/BACKEND_API.md` — полная документация ~170 endpoints
- `docs/COMPETITIVE_ANALYSIS.md` — конкурентный анализ (OVI.uz, Practo, Halodoc, Vezeeta)
- `docs/CHANGELOG_APRIL_2026.md` — этот файл
- `backend/DEPLOY.md` — инструкция деплоя микросервисов
- `CLAUDE.md` — обновлён для monorepo структуры

---

### Salomat AI улучшения
- Инжектирован список врачей (топ-20 по рейтингу) в system prompt
- AI теперь рекомендует конкретного врача по имени, специализации и цене
- Web push клинике при новом лиде от Salomat

### Clinic интеграция
- Consultation → ClinicAppointment автоматически при записи к врачу клиники
- CEO получает уведомление (Socket.IO + Web Push + Telegram)
- Web push тип 'clinic' добавлен в WebPushService
