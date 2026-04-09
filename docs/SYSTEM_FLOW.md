# HamshiraGo — Архитектура и потоки системы

## 1. Общая архитектура

```mermaid
graph TB
    subgraph Клиенты
        MOB[📱 Mobile App<br/>Expo React Native]
        WEB[🌐 Web Client<br/>Next.js]
        MED[👩‍⚕️ Medic App<br/>Expo React Native]
        DOC[🩺 Doctor App<br/>в Medic App]
        ADM[⚙️ Admin Panel<br/>React Vite]
    end

    subgraph Backend["☁️ Backend (NestJS + Railway)"]
        API[REST API]
        WS[WebSocket<br/>Socket.IO]
        CRON[Cron Jobs]
    end

    subgraph Внешние сервисы
        PG[(PostgreSQL)]
        CLD[☁️ Cloudinary<br/>Фото/документы]
        ANTH[🤖 Anthropic<br/>Claude Haiku]
        GROQ[🎙️ Groq<br/>Whisper STT]
        LK[📹 LiveKit<br/>Видеозвонки]
        TG[📨 Telegram Bot]
        PUSH[📲 Expo Push]
        OSRM[🗺️ OSRM<br/>Маршруты]
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
    participant C as 📱 Клиент
    participant API as ☁️ Backend
    participant D as 🔄 Dispatch
    participant M as 👩‍⚕️ Медсестра
    participant TG as 📨 Telegram

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
    C->>API: POST /orders/:id/rate (1-5 ⭐)
```

---

## 3. Salomat — AI ассистент

```mermaid
sequenceDiagram
    participant P as 📱 Пациент
    participant API as ☁️ Backend
    participant AI as 🤖 Claude Haiku
    participant AUD as 📊 Audit Log

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
        P->>P: Кнопка "📞 Позвонить 103"
    else Уровень 3 — К врачу
        API->>AUD: log DOCTOR_REFERRAL
        API-->>P: "Обратитесь к кардиологу"
        P->>P: Кнопка "🩺 Shifokor tanlash"
        P->>API: POST /consultations (с Salomat summary)
    else Уровень 3 — Медсестра
        API->>AUD: log NURSE_REFERRAL
        API-->>P: "Вам нужна капельница"
        P->>P: Кнопка "💉 Hamshira chaqirish"
        P->>API: POST /orders
    else Уровень 4 — Самопомощь
        API-->>P: "Отдых, обильное питьё..."
    end
```

---

## 4. Голосовой агент

```mermaid
sequenceDiagram
    participant P as 📱 Пациент
    participant APP as 📱 Expo-AV
    participant API as ☁️ Backend
    participant GRQ as 🎙️ Groq Whisper
    participant AI as 🤖 Claude Haiku

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
    participant C as 📱 Клиент
    participant API as ☁️ Backend
    participant D as 🩺 Врач
    participant LK as 📹 LiveKit

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
    
    Note over C,D: 📹 Видеозвонок через LiveKit
    
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
    WAIT -->|Принял| ASSIGN[✅ Назначен]
    WAIT -->|Отклонил| NEXT{Ещё попытки?}
    WAIT -->|Таймаут| NEXT
    
    NEXT -->|Да, < 10| SEARCH
    NEXT -->|Нет, 10 попыток| RETRY{Были попытки?}
    
    RETRY -->|Да| WAIT5[⏳ Повтор через 5 мин]
    WAIT5 --> SEARCH
    RETRY -->|Нет кандидатов| CANCEL[❌ Отмена заказа]
```

---

## 7. Роли и доступ

```mermaid
graph LR
    subgraph JWT Роли
        CL[👤 Client<br/>role: client]
        MC[👩‍⚕️ Medic<br/>role: medic]
        DC[🩺 Doctor<br/>role: doctor]
        AD[⚙️ Admin<br/>role: admin]
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
        M1[📱 Mobile Client<br/>Expo SDK 52 + React Native]
        M2[📱 Medic/Doctor App<br/>Expo SDK 52 + React Native]
        W1[🌐 Web Client<br/>Next.js 16]
        W2[🌐 Web Medic<br/>Next.js 16]
        A1[⚙️ Admin<br/>React + Vite + shadcn/ui]
        L1[🏠 Landing<br/>Next.js + SEO]
    end

    subgraph Backend
        N1[NestJS 10<br/>TypeORM + PostgreSQL]
        N2[Socket.IO<br/>Real-time]
        N3[JWT Auth<br/>4 роли]
    end

    subgraph AI
        AI1[🤖 Claude Haiku<br/>Salomat чат + триаж]
        AI2[🎙️ Groq Whisper<br/>Голос → текст]
        AI3[🔊 OpenAI TTS<br/>Текст → голос]
    end

    subgraph Infra
        RW[☁️ Railway<br/>Backend hosting]
        VR[▲ Vercel<br/>Web hosting]
        PG[(PostgreSQL<br/>Railway)]
        CD[☁️ Cloudinary<br/>Media]
    end
```

