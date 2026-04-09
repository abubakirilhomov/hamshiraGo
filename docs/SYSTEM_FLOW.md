# HamshiraGo — Архитектура и потоки системы

## 1. Общая архитектура

```mermaid
graph TB
    subgraph Клиенты
        MOB[Mobile App<br/>Expo React Native]
        WEB[Web Client<br/>Next.js]
        MED[Medic App<br/>Expo React Native]
        DOC[Doctor App<br/>в Medic App]
        ADM[Admin Panel<br/>React Vite]
    end

    subgraph Backend["Backend (NestJS + Railway)"]
        API[REST API]
        WS[WebSocket<br/>Socket.IO]
        CRON[Cron Jobs]
    end

    subgraph Внешние сервисы
        PG[(PostgreSQL)]
        CLD[Cloudinary<br/>Фото/документы]
        ANTH[Anthropic<br/>Claude Haiku]
        GROQ[Groq<br/>Whisper STT]
        LK[LiveKit<br/>Видеозвонки]
        TG[Telegram Bot]
        PUSH[Expo Push]
        OSRM[OSRM<br/>Маршруты]
    end

    MOB <--> API
    WEB <--> API
    MED <--> API
    DOC <--> API
    ADM <--> API
    MOB <--> WS
    MED <--> WS
    DOC <--> WS

    API <--> PG
    API --> CLD
    API --> ANTH
    API --> GROQ
    API --> LK
    API --> TG
    API --> PUSH
    API --> OSRM
```

---

## 2. Путь клиента — заказ медсестры

```mermaid
sequenceDiagram
    participant C as Клиент
    participant API as Backend
    participant D as Dispatch
    participant M as Медсестра
    participant TG as Telegram

    C->>API: POST /orders (serviceId, location)
    API->>API: Рассчитать цену + комиссия 10%
    API->>D: startDispatch(orderId)
    
    loop До 10 попыток (60 сек каждая)
        D->>D: selectBestMedic (расстояние + рейтинг + расписание)
        D->>M: WebSocket: dispatch_invite
        D->>M: Push notification
        D->>TG: Telegram: кнопки Принять/Отклонить
        
        alt Медсестра принимает
            M->>API: POST /orders/:id/accept
            API->>C: WebSocket: order_status = ASSIGNED
            API->>C: Push: "Медик найден!"
        else Таймаут 60 сек
            D->>D: advanceDispatch → следующий медик
        end
    end

    M->>API: PATCH status = ON_THE_WAY
    API->>C: WebSocket: order_status + etaMinutes
    
    M->>API: PATCH status = ARRIVED
    API->>C: Push: "Медик прибыл!"
    
    M->>API: PATCH status = SERVICE_STARTED
    M->>API: POST /orders/:id/photo (before)
    
    M->>API: PATCH status = DONE
    M->>API: POST /orders/:id/photo (after)
    API->>API: Начислить earnings медику
    API->>C: Push: "Заказ завершён!"
    C->>API: POST /orders/:id/rate (1-5 )
```

---

## 3. Salomat — AI ассистент

```mermaid
sequenceDiagram
    participant P as Пациент
    participant API as Backend
    participant AI as Claude Haiku
    participant AUD as Audit Log

    P->>P: Открыть чат Salomat
    P->>P: Принять disclaimer (первый раз)
    
    P->>API: POST /ai-chat/stream (message)
    API->>API: checkRateLimit (50/день)
    API->>API: Загрузить knowledge base<br/>(triage + safety + tone)
    API->>API: Загрузить профиль пациента
    API->>AI: messages + system prompt
    
    loop SSE streaming
        AI-->>API: chunk текста
        API-->>P: SSE: data: {text: "..."}
    end
    
    API->>API: Парсить рекомендацию
    
    alt Уровень 1 — СКОРАЯ
        API->>AUD: log RED_FLAG
        API-->>P: "Вызовите 103 немедленно!"
        P->>P: Кнопка "Позвонить 103"
    else Уровень 3 — К врачу
        API->>AUD: log DOCTOR_REFERRAL
        API-->>P: "Обратитесь к кардиологу"
        P->>P: Кнопка "Shifokor tanlash"
        P->>API: POST /consultations (с Salomat summary)
    else Уровень 3 — Медсестра
        API->>AUD: log NURSE_REFERRAL
        API-->>P: "Вам нужна капельница"
        P->>P: Кнопка "Hamshira chaqirish"
        P->>API: POST /orders
    else Уровень 4 — Самопомощь
        API-->>P: "Отдых, обильное питьё..."
    end
```

