---
name: docs-syncer
description: Updates tasks.md and done.md after any code changes. Use after completing any task to keep documentation in sync.
---

# Docs Syncer — HamshiraGo

## Задача
После любых изменений кода обновить `docs/tasks.md` и `docs/done.md`.

## Формат docs/tasks.md

```markdown
# HamshiraGo — Активные задачи

> Обновляется при каждом изменении. Выполненные задачи переносить в `done.md`.

---

## 🐛 Баги (открытые, в нашей зоне: backend / mobile / medic)

- [ ] Краткое описание — файл/модуль

---

## ⛔ Баги вне зоны изменений (read-only: web / web-medic / admin)

- BUG N: описание

---

## 📋 Задачи

- [ ] Краткое описание — файл/модуль

---

## 💡 Идеи / V1

- [ ] Краткое описание
```

## Формат docs/done.md

```markdown
## YYYY-MM-DD

- **[тип]** Краткое описание — что изменено (файл/модуль)
```

**Типы**: `[backend]`, `[mobile]`, `[medic]`, `[tests]`, `[docs]`, `[config]`

## Алгоритм обновления

### После выполненной задачи:
1. **Прочитать** `docs/tasks.md`
2. **Найти** строку с выполненной задачей
3. **Удалить** её из `tasks.md` (или сменить `[ ]` → убрать)
4. **Прочитать** `docs/done.md`
5. **Добавить** запись в начало нужного `## YYYY-MM-DD` раздела
   - Если раздел с сегодняшней датой уже есть — добавить строку туда
   - Если нет — создать новый `## YYYY-MM-DD` в начале файла (после заголовка)

### Пример: что писать в done.md
```
## 2026-03-02

- **[backend]** BUG 42: Исправлен race condition в acceptOrder — добавлен атомарный UPDATE (`backend/src/orders/orders.service.ts`)
- **[mobile]** Добавлена плавная интерполяция маркера медика на карте (`mobile/app/order/track.tsx`)
- **[tests]** Добавлен health check тест (`tests/api/health.spec.ts`)
```

## Проверка соответствия CLAUDE.md

Перед фиксацией убедиться:
- [ ] Баги в read-only зонах (web/admin) — только в разделе "⛔ Баги вне зоны", не в активных
- [ ] Каждая запись в done.md содержит: тип + описание + файл
- [ ] Дата в формате `YYYY-MM-DD`
- [ ] Нет дублирования между tasks.md и done.md

## Текущая дата
Всегда использовать актуальную дату (`date +%Y-%m-%d` или из контекста).
