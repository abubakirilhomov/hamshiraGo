---
name: api-tester
description: Tests HamshiraGo REST API endpoints manually using curl. Use when you need to verify an endpoint works, debug a response, or check authentication flow.
---

# API Tester — HamshiraGo

## Base URL
```
Production: https://hamshirago-production-0a65.up.railway.app
Local:      http://localhost:3000
```

## Workflow: получить токен → сделать запрос → проверить ответ

### 1. Зарегистрировать / войти как клиент
```bash
# Регистрация
curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998901111111","password":"test1234"}' | jq .

# Логин
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998901111111","password":"test1234"}' | jq -r .access_token)
echo "Token: $TOKEN"
```

### 2. Войти как медик
```bash
TOKEN_MEDIC=$(curl -s -X POST $API/medics/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998902222222","password":"test1234"}' | jq -r .access_token)
```

### 3. Авторизованный запрос
```bash
curl -s -H "Authorization: Bearer $TOKEN" $API/orders | jq .
```

## Все эндпоинты

### Auth (клиент)
| Метод | URL | Auth |
|-------|-----|------|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |
| POST | `/auth/push-token` | Client JWT |

### Медики
| Метод | URL | Auth |
|-------|-----|------|
| POST | `/medics/register` | — |
| POST | `/medics/login` | — |
| GET | `/medics/me` | Medic JWT |
| PATCH | `/medics/location` | Medic JWT |
| POST | `/medics/documents` | Medic JWT |

### Заказы (клиент)
| Метод | URL | Auth |
|-------|-----|------|
| POST | `/orders` | Client JWT |
| GET | `/orders` | Client JWT |
| GET | `/orders/:id` | Client JWT |
| POST | `/orders/:id/cancel` | Client JWT |
| POST | `/orders/:id/rate` | Client JWT |

### Заказы (медик)
| Метод | URL | Auth |
|-------|-----|------|
| GET | `/orders/available` | Medic JWT |
| POST | `/orders/:id/accept` | Medic JWT |
| PATCH | `/orders/:id/status` | Medic JWT |

### Каталог услуг
| Метод | URL | Auth |
|-------|-----|------|
| GET | `/services` | — |

## Примеры тестирования

### Создать заказ
```bash
# 1. Получить serviceId
SERVICE_ID=$(curl -s $API/services | jq -r '.[0].id')

# 2. Создать заказ
curl -s -X POST $API/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceId\": \"$SERVICE_ID\",
    \"discountAmount\": 0,
    \"location\": {
      \"house\": \"ул. Навои 15\",
      \"floor\": \"3\",
      \"apartment\": \"12\",
      \"phone\": \"+998901111111\",
      \"latitude\": 41.2995,
      \"longitude\": 69.2401
    }
  }" | jq .
```

### Проверить статус ответа
```bash
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" $API/orders)
echo "HTTP: $HTTP_CODE"
# Ожидаемо: 200
```

## Ожидаемые HTTP коды
- `200` — успех (GET, PATCH)
- `201` — создано (POST register/login/orders)
- `204` — без тела (push-token, location)
- `400` — ошибка валидации
- `401` — нет/невалидный токен
- `403` — заблокирован или нет прав роли
- `404` — не найдено
- `429` — rate limit (5 req/min register, 10 req/min login)
