---
name: playwright-runner
description: Runs and writes Playwright API tests for HamshiraGo backend. Use when running tests, adding new test cases, or debugging test failures.
---

# Playwright Runner — HamshiraGo

## Структура tests/
```
tests/
├── package.json           # @playwright/test dependency
├── playwright.config.ts   # baseURL из env, таймауты
└── api/
    ├── health.spec.ts     # GET /services — API alive check
    ├── auth.spec.ts       # Регистрация + логин клиента и медика
    └── orders.spec.ts     # Создание заказа (полный flow)
```

## Запуск тестов
```bash
cd /Users/rpg/desktop/hamshirago-mobile/tests

# Установить зависимости (первый раз)
npm install

# Все тесты
npm test

# Только API тесты
npm run test:api

# Конкретный файл
npx playwright test api/auth.spec.ts

# С детальным выводом
npx playwright test --reporter=list

# Против локального сервера
API_URL=http://localhost:3000 npm test

# Против продакшна
API_URL=https://hamshirago-production-0a65.up.railway.app npm test
```

## Переменные окружения
```bash
API_URL=https://hamshirago-production-0a65.up.railway.app  # default
TEST_CLIENT_PHONE=+998901111111
TEST_CLIENT_PASSWORD=test1234
TEST_MEDIC_PHONE=+998902222222
TEST_MEDIC_PASSWORD=test1234
```

## Паттерн нового теста

### API тест с авторизацией
```typescript
import { test, expect, APIRequestContext } from '@playwright/test';

test.describe('Feature Name', () => {
  let request: APIRequestContext;
  let token: string;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.API_URL || 'http://localhost:3000',
    });

    // Получить токен
    const res = await request.post('/auth/login', {
      data: { phone: '+998901111111', password: 'test1234' },
    });
    const body = await res.json();
    token = body.access_token;
  });

  test('should do something', async () => {
    const res = await request.get('/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test.afterAll(async () => {
    await request.dispose();
  });
});
```

## Полезные assertions
```typescript
// Статус
expect(res.status()).toBe(201);

// Поля в ответе
const body = await res.json();
expect(body).toHaveProperty('access_token');
expect(body.user.phone).toBe('+998901111111');

// Массив
expect(Array.isArray(body.data)).toBeTruthy();
expect(body.data.length).toBeGreaterThan(0);

// Ошибка
expect(res.status()).toBe(400);
const err = await res.json();
expect(err.message).toContain('phone');
```

## Добавление нового тест-файла
1. Создай `tests/api/<feature>.spec.ts`
2. Следуй паттерну выше
3. Запусти `npx playwright test api/<feature>.spec.ts --reporter=list`
4. Обнови `docs/tasks.md` / `docs/done.md`
