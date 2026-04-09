# Salomat — AI Ассистент HamshiraGo

> **Salomat** (от узбекского "соломат" — здоровый) — AI-помощник, который помогает пациентам определить что делать: самолечение, вызвать медсестру или записаться к врачу.

---

## S1. Архитектура Salomat

```mermaid
graph TB
    subgraph Клиент
        CHAT[Текстовый чат<br/>mobile/web]
        VOICE[Голосовой агент<br/>mobile]
    end

    subgraph "Backend — Salomat Engine"
        RATE[Rate Limiter<br/>50 msg/день]
        KB[Knowledge Base<br/>triage + safety + tone]
        CTX[Patient Context<br/>имя, профиль, анамнез]
        ENC[Encryption<br/>AES-256-GCM]
    end

    subgraph "AI Pipeline"
        STT[Groq Whisper<br/>аудио → текст]
        LLM[Claude Haiku<br/>триаж + ответ]
        TTS[OpenAI TTS<br/>текст → голос]
    end

    subgraph Хранение
        DB[(PostgreSQL<br/>voice_sessions<br/>chat_messages)]
        AUDIT[(salomat_audit_logs<br/>красные флаги<br/>направления)]
    end

    subgraph Действия
        DOC_ACT[Запись к врачу]
        NURSE_ACT[Вызов медсестры]
        EMRG[Скорая 103]
        SELF[Самопомощь]
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
    
    CONSENT -->|Да| DISC[Показать disclaimer]
    DISC --> AGREE{Согласен?}
    AGREE -->|Нет| CLOSE[Закрыть чат]
    AGREE -->|Да| SAVE_CONSENT[Сохранить согласие]
    
    CONSENT -->|Нет| GREET
    SAVE_CONSENT --> GREET
    
    GREET[Приветствие на узбекском] --> WAIT_MSG
    
    WAIT_MSG[Ожидание сообщения] --> CHECK_LIMIT{Rate limit<br/>50/день?}
    
    CHECK_LIMIT -->|Превышен| LIMIT_MSG[Лимит исчерпан]
    CHECK_LIMIT -->|OK| CHECK_TOPIC{Тема медицинская?}
    
    CHECK_TOPIC -->|Нет| REDIRECT[Salomat помогает с здоровьем]
    REDIRECT --> WAIT_MSG
    
    CHECK_TOPIC -->|Манипуляция| SAFEGUARD[Safeguard - блокировка]
    SAFEGUARD --> AUDIT_SAFE[Audit: SAFEGUARD]
    AUDIT_SAFE --> WAIT_MSG
    
    CHECK_TOPIC -->|Да| COLLECT[Сбор симптомов<br/>Вопросы ПО ОДНОМУ]
```

---

## S3. Сбор информации и триаж

```mermaid
flowchart TD
    COLLECT([Сбор симптомов]) --> Q1[Что беспокоит?]
    Q1 --> Q2[Как давно?]
    Q2 --> Q3[Насколько сильно? 1-10]
    Q3 --> Q4[Хронические заболевания?<br/>Аллергии?]
    Q4 --> Q5[Что уже пробовали?]
    
    Q5 --> TRIAGE{Оценка срочности}
    
    TRIAGE -->|Уровень 1| RED[КРАСНЫЙ ФЛАГ]
    TRIAGE -->|Уровень 2| ORANGE[СРОЧНО]
    TRIAGE -->|Уровень 3| YELLOW[ПЛАНОВЫЙ]
    TRIAGE -->|Уровень 4| GREEN[САМОПОМОЩЬ]
    
    RED --> RED_ACT[Вызовите 103 немедленно]
    RED --> AUDIT_RED[Audit: RED_FLAG]
    
    ORANGE --> ORANGE_ACT[Срочно к врачу сегодня]
    ORANGE --> SPEC_ORANGE{Какой специалист?}
    
    YELLOW --> SPEC_YELLOW{Какой специалист?}
    
    GREEN --> GREEN_ACT[Рекомендации - отдых и питье]
```

---

## S4. Направление к специалисту

