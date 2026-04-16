# Задачи для Диёра — HamshiraGo

> Обновлено: 2026-04-16

---

## 🚀 Деплой (приоритет 1)

- [ ] Задеплоить **backend** на Railway (`git push` → auto-deploy)
- [ ] Задеплоить **admin** на Railway / Vercel
- [ ] Задеплоить **web** (клиент) на Railway
- [ ] Задеплоить **web-medic** на Railway
- [ ] Задеплоить **landing** (hamshirago.uz)
- [ ] Проверить что все env переменные актуальны на Railway (`DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `VAPID_*`)

---

## 🐛 Баги — web / web-medic / admin

- [x] **BUG 14** — web-medic загружает все заказы чтобы найти один по id → уже исправлен (medicApi.orders.get(id))
- [x] **BUG 15** — web client передаёт лишние поля в `CreateOrderDto` → уже исправлен
- [x] **BUG 26** — `BASE_URL` захардкожен `localhost:3000` в web и web-medic → уже исправлен
- [x] **BUG 27** — `api.orders.list()` ожидает массив, бэкенд возвращает `{ data, total, page }` → уже исправлен
- [x] **BUG 28** — WebSocket cleanup не эмитит `unsubscribe_order` при размонтировании (web) → исправлен 2026-04-16
- [x] **BUG 29** — web-клиент может напрямую поставить статус `DONE` → исправлен 2026-04-16 (canConfirmDone=false)
- [x] **BUG 30** — Dashboard считает доход только по первым 100 заказам → уже исправлен (полная пагинация)
- [x] **BUG 31** — Dashboard "сегодня" ограничен 100 заказами → уже исправлен (while loop + totalPages)
- [ ] **BUG 32** — Admin роутер проверяет только наличие токена, не его валидность → backend задача
- [ ] **BUG 33** — Admin JWT хранится в `localStorage` → уязвимость к XSS, перевести на httpOnly cookie → backend задача

---

## 📋 Фичи V1

- [ ] Разделить таблицу `payments` → отдельный `payments_ledger` для прозрачности финансов
- [ ] Фильтр услуг по категории на главном экране mobile / web
- [ ] Повторный заказ — кнопка "Заказать снова" в истории заказов
- [ ] Push-уведомления на web (web-push уже есть, проверить интеграцию)

---

## ✅ Уже сделано в этом PR (для контекста)

- Admin панель: полный i18n (ru + uz) для всех страниц
- Admin: PWA install кнопка в navbar, кастомный логотип
- Логотип заменён во всех проектах (admin, web, web-medic, landing)
- Favicon обновлён во всех проектах (убран `favicon.ico` с буквой "H")
- SplashScreen web / web-medic: новый логотип
- Auth страницы web / web-medic: новый логотип вместо `FaMedkit`
- Landing: dark/light mode переключатель