---

## 10. Денежный поток

```mermaid
flowchart LR
    C[👤 Клиент] -->|Оплата| P[💳 Payme / Click]
    P -->|100%| SYS[🏥 HamshiraGo]
    SYS -->|90%| M[👩‍⚕️ Медсестра]
    SYS -->|10%| FEE[💰 Комиссия платформы]
    
    C2[👤 Клиент] -->|Оплата консультации| SYS
    SYS -->|85%| D[🩺 Врач]
    SYS -->|15%| FEE2[💰 Комиссия]
```

---

# Salomat — AI Ассистент HamshiraGo

> **Salomat** (от узбекского "соломат" — здоровый) — AI-помощник, который помогает пациентам определить что делать: самолечение, вызвать медсестру или записаться к врачу.

---

## S1. Архитектура Salomat

```mermaid
graph TB
    subgraph Клиент
        CHAT[💬 Текстовый чат<br/>mobile/web]
        VOICE[🎙️ Голосовой агент<br/>mobile]
    end

    subgraph "Backend — Salomat Engine"
        RATE[🚦 Rate Limiter<br/>50 msg/день]
        KB[📚 Knowledge Base<br/>triage + safety + tone]
        CTX[👤 Patient Context<br/>имя, профиль, анамнез]
        ENC[🔐 Encryption<br/>AES-256-GCM]
    end

    subgraph "AI Pipeline"
        STT[🎙️ Groq Whisper<br/>аудио → текст]
        LLM[🤖 Claude Haiku<br/>триаж + ответ]
        TTS[🔊 OpenAI TTS<br/>текст → голос]
    end

    subgraph Хранение
        DB[(PostgreSQL<br/>voice_sessions<br/>chat_messages)]
        AUDIT[(salomat_audit_logs<br/>красные флаги<br/>направления)]
    end

    subgraph Действия
        DOC_ACT[🩺 Запись к врачу]
        NURSE_ACT[💉 Вызов медсестры]
        EMRG[🚑 Скорая 103]
        SELF[🏠 Самопомощь]
    end

    CHAT --> RATE
    VOICE --> STT
    STT --> RATE
    RATE --> KB
    KB --> CTX
    CTX --> LLM
    LLM --> AUDIT
    LLM --> ENC
    ENC --> DB

    LLM --> DOC_ACT
    LLM --> NURSE_ACT
    LLM --> EMRG
    LLM --> SELF

    VOICE -.-> TTS
    TTS -.-> VOICE
```

---

## S2. Полный диалог с Salomat (все сценарии)

```mermaid
flowchart TD
    START([Пациент открывает Salomat]) --> CONSENT{Первый раз?}
    
    CONSENT -->|Да| DISC[📋 Показать disclaimer<br/>"Salomat — не врач,<br/>в экстренных — 103"]
    DISC --> AGREE{Согласен?}
    AGREE -->|Нет| CLOSE[❌ Закрыть чат]
    AGREE -->|Да| SAVE_CONSENT[Сохранить согласие]
    
    CONSENT -->|Нет| GREET
    SAVE_CONSENT --> GREET
    
    GREET[🇺🇿 Приветствие на узбекском<br/>"Ассалому алайкум!<br/>Мен Salomat..."] --> WAIT_MSG
    
    WAIT_MSG[⏳ Ожидание сообщения] --> CHECK_LIMIT{Rate limit<br/>50/день?}
    
    CHECK_LIMIT -->|Превышен| LIMIT_MSG[⚠️ "Лимит исчерпан,<br/>попробуйте завтра"]
    CHECK_LIMIT -->|OK| CHECK_TOPIC{Тема медицинская?}
    
    CHECK_TOPIC -->|Нет| REDIRECT[🔄 "Я Salomat,<br/>помогаю с вопросами<br/>здоровья"]
    REDIRECT --> WAIT_MSG
    
    CHECK_TOPIC -->|Манипуляция| SAFEGUARD[🛡️ Safeguard<br/>"Не могу выполнить<br/>эту инструкцию"]
    SAFEGUARD --> AUDIT_SAFE[📊 Audit: SAFEGUARD]
    AUDIT_SAFE --> WAIT_MSG
    
    CHECK_TOPIC -->|Да| COLLECT[📝 Сбор симптомов<br/>Вопросы ПО ОДНОМУ]
```