---

## 4. Голосовой агент

```mermaid
sequenceDiagram
    participant P as Пациент
    participant APP as Expo-AV
    participant API as Backend
    participant GRQ as Groq Whisper
    participant AI as Claude Haiku

    P->>APP: Нажать + держать микрофон
    APP->>APP: Запись аудио (m4a)
    P->>APP: Отпустить
    
    APP->>API: POST /voice-agent/transcribe (audio file)
    API->>GRQ: Whisper Large v3
    GRQ-->>API: { text: "У меня болит голова" }
    API-->>APP: { text, duration }
    
    APP->>API: POST /voice-agent/chat (text + sessionId)
    API->>AI: Claude + knowledge base
    AI-->>API: reply + recommendation
    API-->>APP: { reply, recommendation, sessionComplete }
    
    APP->>P: Показать текст ответа
    
    Note over P,APP: TTS озвучка (когда будет OpenAI ключ)
```

---

## 5. Консультация с врачом

```mermaid
sequenceDiagram
    participant C as Клиент
    participant API as Backend
    participant D as Врач
    participant LK as LiveKit

    C->>API: POST /consultations (doctorId, symptoms, slotId)
    API->>API: Забронировать слот
    API->>API: Сгенерировать Salomat summary
    API->>D: Push: "Новая консультация!"
    API->>D: WebSocket: new_consultation
    API->>D: Telegram: уведомление
    
    D->>API: POST /consultations/:id/doctor-accept
    API->>C: Push: "Врач принял!"
    
    C->>API: POST /consultations/:id/call
    API->>LK: Создать комнату
    API-->>C: { token, serverUrl, roomName }
    
    D->>API: POST /consultations/:id/call/join
    API-->>D: { token, serverUrl, roomName }
    
    Note over C,D: Видеозвонок через LiveKit
    
    D->>API: POST /consultations/:id/call/end
    D->>API: PATCH /consultations/:id/doctor-complete
    Note right of D: doctorNotes + рецепт
    
    API->>C: Push: "Консультация завершена"
    API->>C: Push: "Новый рецепт!"
    
    C->>API: POST /prescriptions/:id/confirm
    API->>API: Создать заказ на медсестру
```

---

## 6. Dispatch алгоритм

```mermaid
flowchart TD
    START([Новый заказ]) --> SEARCH[Поиск медиков]
    
    SEARCH --> F1{Онлайн?}
    F1 -->|Нет| SKIP1[Пропустить]
    F1 -->|Да| F2{Верифицирован?}
    
    F2 -->|Нет| SKIP2[Пропустить]
    F2 -->|Да| F3{В рабочих часах?}
    
    F3 -->|Нет| SKIP3[Пропустить]
    F3 -->|Да| F4{В радиусе 15км?}
    
    F4 -->|Нет| SKIP4[Пропустить]
    F4 -->|Да| F5{В рабочей зоне?}
    
    F5 -->|Нет| SKIP5[Пропустить]
    F5 -->|Да| RANK[Ранжирование]
    
    RANK --> R1{Избранный медик?}
    R1 -->|Да| INVITE[Отправить приглашение]
    R1 -->|Нет| R2[Сортировать по расстоянию]
    R2 --> INVITE
    
    INVITE --> WAIT{60 сек ожидание}
    WAIT -->|Принял| ASSIGN[Назначен]
    WAIT -->|Отклонил| NEXT{Ещё попытки?}
    WAIT -->|Таймаут| NEXT
    
    NEXT -->|Да, < 10| SEARCH
    NEXT -->|Нет, 10 попыток| RETRY{Были попытки?}
    
    RETRY -->|Да| WAIT5[Повтор через 5 мин]
    WAIT5 --> SEARCH
    RETRY -->|Нет кандидатов| CANCEL[Отмена заказа]
```