```mermaid
flowchart TD
    SPEC([Определение специалиста]) --> CHECK_AGE{Пациент<br/>до 18 лет?}
    
    CHECK_AGE -->|Да| PED[Педиатр<br/>ВСЕГДА для детей]
    CHECK_AGE -->|Нет| SYMPTOMS{Основные симптомы}
    
    SYMPTOMS -->|Горло, нос, уши| ENT[ЛОР]
    SYMPTOMS -->|Сердце, давление| CARD[Кардиолог]
    SYMPTOMS -->|Живот, ЖКТ| GASTRO[Гастроэнтеролог]
    SYMPTOMS -->|Голова, нервы| NEURO[Невролог]
    SYMPTOMS -->|Кожа, сыпь| DERM[Дерматолог]
    SYMPTOMS -->|Женское здоровье| GYN[Гинеколог]
    SYMPTOMS -->|Тревога, депрессия| PSY[Психотерапевт]
    SYMPTOMS -->|Щитовидка, гормоны| ENDO[Эндокринолог]
    SYMPTOMS -->|Общие, неясные| THER[Терапевт]
    
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
    
    ACTION -->|Нужен осмотр| DOC_REC[Обратитесь к специалисту]
    ACTION -->|Нужна процедура| NURSE_REC[Вам нужна процедура]
    
    DOC_REC --> AUDIT_DOC[Audit: DOCTOR_REFERRAL]
    NURSE_REC --> AUDIT_NURSE[Audit: NURSE_REFERRAL]
    
    DOC_REC --> SUMMARY[Генерация summary<br/>для врача]
    SUMMARY --> BOOK_DOC[Запись с предзаполненными<br/>симптомами + специализацией]
```

---

## S5. Salomat → Запись к врачу (полный путь)

```mermaid
sequenceDiagram
    participant P as Пациент
    participant SAL as Salomat
    participant API as Backend
    participant D as Врач

    P->>SAL: "У меня часто болит голова<br/>уже 2 недели"
    SAL->>P: "Как часто? Каждый день?"
    P->>SAL: "Почти каждый день, особенно вечером"
    SAL->>P: "Принимаете что-нибудь от боли?"
    P->>SAL: "Парацетамол, помогает на пару часов"
    
    SAL->>SAL: Триаж: Уровень 3<br/>Специалист: Невролог
    
    SAL->>P: "При повторяющейся головной боли<br/>более 2 недель стоит обратиться<br/>к неврологу. Он проведёт осмотр<br/>и при необходимости назначит<br/>обследование."
    
    Note over SAL,P: Кнопка: "Записаться к неврологу"
    
    P->>API: Нажал "Записаться"
    API->>API: Генерация summary:<br/>"Головная боль 2 нед.,<br/>ежедневно, вечером,<br/>парацетамол временно помогает"
    
    P->>API: GET /doctors?spec=Невролог
    API-->>P: Список неврологов + слоты
    
    P->>API: POST /consultations<br/>{doctorId, symptoms, slotId}
    API->>API: Сохранить salomatSummary
    API->>API: Забронировать слот
    API->>D: Push: "Новая консультация!"
    
    D->>D: Видит summary от Salomat<br/>перед началом приёма
    D->>P: Видеозвонок
    D->>API: Завершить + рецепт
    
    API->>P: Push: "Рецепт готов!"
    P->>API: Подтвердить рецепт
    API->>API: Создать заказ на медсестру
```

---

## S6. Salomat → Вызов медсестры (полный путь)

```mermaid
sequenceDiagram
    participant P as Пациент
    participant SAL as Salomat
    participant API as Backend
    participant D as Dispatch
    participant M as Медсестра

    P->>SAL: "Врач назначил курс уколов,<br/>нужна медсестра на дом"
    SAL->>P: "Какой укол назначен?<br/>Внутримышечный или внутривенный?"
    P->>SAL: "Внутримышечный, цефтриаксон"
    
    SAL->>SAL: Триаж: Уровень 3<br/>Рекомендация: NURSE<br/>Услуга: Внутримышечный укол
    
    SAL->>P: "Понятно. Для внутримышечного<br/>укола вам нужна медсестра.<br/>Она приедет к вам домой<br/>со всем необходимым."
    
    Note over SAL,P: Кнопка: "Вызвать медсестру"
    
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
    P->>API: Оценка 
```

---

## S7. Salomat → Экстренный случай

```mermaid
sequenceDiagram
    participant P as Пациент
    participant SAL as Salomat
    participant AUD as Audit

    P->>SAL: "Сильная боль в груди,<br/>не могу нормально дышать"
    
    SAL->>SAL: RED FLAG DETECTED<br/>Боль в груди + одышка<br/>= Возможный инфаркт
    SAL->>AUD: log RED_FLAG<br/>triage_level: 1

    SAL->>P: "При сильной боли в груди<br/>с затруднённым дыханием<br/>нужно НЕМЕДЛЕННО<br/>вызвать скорую помощь.<br/><br/>Не ждите, позвоните 103<br/>прямо сейчас."
    
    Note over SAL,P: Кнопка: "Позвонить 103"
    
    Note over SAL: Salomat НЕ задаёт<br/>уточняющих вопросов<br/>при красном флаге.<br/>Сразу направляет на 103.
```

