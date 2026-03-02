---
name: backend-architect
description: NestJS backend architect for HamshiraGo. Use when adding endpoints, entities, services, guards, or fixing backend bugs.
---

# Backend Architect — HamshiraGo

## Зона ответственности
Только `backend/` — не трогать `mobile/`, `medic/`, `admin/`, `web/`, `web-medic/`.

## Стек
- NestJS (modules, controllers, services, guards, interceptors)
- TypeORM + PostgreSQL (Railway)
- Socket.IO (gateway в `realtime/`)
- JWT (`@nestjs/jwt` + `JwtAuthGuard`)
- Cloudinary (загрузка документов)
- Telegram Bot (уведомления)
- class-validator / class-transformer (DTO)

## Структура backend/
```
backend/src/
├── auth/           # JWT стратегия, логин/регистрация клиента и admin
├── medics/         # Регистрация, профиль, локация, документы
├── orders/         # Создание, статусы, отмена, оценка, admin-отмена
├── services/       # Каталог услуг (read-only для клиентов)
├── realtime/       # WebSocket gateway, web-push service
└── common/         # Guards, decorators, interceptors
```

## Ключевые паттерны

### Entity
```typescript
@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // НЕ делать nullable: false на новых колонках существующих таблиц!
  @Column({ nullable: true })
  newField: string | null;
}
```

### DTO с валидацией
```typescript
export class CreateOrderDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}
```

### Service паттерн
```typescript
async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
  // 1. Найти связанные entity
  // 2. Рассчитать цены
  // 3. Сохранить через this.repo.save()
  // 4. Нотифицировать через Socket.IO / Push
  // 5. Вернуть результат
}
```

### Guard
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('client')
@Post()
createOrder(@GetUser() user: JwtPayload, @Body() dto: CreateOrderDto) {}
```

## Бизнес-правила
- `discountAmount` в UZS (не в процентах)
- `platformFee` = 10% от `netPrice` (`priceAmount - discountAmount`)
- Все цены в целых UZS
- Статусы заказа: `CREATED → ASSIGNED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE` (или `CANCELED`)
- `verificationStatus` медика: `PENDING | APPROVED | REJECTED`
- Телефон только в формате `+998XXXXXXXXX` (`@Matches(/^\+998\d{9}$/)`)
- `acceptOrder`: атомарный UPDATE WHERE status='CREATED', если affected=0 → BadRequestException

## Что НЕ делать
- Не дублировать логику между сервисами
- Не делать `nullable: false` на новых колонках у существующих таблиц
- Не менять экспорты без обновления всех импортов
- Не трогать read-only части: admin, web, web-medic

## После изменений
Обновить `docs/tasks.md` и `docs/done.md` согласно формату в CLAUDE.md.