---

## S3. Сбор информации и триаж

```mermaid
flowchart TD
    COLLECT([📝 Сбор симптомов]) --> Q1[Что беспокоит?]
    Q1 --> Q2[Как давно?]
    Q2 --> Q3[Насколько сильно? 1-10]
    Q3 --> Q4[Хронические заболевания?<br/>Аллергии?]
    Q4 --> Q5[Что уже пробовали?]
    
    Q5 --> TRIAGE{🚦 Оценка срочности}
    
    TRIAGE -->|Уровень 1| RED[🔴 КРАСНЫЙ ФЛАГ]
    TRIAGE -->|Уровень 2| ORANGE[🟠 СРОЧНО]
    TRIAGE -->|Уровень 3| YELLOW[🟡 ПЛАНОВЫЙ]
    TRIAGE -->|Уровень 4| GREEN[🟢 САМОПОМОЩЬ]
    
    RED --> RED_ACT["🚑 'Вызовите 103 немедленно!'<br/>Кнопка: Позвонить 103"]
    RED --> AUDIT_RED[📊 Audit: RED_FLAG]
    
    ORANGE --> ORANGE_ACT["⚠️ 'Срочно к врачу сегодня'<br/>Кнопка: Записаться срочно"]
    ORANGE --> SPEC_ORANGE{Какой специалист?}
    
    YELLOW --> SPEC_YELLOW{Какой специалист?}
    
    GREEN --> GREEN_ACT["💊 Рекомендации:<br/>Отдых, питьё,<br/>парацетамол<br/>'Если не пройдёт за 2-3 дня<br/>— к врачу'"]
```

---

## S4. Направление к специалисту

```mermaid
flowchart TD
    SPEC([Определение специалиста]) --> CHECK_AGE{Пациент<br/>до 18 лет?}
    
    CHECK_AGE -->|Да| PED[👶 Педиатр<br/>ВСЕГДА для детей]
    CHECK_AGE -->|Нет| SYMPTOMS{Основные симптомы}
    
    SYMPTOMS -->|Горло, нос, уши| ENT[👂 ЛОР]
    SYMPTOMS -->|Сердце, давление| CARD[❤️ Кардиолог]
    SYMPTOMS -->|Живот, ЖКТ| GASTRO[🫁 Гастроэнтеролог]
    SYMPTOMS -->|Голова, нервы| NEURO[🧠 Невролог]
    SYMPTOMS -->|Кожа, сыпь| DERM[🩹 Дерматолог]
    SYMPTOMS -->|Женское здоровье| GYN[👩 Гинеколог]
    SYMPTOMS -->|Тревога, депрессия| PSY[🧘 Психотерапевт]
    SYMPTOMS -->|Щитовидка, гормоны| ENDO[💊 Эндокринолог]
    SYMPTOMS -->|Общие, неясные| THER[🩺 Терапевт]
    
    PED --> ACTION
    ENT --> ACTION
    CARD --> ACTION
    GASTRO --> ACTION
    NEURO --> ACTION
    DERM --> ACTION
    GYN --> ACTION
    PSY --> ACTION
    ENDO --> ACTION
    THER --> ACTION
    
    ACTION{Что предложить?}
    
    ACTION -->|Нужен осмотр| DOC_REC["🩺 'Обратитесь к [специалист]'<br/>Кнопка: Shifokor tanlash<br/>→ /doctors?spec=..."]
    ACTION -->|Нужна процедура| NURSE_REC["💉 'Вам нужна [процедура]'<br/>Кнопка: Hamshira chaqirish<br/>→ /order/location"]
    
    DOC_REC --> AUDIT_DOC[📊 Audit: DOCTOR_REFERRAL]
    NURSE_REC --> AUDIT_NURSE[📊 Audit: NURSE_REFERRAL]
    
    DOC_REC --> SUMMARY[📋 Генерация summary<br/>для врача]
    SUMMARY --> BOOK_DOC[📅 Запись с предзаполненными<br/>симптомами + специализацией]
```

---

## S5. Salomat → Запись к врачу (полный путь)