---

## S8. Голосовой режим Salomat

```mermaid
flowchart TD
    START([Пациент нажимает микрофон]) --> REC[Запись аудио<br/>expo-av, формат m4a]
    
    REC --> RELEASE[Пациент отпускает]
    RELEASE --> UPLOAD[Upload аудио<br/>POST /voice-agent/transcribe]
    
    UPLOAD --> STT[Groq Whisper<br/>Large v3]
    STT --> TEXT[Распознанный текст<br/>показать пациенту]
    
    TEXT --> CHAT[POST /voice-agent/chat<br/>Claude Haiku + knowledge base]
    
    CHAT --> STREAM[Streaming ответ<br/>текст появляется<br/>по мере генерации]
    
    STREAM --> TTS_CHECK{OpenAI TTS<br/>настроен?}
    
    TTS_CHECK -->|Да| TTS[Озвучка ответа<br/>POST /voice-agent/synthesize]
    TTS --> PLAY[Воспроизведение<br/>Audio.Sound]
    
    TTS_CHECK -->|Нет| TEXT_ONLY[Только текст]
    
    PLAY --> DONE_CHECK{Рекомендация<br/>готова?}
    TEXT_ONLY --> DONE_CHECK
    
    DONE_CHECK -->|Нет, нужно больше инфо| NEXT_Q[Следующий вопрос]
    NEXT_Q --> START
    
    DONE_CHECK -->|DOCTOR| DOC_CARD[Записаться к врачу]
    DONE_CHECK -->|NURSE| NURSE_CARD[Вызвать медсестру]
    DONE_CHECK -->|EMERGENCY| EMRG_CARD[Позвонить 103]
    DONE_CHECK -->|SELF_CARE| TIPS[Рекомендации<br/>самопомощи]
```

---

## S9. Salomat Audit и аналитика

```mermaid
graph TB
    subgraph "События аудита"
        E1[RED_FLAG<br/>Экстренные случаи]
        E2[DOCTOR_REFERRAL<br/>Направление к врачу]
        E3[NURSE_REFERRAL<br/>Направление к медсестре]
        E4[SAFEGUARD<br/>Блокировка манипуляции]
        E5[RATE_LIMIT<br/>Превышение лимита]
    end

    subgraph "Хранение"
        DB[(salomat_audit_logs<br/>clientId, action,<br/>specialization, details,<br/>triageLevel, createdAt)]
    end

    subgraph "Admin Dashboard"
        KPI[KPI карточки<br/>Всего событий<br/>Красных флагов<br/>Направлений к врачам]
        PIE[Pie Chart<br/>Топ специализаций]
        LINE[Line Chart<br/>События по дням]
        TABLE[Таблица сессий<br/>Клиент, длительность,<br/>рекомендация, результат]
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

    KPI --> INSIGHT[Инсайты:<br/>• Какие специальности в дефиците<br/>• Сколько пациентов записались<br/>• Конверсия Salomat → заказ<br/>• Пропущенные красные флаги]
```

---

## S10. Безопасность и приватность Salomat

```mermaid
flowchart TD
    MSG([Сообщение пациента]) --> SANITIZE[Санитизация<br/>Убрать ИМЯ, ТЕЛЕФОН,<br/>ПИНФЛ, АДРЕС<br/>перед отправкой в AI]
    
    SANITIZE --> ENCRYPT[Шифрование<br/>AES-256-GCM<br/>перед сохранением в БД]
    
    ENCRYPT --> DB[(PostgreSQL<br/>зашифрованный content)]
    
    SANITIZE --> API_CALL[Anthropic API<br/>Claude Haiku<br/>Без персональных данных]
    
    API_CALL --> RESPONSE[Ответ AI]
    
    RESPONSE --> LOG_CHECK{Содержит<br/>красный флаг?}
    LOG_CHECK -->|Да| AUDIT[Audit Log<br/>Без PII]
    LOG_CHECK -->|Нет| SKIP_AUDIT[Пропустить]
    
    subgraph "Правовая база"
        LAW1[Закон РУз<br/>о персональных данных]
        LAW2[Мед. данные<br/>хранить в Узбекистане]
        LAW3[Согласие пациента<br/>обязательно]
        LAW4[Soft delete<br/>30 дней до удаления]
    end
    
    DB --- LAW1
    DB --- LAW2
    ENCRYPT --- LAW3
    DB --- LAW4
```