---

## 7. Роли и доступ

```mermaid
graph LR
    subgraph JWT Роли
        CL[Client<br/>role: client]
        MC[Medic<br/>role: medic]
        DC[Doctor<br/>role: doctor]
        AD[Admin<br/>role: admin]
    end

    subgraph Доступ
        CL --> O1[Заказы]
        CL --> O2[Консультации]
        CL --> O3[Salomat чат]
        CL --> O4[Голосовой агент]
        CL --> O5[Лояльность/подписки]
        
        MC --> M1[Принять заказ]
        MC --> M2[GPS трекинг]
        MC --> M3[Фото до/после]
        MC --> M4[Расписание]
        
        DC --> D1[Принять консультацию]
        DC --> D2[Видеозвонок]
        DC --> D3[Рецепт]
        DC --> D4[Слоты расписания]
        
        AD --> A1[Верификация]
        AD --> A2[Аналитика]
        AD --> A3[Salomat аудит]
        AD --> A4[Push кампании]
    end
```

---

## 8. Статусы заказа

```mermaid
stateDiagram-v2
    [*] --> CREATED: Клиент создал
    CREATED --> ASSIGNED: Dispatch нашёл медика
    CREATED --> CANCELED: Нет медиков / клиент отменил
    
    ASSIGNED --> ACCEPTED: Медик подтвердил
    ASSIGNED --> CANCELED: Медик/клиент отменил
    
    ACCEPTED --> ON_THE_WAY: Медик выехал
    ON_THE_WAY --> ARRIVED: Медик прибыл
    ARRIVED --> SERVICE_STARTED: Процедура началась
    SERVICE_STARTED --> DONE: Завершено
    
    DONE --> [*]
    CANCELED --> [*]
```

---

## 9. Технический стек

```mermaid
graph TB
    subgraph Frontend
        M1[Mobile Client<br/>Expo SDK 52 + React Native]
        M2[Medic/Doctor App<br/>Expo SDK 52 + React Native]
        W1[Web Client<br/>Next.js 16]
        W2[Web Medic<br/>Next.js 16]
        A1[Admin<br/>React + Vite + shadcn/ui]
        L1[Landing<br/>Next.js + SEO]
    end

    subgraph Backend
        N1[NestJS 10<br/>TypeORM + PostgreSQL]
        N2[Socket.IO<br/>Real-time]
        N3[JWT Auth<br/>4 роли]
    end

    subgraph AI
        AI1[Claude Haiku<br/>Salomat чат + триаж]
        AI2[Groq Whisper<br/>Голос → текст]
        AI3[OpenAI TTS<br/>Текст → голос]
    end

    subgraph Infra
        RW[Railway<br/>Backend hosting]
        VR[Vercel<br/>Web hosting]
        PG[(PostgreSQL<br/>Railway)]
        CD[Cloudinary<br/>Media]
    end
```

---

## 10. Денежный поток

```mermaid
flowchart LR
    C[Клиент] -->|Оплата| P[Payme / Click]
    P -->|100%| SYS[HamshiraGo]
    SYS -->|90%| M[Медсестра]
    SYS -->|10%| FEE[Комиссия платформы]
    
    C2[Клиент] -->|Оплата консультации| SYS
    SYS -->|85%| D[Врач]
    SYS -->|15%| FEE2[Комиссия]
```