```mermaid
sequenceDiagram
    participant P as 📱 Пациент
    participant SAL as 🤖 Salomat
    participant API as ☁️ Backend
    participant D as 🩺 Врач

    P->>SAL: "У меня часто болит голова<br/>уже 2 недели"
    SAL->>P: "Как часто? Каждый день?"
    P->>SAL: "Почти каждый день, особенно вечером"
    SAL->>P: "Принимаете что-нибудь от боли?"
    P->>SAL: "Парацетамол, помогает на пару часов"
    
    SAL->>SAL: Триаж: Уровень 3<br/>Специалист: Невролог
    
    SAL->>P: "При повторяющейся головной боли<br/>более 2 недель стоит обратиться<br/>к неврологу. Он проведёт осмотр<br/>и при необходимости назначит<br/>обследование."
    
    Note over SAL,P: Кнопка: "🩺 Записаться к неврологу"
    
    P->>API: Нажал "Записаться"
    API->>API: Генерация summary:<br/>"Головная боль 2 нед.,<br/>ежедневно, вечером,<br/>парацетамол временно помогает"
    
    P->>API: GET /doctors?spec=Невролог
    API-->>P: Список неврологов + слоты
    
    P->>API: POST /consultations<br/>{doctorId, symptoms, slotId}
    API->>API: Сохранить salomatSummary
    API->>API: Забронировать слот
    API->>D: Push: "Новая консультация!"
    
    D->>D: Видит summary от Salomat<br/>перед началом приёма
    D->>P: 📹 Видеозвонок
    D->>API: Завершить + рецепт
    
    API->>P: Push: "Рецепт готов!"
    P->>API: Подтвердить рецепт
    API->>API: Создать заказ на медсестру
```

---

## S6. Salomat → Вызов медсестры (полный путь)

```mermaid
sequenceDiagram
    participant P as 📱 Пациент
    participant SAL as 🤖 Salomat
    participant API as ☁️ Backend
    participant D as 🔄 Dispatch
    participant M as 👩‍⚕️ Медсестра

    P->>SAL: "Врач назначил курс уколов,<br/>нужна медсестра на дом"
    SAL->>P: "Какой укол назначен?<br/>Внутримышечный или внутривенный?"
    P->>SAL: "Внутримышечный, цефтриаксон"
    
    SAL->>SAL: Триаж: Уровень 3<br/>Рекомендация: NURSE<br/>Услуга: Внутримышечный укол
    
    SAL->>P: "Понятно. Для внутримышечного<br/>укола вам нужна медсестра.<br/>Она приедет к вам домой<br/>со всем необходимым."
    
    Note over SAL,P: Кнопка: "💉 Вызвать медсестру"
    
    P->>API: Нажал "Вызвать медсестру"
    API-->>P: Экран выбора адреса
    
    P->>API: POST /orders<br/>{serviceId: "укол", location}
    API->>D: startDispatch
    D->>M: dispatch_invite + push
    M->>API: accept
    
    API->>P: Push: "Медсестра найдена!"
    M->>P: ON_THE_WAY → ETA ~15 мин
    M->>P: ARRIVED → "Откройте дверь"
    M->>API: Фото ДО процедуры
    M->>API: SERVICE_STARTED
    M->>API: DONE
    M->>API: Фото ПОСЛЕ процедуры
    P->>API: Оценка ⭐⭐⭐⭐⭐
```

---

## S7. Salomat → Экстренный случай

```mermaid
sequenceDiagram
    participant P as 📱 Пациент
    participant SAL as 🤖 Salomat
    participant AUD as 📊 Audit

    P->>SAL: "Сильная боль в груди,<br/>не могу нормально дышать"
    
    SAL->>SAL: 🔴 RED FLAG DETECTED<br/>Боль в груди + одышка<br/>= Возможный инфаркт
    SAL->>AUD: log RED_FLAG<br/>triage_level: 1

    SAL->>P: "⚠️ При сильной боли в груди<br/>с затруднённым дыханием<br/>нужно НЕМЕДЛЕННО<br/>вызвать скорую помощь.<br/><br/>Не ждите, позвоните 103<br/>прямо сейчас."
    
    Note over SAL,P: 🔴 Кнопка: "📞 Позвонить 103"
    
    Note over SAL: Salomat НЕ задаёт<br/>уточняющих вопросов<br/>при красном флаге.<br/>Сразу направляет на 103.
```

---

## S8. Голосовой режим Salomat

