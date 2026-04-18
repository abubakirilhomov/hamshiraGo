# HamshiraGo — Backend ↔ Frontend Integration Gaps

> Дата анализа: 2026-04-18
> Backend endpoints готовы, но frontend не вызывает их.

---

## CRITICAL — Сломанный бизнес-flow

### 1. finalPrice (ценовой диапазон операции) — ВЕСЬ ПОТОК НЕ РАБОТАЕТ

**Backend готов:** `PATCH /orders/:id/final-price` + поля `priceMin/priceMax/finalPrice` в Order entity

**Что не сделано:**

| Зона | Проблема | Кто делает |
|------|----------|-----------|
| **web-medic** | `api.ts:124` определяет `setFinalPrice()` но НИ ОДНА страница не вызывает его. Мёртвый код | Жафар |
| **medic (Expo)** | Нет UI для ввода итоговой цены после операции. Медик не может завершить заказ с переменной ценой | Абубакир |
| **web (клиент)** | `orders/page.tsx:73` показывает priceMin/priceMax range, но finalPrice не отображается | Диёр |
| **mobile (клиент)** | Нет отображения ни priceMin/priceMax, ни finalPrice | Абубакир |

**Как должно работать:**
1. Админ создаёт услугу с `priceMin=300000, priceMax=450000`
2. Клиент видит "от 300 000 до 450 000 UZS" при заказе
3. Медик выполняет операцию
4. Медик вводит итоговую цену (например 350 000) через UI
5. `PATCH /orders/:id/final-price { finalPrice: 350000 }` → backend валидирует range
6. Клиент видит подтверждённую цену

---

## HIGH — Медик не может вывести деньги с мобильного

### 2. Withdrawal request в medic/ Expo

**Backend готов:** `POST /medics/me/withdrawal-request { amount, cardNumber? }`

**Что не сделано:**

| Зона | Проблема | Кто делает |
|------|----------|-----------|
| **medic (Expo)** | `profile.tsx` показывает баланс и earnings, но нет кнопки "Вывести средства" | Абубакир |
| **web-medic** | ИНТЕГРИРОВАН — `wallet/page.tsx` вызывает `wallet.requestWithdrawal()` | — |
| **admin** | ИНТЕГРИРОВАН — `Payouts.tsx` вызывает approve/decline | — |

---

## MEDIUM — App Store требование

### 3. Account deletion в mobile/ Expo

**Backend готов:** `DELETE /auth/account`

**Что не сделано:**

| Зона | Проблема | Кто делает |
|------|----------|-----------|
| **mobile (Expo)** | Нет кнопки "Удалить аккаунт" в профиле. App Store/Google Play ТРЕБУЮТ эту кнопку | Абубакир |
| **web** | ИНТЕГРИРОВАН — `profile/page.tsx:95` вызывает `api.auth.deleteAccount()` | — |

---

## LOW — Не критично

### 4. Companies/Clinics в mobile/ Expo

**Backend готов:** `GET /companies`, `GET /companies/:id`

| Зона | Проблема | Кто делает |
|------|----------|-----------|
| **mobile (Expo)** | Нет экрана просмотра клиник. Клиент на mobile не может найти клиники | Абубакир |
| **web** | ИНТЕГРИРОВАН — `clinics/page.tsx` + `clinics/[id]/page.tsx` | — |

### 5. priceMin/priceMax display

| Зона | Проблема | Кто делает |
|------|----------|-----------|
| **mobile (Expo)** | OrderCard и order confirm не показывают диапазон цен | Абубакир |
| **medic (Expo)** | Не показывает диапазон в деталях заказа | Абубакир |

---

## Итоговая таблица

| # | Feature | Backend | web | web-medic | mobile | medic | admin |
|---|---------|---------|-----|-----------|--------|-------|-------|
| 1 | finalPrice UI | READY | Partial | Dead code | NO | NO | — |
| 2 | Withdrawal | READY | — | YES | — | NO | YES |
| 3 | Account delete | READY | YES | — | NO | — | — |
| 4 | Companies browse | READY | YES | — | NO | — | YES |
| 5 | Price range display | READY | Partial | Partial | NO | NO | — |
| 6 | Doctor rating | READY | YES | — | YES | — | — |
| 7 | Consultation payment | READY | YES | — | YES | — | — |
| 8 | Doctor web push | READY | — | YES | — | — | — |
| 9 | Unified doctor login | READY | — | YES | — | — | — |
| 10 | Clinic appointments | READY | — | YES | — | — | — |

---

## Приоритет исполнения

### Абубакир (mobile + medic Expo)
1. ~~finalPrice UI в medic~~ → нужен UI для ввода цены после операции
2. Withdrawal request UI в medic → кнопка "Вывести" + форма (сумма, карта)
3. Account deletion в mobile → кнопка + Alert + DELETE /auth/account
4. priceMin/priceMax display в mobile → показать "от X до Y" в OrderCard

### Диёр (web)
1. finalPrice display в web/orders → показать итоговую цену если есть
2. priceMin/priceMax range display в web/order/confirm → "от X до Y UZS"

### Жафар (web-medic)
1. **CRITICAL:** finalPrice UI в web-medic → страница заказа + кнопка "Ввести итоговую цену" + вызов `setFinalPrice()` из `api.ts:124`