```mermaid
flowchart TD
    START([🎙️ Пациент нажимает микрофон]) --> REC[🔴 Запись аудио<br/>expo-av, формат m4a]
    
    REC --> RELEASE[Пациент отпускает]
    RELEASE --> UPLOAD[📤 Upload аудио<br/>POST /voice-agent/transcribe]
    
    UPLOAD --> STT[🎙️ Groq Whisper<br/>Large v3]
    STT --> TEXT[📝 Распознанный текст<br/>показать пациенту]
    
    TEXT --> CHAT[🤖 POST /voice-agent/chat<br/>Claude Haiku + knowledge base]
    
    CHAT --> STREAM[📨 Streaming ответ<br/>текст появляется<br/>по мере генерации]
    
    STREAM --> TTS_CHECK{OpenAI TTS<br/>настроен?}
    
    TTS_CHECK -->|Да| TTS[🔊 Озвучка ответа<br/>POST /voice-agent/synthesize]
    TTS --> PLAY[🔈 Воспроизведение<br/>Audio.Sound]
    
    TTS_CHECK -->|Нет| TEXT_ONLY[📝 Только текст]
    
    PLAY --> DONE_CHECK{Рекомендация<br/>готова?}
    TEXT_ONLY --> DONE_CHECK
    
    DONE_CHECK -->|Нет, нужно больше инфо| NEXT_Q[Следующий вопрос]
    NEXT_Q --> START
    
    DONE_CHECK -->|DOCTOR| DOC_CARD[🩺 Карточка<br/>"Записаться к врачу"]
    DONE_CHECK -->|NURSE| NURSE_CARD[💉 Карточка<br/>"Вызвать медсестру"]
    DONE_CHECK -->|EMERGENCY| EMRG_CARD[🚑 Карточка<br/>"Позвонить 103"]
    DONE_CHECK -->|SELF_CARE| TIPS[💊 Рекомендации<br/>самопомощи]
```

---

## S9. Salomat Audit и аналитика

```mermaid
graph TB
    subgraph "События аудита"
        E1[🔴 RED_FLAG<br/>Экстренные случаи]
        E2[🩺 DOCTOR_REFERRAL<br/>Направление к врачу]
        E3[💉 NURSE_REFERRAL<br/>Направление к медсестре]
        E4[🛡️ SAFEGUARD<br/>Блокировка манипуляции]
        E5[🚦 RATE_LIMIT<br/>Превышение лимита]
    end

    subgraph "Хранение"
        DB[(salomat_audit_logs<br/>clientId, action,<br/>specialization, details,<br/>triageLevel, createdAt)]
    end

    subgraph "Admin Dashboard"
        KPI[📊 KPI карточки<br/>Всего событий<br/>Красных флагов<br/>Направлений к врачам]
        PIE[🥧 Pie Chart<br/>Топ специализаций]
        LINE[📈 Line Chart<br/>События по дням]
        TABLE[📋 Таблица сессий<br/>Клиент, длительность,<br/>рекомендация, результат]
    end

    E1 --> DB
    E2 --> DB
    E3 --> DB
    E4 --> DB
    E5 --> DB

    DB --> KPI
    DB --> PIE
    DB --> LINE
    DB --> TABLE

    KPI --> INSIGHT[💡 Инсайты:<br/>• Какие специальности в дефиците<br/>• Сколько пациентов записались<br/>• Конверсия Salomat → заказ<br/>• Пропущенные красные флаги]
```

---

## S10. Безопасность и приватность Salomat

```mermaid
flowchart TD
    MSG([Сообщение пациента]) --> SANITIZE[🔒 Санитизация<br/>Убрать ИМЯ, ТЕЛЕФОН,<br/>ПИНФЛ, АДРЕС<br/>перед отправкой в AI]
    
    SANITIZE --> ENCRYPT[🔐 Шифрование<br/>AES-256-GCM<br/>перед сохранением в БД]
    
    ENCRYPT --> DB[(PostgreSQL<br/>зашифрованный content)]
    
    SANITIZE --> API_CALL[🤖 Anthropic API<br/>Claude Haiku<br/>Без персональных данных]
    
    API_CALL --> RESPONSE[Ответ AI]
    
    RESPONSE --> LOG_CHECK{Содержит<br/>красный флаг?}
    LOG_CHECK -->|Да| AUDIT[📊 Audit Log<br/>Без PII]
    LOG_CHECK -->|Нет| SKIP_AUDIT[Пропустить]
    
    subgraph "Правовая база"
        LAW1[📜 Закон РУз<br/>о персональных данных]
        LAW2[🏥 Мед. данные<br/>хранить в Узбекистане]
        LAW3[✅ Согласие пациента<br/>обязательно]
        LAW4[⏰ Soft delete<br/>30 дней до удаления]
    end
    
    DB --- LAW1
    DB --- LAW2
    ENCRYPT --- LAW3
    DB --- LAW4
```
