# HamshiraGo --- Выполненные задачи

## 2026-04-05 (Doctor role support in medic app)

- **[medic]** Add `role` and `specialization` fields to MedicUser interface, add `loginDoctor` method to AuthContext, update `refreshProfile` to use correct endpoint by role -- `medic/context/AuthContext.tsx`
- **[medic]** Create `(doctor-tabs)/_layout.tsx` with 3 doctor-specific tabs: Konsultatsiyalar (stethoscope), Bemorlar (users), Profil (user) -- `medic/app/(doctor-tabs)/_layout.tsx`
- **[medic]** Create `(doctor-tabs)/index.tsx` -- pending consultations screen: fetch GET /consultations/doctor/pending, accept/decline with gradient pill buttons, verification banner -- `medic/app/(doctor-tabs)/index.tsx`
- **[medic]** Create `(doctor-tabs)/my-patients.tsx` -- consultation history with active/history sections, status badges, pagination, tap to detail -- `medic/app/(doctor-tabs)/my-patients.tsx`
- **[medic]** Create `(doctor-tabs)/profile.tsx` -- doctor profile: specialization, consultation count, rating, balance, earnings, Telegram, schedule link, language picker, logout -- `medic/app/(doctor-tabs)/profile.tsx`
- **[medic]** Create `doctor-consultation/[id].tsx` -- consultation detail: symptoms card, client info, slot time, video call button (LiveKit), doctor notes textarea, gradient pill "Yakunlash" CTA -- `medic/app/doctor-consultation/[id].tsx`
- **[medic]** Update root _layout.tsx: role-based routing (doctor -> (doctor-tabs), medic -> (tabs)), register (doctor-tabs) and doctor-consultation/[id] Stack.Screen entries, handle consultation push notifications -- `medic/app/_layout.tsx`
- **[medic]** Add Hamshira/Doktor role selector to auth screen login mode with loginDoctor flow -- `medic/app/auth.tsx`

## 2026-04-05 (V5-A-1: Mobile Voice Agent screen)

- **[mobile]** Create voice-agent.tsx screen with mic recording (expo-av), transcribe via /voice-agent/transcribe, chat via /voice-agent/chat, chat history FlatList, recommendation card (DOCTOR/NURSE), quick suggestion chips -- `mobile/app/voice-agent.tsx`
- **[mobile]** Add voice-agent Stack.Screen to root layout -- `mobile/app/_layout.tsx`
- **[mobile]** Add Voice Agent banner ("Ovozli AI Hamshira") to home screen below AI Chat banner -- `mobile/app/(tabs)/index.tsx`
- **[mobile]** Install expo-av dependency for audio recording -- `mobile/package.json`

## 2026-04-05 (Doctor Schedule / DoctorSlot system)

- **[backend]** Create DoctorSlot entity (doctor_slots table) with doctorId, startsAt, endsAt, isBooked, consultationId -- `src/doctors/entities/doctor-slot.entity.ts`
- **[backend]** Create CreateSlotsDto with date, startTime, endTime, intervalMinutes validation -- `src/doctors/dto/create-slots.dto.ts`
- **[backend]** Add 6 slot methods to DoctorsService: createSlots, getAvailableSlots, getDoctorSlots, bookSlot, releaseSlot, deleteSlot -- `src/doctors/doctors.service.ts`
- **[backend]** Add 4 slot endpoints to DoctorsController: POST me/slots, GET me/slots, DELETE me/slots/:slotId, GET :id/slots (public) -- `src/doctors/doctors.controller.ts`
- **[backend]** Register DoctorSlot in DoctorsModule TypeOrmModule.forFeature -- `src/doctors/doctors.module.ts`
- **[backend]** Add optional slotId to CreateConsultationDto -- `src/consultations/dto/create-consultation.dto.ts`
- **[backend]** Integrate slot booking in createConsultation + slot release in cancelConsultation and doctorDeclineConsultation -- `src/consultations/consultations.service.ts`
- **[backend]** Import DoctorsModule in ConsultationsModule for slot integration -- `src/consultations/consultations.module.ts`

## 2026-04-05 (V5 Voice Agent backend module)

- **[backend]** Create VoiceSession entity with jsonb messages, recommendation, suggestedSpecialization, suggestedServiceId, exchangeCount -- `src/voice-agent/entities/voice-session.entity.ts`
- **[backend]** Create VoiceAgentService: STT via Groq Whisper, chat via Claude Haiku with RU/UZ system prompts, TTS placeholder, session CRUD, book-nurse/book-doctor helpers, admin stats/list, stale session cron cleanup -- `src/voice-agent/voice-agent.service.ts`
- **[backend]** Create VoiceAgentController: POST transcribe (multipart), POST chat, POST synthesize, GET/DELETE session, POST book-nurse/book-doctor, admin sessions/stats endpoints with AdminGuard -- `src/voice-agent/voice-agent.controller.ts`
- **[backend]** Create VoiceAgentModule importing TypeOrm, Config, Services, JWT -- `src/voice-agent/voice-agent.module.ts`
- **[backend]** Create VoiceChatDto and VoiceSynthesizeDto with class-validator -- `src/voice-agent/dto/voice-chat.dto.ts`
- **[backend]** Register VoiceAgentModule in AppModule -- `src/app.module.ts`
- **[backend]** Add i18n keys for voice agent errors (5 keys) -- `src/common/i18n/ru.json`, `src/common/i18n/uz.json`
- **[backend]** Add GROQ_API_KEY and OPENAI_API_KEY to .env.example -- `.env.example`
- **[backend]** Install form-data dependency for Groq API multipart upload -- `package.json`

## 2026-04-05 (Doctor Auth system)

- **[backend]** Extend Doctor entity with auth columns (passwordHash, isOnline, isBlocked, verificationStatus, facePhotoUrl, licensePhotoUrl, balance, earnings, lastSeenAt, updatedAt) + unique phone index -- `src/consultations/entities/doctor.entity.ts`
- **[backend]** Create DoctorsModule with full auth system (register, login, profile, push-token, telegram-chat-id, documents upload, profile-photo, admin verify/block endpoints) -- `src/doctors/`
- **[backend]** Add doctor role to JWT strategy validate() and JwtPayload type -- `src/auth/strategies/jwt.strategy.ts`
- **[backend]** Import DoctorsModule in AuthModule (forwardRef) and AppModule -- `src/auth/auth.module.ts`, `src/app.module.ts`
- **[backend]** Add i18n keys for doctor errors (DOCTOR_ACCESS_ONLY, DOCTOR_NOT_AUTHENTICATED, DOCTOR_PHONE_EXISTS) -- `src/common/i18n/ru.json`, `src/common/i18n/uz.json`

## 2026-04-05 (Doctor consultation endpoints + notifications)

- **[backend]** Add DoctorAuthGuard and @DoctorId() decorator -- `src/auth/guards/doctor-auth.guard.ts`, `src/auth/decorators/doctor-id.decorator.ts`
- **[backend]** Add telegramChatId and pushToken columns to Doctor entity -- `src/consultations/entities/doctor.entity.ts`
- **[backend]** Add 5 doctor endpoints to consultations controller (pending, my, accept, decline, complete) -- `src/consultations/consultations.controller.ts`
- **[backend]** Add doctor service methods (getDoctorPending, getDoctorConsultations, doctorAccept/Decline/Complete, findDoctorById, saveDoctorTelegramChatId) -- `src/consultations/consultations.service.ts`
- **[backend]** Add /start doctor_{doctorId} Telegram linking -- `src/telegram/telegram-bot.service.ts`, `src/telegram/telegram-bot.module.ts`
- **[backend]** Add doctor WebSocket room + emitNewConsultation method -- `src/realtime/order-events.gateway.ts`
- **[backend]** Add WebSocket + Push + Telegram notifications on consultation creation -- `src/consultations/consultations.service.ts`
- **[backend]** Update ConsultationsModule with CommonModule import, TelegramBotModule with ConsultationsModule import -- modules

## 2026-04-05 (7-screen Stitch redesign batch)

- **[mobile]** Redesign Referral screen (Stitch design) -- useSafeAreaInsets, brand+bell header, centered 64px teal gift circle, "Taklif dasturi" title (Manrope_700Bold 24px), dashed border code card (2px dashed #006860, radius 16), copy icon button, "Ulashing" gradient pill CTA with share icon, stats cards (invited count + bonus amount), CAMPAIGN gradient banner with chevron, bottom padding 100 -- `mobile/app/referral.tsx`
- **[mobile]** Redesign Medical Card screen (Stitch design) -- useSafeAreaInsets, back+brand header, "HAMSHIRAGO PROFILE" label + "Tibbiy karta" title (Manrope_700Bold 24px), ID text + edit icon, white cards (radius 16, Shadow.sm): blood type chip selector (8 options in 2 rows, selected=#006860+white text), allergies/chronic/notes sections with inline edit toggle (pencil/check), sticky bottom gradient pill "Saqlash" CTA -- `mobile/app/medical-card.tsx`
- **[mobile]** Redesign Nearby Medics screen (Stitch design) -- search pill bar + filter icon button, teal count badge pill "12 ta hamshira", map fills space, teal pin markers, selected medic bottom card (white, radius 24px top, Shadow.lg): 56px avatar + name + rating stars + distance/experience info row + "Xizmat tanlash" gradient pill CTA, white circle refresh button (44px) -- `mobile/app/nearby-medics.tsx`
- **[mobile]** Redesign Prescriptions List screen (Stitch design) -- useSafeAreaInsets, brand+bell header, "Retseptlar" title + subtitle, stats row (JAMI + BU OYDA cards with teal numbers), prescription cards (pill icon circle + medication name + doctor date + status pills: KUTILMOQDA amber, TASDIQLANGAN green, MUDDATI O'TGAN grey), bottom banner "Yangi retsept kerakmi?" with gradient CTA, bottom padding 100 -- `mobile/app/prescriptions.tsx`
- **[mobile]** Redesign Prescription Detail screen (Stitch design) -- back arrow + "Retsept" + dots menu header, medication name (Manrope_700Bold 24px), status pill below name, doctor card (avatar + name + specialization), DOZASI section (caption label + value + hint), DAVOMIYLIGI section (large 20px days + expiry date), Ko'rsatmalar section (paragraph text), tonal inputs for address form, bottom: gradient pill "Tasdiqlash" CTA + error ghost pill "Bekor qilish" -- `mobile/app/prescription.tsx`
- **[mobile]** Redesign Courses screen (Stitch design) -- useSafeAreaInsets, brand+bell header, "Davolash kurslari" title + subtitle, course cards (white, radius 16, Shadow.sm): title + start date + status pill (JARAYONDA amber, YAKUNLANGAN green), progress bar (surfaceContainerLow track + #006860 fill) + "4/10 muolaja" count + "XX% tugallandi", NAVBATDAGI SEANS row, gradient circle FAB (56px, Shadow.md) with "+" icon, modal sheet with gradient submit -- `mobile/app/courses.tsx`
- **[mobile]** Redesign NPS Survey screen (Stitch design) -- semi-transparent overlay (rgba(25,28,30,0.45)), centered white card (radius 24, padding 24, maxWidth 340), close "x" top-right, trophy icon in teal circle (48px), "Bizni baholang" title (Manrope_700Bold 20px), subtitle, score circles in 2 rows (1-6 top, 7-10 bottom, 40px each, selected=#006860+white, unselected=surfaceContainerLow+grey), comment textarea (surfaceContainerLow, no border, radius 12, 80px), "Yuborish" gradient pill CTA, "Keyinroq" grey text link -- `mobile/app/nps.tsx`

## 2026-04-05 (Loyalty + Favorites + Subscriptions redesign)

- **[mobile]** Redesign Loyalty screen (Stitch design) -- useSafeAreaInsets, gradient hero card (#006860->#008379, radius 24) with SILVER tier badge pill (white bg, teal text), large 48px Manrope_800ExtraBold points + "ball" label + next-tier hint, "Mening darajam" tier progress (3 circles BRONZE/SILVER/GOLD connected by line, current highlighted teal), "Ballarni sarflash" section with redemption cards (medkit icon + title + subtitle + green points pill + gradient "Sarflash" button), "Tarix" section with history list (icon circles + desc + date + colored +/- points), redeem modal with preset pills + gradient submit -- `mobile/app/loyalty.tsx`
- **[mobile]** Redesign Favorites screen (Stitch design) -- useSafeAreaInsets, stethoscope icon header + "Sevimlilar" 24px, subtitle block "Sizning mutaxassislaringiz" 22px + grey desc, medic cards (white, radius 16, Shadow.sm) with 56px avatar + name (Manrope_600SemiBold 16px) + experience + star rating + reviewCount, skill pills row (surfaceContainerLow bg, Inter 12px), price row with /soat, full-width gradient "Band qilish" pill, filled teal heart top-right, bottom banner "HAMMASINI KO'RISH" link, empty state with grey heart icon circle -- `mobile/app/favorites.tsx`
- **[mobile]** Redesign Subscriptions screen (Stitch design) -- useSafeAreaInsets, "Clinical Sanctuary" brand header + bell icon, "Mening obunalarim" title 22px, active subscription card (white, radius 20, Shadow.md) with "HOZIRGI TARIF" label + green "FAOL" pill + tier name 20px + stats row (BUYURTMALAR qoldi + AMAL QILISH kun) + "Bekor qilish" error link, horizontal ScrollView tier cards (260px wide, radius 20) with teal icon circle + tier name + desc + benefits checklist (check/unfilled circle) + price 24px Manrope_800ExtraBold + gradient "Sotib olish" pill, comparison table with alternating surfaceContainerLow rows + check/X marks per tier -- `mobile/app/subscriptions.tsx`

## 2026-04-05 (Consultations + Video Call redesign)

- **[mobile]** Redesign Consultations List screen (Stitch design) -- useSafeAreaInsets, back arrow + "Konsultatsiyalar" header (Manrope_700Bold), "Mening Tarixim" title 24px + grey subtitle, consultation cards (white, radius 16, Shadow.sm) with 48px avatar circle + initials + doctor name/specialization (Manrope_600SemiBold 15px / Inter 13px), status pills top-right (FAOL green bg, YAKUNLANGAN successContainer, BEKOR QILINGAN errorContainer), date+time row with calendar/clock icons (Inter 12px), "Xulosani ko'rish" link for completed, 12px card gap, empty state with stethoscope icon circle -- `mobile/app/consultations.tsx`
- **[mobile]** Redesign Consultation Booking screen (Stitch design) -- useSafeAreaInsets, back arrow + "Konsultatsiya" header, doctor card (white, radius 16, Shadow.sm) with 64px circle avatar + name 18px + specialization + experience + ONLINE green dot badge, "Shikoyatlaringiz" textarea (tonal #f2f4f6, no border, radius 12, 120px minHeight, Inter 15px), "Konsultatsiya turi" two option cards (video/chat) side-by-side with icon circles + labels + subtitles + selected state (#006860 border + primaryLight bg), "XIZMAT NARXI" price section (Manrope_800ExtraBold 32px + UZS), gradient pill CTA with safe area bottom -- `mobile/app/consultation.tsx`
- **[mobile]** Redesign Video Call screen (Stitch design) -- full-screen dark #1a1a1a bg, remote video area with avatar placeholder, header overlay (doctor name Manrope_600SemiBold white + MM:SS timer Inter white 70%), local video preview top-right 120x160 radius 16 + 2px white border, glassmorphism control bar (rgba(0,0,0,0.5)), 3 circle buttons (mic 48px white, end call 56px red #DC2626, camera 48px white) with gap 24, safe area bottom padding, call timer hook -- `mobile/app/video-call.tsx`

## 2026-04-05 (AI Chat + Doctors redesign)

- **[mobile]** Redesign AI Chat screen (Stitch design) -- teal gradient header (#006860->#008379) with robot avatar circle + "AI Hamshira" title + ONLINE dot + menu, chat area on #f8f9fb, AI bubbles surfaceContainerLow left-aligned radius 16/4, user bubbles #006860 right-aligned radius 16/4, timestamps Inter 11px, doctor recommendation white card with avatar+name+gradient pill CTA, quick suggestion chips horizontal scroll, tonal input (no border, radius 24) + 40px teal send circle, safe area insets -- `mobile/app/ai-chat.tsx`
- **[mobile]** Redesign Doctors List screen (Stitch design) -- safe area insets, "Shifokorlar" header Manrope_700Bold 24px + subtitle, tonal pill search input (surfaceContainerLow, no border), filter pills horizontal ScrollView (Barchasi/Terapevt/Kardiolog etc, selected=#006860+white, unselected=surfaceContainerLow), doctor cards (white, radius 16, Shadow.sm, 56px circle avatar, name+spec+rating star amber+score+reviews, NARXI label+price Manrope_700Bold, "Yozilish" pill button), bottom padding 100 -- `mobile/app/doctors.tsx`

## 2026-04-05 (Order Flow redesign)

- **[mobile]** Redesign Service Detail screen (Stitch design) -- dark teal hero gradient (#006860->#004D47), centered 60px medkit icon, white title, price pill, white card overlapping hero by -24px, info row (clock+category), "Xizmat haqida" section, sticky bottom gradient pill CTA -- `mobile/app/service/[id].tsx`, `mobile/app/service/_layout.tsx`
- **[mobile]** Redesign Order Location screen (Stitch design) -- custom header with back+title+GPS icon, map area ~50%, address preview card, bottom sheet form (tonal #f2f4f6 inputs, building icon, 2-col floor/apt, +998 prefix), gradient pill CTA -- `mobile/app/order/location.tsx`
- **[mobile]** Redesign Order Confirm screen (Stitch design) -- custom header, service card (icon circle + title + price), address card with pin icon, urgent toggle, promo code input, price breakdown (base/discount green/urgent/divider/total 24px bold), sticky gradient pill CTA -- `mobile/app/order/confirm.tsx`
- **[mobile]** Redesign Order Chat screen (Stitch design) -- dark teal header gradient with medic avatar circle + name + green online dot, date separators, medic bubbles (#f2f4f6 left, radius 16/4), user bubbles (#006860 right, white text, radius 16/4), tonal input bar + attachment icon + send circle -- `mobile/app/order/chat.tsx`
- **[mobile]** Redesign Order Tracking screen (Stitch design) -- safe-area top bar with back button + floating status pill badge + Live pill, Stitch-styled cards (shadow.sm, no borders), action buttons row (Aloqa secondary + Bekor qilish error ghost), updated trackStyles.ts with Fonts/Shadow tokens -- `mobile/app/order/track.tsx`, `mobile/app/order/trackStyles.ts`
- **[mobile]** Update order + service layouts -- headerShown:false for custom headers, added chat screen to Stack -- `mobile/app/order/_layout.tsx`, `mobile/app/service/_layout.tsx`

## 2026-04-05 (Profile + Orders redesign)

- **[mobile]** Redesign Profile screen (Stitch design) -- useSafeAreaInsets, HamshiraGo brand header with gear/bell icons, centered avatar (grey circle + user icon), name/phone centered, green gradient loyalty card with tier badge + points + "Ko'proq bilish" CTA, menu list with 40px icon circles + chevron, language badge pill, red logout row -- `mobile/app/(tabs)/profile.tsx`
- **[mobile]** Redesign Orders List screen (Stitch design) -- useSafeAreaInsets, "Buyurtmalar" header with subtitle, filter pills (Barchasi/Faol/Tugatilgan), order cards with service icon circle + title/date + price/status badge, status pill colors (success/warning/error/neutral), ItemSeparator 12px gap, pull-to-refresh, empty state -- `mobile/app/(tabs)/two.tsx`

## 2026-04-05 (Home + Tab bar + ServiceCard redesign)

- **[mobile]** Redesign Home screen (Stitch design) -- custom header with bell icon, search pill, dark teal AI chat banner with pill CTA, nearby medics horizontal ScrollView, 2-column services grid via FlatList numColumns=2, skeleton grid loader -- `mobile/app/(tabs)/index.tsx`
- **[mobile]** Redesign Tab bar (Stitch design) -- white bg, no top border, whisper shadow, active dot indicator under icon, 60px height, #006860 active tint -- `mobile/app/(tabs)/_layout.tsx`
- **[mobile]** Redesign ServiceCard with gridMode prop -- vertical card layout (icon top, title, price, plus button) for grid, horizontal list layout preserved for backward compat -- `mobile/components/ServiceCard.tsx`

## 2026-04-05

- **[mobile]** Redesign Auth screen (Stitch design) -- light bg, top bar with help icon, green medkit circle, welcome title/subtitle, white form card (no-border tonal inputs), +998 prefix, eye toggle, referral with IXTIYORIY badge, gradient pill CTA, YOKI divider, ghost secondary button, legal footer -- `mobile/app/auth.tsx`
- **[mobile]** Redesign Onboarding screen (Stitch design) -- logo+skip header, illustration card with icon+badge, slide counter, pill dots (Reanimated), gradient CTA button, trust footer -- `mobile/app/onboarding.tsx`
- **[mobile]** Redesign Language Picker (Stitch design) -- light bg, language cards with radio, green gradient CTA, hint row, footer -- `mobile/app/language-picker.tsx`

- **[backend]** i18n error keys — replaced all hardcoded English error messages with translation keys in DTOs (register-client, login, register-medic, login-medic, create-doctor) and services/guards/decorators (auth.service, admin.guard, medic-auth.guard, jwt.strategy, client-id.decorator, medic-id.decorator, users.service)
- **[backend]** i18n error keys (phase 2) — replaced all hardcoded English error messages with translation keys in orders/orders.service.ts (34 throws), orders/dispatch.service.ts (2 throws), payments/payments.service.ts (3 throws), payments/payme.service.ts (2 throws), payments/payments.controller.ts (2 throws), reviews/reviews.controller.ts (1 throw)
- **[backend]** i18n error keys (phase 3) — replaced hardcoded English error messages with translation keys in 17 files: reviews (service+controller), medics (service+controller), consultations (service+video.service), loyalty, subscriptions, nps, treatment-courses, medical-card, promo, client-errors, services (service+controller), referrals, telegram-bot.controller

- **[backend]** X-Request-Id middleware — генерация уникального ID для каждого запроса, проброс в response headers — `backend/src/common/middleware/request-id.middleware.ts` (new), `backend/src/app.module.ts`, `backend/src/main.ts`
- **[backend]** WebSocket event logging — логирование subscribe_order, unsubscribe_order, dispatch_invite_expired, dispatch_update, medic_location — `backend/src/realtime/order-events.gateway.ts`
- **[backend]** Telegram bot interactive commands — полный rewrite: inline buttons accept/decline, callback query handler, уведомления клиенту в Telegram, telegramChatId в User entity — `backend/src/telegram/telegram-bot.service.ts`, `backend/src/telegram/telegram-bot.module.ts`, `backend/src/common/telegram.service.ts` (sendMessageWithButtons, answerCallbackQuery, editMessageText), `backend/src/orders/dispatch.service.ts`, `backend/src/orders/orders.service.ts`, `backend/src/users/entities/user.entity.ts`, `backend/src/users/users.service.ts`, `backend/src/medics/medics.service.ts`
- **[config]** Docker Compose + Backend Dockerfile — postgres, backend, admin, web, web-medic, osrm, pgadmin — `docker-compose.yml` (new), `backend/Dockerfile` (new)
- **[backend]** AI Analytics module — Claude AI chat, feedback summary, top issues classification — `backend/src/analytics/analytics.module.ts`, `backend/src/analytics/analytics.service.ts`, `backend/src/analytics/analytics.controller.ts`
- **[feature]** AI Ассистент страница в admin — чат с AI + сводка проблем (два таба) — `admin/src/pages/AiChat.tsx`, API functions in `api.ts`, sidebar + route + i18n (ru/uz)
- **[mobile]** Nearby medics map screen — MapView с маркерами медиков, геолокация, bottom card — `mobile/app/nearby-medics.tsx` (new), `mobile/app/(tabs)/index.tsx` (banner link)

## 2026-04-05 (D-23–D-26: Admin новые страницы + ADM-BUG-1–14)

- **[feature]** D-23 — Admin Промо-коды: таблица, фильтр, создание/деактивация — `admin/src/pages/PromoCodes.tsx`
- **[feature]** D-24 — Admin Тарифы подписок: CRUD диалог, статистика, toggle isActive — `admin/src/pages/SubscriptionTiers.tsx`
- **[feature]** D-25 — Admin Врачи: таблица с фото/рейтингом, CRUD диалог, toggle isActive — `admin/src/pages/Doctors.tsx`
- **[feature]** D-26 — Admin Аудит-лог: пагинация, фильтр по action, expandable JSON row — `admin/src/pages/AuditLog.tsx`
- **[api]** Добавлены типы и функции: PromoCode, SubscriptionTier, Doctor, AuditLog — `admin/src/lib/api.ts`
- **[fix]** ADM-BUG-1 — Dashboard revenue грузится один раз при монтировании, не каждые 30с
- **[fix]** ADM-BUG-2 — Dashboard timezone fix (toLocaleDateString("sv")), лейбл "В процессе сейчас"
- **[fix]** ADM-BUG-3 — Orders поиск по до 1000 заказов (10 страниц × 100)
- **[fix]** ADM-BUG-4 — Analytics грузит только 90 дней с cutoff stop
- **[fix]** ADM-BUG-5 — Reports грузит DONE заказы только с даты `from`
- **[fix]** ADM-BUG-6 — Medics грузит все страницы параллельно
- **[fix]** ADM-BUG-7 — Clients isMounted ref предотвращает двойную загрузку
- **[fix]** ADM-BUG-8 — Services min=0 + Math.max(0) на цену
- **[fix]** ADM-BUG-9 — Consultations (clientId ?? "").slice(0,8) в двух местах
- **[fix]** ADM-BUG-10 — Consultations alert() → toast.error()
- **[fix]** ADM-BUG-11 — Settings slider onValueCommit вместо onValueChange
- **[fix]** ADM-BUG-12 — UserSupport поиск по 500 ошибкам с debounce
- **[fix]** ADM-BUG-13 — api.ts base64url → base64 конвертация перед atob
- **[fix]** ADM-BUG-14 — api.ts 401: custom event + useNavigate в AdminLayout (SPA навигация)

## 2026-04-04 (Bug Audit + Fixes — Абубакир)

- **[audit]** Full bug audit: 15 mobile bugs + 14 admin bugs found and documented in tasks.md
- **[fix]** MOB-BUG-1–4 (CRITICAL): Fixed apiFetch 3-argument pattern in prescription.tsx, prescriptions.tsx, nps.tsx
- **[fix]** MOB-BUG-5 (CRITICAL): Fixed Rules of Hooks violation in video-call.tsx
- **[fix]** MOB-BUG-6–15: Various mobile fixes (promoId, user.name, chat, subscription discount, TextInput, LiveKit, NPS race)

## 2026-04-04 (D-22: Статистика заказов медика)
- **[feature]** Счётчик DONE заказов в стат-блоке профиля (4-я колонка грид), загружается параллельно с профилем — web-medic/app/profile/page.tsx

## 2026-04-04 (D-21: Верификация медика — отдельная страница)
- **[feature]** /verification — статус карточка (APPROVED/PENDING/REJECTED), dnd загрузка facePhoto + licensePhoto, кнопка отправки — web-medic/app/verification/page.tsx
- **[feature]** Кнопка "Верификация" с цветным статусом в профиле медика — web-medic/app/profile/page.tsx

## 2026-04-04 (D-19: Редактирование имени медика)
- **[feature]** medicApi.auth.updateProfile(name) → PATCH /medics/profile — web-medic/lib/api.ts
- **[feature]** Кнопка FaPen рядом с именем в хедере профиля, inline input с Enter/Escape, ✓/✗ кнопки, обновляет localStorage — web-medic/app/profile/page.tsx

## 2026-04-04 (D-18: Промо-коды на подтверждении заказа)
- **[feature]** api.promo.validate(code) → POST /promo/validate — web/lib/api.ts
- **[feature]** Поле промо-кода + кнопка "Применить", зелёная/красная рамка по статусу, строка скидки в итоге — web/app/order/confirm/page.tsx

## 2026-04-04 (D-17 + D-20: Чат в заказе — web + web-medic)
- **[feature]** ChatMessage интерфейс + api.chat.getMessages/sendMessage — web/lib/api.ts
- **[feature]** Кнопка "Чат с медиком" + slide-up панель, Socket.IO order_message listener — web/app/orders/[id]/page.tsx
- **[feature]** ChatMessage интерфейс + medicApi.chat.getMessages/sendMessage (medic-messages endpoint) — web-medic/lib/api.ts
- **[feature]** Кнопка "Чат с клиентом" + slide-up панель, Socket.IO order_message listener — web-medic/app/order/[id]/page.tsx

## 2026-04-04 (Этапы 1–5: Infrastructure + Features + Mobile UI)

- **[infra]** Миграции 001–010 запущены на Railway production DB (25 таблиц) — prescriptions, nps_surveys, video fields, order chat, promo_codes, admin_audit_logs
- **[feature]** GET /health/detailed — проверка DB, Cloudinary, Expo Push с latency -- `backend/src/app.controller.ts`
- **[feature]** GET /auth/me — профиль клиента -- `backend/src/auth/auth.controller.ts`
- **[feature]** PATCH /auth/profile — обновление имени клиента -- `backend/src/auth/auth.controller.ts`
- **[feature]** PATCH /medics/profile — обновление имени медика -- `backend/src/medics/medics.controller.ts`
- **[feature]** POST /auth/refresh — обновление JWT токена -- `backend/src/auth/auth.controller.ts`
- **[feature]** POST /orders/:id/reorder — повторный заказ (копия service + location) -- `backend/src/orders/orders.service.ts`
- **[feature]** Order chat: POST /orders/:id/messages, POST /:id/medic-messages, GET /:id/messages, Socket.IO event order_message -- `backend/src/orders/`
- **[feature]** PromoCode entity + CRUD: POST /promo/validate, GET/POST/PATCH /promo/admin -- `backend/src/promo/`
- **[feature]** AdminAuditLog entity + GET /admin/audit-log (paginated + filter) -- `backend/src/common/audit-log.service.ts`
- **[feature]** Mobile: order chat screen (FlatList, Socket.IO real-time, send/receive) -- `mobile/app/order/chat.tsx`
- **[feature]** Mobile: promo code input on confirm screen (validate + discount display) -- `mobile/app/order/confirm.tsx`
- **[feature]** Mobile: inline edit name on profile screen -- `mobile/app/(tabs)/profile.tsx`
- **[feature]** Mobile: chat button on order track screen -- `mobile/app/order/track.tsx`
- **[i18n]** Added chat.*, promo.*, editProfile.* keys to ru.json + uz.json
- **[migration]** 008_order_chat.sql, 009_promo_codes.sql, 010_admin_audit_log.sql
- **[docs]** Full mobile vs web gap analysis (updated 2026-04-04): web client at parity except chat + promo codes

## 2026-04-03 (Web + Web-Medic: Онбординг)
- **[feature]** /onboarding — 3 слайда (стетоскоп, карта, звезда), CSS анимация, localStorage flag — web/app/onboarding/page.tsx
- **[feature]** Редирект на /onboarding если флаг не стоит — web/app/auth/page.tsx
- **[feature]** /onboarding — 3 слайда для медика (чемодан, карта, кошелёк) — web-medic/app/onboarding/page.tsx
- **[feature]** Редирект на /onboarding если флаг не стоит — web-medic/app/auth/page.tsx

## 2026-04-03 (Web-Medic: Кошелёк медика)
- **[feature]** urgentFee, isUrgent добавлены в Order интерфейс — web-medic/lib/api.ts
- **[feature]** /wallet — balance + earnings карточки, история DONE заказов с разбивкой (цена, срочный, скидка, комиссия 10%) — web-medic/app/wallet/page.tsx
- **[feature]** Кнопка "Кошелёк" с балансом в профиле медика — web-medic/app/profile/page.tsx

## 2026-04-03 (Web-Medic: Отзывы медика)
- **[feature]** reviews.getByMedic(medicId, page) — web-medic/lib/api.ts
- **[feature]** /reviews страница — рейтинг summary, список карточек с звёздами и датой, пагинация — web-medic/app/reviews/page.tsx
- **[feature]** Кнопка "Мои отзывы" с рейтингом и счётчиком — web-medic/app/profile/page.tsx

## 2026-04-03 (Web: Видеозвонок LiveKit)
- **[deps]** @livekit/components-react + livekit-client установлены — web/package.json
- **[feature]** initiateCall(), endCall() — web/lib/api.ts
- **[feature]** /video-call/[id] страница — LiveKitRoom, custom UI (mic/cam toggle, PiP локальное видео, remote видео) — web/app/video-call/[id]/page.tsx
- **[feature]** Кнопка "Видеозвонок" для PENDING/ACTIVE консультаций — web/app/consultations/page.tsx

## 2026-04-03 (Web: Редактирование профиля)
- **[backend]** updateName(id, name) в UsersService — backend/src/users/users.service.ts
- **[backend]** PATCH /auth/profile endpoint (JwtAuthGuard) — backend/src/auth/auth.controller.ts
- **[feature]** api.auth.updateProfile(name) функция — web/lib/api.ts
- **[feature]** Кнопка "Изменить" (FaPen) рядом с именем + модал с input → PATCH /auth/profile → обновляет localStorage — web/app/profile/page.tsx

## 2026-04-03 (Web-Medic: История заказов)
- **[feature]** `/orders` страница — табы Активные/История, KPI (выполнено/заработано/отменено), список с кликом на детали, pull-to-refresh — web-medic/app/orders/page.tsx
- **[feature]** Кнопка "Вся история →" на дашборде рядом с заголовком "Мои заказы" — web-medic/app/page.tsx

## 2026-04-03 (D-15: Admin Analytics)
- **[feature]** /analytics page — period switcher (30/90 days), KPI cards (avg check, platform revenue, conversion %, avg completion time), weekly ComposedChart (bars+line), top medics table (orders + revenue, medic name lookup), top services table — admin/src/pages/Analytics.tsx
- **[feature]** Route /analytics + PieChart sidebar link added — admin/src/App.tsx, AdminSidebar.tsx

## 2026-04-03 (D-14: Admin Consultations + Prescriptions)
- **[backend]** getAllConsultations(page, limit, status?) method — backend/src/consultations/consultations.service.ts
- **[backend]** GET /consultations/admin/all endpoint (AdminGuard, paginated, filterable by status) — backend/src/consultations/consultations.controller.ts
- **[feature]** AdminConsultation type + getAdminConsultations, completeConsultation, cancelAdminConsultation API functions — admin/src/lib/api.ts
- **[feature]** /consultations admin page — list table with status filter, pagination, "Детали" modal, "Завершить" modal (doctorNotes + service dropdown → creates prescription), "Отменить" action — admin/src/pages/Consultations.tsx
- **[feature]** Route /consultations + MessageSquare sidebar link added — admin/src/App.tsx, AdminSidebar.tsx

## 2026-04-03 (D-13: Admin NPS Dashboard)
- **[feature]** getNpsStats API function + NpsStats/NpsMonthStat types — admin/src/lib/api.ts
- **[feature]** `/nps` page — overall NPS gauge (color-coded), promoters/passives/detractors cards with progress bars, monthly bar chart (recharts), monthly breakdown table — admin/src/pages/Nps.tsx
- **[feature]** Route /nps added — admin/src/App.tsx
- **[feature]** NPS link (ThumbsUp icon) added to sidebar — admin/src/components/AdminSidebar.tsx

## 2026-04-02 (D-12: Web NPS)
- **[feature]** checkNps, submitNps API functions — web/lib/api.ts
- **[feature]** `/nps` page — 0–10 score buttons (red/amber/green), comment textarea, thank-you screen — web/app/nps/page.tsx
- **[feature]** Auto-check on main page load: GET /nps/check → if shouldShow redirect to /nps (once per session via sessionStorage) — web/app/page.tsx

## 2026-04-02 (D-11: Web Prescriptions)
- **[feature]** Prescription type + API functions (getMyPrescriptions, confirmPrescription, cancelPrescription) — web/lib/api.ts
- **[feature]** `/prescriptions` page — list with PENDING/CONFIRMED/CANCELED/EXPIRED status badges, expiry check, pagination — web/app/prescriptions/page.tsx
- **[feature]** `/prescriptions/[id]` page — service info, doctorNotes, expiry, GPS location, address form (house/floor/apt/phone), confirm/cancel modals — web/app/prescriptions/[id]/page.tsx
- **[feature]** Prescriptions link added to profile page — web/app/profile/page.tsx

## 2026-04-02 (V3: Video Consultations — LiveKit)

- **[feature]** VideoService: LiveKit integration — createRoom, generateToken, endCall, joinCall with RoomServiceClient -- `backend/src/consultations/video.service.ts`
- **[feature]** Video endpoints: POST /:id/call (initiate), POST /:id/call/join, POST /:id/call/end, GET /:id/call/status -- `backend/src/consultations/consultations.controller.ts`
- **[feature]** Consultation entity: added videoRoomName, videoStatus (CALLING/ACTIVE/ENDED) -- `backend/src/consultations/entities/consultation.entity.ts`
- **[migration]** SQL migration `backend/migrations/007_video_consultations.sql` -- ALTER consultations ADD videoRoomName, videoStatus
- **[dependency]** Installed `livekit-server-sdk` for backend -- `backend/package.json`
- **[feature]** Mobile video call screen: LiveKit room, remote/local video tracks, mic/camera toggle, end call -- `mobile/app/video-call.tsx`
- **[feature]** "Call Doctor" button on ACTIVE/PENDING consultations -- `mobile/app/consultations.tsx`
- **[dependency]** Installed `@livekit/react-native`, `@livekit/react-native-expo-plugin` -- `mobile/package.json`
- **[i18n]** Added `videoCall.*` keys to ru.json and uz.json (5 keys each)

## 2026-04-02 (V3: NPS Surveys)

## 2026-04-02 (web-medic: интерактивная карта в рабочей зоне)
- **[feat]** Добавлена интерактивная Leaflet карта на страницу work-zone — клик устанавливает центр, отображается круг зоны — web-medic/app/work-zone/page.tsx

## 2026-04-02 (i18n: переводы названий услуг)
- **[fix]** Добавлены поля titleUz/descriptionUz/categoryUz в интерфейс Service — web/lib/api.ts
- **[fix]** Названия и описания услуг переводятся при language=uz через поля из API — web/app/page.tsx
- **[fix]** Статическая карта SERVICE_TITLE_UZ для перевода serviceTitle в заказах медика — web-medic/app/page.tsx

## 2026-04-02 (Landing: SEO-страницы по районам Ташкента)
- **[feat]** Добавлены страницы по районам: Чиланзар, Юнусабад, Мирзо-Улугбек, Яккасарай (ru + uz) — landing/app/[lang]/[service]/page.tsx

## 2026-04-02 (Admin: карта медиков с геозонами)
- **[feat]** Добавлены поля workZoneLat/workZoneLng/workZoneRadius в интерфейс AdminMedic — admin/src/lib/api.ts
- **[feat]** Вкладка "Карта" в странице медиков — react-leaflet карта с маркерами и Circle геозонами — admin/src/pages/Medics.tsx

## 2026-04-02 (Аудит Диёра — подтверждение готовых задач)
- **[verified]** Web: экран оценки после завершения заказа (звёзды + комментарий) — встроен в `/orders/[id]`, API `orders.rate()` — `web/app/orders/[id]/page.tsx`, `web/lib/api.ts`
- **[verified]** Web: переключатель «Срочный вызов» при создании заказа + отображение доплаты — `web/app/order/confirm/page.tsx`
- **[verified]** Web: глобальный error handler — `error.tsx` + `global-error.tsx` + `reportClientError()` → `POST /client-errors` — `web/app/error.tsx`, `web/app/global-error.tsx`, `web/lib/api.ts`
- **[verified]** Web-medic: глобальный error handler — `error.tsx` + `global-error.tsx` + Sentry интеграция — `web-medic/app/error.tsx`, `web-medic/app/global-error.tsx`
- **[verified]** Admin: страница «User Support» — таблица ошибок, фильтры (статус/поиск), статистика (NEW/IN_PROGRESS/FIXED/IGNORED) — `admin/src/pages/UserSupport.tsx`, `admin/src/lib/api.ts`
- **[verified]** Landing: SEO страницы услуг — `/ru/ukol-na-domu`, `/ru/kapelnica-na-domu`, `/ru/izmerenie-davleniya`, `/ru/uxod-na-domu` + узбекские аналоги — `landing/app/[lang]/[service]/page.tsx`
- **[verified]** Landing: Sitemap.xml + robots.txt — `landing/app/sitemap.ts`, `landing/app/robots.ts`
- **[verified]** Landing: Meta-теги, Open Graph, JSON-LD (MedicalBusiness + FAQPage + MobileApplication), hreflang ru/uz — `landing/app/[lang]/layout.tsx`

## 2026-04-02 (V3: NPS Surveys)
- **[feature]** NPS module: NpsSurvey entity (userId, score 0–10, comment), submit with 1/month limit, hasAnsweredThisMonth check -- `backend/src/nps/`
- **[feature]** NPS cron: `@Cron('0 11 1 * *')` sends push to active clients (≥1 DONE order in 30 days), skips already-answered -- `backend/src/nps/nps.service.ts`
- **[feature]** NPS admin stats: overall NPS score + monthly breakdown with promoters/passives/detractors -- `GET /nps/admin/stats`
- **[feature]** NPS endpoints: POST /nps/submit, GET /nps/check, GET /nps/admin/stats -- `backend/src/nps/nps.controller.ts`
- **[migration]** SQL migration `backend/migrations/006_nps.sql` -- nps_surveys table with indexes
- **[feature]** Mobile NPS screen: 0–10 score buttons (color-coded), optional comment, thank-you screen -- `mobile/app/nps.tsx`
- **[feature]** Auto-check NPS on app open (GET /nps/check → navigate to /nps if shouldShow) -- `mobile/app/_layout.tsx`
- **[feature]** Push deep link for NPS (data.type === 'nps') -- `mobile/app/_layout.tsx`
- **[i18n]** Added `nps.*` keys to ru.json and uz.json (13 keys each)

## 2026-04-02 (V3: Doctor Prescription → Auto-Order)
- **[feature]** Prescription entity: consultationId, clientId, serviceId, serviceTitle, servicePrice, status (PENDING/CONFIRMED/CANCELED/EXPIRED), orderId, doctorNotes, expiresAt (7 days) -- `backend/src/consultations/entities/prescription.entity.ts`
- **[feature]** Prescription service methods: createPrescription (with push notification), confirmPrescription (creates order via OrdersService), getMyPrescriptions (paginated), cancelPrescription -- `backend/src/consultations/consultations.service.ts`
- **[feature]** Prescription endpoints: GET /consultations/prescriptions/my, POST /consultations/prescriptions/:id/confirm, POST /consultations/prescriptions/:id/cancel -- `backend/src/consultations/consultations.controller.ts`
- **[feature]** Admin complete consultation now auto-creates prescription if createOrderServiceId provided -- `backend/src/consultations/consultations.controller.ts`
- **[feature]** ConfirmPrescriptionDto with OrderLocationDto -- `backend/src/consultations/dto/confirm-prescription.dto.ts`
- **[migration]** SQL migration `backend/migrations/005_prescriptions.sql` -- prescriptions table with indexes
- **[feature]** Mobile prescription screen: service info, doctor notes, expiry, location form, confirm/cancel flow -- `mobile/app/prescription.tsx`
- **[feature]** Mobile prescriptions list screen with status badges, pagination, navigation -- `mobile/app/prescriptions.tsx`
- **[feature]** Push notification deep link for prescriptions -- `mobile/app/_layout.tsx`
- **[feature]** Profile quick link to prescriptions -- `mobile/app/(tabs)/profile.tsx`
- **[i18n]** Added `prescription.*` keys to ru.json and uz.json (24 keys each)

## 2026-04-02 (Sentry Error Tracking — ALL-L1)
- **[infra]** Backend Sentry: `@sentry/nestjs` installed, `instrument.ts` with DSN from env, `SentryExceptionFilter` (5xx only) registered globally -- `backend/src/instrument.ts`, `backend/src/common/filters/sentry-exception.filter.ts`, `backend/src/app.module.ts`, `backend/src/main.ts`
- **[infra]** Mobile Sentry: `@sentry/react-native` installed, `Sentry.init()` in `_layout.tsx`, `reportError()` sends to both Sentry + backend API -- `mobile/app/_layout.tsx`, `mobile/utils/reportError.ts`, `mobile/app.json` (plugin)
- **[infra]** Medic Sentry: `@sentry/react-native` installed, `Sentry.init()` in `_layout.tsx`, `reportError()` sends to both Sentry + backend API -- `medic/app/_layout.tsx`, `medic/utils/reportError.ts`, `medic/app.json` (plugin)
- **[docs]** Added Диёр's task list to `docs/tasks.md` with API refs and mobile references

## 2026-03-31 (Full Documentation Sync)

- **[docs]** Created `docs/PRODUCTION_SETUP.md` -- comprehensive production deployment guide with Railway env vars (critical/payments/AI/Telegram/Cloudinary/VAPID/optional), database migration instructions, mobile app EAS setup, web app deployment, security checklist, graceful fallbacks table, monitoring/cron jobs overview, architecture diagram
- **[docs]** Updated `docs/BACKEND_API.md` -- added sections 18-21: Reviews (POST/GET endpoints, unique constraints, cron reminders), Loyalty (GET /loyalty/my, GET /loyalty/history, POST /loyalty/redeem with tier system), Subscriptions (client + admin endpoints, purchase/cancel/tiers), Consultations/AI Agent (ai-chat, doctors, consultations, admin CRUD)
- **[docs]** Updated `docs/tasks.md` -- marked V2 section as COMPLETED (Loyalty, Subscriptions, AI Agent + Consultations), added V3 roadmap section with carried-over items (video consultations, NPS, web features, admin improvements), separated V3+ ideas
- **[docs]** Updated `docs/done.md` -- added V2 consolidated summary section

## 2026-03-31 (V2 Consolidated Summary)

- **[backend]** V2-A Loyalty Points: complete module with LoyaltyTransaction entity, tier system (BRONZE/SILVER/GOLD with multipliers), awardPoints/spendPoints with pessimistic locks, milestone bonuses, 3 endpoints (GET /loyalty/my, GET /loyalty/history, POST /loyalty/redeem), auto-award on DONE, AppSettings config -- `backend/src/loyalty/`, `backend/migrations/002_loyalty.sql`
- **[backend]** V2-B Subscriptions: complete module with SubscriptionTier + Subscription entities, purchase with pessimistic lock, cancel, getSubscriptionDiscount, incrementOrdersUsed, daily cron expiry at 3 AM with push, client + admin endpoints -- `backend/src/subscriptions/`, `backend/migrations/003_subscriptions.sql`
- **[backend]** V2-C AI Agent + Consultations: complete module with Doctor/Consultation/ChatMessage entities, AiAgentService (Claude Haiku via @anthropic-ai/sdk), medical triage system prompt, specialization extraction, graceful fallback, client + admin endpoints, 15% platformFee -- `backend/src/consultations/`, `backend/migrations/004_consultations.sql`
- **[mobile]** V2-A Loyalty UI: loyalty screen with points balance, tier badge, progress bar, redeem bottom sheet, paginated transaction history; profile card; order confirm info; order track earned notice -- `mobile/app/loyalty.tsx`
- **[mobile]** V2-B Subscriptions UI: subscriptions screen with active sub card, available tiers, purchase/cancel flow; profile card; order confirm discount info -- `mobile/app/subscriptions.tsx`
- **[mobile]** V2-C Consultations UI: AI Chat screen, Doctors list (filterable by specialization), Consultation booking, My Consultations (paginated), home banner, profile quick links -- `mobile/app/ai-chat.tsx`, `mobile/app/doctors.tsx`, `mobile/app/consultation.tsx`, `mobile/app/consultations.tsx`

## 2026-03-31 (AI Chat + Consultations UI -- mobile client)

- **[feature]** AI Chat screen `mobile/app/ai-chat.tsx` -- chat interface with AI medical assistant, message bubbles (user/assistant), typing indicator, recommendation cards with "Find Doctor" button, KeyboardAvoidingView, auto-scroll
- **[feature]** Doctors list screen `mobile/app/doctors.tsx` -- filterable by specialization, doctor cards with photo (expo-image + blurhash), rating, price, "Book" button, empty state
- **[feature]** Consultation booking screen `mobile/app/consultation.tsx` -- doctor info card, symptoms summary from AI chat, price/fee display, confirm booking flow
- **[feature]** My Consultations screen `mobile/app/consultations.tsx` -- paginated FlashList, status badges (PENDING/ACTIVE/COMPLETED/CANCELED), doctor notes alert on tap, load more
- **[feature]** AI assistant banner on home screen `mobile/app/(tabs)/index.tsx` -- prominent card linking to /ai-chat
- **[feature]** Profile quick links `mobile/app/(tabs)/profile.tsx` -- added "My Consultations" and "AI Assistant" links
- **[routing]** Registered 4 new Stack.Screen routes in `mobile/app/_layout.tsx` (ai-chat, doctors, consultation, consultations)
- **[i18n]** Added `aiChat.*`, `doctors.*`, `consultation.*` keys to `mobile/i18n/ru.json` and `mobile/i18n/uz.json`

## 2026-03-31 (AI Agent + Online Consultations module)

- **[feature]** Complete Consultations module -- `backend/src/consultations/` (entities, services, controller, module, DTOs)
  - Doctor entity: name, nameUz, specialization, bio, photoUrl, pricePerConsultation, phone, rating, consultationCount
  - Consultation entity: clientId, doctorId, status (PENDING/ACTIVE/COMPLETED/CANCELED), symptoms, suggestedSpecialization, doctorNotes, createdOrderId, price, platformFee (15%)
  - ChatMessage entity: consultationId (nullable for triage), userId, role (user/assistant/doctor), content
  - AiAgentService: Claude Haiku integration via @anthropic-ai/sdk, medical triage system prompt, parseRecommendation() for specialization extraction, graceful fallback when API key missing
  - ConsultationsService: getDoctors (with specialization filter), createConsultation, completeConsultation, cancelConsultation, getMyConsultations (paginated), getConsultation (with messages), saveChatMessage, admin CRUD for doctors, stats
  - Client endpoints: POST /consultations/ai-chat, GET /consultations/doctors, GET /consultations/doctors/:id, POST /consultations, GET /consultations/my, GET /consultations/:id
  - Admin endpoints: POST/PATCH/GET /consultations/admin/doctors, PATCH /consultations/admin/:id/complete, PATCH /consultations/admin/:id/cancel, GET /consultations/admin/stats
- **[dependency]** Installed @anthropic-ai/sdk for Claude API integration -- `backend/package.json`
- **[migration]** SQL migration `backend/migrations/004_consultations.sql` -- doctors, consultations, chat_messages tables, indexes, seed 6 sample doctors with different specializations
- **[integration]** Registered ConsultationsModule in AppModule -- `backend/src/app.module.ts`

## 2026-03-31 (Subscriptions UI -- mobile client)

- **[feature]** Subscriptions screen `mobile/app/subscriptions.tsx` -- active subscription card with progress bar and cancel button, available tiers list with purchase flow, i18n support (ru/uz)
- **[feature]** Subscription card on profile `mobile/app/(tabs)/profile.tsx` -- fetches `/subscriptions/my`, shows active subscription info or "no subscription" link, added subscriptions quick link
- **[feature]** Subscription discount info on order confirm `mobile/app/order/confirm.tsx` -- fetches active subscription, shows discount percentage info card or limit reached warning
- **[feature]** Subscriptions route registered in `mobile/app/_layout.tsx`
- **[i18n]** Added `subscription.*` keys to `mobile/i18n/ru.json` and `mobile/i18n/uz.json` (22 keys each)

## 2026-03-31 (Subscriptions/Packages module)

- **[feature]** Complete Subscriptions module -- `backend/src/subscriptions/` (entities, service, controller, module, DTOs)
  - SubscriptionTier entity: name, nameUz, description, price, billingDays, maxOrders, discountPercent, isActive, sortOrder
  - Subscription entity: userId, tierId, status (ACTIVE/EXPIRED/CANCELED), ordersUsed, startDate, expiresAt
  - `purchase()` with pessimistic lock to prevent double-purchase
  - `cancel()` sets status=CANCELED
  - `getSubscriptionDiscount()` checks active sub with remaining orders, returns discountPercent
  - `incrementOrdersUsed()` atomic increment
  - Daily cron at 3 AM expires overdue subscriptions and sends push notification
  - Client endpoints: GET /subscriptions/tiers, GET /subscriptions/my, POST /subscriptions/purchase, POST /subscriptions/cancel
  - Admin endpoints: GET/POST /subscriptions/admin/tiers, PATCH /subscriptions/admin/tiers/:id, GET /subscriptions/admin/stats
- **[feature]** Integrated subscription discount into OrdersService `create()` -- applies discountPercent from active subscription, increments ordersUsed after order creation -- `backend/src/orders/orders.service.ts`
- **[migration]** SQL migration `backend/migrations/003_subscriptions.sql` -- subscription_tiers, subscriptions tables, indexes, seed 3 default tiers

## 2026-03-31 (Loyalty Points UI -- mobile client)

- **[feature]** Loyalty screen `mobile/app/loyalty.tsx` -- points balance card with gradient, tier badge (BRONZE/SILVER/GOLD), progress bar to next tier, redeem bottom sheet modal with preset buttons and discount estimate, paginated transaction history via FlashList
- **[feature]** Loyalty card on profile `mobile/app/(tabs)/profile.tsx` -- fetches `/loyalty/my` with cache fallback, shows points + tier badge, navigates to loyalty screen; added loyalty link in quick links section
- **[feature]** Loyalty info on order confirm `mobile/app/order/confirm.tsx` -- fetches loyalty balance, shows available discount info with link to loyalty screen when user has points
- **[feature]** Loyalty points earned notice on order track `mobile/app/order/track.tsx` -- informational card shown after order status DONE
- **[feature]** Loyalty route registered in `mobile/app/_layout.tsx`
- **[i18n]** Added `loyalty.*` keys to `mobile/i18n/ru.json` and `mobile/i18n/uz.json` (24 keys each)

## 2026-03-31 (Loyalty Points module)

- **[feature]** Complete Loyalty Points module -- `backend/src/loyalty/` (entity, service, controller, module, DTO)
  - LoyaltyTransaction entity with EARNED/SPENT/BONUS/MILESTONE types
  - `awardPoints()` with tier multipliers (BRONZE x1, SILVER x1.5, GOLD x2) and milestone bonus every 5 orders
  - `spendPoints()` with pessimistic_write lock, converts points to UZS discount
  - `getBalance()` returns points, tier, next tier info
  - `getHistory()` paginated transaction history
  - Endpoints: GET /loyalty/my, GET /loyalty/history, POST /loyalty/redeem
- **[feature]** Extended User entity with `loyaltyPoints` and `loyaltyTier` columns (nullable) -- `backend/src/users/entities/user.entity.ts`
- **[feature]** Extended AppSettings entity with 4 loyalty config columns (pointsPerOrder, silverThreshold, goldThreshold, redemptionRate) -- `backend/src/app-settings/entities/app-settings.entity.ts`
- **[feature]** Extended AppSettings DTO, service, controller to support loyalty config fields -- `backend/src/app-settings/`
- **[feature]** Hooked loyalty award into OrdersService DONE transition (fire-and-forget like referral bonus) -- `backend/src/orders/orders.service.ts`
- **[migration]** SQL migration `backend/migrations/002_loyalty.sql` -- idempotent DDL for users columns, loyalty_transactions table, app_settings columns

## 2026-03-31 (SQL migration script for Railway DB schema sync)

- **[migration]** Generated comprehensive idempotent SQL migration `backend/migrations/001_sync_schema.sql` covering all 14 tables: users, medics, services, orders, order_locations, dispatch_attempts, reviews, referrals, treatment_courses, favorite_medics, medical_cards, app_settings, client_errors. Creates missing tables (IF NOT EXISTS), adds missing columns via DO $$ blocks, creates enums, indexes, unique constraints, and seeds app_settings singleton row.

## 2026-03-31 (4 BLOCKER backend bug fixes — Railway DB column mismatch)

- **[fix]** BE-BLK1 — Client registration 500: `users.service.ts` `create()` now catches missing-column errors from referral columns and falls back to raw INSERT with base columns only -- `users/users.service.ts`
- **[fix]** BE-BLK2 — Medic login 500: added `isMissingColumnError` helper and `findBaseByField` fallback to `medics.service.ts`; wrapped `register()`, `login()`, `findById()`, `getProfile()`, `updateLocation()`, `setWorkZone()`, `clearWorkZone()`, `saveTelegramChatId()`, `getOnlinePushTokens()`, `getOnlineTelegramChatIds()`, `getPendingVerifications()`, `verifyMedic()`, `autoDisableStaleOnlineMedics()` with try-catch for missing columns -- `medics/medics.service.ts`
- **[fix]** BE-BLK3 — Reviews endpoint 500: added `isTableOrColumnMissing` guard to `findByMedic()`, `findByClient()`, `findByOrder()`, `getTargetRatingStats()`, and `create()` — returns empty results when reviews table/columns missing on Railway -- `reviews/reviews.service.ts`
- **[fix]** BE-BLK4 — AppSettings missing urgentFeePercent: raw SQL fallback now tries to include urgent fields with COALESCE defaults (50/22/7); nested try-catch falls back to base columns with in-memory defaults; `patch()` also wrapped for missing urgent columns -- `app-settings/app-settings.service.ts`

## 2026-03-31 (3 LOW bug fixes)

- **[fix]** MED-L1 — Photo MIME type: `jpg` extension now correctly maps to `image/jpeg` instead of invalid `image/jpg`; added `.toLowerCase()` for case safety -- `medic/app/(tabs)/profile.tsx`
- **[fix]** MED-L2 — Work zone PATCH button disable: verified already implemented (`saving`/`clearing` states with `disabled` prop on both save and clear buttons) -- `medic/app/work-zone.tsx`
- **[fix]** MOB-L1 — Phone re-validation in confirm.tsx: added `trim()` + `length < 9` check at start of `handleSubmit`; uses validated `phone` variable in API payload -- `mobile/app/order/confirm.tsx`

## 2026-03-31 (Medic: 6 MEDIUM bug fixes)

- **[fix]** MED-M1 — Earnings display mismatch: EarningsCard now only shows full breakdown (commission, net earnings) when `order.status === 'DONE'`; in-progress orders show service name, date, price and "Earnings calculated after completion" placeholder; uses `doneEarnings` from backend response when available -- `medic/app/order/[id].tsx`, `medic/components/order/EarningsCard.tsx`, `medic/i18n/ru.json`, `medic/i18n/uz.json`
- **[fix]** MED-M2 — Socket emit without connection check: verified all `socket.emit()` calls in `useMedicLocation.ts` already use safe `socket?.connected` guard (fixed in MED-H3) -- `medic/hooks/useMedicLocation.ts`
- **[fix]** MED-M3 — Photo upload raw fetch without timeout: added AbortController with 30s timeout, explicit 401 handling that calls `logout()`, and AbortError-specific error message -- `medic/app/verification.tsx`
- **[fix]** MED-M4 — Location permission revoked no retry: reset `locationDeniedWarnedRef.current = false` at start of `startTracking()` so each new order triggers a fresh permission check even if previously denied -- `medic/hooks/useMedicLocation.ts`
- **[fix]** MED-M5 — OSRM route timeout infinite spinner: added `routeError` state; on fetch failure sets error flag; UI shows "Route unavailable" text with warning icon instead of perpetual loading overlay -- `medic/components/OrderInviteModal.tsx`, `medic/i18n/ru.json`, `medic/i18n/uz.json`
- **[fix]** MED-M6 — Order fetch 401 router.back() on auth error: catch block now checks if error message contains '401'/'Unauthorized' and returns early, letting the global 401 handler manage auth redirect; `router.back()` only called for non-auth errors (404, 500) -- `medic/hooks/useOrderStatus.ts`

## 2026-03-31 (Backend: 5 MEDIUM bug fixes)

- **[fix]** BE-M1 — Discount validation: replaced 20% cap with first-order eligibility check (count DONE orders) + 15% cap; added TODO for promo-code system -- `orders/orders.service.ts`
- **[fix]** BE-M2 — AppSettings init save without try-catch: wrapped `repo.save()` in try-catch with retry `findOne` fallback on duplicate key / constraint error -- `app-settings/app-settings.service.ts`
- **[fix]** BE-M3 — Order status enum validation: already fixed (`@IsEnum(OrderStatus)` present in DTO) -- `orders/dto/update-order-status.dto.ts`
- **[fix]** BE-M4 — Push notification no retry: added `notifyWithRetry` helper (retries once after 2s); applied to critical calls (CANCELED, DONE, ACCEPTED, medic status changes to client) -- `orders/orders.service.ts`
- **[fix]** BE-M5 — Location decimal-to-number NaN guard: replaced raw `Number()` with `safeNumber()` in `mapLegacyOrderRow` (lat/lng fields) and `findAvailable` (medic + order coordinates) with `Number.isFinite` fallback -- `orders/orders.service.ts`

## 2026-03-31 (Mobile: 5 MEDIUM bug fixes)

- **[fix]** MOB-M1 — Silent API failures in confirm.tsx: added toast on service load error (critical path), console.warn on non-critical settings/orders-count failures -- `mobile/app/order/confirm.tsx`
- **[fix]** MOB-M2 — WebSocket cleanup missing unsubscribe_order on unmount: iterate subscribedRef and emit `unsubscribe_order` for each order before clearing -- `mobile/app/(tabs)/two.tsx`
- **[fix]** MOB-M3 — Urgent fee percent has no bounds check: clamped `urgentFeePercent` to 0-100 range with `Math.max(0, Math.min(100, ...))` -- `mobile/app/order/confirm.tsx`
- **[fix]** MOB-M4 — Navigation race condition from AsyncStorage re-reads on every segment change: added early return when `onboardingDone === true` to skip redundant reads -- `mobile/app/_layout.tsx`
- **[fix]** MOB-M5 — Profile stats show 0 on network failure instead of cached values: added `cacheSet` on success and `cacheGetStale` fallback on failure -- `mobile/app/(tabs)/profile.tsx`

## 2026-03-31 (Mobile: 3 HIGH bug fixes)

- **[fix]** MOB-H1 — parseFloat on coordinates without NaN check: added `isNaN(lat) || isNaN(lng)` validation before creating order, shows toast on invalid coordinates -- `mobile/app/order/confirm.tsx`
- **[fix]** MOB-H2 — Stale orders list after creating new order: replaced `useFocusEffect` dependency on `fetchOrders` with `fetchOrdersRef` pattern so callback is always stable (empty deps) and fires on every tab focus with the latest token -- `mobile/app/(tabs)/two.tsx`
- **[fix]** MOB-H3 — parseInt without validation in treatment courses: added `isNaN` + `<= 0` checks for totalProcedures and intervalDays before API call, shows warning toast -- `mobile/app/courses.tsx`

## 2026-03-31 (Backend: 5 HIGH bug fixes)

- **[fix]** BE-H1 — Dispatch invite expiry not checked on accept: added `expiresAt: MoreThan(new Date())` to `onMedicAccept` query so expired invites are treated as self-claims, not accepted invites -- `orders/dispatch.service.ts`
- **[fix]** BE-H2 — Geofence not checked on self-claim: `acceptOrder` now validates medic's `workZoneRadius` via haversine distance to order location before allowing accept -- `orders/orders.service.ts`
- **[fix]** BE-H3 — Blocked users stay connected via WebSocket: `handleConnection` now looks up user/medic and disconnects if `isBlocked` is true; injected `UsersService`/`MedicsService` into gateway -- `realtime/order-events.gateway.ts`, `realtime/realtime.module.ts`
- **[fix]** BE-H4 — Reviews unique constraint too weak: changed from `['orderId', 'authorRole']` to `['orderId', 'authorRole', 'targetRole']` -- `reviews/entities/review.entity.ts`
- **[fix]** BE-H5 — Referral columns fallback incomplete: `findBaseBy` now attempts to select referral columns (`referralCode`, `referredBy`, `referralBonusUsed`, `pendingReferralDiscount`) with try-catch fallback -- `users/users.service.ts`

## 2026-03-31 (Medic: 3 HIGH bug fixes)

- **[fix]** MED-H1 — Accept order UI closes before API response: moved `setAcceptModal(null)` and `setBannerOrder(null)` AFTER successful `apiFetch`, removed re-throw so medic can retry from open modal -- `medic/hooks/useMedicOrderFeed.ts`
- **[fix]** MED-H2 — Background location token stale after logout: `logout()` in AuthContext now immediately calls `setBackgroundLocationToken(null)` and `stopBackgroundLocationUpdates()` before clearing SecureStore, eliminating the race between React effect and background task -- `medic/context/AuthContext.tsx`
- **[fix]** MED-H3 — Location tracking continues on socket disconnect: added `socket.on('disconnect')` listener that calls `stopTracking()` to prevent battery drain; replaced unsafe `socket!.emit()` with `socket?.connected` guard -- `medic/hooks/useMedicLocation.ts`

## 2026-03-31 (Backend: 4 CRITICAL bug fixes)

- **[fix]** BE-CR1 — Double-payment race condition in Payme: `performTransaction` now uses `dataSource.transaction` with `SELECT ... FOR UPDATE` on the payment row, preventing two simultaneous requests from both marking as paid -- `payments/payme.service.ts`
- **[fix]** BE-CR2 — Race condition cancel after SERVICE_STARTED: removed stale pre-check, atomic `UPDATE ... WHERE status IN (cancellable)` now includes `clientId` in WHERE clause, returns `ConflictException` (409) on 0 affected rows -- `orders/orders.service.ts`
- **[fix]** BE-CR3 — Earnings calculation decimal type mismatch: added `safeNumber()` helper to safely convert DB decimal/string values, applied to all `priceAmount`, `urgentFee`, `discountAmount`, `platformFee` arithmetic -- `orders/orders.service.ts`
- **[fix]** BE-CR4 — Referral bonus double-award race condition: `applyReferralBonusIfEligible` now runs inside `dataSource.transaction` with `pessimistic_write` lock on user row, preventing concurrent DONE transitions from both awarding bonuses -- `orders/orders.service.ts`

## 2026-03-31 (Mobile: push notification navigation fix)

- **[fix]** Исправлен параметр навигации при тапе на push-уведомление — `_layout.tsx` отправлял `?id=` вместо `?orderId=`, из-за чего `track.tsx` получал `undefined` и показывал "Order not found". Исправлено в обоих обработчиках (background + cold-start) — `mobile/app/_layout.tsx`

## 2026-03-31 (Web-medic: Web Push уведомления)

- **[feat]** Добавлен `medicApi.webPush.subscribe` и `medicApi.webPush.unsubscribe` в `medicApi` — `web-medic/lib/api.ts`
- **[fix]** Исправлен `subscribeWebPush` — теперь вызывает `Notification.requestPermission()` вместо молчаливой проверки `permission !== "granted"` — `web-medic/lib/webPush.ts`
- **[verified]** `WebPushInit.tsx`, `webPush.ts`, `sw.js`, подключение в `layout.tsx` — уже существовали и корректно настроены для медиков (эндпоинт `/medics/web-push-subscription`, токен `medic_token`)

## 2026-03-31 (Admin: Reviews page, Settings urgent fields, Medic topup)

- **[feat]** Добавлены интерфейсы `Review`, `AppSettings` и функции `getMedicReviews`, `getClientReviews`, `topupMedic`, `getSettings`, `updateSettings` — `admin/src/lib/api.ts`
- **[feat]** Создана страница `Reviews` — поиск отзывов медика по ID, таблица с рейтингом звёздами, комментарием, ролью автора и датой — `admin/src/pages/Reviews.tsx`
- **[feat]** Добавлены поля `urgentFeePercent`, `urgentStartHour`, `urgentEndHour` на страницу настроек с отдельной кнопкой сохранения — `admin/src/pages/Settings.tsx`
- **[feat]** Добавлена кнопка «Пополнить» для каждого медика в таблице; Dialog с вводом суммы вызывает `topupMedic` + `toast.success` — `admin/src/pages/Medics.tsx`
- **[feat]** Добавлены маршруты `/reviews` и `/settings` — `admin/src/App.tsx`
- **[feat]** Добавлены nav items «Отзывы» (Star) и «Настройки» (Settings) в сайдбар — `admin/src/components/AdminSidebar.tsx`

## 2026-03-31 (Web-medic: экран геозоны рабочей зоны)

- **[feat]** Создан экран `/work-zone` — lat/lng инпуты, слайдер радиуса 0.5–50 км, кнопки «Сохранить зону» (PATCH /medics/work-zone) и «Убрать ограничение» (DELETE /medics/work-zone) — `web-medic/app/work-zone/page.tsx`
- **[feat]** При загрузке — GET /medics/me подгружает текущие workZoneLat/workZoneLng/workZoneRadius в поля формы — `web-medic/app/work-zone/page.tsx`
- **[feat]** Добавлена кнопка «Рабочая зона» в профиль медика — показывает статус зоны (активна / без ограничений) — `web-medic/app/profile/page.tsx`
- **[i18n]** Добавлена секция `workZone` (23 ключа) — `web-medic/i18n/ru.json`, `web-medic/i18n/uz.json`

## 2026-03-31 (Web-medic: оценка клиента после заказа)

- **[feat]** Добавлен блок «Оценить клиента» на странице заказа — показывается при `status === "DONE"`, проверяет через `GET /reviews/order/:id` нет ли уже отзыва с `authorRole=medic` — `web-medic/app/order/[id]/page.tsx`
- **[feat]** 5 интерактивных звёзд с hover-эффектом, textarea для комментария (необязательно), кнопки «Отправить» / «Пропустить» — `web-medic/app/order/[id]/page.tsx`
- **[feat]** После отправки/пропуска блок скрывается, показывается «Спасибо!» — `web-medic/app/order/[id]/page.tsx`
- **[feat]** Добавлен интерфейс `Review` — `web-medic/lib/api.ts`
- **[i18n]** Добавлены ключи `order.rateClient*` (rateClient, rateClientHint, rateClientComment, rateClientCommentPlaceholder, rateClientSubmit, rateClientSkip, rateClientThanks, rateClientSelectFirst) — `web-medic/i18n/ru.json`, `web-medic/i18n/uz.json`

## 2026-03-31 (Web: страница отзывов медика)

- **[feat]** Создана страница отзывов `/reviews/medic/[medicId]` — список отзывов с рейтингом, звёздами, датой, пагинацией и заглушкой — `web/app/reviews/medic/[medicId]/page.tsx`
- **[feat]** Добавлена кнопка «Отзывы» рядом с рейтингом медика на странице заказа — `web/app/orders/[id]/page.tsx`
- **[i18n]** Добавлена секция `reviews.*` (title, back, loading, error, retry, empty, emptyHint, avgRating, totalReviews, noComment, roleClient, roleMedic, prevPage, nextPage, pageOf) — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (Phase 2: Professional Level Upgrade -- mobile + medic)

- **[mobile]** **[medic]** 2A-1: API Retry + Timeout -- Added 20s timeout to medic api.ts (was missing), added GET retry with 1s delay on network error in both apps (`mobile/constants/api.ts`, `medic/constants/api.ts`)
- **[mobile]** **[medic]** 2A-2: Offline Banner -- Created OfflineBanner component with NetInfo + Reanimated slide-down animation in both apps, integrated in _layout.tsx (`mobile/components/OfflineBanner.tsx`, `medic/components/OfflineBanner.tsx`)
- **[medic]** 2A-3: Alert->Toast -- Converted remaining non-destructive Alert.alert to toast in medic (6 files: _layout, useMedicLocation, OrderInviteModal, profile, verification)
- **[mobile]** **[medic]** 2B: Design Tokens Migration -- Migrated 42 files (19 mobile + 23 medic) from hardcoded borderRadius/padding/fontSize/elevation to Radius/Spacing/Typography/Shadow tokens
- **[mobile]** **[medic]** 2C: Deep Linking + Push Navigation -- Added notification response listeners + cold-start handler in both _layout.tsx for order/course/referral/invite navigation (`mobile/app/_layout.tsx`, `medic/app/_layout.tsx`)
- **[mobile]** **[medic]** 2D: Onboarding -- Created 3-slide onboarding screens for both apps with FlatList paging, Reanimated dots, i18n (ru+uz), AsyncStorage first-launch flag (`mobile/app/onboarding.tsx`, `medic/app/onboarding.tsx`)
- **[mobile]** **[medic]** 2E-1: Local Caching -- Created cache.ts utility (TTL-aware + stale fallback), applied to services list, orders, medic profile with offline fallback + warning banner (`mobile/utils/cache.ts`, `medic/utils/cache.ts`)
- **[mobile]** **[medic]** 2E-2: Analytics -- Created analytics.ts with AsyncStorage event queue + batch flush, tracking: app_opened, login, register, order_created/accepted/completed, rating_submitted, toggle_online (`mobile/utils/analytics.ts`, `medic/utils/analytics.ts`)

## 2026-03-31 (AsyncStorage data caching -- mobile + medic)

- **[feature]** Cache utility (`cacheSet`, `cacheGet`, `cacheGetStale`, `cacheClear`) with TTL support and stale-data fallback for offline use -- `mobile/utils/cache.ts`, `medic/utils/cache.ts`
- **[feature]** Mobile: services list cached with 1-hour TTL; shows fresh cache instantly on mount, refreshes in background; falls back to stale cache when offline with warning banner -- `mobile/app/(tabs)/index.tsx`
- **[feature]** Mobile: orders list cached on first-page fetch; falls back to stale cache on network failure with warning banner -- `mobile/app/(tabs)/two.tsx`
- **[feature]** Medic: profile data cached via `cacheSet` whenever medic object updates; completed count cached with stale fallback on failure -- `medic/app/(tabs)/profile.tsx`
- **[feature]** Medic: my-orders list cached on fetch; falls back to stale cache on failure with warning banner -- `medic/app/(tabs)/my-orders.tsx`
- **[i18n]** Added `common.cachedData` key to `mobile/i18n/ru.json`, `mobile/i18n/uz.json`, `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-31 (Analytics event tracking -- mobile + medic)

- **[feature]** Created analytics utility with local event queue, batching (20 events), and flush-on-start -- `mobile/utils/analytics.ts`, `medic/utils/analytics.ts`
- **[integration]** Mobile client: tracking `app_opened`, `order_created`, `order_completed`, `rating_submitted`, `login`, `register` -- `mobile/app/_layout.tsx`, `mobile/app/order/confirm.tsx`, `mobile/app/order/track.tsx`, `mobile/components/RatingModal.tsx`, `mobile/app/auth.tsx`
- **[integration]** Medic app: tracking `app_opened`, `order_accepted`, `order_completed`, `rating_submitted`, `login`, `register`, `toggle_online` -- `medic/app/_layout.tsx`, `medic/app/(tabs)/index.tsx`, `medic/app/order/[id].tsx`, `medic/components/ClientRatingModal.tsx`, `medic/app/auth.tsx`, `medic/app/(tabs)/profile.tsx`

## 2026-03-31 (Onboarding screen -- medic app)

- **[feature]** 3-slide onboarding screen for medic app: "Accept orders", "Get verified", "Set work zone" -- swipeable FlatList with pagingEnabled, Reanimated dot indicators, Skip/Next/Start buttons -- `medic/app/onboarding.tsx`
- **[integration]** Onboarding flow integrated into medic _layout.tsx: AsyncStorage key `medic_onboarding_completed`, onboarding shown before language-picker on first launch -- `medic/app/_layout.tsx`
- **[i18n]** Added `onboarding.*` keys (slide1Title, slide1Desc, slide2Title, slide2Desc, slide3Title, slide3Desc, next, start, skip) to both `medic/i18n/ru.json` and `medic/i18n/uz.json`

## 2026-03-31 (Onboarding screen -- mobile client)

- **[feature]** 3-slide onboarding screen shown on first launch with swipeable FlatList, animated dot indicators (Reanimated), "Skip"/"Next"/"Start" buttons -- `mobile/app/onboarding.tsx`
- **[integration]** Navigation flow updated: onboarding -> language-picker -> auth -> (tabs); onboarding state stored in AsyncStorage (`onboarding_completed`) -- `mobile/app/_layout.tsx`
- **[i18n]** Added `onboarding.*` keys (slide1Title, slide1Desc, slide2Title, slide2Desc, slide3Title, slide3Desc, next, start, skip) to both `mobile/i18n/ru.json` and `mobile/i18n/uz.json`

## 2026-03-31 (Design tokens migration -- mobile client)

- **[refactor]** Replaced hardcoded `borderRadius` values with `Radius.*` tokens (xs/sm/md/lg/xl/full) across 19 mobile client files
- **[refactor]** Replaced hardcoded `padding`/`margin`/`gap` spacing values with `Spacing.*` tokens (xs/sm/md/lg/xl/xxl/xxxl) across 19 mobile client files
- **[refactor]** Replaced hardcoded `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`/`elevation` with `...Shadow.*` spread tokens (sm/md/lg) in auth.tsx, Toast.tsx, courses.tsx, trackStyles.ts, TrackMap.tsx
- **[refactor]** Replaced hardcoded hex color literals with Theme.* tokens (Theme.info for #2563eb, Theme.success for #16a34a, Theme.error for #dc2626, Theme.warning for #f59e0b, Theme.primary for #0d9488, Theme.background for #f8fafc, Theme.textTertiary for #94a3b8)
- **[files]** `mobile/app/order/trackStyles.ts`, `mobile/app/auth.tsx`, `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/two.tsx`, `mobile/app/(tabs)/profile.tsx`, `mobile/app/order/confirm.tsx`, `mobile/app/order/location.tsx`, `mobile/app/courses.tsx`, `mobile/app/favorites.tsx`, `mobile/app/medical-card.tsx`, `mobile/app/referral.tsx`, `mobile/components/SplashOverlay.tsx`, `mobile/components/SkeletonLoader.tsx`, `mobile/components/Toast.tsx`, `mobile/components/RatingModal.tsx`, `mobile/components/order/TrackMap.tsx`, `mobile/components/order/ProgressStepper.tsx`, `mobile/components/order/MedicInfoCard.tsx`, `mobile/components/order/TrackActions.tsx`

## 2026-03-31 (Design tokens migration -- medic)

- **[refactor]** Replaced hardcoded `borderRadius` values with `Radius.*` tokens (xs/sm/md/lg/xl/full) across 23 medic app files
- **[refactor]** Replaced hardcoded `padding`/`margin`/`gap` spacing values with `Spacing.*` tokens (xs/sm/md/lg/xl/xxl/xxxl) across 23 medic app files
- **[refactor]** Replaced hardcoded `fontSize` values with `Typography.*` tokens (caption/bodySmall/body/h1/h2/h3) across 23 medic app files
- **[refactor]** Replaced hardcoded `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`/`elevation` with `...Shadow.*` spread tokens (sm/md/lg) in auth.tsx, Toast.tsx, SwipeActionButton.tsx, OrderInviteModal.tsx
- **[refactor]** Replaced hardcoded hex color literals with Theme.* tokens (Theme.error, Theme.warning, Theme.primary, Theme.overlay, Theme.textInverse) where applicable
- **[files]** `medic/app/auth.tsx`, `medic/app/(tabs)/index.tsx`, `medic/app/(tabs)/my-orders.tsx`, `medic/app/(tabs)/profile.tsx`, `medic/app/order/[id].tsx`, `medic/app/work-zone.tsx`, `medic/app/verification.tsx`, `medic/components/SplashOverlay.tsx`, `medic/components/SkeletonLoader.tsx`, `medic/components/Toast.tsx`, `medic/components/ClientRatingModal.tsx`, `medic/components/NewOrderBanner.tsx`, `medic/components/SwipeActionButton.tsx`, `medic/components/OrderInviteModal.tsx`, `medic/components/OfflineBanner.tsx`, `medic/components/profile/ProfileHeader.tsx`, `medic/components/profile/VerificationCard.tsx`, `medic/components/profile/OnlineToggle.tsx`, `medic/components/profile/StatsSection.tsx`, `medic/components/order/OrderDetailMap.tsx`, `medic/components/order/StatusActions.tsx`, `medic/components/order/EarningsCard.tsx`, `medic/components/order/ClientInfo.tsx`

## 2026-03-31 (Toast conversion Phase 2 -- medic)

- **[refactor]** Converted remaining non-destructive Alert.alert calls to showToast() in medic app -- `medic/app/_layout.tsx` (auto-offline), `medic/hooks/useMedicLocation.ts` (location denied), `medic/components/OrderInviteModal.tsx` (wallet/error alerts), `medic/app/(tabs)/profile.tsx` (location+gallery permission info), `medic/app/verification.tsx` (gallery+camera permission info)
- **[cleanup]** Removed unused Alert import from `OrderInviteModal.tsx` and `useMedicLocation.ts`; kept Alert only where confirmation dialogs with action buttons are used

## 2026-03-31 (Push notification navigation + deep linking -- mobile + medic)

- **[feature]** Push notification tap handler: added `addNotificationResponseReceivedListener` in `RootLayoutNav` to navigate on notification tap (order->track, course, referral for mobile; order detail, invite for medic) -- `mobile/app/_layout.tsx`, `medic/app/_layout.tsx`
- **[feature]** Cold-start notification: added `getLastNotificationResponseAsync` to handle notification that launched the app from killed state -- `mobile/app/_layout.tsx`, `medic/app/_layout.tsx`
- **[verify]** Deep linking schemes already configured: `hamshiragomobile://` (mobile) and `hamshiragomedic://` (medic) in app.json; Expo Router handles URL-based routing automatically via file structure

## 2026-04-01 (API reliability + Offline Banner -- mobile + medic)

- **[fix]** Medic API timeout: added AbortController with 20s timeout matching mobile pattern -- `medic/constants/api.ts`
- **[fix]** Retry logic: GET requests retry once after 1s on network/timeout errors (TypeError, AbortError); POST/PUT/PATCH/DELETE never retry -- `mobile/constants/api.ts`, `medic/constants/api.ts`
- **[feature]** OfflineBanner: sticky animated banner using NetInfo + Reanimated slide-down, shows when device is offline, auto-hides on reconnect -- `mobile/components/OfflineBanner.tsx`, `medic/components/OfflineBanner.tsx`
- **[integration]** OfflineBanner rendered above Stack navigator in both app layouts -- `mobile/app/_layout.tsx`, `medic/app/_layout.tsx`
- **[deps]** Installed `@react-native-community/netinfo` in both mobile and medic apps

## 2026-03-31 (Professional Level Upgrade -- mobile + medic)

- **[design]** Design System: Updated `Theme.ts` in both apps -- refined healthcare palette (teal primary, better contrast), added `Radius`, `Spacing`, `Typography`, `Shadow` token exports (`mobile/constants/Theme.ts`, `medic/constants/Theme.ts`)
- **[perf]** Skeleton Loaders: Created `SkeletonLoader.tsx` in both apps (Reanimated shimmer), applied to home/orders/profile screens replacing ActivityIndicator (`mobile/components/SkeletonLoader.tsx`, `medic/components/SkeletonLoader.tsx`)
- **[perf]** FlashList: Replaced FlatList with `@shopify/flash-list` in orders lists (`mobile/app/(tabs)/two.tsx`, `medic/app/(tabs)/index.tsx`, `medic/app/(tabs)/my-orders.tsx`)
- **[ux]** Haptic Feedback: Added `expo-haptics` on order confirm, status changes, star rating, pull-to-refresh (`mobile/app/order/confirm.tsx`, `mobile/components/RatingModal.tsx`, `mobile/app/(tabs)/two.tsx`, `medic/app/order/[id].tsx`, `medic/app/(tabs)/index.tsx`, `medic/components/ClientRatingModal.tsx`)
- **[perf]** React.memo + useCallback: Wrapped `ServiceCard`, `OrderCard`, `AvailableOrderCard` in memo; memoized handlers and computations (`mobile/components/ServiceCard.tsx`, `mobile/components/OrderCard.tsx`, `medic/app/(tabs)/index.tsx`, `medic/app/(tabs)/my-orders.tsx`, `medic/app/(tabs)/profile.tsx`)
- **[refactor]** Decomposition -- Mobile: `track.tsx` split into `TrackMap`, `ProgressStepper`, `MedicInfoCard`, `TrackActions` (`mobile/components/order/`)
- **[refactor]** Decomposition -- Medic: `profile.tsx` split into `ProfileHeader`, `VerificationCard`, `OnlineToggle`, `StatsSection`; `order/[id].tsx` split into `OrderDetailMap`, `StatusActions`, `EarningsCard`, `ClientInfo` (`medic/components/profile/`, `medic/components/order/`)
- **[feature]** Toast System: Created `Toast.tsx` + `ToastContext.tsx` in both apps, replaced non-destructive `Alert.alert()` calls (`mobile/components/Toast.tsx`, `mobile/context/ToastContext.tsx`, `medic/components/Toast.tsx`, `medic/context/ToastContext.tsx`)
- **[a11y]** Accessibility: Added `accessibilityLabel`/`accessibilityRole` to 11 files across both apps -- auth, cards, rating, profile, status (`mobile/app/auth.tsx`, `mobile/components/ServiceCard.tsx`, `mobile/components/OrderCard.tsx`, `mobile/components/RatingModal.tsx`, `mobile/components/order/MedicInfoCard.tsx`, `mobile/components/order/ProgressStepper.tsx`, `medic/app/auth.tsx`, `medic/app/(tabs)/index.tsx`, `medic/components/ClientRatingModal.tsx`, `medic/components/profile/ProfileHeader.tsx`, `medic/components/profile/OnlineToggle.tsx`, `medic/components/order/StatusActions.tsx`)
- **[perf]** expo-image: Replaced remote `Image` with `expo-image` (blurhash placeholder, transition, caching) in 6 files (`mobile/components/order/MedicInfoCard.tsx`, `mobile/components/order/TrackMap.tsx`, `mobile/app/order/track.tsx`, `mobile/app/favorites.tsx`, `medic/components/profile/ProfileHeader.tsx`, `medic/app/verification.tsx`)

## 2026-03-31 (Toast notification system replacing Alert.alert for non-destructive messages)

- **[feature]** Created `Toast` component with Reanimated slide-down animation, auto-dismiss, color-coded types (success/error/info/warning) -- `mobile/components/Toast.tsx`, `medic/components/Toast.tsx`
- **[feature]** Created `ToastContext` with provider, queue (FIFO), and `useToast()` hook -- `mobile/context/ToastContext.tsx`, `medic/context/ToastContext.tsx`
- **[integration]** Wrapped both app layouts with `ToastProvider` inside existing provider tree -- `mobile/app/_layout.tsx`, `medic/app/_layout.tsx`
- **[refactor]** Mobile: replaced non-destructive `Alert.alert` with `showToast()` in `medical-card.tsx`, `order/track.tsx`, `order/confirm.tsx`, `courses.tsx`, `hooks/useOrderTracking.ts`
- **[refactor]** Medic: replaced non-destructive `Alert.alert` with `showToast()` in `work-zone.tsx`, `verification.tsx`, `order/[id].tsx`, `(tabs)/profile.tsx`, `hooks/useOrderStatus.ts`
- **[note]** Kept `Alert.alert` for confirmation dialogs (cancel order, complete order, payment platform picker, course actions) and permission prompts requiring user acknowledgment

## 2026-03-31 (Accessibility labels and roles for critical user flows)

- **[a11y]** Added `accessibilityRole="button"` and `accessibilityLabel` with service name + price to `ServiceCard` — `mobile/components/ServiceCard.tsx`
- **[a11y]** Added `accessibilityRole="button"` and `accessibilityLabel` with status + service + price to `OrderCard` — `mobile/components/OrderCard.tsx`
- **[a11y]** Added star button labels (`N из 5 звёзд`), selected state, submit button label to `RatingModal` — `mobile/components/RatingModal.tsx`
- **[a11y]** Added avatar `accessibilityLabel` and rating label (`Рейтинг X из 5`) to `MedicInfoCard` — `mobile/components/order/MedicInfoCard.tsx`
- **[a11y]** Added step labels with active/done/pending state to `ProgressStepper` — `mobile/components/order/ProgressStepper.tsx`
- **[a11y]** Added `accessibilityRole="tab"` with selected state, input labels (Телефон, Имя, Пароль, Реферальный код), submit button to auth screen — `mobile/app/auth.tsx`
- **[a11y]** Added `accessibilityRole="button"` and `accessibilityLabel` with service + address + price to `AvailableOrderCard`, accept button label — `medic/app/(tabs)/index.tsx`
- **[a11y]** Added star labels, submit/skip button labels to `ClientRatingModal` — `medic/components/ClientRatingModal.tsx`
- **[a11y]** Added avatar and rating accessibility labels to `ProfileHeader` — `medic/components/profile/ProfileHeader.tsx`
- **[a11y]** Added `accessibilityRole="switch"` with checked state and label to `OnlineToggle` — `medic/components/profile/OnlineToggle.tsx`
- **[a11y]** Added status badge label and action button label to `StatusActions` — `medic/components/order/StatusActions.tsx`
- **[a11y]** Added tab roles with selected state, input labels, submit button label to medic auth screen — `medic/app/auth.tsx`
- **[verify]** `npx tsc --noEmit` passes with zero errors in both mobile and medic apps

## 2026-03-31 (Replace React Native Image with expo-image for remote URLs)

- **[perf]** Replaced `Image` from react-native with `Image` from expo-image for all remote URL images in mobile app — adds disk caching, blurhash placeholders, smooth transitions — `mobile/components/order/MedicInfoCard.tsx`, `mobile/components/order/TrackMap.tsx`, `mobile/app/order/track.tsx`, `mobile/app/favorites.tsx`
- **[perf]** Replaced `Image` from react-native with `Image` from expo-image for all remote URL images in medic app — adds disk caching, blurhash placeholders, smooth transitions — `medic/components/profile/ProfileHeader.tsx`, `medic/app/verification.tsx`
- **[deps]** Installed `expo-image` in both `mobile/` and `medic/` apps

## 2026-03-31 (Refactor: decompose profile.tsx and [id].tsx into sub-components — medic app)

- **[refactor]** Extracted `ProfileHeader` component (avatar, name, phone, rating) from profile.tsx — `medic/components/profile/ProfileHeader.tsx`
- **[refactor]** Extracted `VerificationCard` component (verification status badge with navigation) from profile.tsx — `medic/components/profile/VerificationCard.tsx`
- **[refactor]** Extracted `OnlineToggle` component (online/offline switch + background location warning) from profile.tsx — `medic/components/profile/OnlineToggle.tsx`
- **[refactor]** Extracted `StatsSection` component (experience, completed count, rating, balance, earnings cards) from profile.tsx — `medic/components/profile/StatsSection.tsx`
- **[refactor]** Extracted `OrderDetailMap` component (MapView with medic/client markers, route polyline, legend) from order/[id].tsx — `medic/components/order/OrderDetailMap.tsx`
- **[refactor]** Extracted `StatusActions` component (status badge, live tracking card, swipe action button, completed note) from order/[id].tsx — `medic/components/order/StatusActions.tsx`
- **[refactor]** Extracted `EarningsCard` component (service info, price breakdown, net earnings) from order/[id].tsx — `medic/components/order/EarningsCard.tsx`
- **[refactor]** Extracted `ClientInfo` component (address, phone, call button, maps button, med card button) from order/[id].tsx — `medic/components/order/ClientInfo.tsx`
- **[refactor]** All 8 sub-components wrapped in `React.memo()` with TypeScript interfaces for props
- **[refactor]** Refactored `medic/app/(tabs)/profile.tsx` to compose 4 sub-components (reduced from 803 to 483 lines)
- **[refactor]** Refactored `medic/app/order/[id].tsx` to compose 4 sub-components (reduced from 919 to 296 lines)
- **[verify]** `npx tsc --noEmit` passes with zero errors

## 2026-03-31 (Refactor: decompose track.tsx into sub-components — mobile client)

- **[refactor]** Extracted `ProgressStepper` component (order status step visualization) — `mobile/components/order/ProgressStepper.tsx`
- **[refactor]** Extracted `MedicInfoCard` component (medic avatar, name, rating) — `mobile/components/order/MedicInfoCard.tsx`
- **[refactor]** Extracted `TrackMap` component (MapView, markers, polyline, legend) — `mobile/components/order/TrackMap.tsx`
- **[refactor]** Extracted `TrackActions` component (cancel, favorite, pay, back-to-orders buttons) — `mobile/components/order/TrackActions.tsx`
- **[refactor]** Refactored `track.tsx` to compose sub-components; all hooks remain in parent — `mobile/app/order/track.tsx`
- **[perf]** Wrapped all 4 new sub-components in `React.memo()` for render optimization
- **[quality]** Each sub-component has own TypeScript interface for props and self-contained StyleSheet

## 2026-03-31 (Skeleton Loaders, FlashList, Haptic Feedback, Memo — medic app)

- **[perf]** Created reusable `SkeletonLoader` component with Reanimated opacity pulse animation + presets (`SkeletonCard`, `SkeletonMyOrderCard`, `SkeletonLine`, `SkeletonAvatar`, `SkeletonProfileHeader`) — `medic/components/SkeletonLoader.tsx`
- **[perf]** Replaced `FlatList` with `FlashList` (@shopify/flash-list v2) in available orders and my-orders screens — `medic/app/(tabs)/index.tsx`, `medic/app/(tabs)/my-orders.tsx`
- **[perf]** Replaced `ActivityIndicator` loading states with skeleton placeholders in 3 screens — `medic/app/(tabs)/index.tsx`, `medic/app/(tabs)/my-orders.tsx`, `medic/app/(tabs)/profile.tsx`
- **[ux]** Added haptic feedback (expo-haptics) on status change buttons, order completion (success notification), pull-to-refresh, and star rating press — `medic/app/order/[id].tsx`, `medic/app/(tabs)/index.tsx`, `medic/components/ClientRatingModal.tsx`
- **[perf]** Wrapped `AvailableOrderCard` in `React.memo`, memoized `renderItem` with `useCallback`, memoized `handleAccept` with `useCallback` — `medic/app/(tabs)/index.tsx`
- **[perf]** Memoized active/history order filtering with `useMemo`, wrapped `renderItem` with `useCallback` — `medic/app/(tabs)/my-orders.tsx`
- **[perf]** Memoized rating display calculation with `useMemo` — `medic/app/(tabs)/profile.tsx`
- **[deps]** Installed `@shopify/flash-list` v2 — `medic/package.json`

## 2026-03-31 (Skeleton Loaders, FlashList, Haptic Feedback, Memo — mobile client)

- **[perf]** Created reusable `SkeletonLoader` component with Reanimated opacity pulse animation + presets (`SkeletonServiceCard`, `SkeletonOrderCard`, `SkeletonLine`, `SkeletonAvatar`) — `mobile/components/SkeletonLoader.tsx`
- **[perf]** Replaced `ActivityIndicator` with skeleton card placeholders on Home screen (services list) — `mobile/app/(tabs)/index.tsx`
- **[perf]** Replaced `ActivityIndicator` with skeleton order cards on Orders screen — `mobile/app/(tabs)/two.tsx`
- **[perf]** Replaced `FlatList` with `FlashList` from `@shopify/flash-list` v2 on Orders screen — `mobile/app/(tabs)/two.tsx`
- **[perf]** Wrapped `OrderCard` in `React.memo()` — `mobile/components/OrderCard.tsx`
- **[perf]** Wrapped `ServiceCard` in `React.memo()` + `useCallback` for press handler — `mobile/components/ServiceCard.tsx`
- **[perf]** Wrapped `renderItem`, `onRefresh`, `onEndReached` in `useCallback` on Orders screen — `mobile/app/(tabs)/two.tsx`
- **[perf]** Wrapped `loadServices` in `useCallback` on Home screen — `mobile/app/(tabs)/index.tsx`
- **[ux]** Added haptic feedback (`expo-haptics`) on order confirm (Medium impact) + success notification — `mobile/app/order/confirm.tsx`
- **[ux]** Added haptic feedback on rating star press (Light impact) — `mobile/components/RatingModal.tsx`
- **[ux]** Added haptic feedback on pull-to-refresh (Light impact) — `mobile/app/(tabs)/two.tsx`
- **[deps]** Installed `@shopify/flash-list`, `expo-haptics` — `mobile/package.json`

## 2026-03-31 (Design System — theme tokens for mobile + medic)

- **[design]** Updated Theme with professional healthcare palette (teal-blue primary, slate neutrals, semantic colors) — `mobile/constants/Theme.ts`, `medic/constants/Theme.ts`
- **[design]** Added new color tokens: `primaryLight`, `info`, `surfaceSecondary`, `overlay`, `textTertiary`, `textInverse`, `borderLight`, `borderFocus`, `gradientWarm`, order status colors (`statusCreated`..`statusCanceled`) — both apps
- **[design]** Added medic-specific tokens: `verificationPending/Approved/Rejected`, `onlineGreen`, `offlineGrey` — `medic/constants/Theme.ts`
- **[design]** Added `Radius` tokens (xs/sm/md/lg/xl/full) — both apps
- **[design]** Added `Spacing` tokens (xs..xxxl, 4-point grid) — both apps
- **[design]** Added `Typography` scale (h1..caption, button) with fontSize/lineHeight/fontWeight — both apps
- **[design]** Added `Shadow` presets (sm/md/lg) with iOS shadows + Android elevation — both apps
- **[compat]** All existing Theme keys preserved (primary, primaryDark, accent, success, warning, error, background, surface, text, textSecondary, border, bannerGradient)

## 2026-03-31 (Medic work zone / geofence settings screen — medic app)

- **[feat]** Created work zone screen with MapView + Circle overlay + radius slider (0.5-50 km) — `medic/app/work-zone.tsx`
- **[feat]** Added `workZoneLat`, `workZoneLng`, `workZoneRadius` fields to `MedicUser` interface — `medic/context/AuthContext.tsx`
- **[feat]** Added work zone navigation button to profile screen with active/inactive status display — `medic/app/(tabs)/profile.tsx`
- **[feat]** Registered `work-zone` Stack.Screen in root layout — `medic/app/_layout.tsx`
- **[i18n]** Added `geofence.*` keys (workZone, tapToSetCenter, radius, km, saveZone, clearZone, saved, cleared, zoneActive, noZone) — `medic/i18n/ru.json`, `medic/i18n/uz.json`
- **[deps]** Installed `@react-native-community/slider` — `medic/package.json`

## 2026-03-31 (Client rating in dispatch invite — backend + medic)

- **[feat]** `ReviewsService.getTargetRatingStats()` — aggregated AVG(rating) + COUNT for a target (medic or client) — `backend/src/reviews/reviews.service.ts`
- **[feat]** `DispatchService` injects `ReviewsService`, enriches `dispatch_invite` payload with `client.averageRating` and `client.reviewCount` (wrapped in try/catch) — `backend/src/orders/dispatch.service.ts`
- **[feat]** `OrdersModule` imports `ReviewsModule` for dispatch access — `backend/src/orders/orders.module.ts`
- **[feat]** `OrderInviteModal` displays client rating badge (gold star + score) or "New client" badge — `medic/components/OrderInviteModal.tsx`
- **[feat]** `DispatchInvitePayload` extended with optional `client` field — `medic/components/OrderInviteModal.tsx`
- **[i18n]** Added `rating.clientRating` and `rating.newClient` keys — `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-31 (Medic rates client after DONE — medic app)

- **[feat]** Created `ClientRatingModal` component (stars 1-5, comment, submit + skip buttons) — `medic/components/ClientRatingModal.tsx`
- **[feat]** Modified `useOrderStatus` hook: stores `doneEarnings` in state instead of showing Alert on DONE; returns `doneEarnings` — `medic/hooks/useOrderStatus.ts`
- **[feat]** Modified order detail screen: shows `ClientRatingModal` after DONE, submits review via `POST /reviews` with `targetRole: 'client'`, then shows earnings Alert and navigates — `medic/app/order/[id].tsx`
- **[i18n]** Added `rating.*` keys (rateClient, tapStar, selectRating, submit, reviewPlaceholder, skip) — `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-31 (Review reminder cron — backend)

- **[feat]** `ReviewsService.sendReviewReminders()` — cron every 15 min, sends push/Telegram reminders ~1 hour after order completion if review not left — `backend/src/reviews/reviews.service.ts`
- **[refactor]** `ReviewsModule` imports `RealtimeModule`, `UsersModule`, `MedicsModule` for push/telegram access — `backend/src/reviews/reviews.module.ts`

## 2026-03-31 (Geofence / work zone — backend)

- **[feat]** Добавлены 3 nullable поля `workZoneLat`, `workZoneLng`, `workZoneRadius` в сущность `Medic` — `backend/src/medics/entities/medic.entity.ts`
- **[feat]** Создан `SetWorkZoneDto` с валидацией (lat, lng, radius 0.5–50 km) — `backend/src/medics/dto/set-work-zone.dto.ts`
- **[feat]** `MedicsService.setWorkZone()` и `clearWorkZone()` — `backend/src/medics/medics.service.ts`
- **[feat]** `PATCH /medics/work-zone` и `DELETE /medics/work-zone` (MedicAuthGuard) — `backend/src/medics/medics.controller.ts`
- **[feat]** Geofence фильтр в `DispatchService.selectBestMedic()`: haversine-проверка от центра зоны медика до адреса заказа, если `workZoneRadius` задан — `backend/src/orders/dispatch.service.ts`

## 2026-03-31 (Reviews module — backend)

- **[feat]** Создан модуль `reviews` — `backend/src/reviews/`
- **[feat]** Сущность `Review` с составным UNIQUE по `(orderId, authorRole)` — `backend/src/reviews/entities/review.entity.ts`
- **[feat]** `CreateReviewDto` с валидацией (orderId UUID, rating 1–5, comment max 1000, targetRole) — `backend/src/reviews/dto/create-review.dto.ts`
- **[feat]** `PaginationQueryDto` (page, limit) — `backend/src/reviews/dto/pagination-query.dto.ts`
- **[feat]** `ReviewsService.create()` — проверяет: заказ DONE, автор участник заказа, не дублируется — `backend/src/reviews/reviews.service.ts`
- **[feat]** `ReviewsService.recalcAverageRating()` — обновляет `medics.rating` + `medics.reviewCount`; обновляет `users.averageRating` с try/catch (колонка может отсутствовать на Railway) — `backend/src/reviews/reviews.service.ts`
- **[feat]** `ReviewsService.findByMedic()`, `findByClient()`, `findByOrder()` — пагинация, сортировка по дате — `backend/src/reviews/reviews.service.ts`
- **[feat]** `ReviewsController` — `POST /reviews`, `GET /reviews/medic/:id`, `GET /reviews/client/:id`, `GET /reviews/order/:id` — `backend/src/reviews/reviews.controller.ts`
- **[feat]** `ReviewsModule` подключён в `AppModule` — `backend/src/app.module.ts`

## 2026-03-31 (Курсы лечения — web client)

- **[feat]** Добавлены интерфейс `TreatmentCourse`, `CreateTreatmentCourseDto` и функции `getTreatmentCourses()`, `createTreatmentCourse()`, `deleteTreatmentCourse()`, `patchTreatmentCourse()` — `web/lib/api.ts`
- **[feat]** Создана страница `web/app/courses/page.tsx`: список курсов с прогресс-баром, статус-бейджем, кнопкой удалить, inline-форма добавления
- **[feat]** Кнопка "Курсы лечения" (FaSyringe) в профиль — `web/app/profile/page.tsx`
- **[i18n]** Ключи секции `courses.*` — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (Favorites / My Medics — web client)

- **[feat]** Добавлен интерфейс `FavoriteMedic` и функции `getFavorites()`, `addFavorite(medicId)`, `removeFavorite(medicId)` — `web/lib/api.ts`
- **[feat]** Создана страница `web/app/favorites/page.tsx`: список карточек медиков (фото/инициалы, имя, рейтинг, опыт, кнопка "Удалить"), заглушка при пустом списке
- **[feat]** Кнопка "Закрепить медика" на странице заказа при `status === "DONE"` — `web/app/orders/[id]/page.tsx`
- **[feat]** Кнопка "Мои медики" в профиль — `web/app/profile/page.tsx`
- **[i18n]** Ключи секции `favorites.*` — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (Referral Program — web client)

- **[feat]** Добавлен интерфейс `ReferralInfo` и функция `getReferralInfo()` — `web/lib/api.ts`
- **[feat]** Создана страница `web/app/referral/page.tsx`: хедер с зелёным градиентом, реферальный код крупно с кнопкой "Копировать", ссылка для приглашения `https://app.hamshirago.uz?ref=КОД` с кнопками "Поделиться" и "Копировать ссылку", блок объяснения бонуса, статистика
- **[feat]** Добавлена кнопка "Пригласи друга" (FaGift) в профиль — `web/app/profile/page.tsx`
- **[i18n]** Добавлены ключи секции `referral.*` — `web/i18n/ru.json`, `web/i18n/uz.json`

## 2026-03-31 (MedicalCard — web-medic)

- **[feat]** Добавлен интерфейс `MedicalCard` и метод `medicApi.medicalCard.getByClient(clientId)` — `web-medic/lib/api.ts`
- **[feat]** В страницу деталей заказа добавлена секция "Медкарта клиента" (группа крови, аллергии, хронические болезни, заметки); показывается только если есть хотя бы одно непустое поле; загружается по `clientId` из заказа — `web-medic/app/order/[id]/page.tsx`
- **[i18n]** Добавлены ключи `order.medicalCard.*` (title, bloodType, allergies, chronicDiseases, notes) — `web-medic/i18n/ru.json`, `web-medic/i18n/uz.json`

## 2026-03-28 (Favorites + MedicalCard UI — mobile client)

- **[feat]** Добавлена кнопка "Закрепить медика / Открепить" на экране трекинга заказа (статус DONE, если есть медик); загружает список favorites при DONE и проверяет isFavorite — `mobile/app/order/track.tsx`, `mobile/app/order/trackStyles.ts`
- **[feat]** Создан экран `app/favorites.tsx` — список избранных медиков (фото, имя, рейтинг, телефон), empty state — `mobile/app/favorites.tsx`
- **[feat]** Создан экран `app/medical-card.tsx` — форма медкарты (bloodType, allergies, chronicDiseases, notes), GET/PUT /medical-card — `mobile/app/medical-card.tsx`
- **[feat]** Добавлены ссылки "Мои медики" и "Медкарта" в профиль клиента (раздел Quick links) — `mobile/app/(tabs)/profile.tsx`
- **[i18n]** Ключи `favorites.*` и `medcard.*` уже присутствовали в `mobile/i18n/ru.json` и `mobile/i18n/uz.json`

## 2026-03-28 (Referral Program + Treatment Courses UI — mobile client)

- **[feat]** Created referral screen — `mobile/app/referral.tsx`: fetches `GET /referrals/my`, shows large code, Clipboard copy, Share, stats (referredCount, bonusPaidCount), promo text
- **[feat]** Added optional referral code section to registration form — `mobile/app/auth.tsx`: collapsible "Есть реферальный код?" with TextInput, onBlur validation via `GET /referrals/validate/:code`, passes `referredByCode` in register call
- **[feat]** Updated `AuthContext.register()` signature to accept optional `referredByCode` — `mobile/context/AuthContext.tsx`
- **[feat]** Created treatment courses screen — `mobile/app/courses.tsx`: FlatList with progress bars, status badges, next date, FAB "+" → bottom sheet modal to create course, tap card → Alert with "Отметить выполненной" (PATCH markComplete) or delete
- **[feat]** Added post-DONE courses prompt in track screen — `mobile/app/order/track.tsx`: Alert fires once when order reaches DONE, offers to navigate to `/courses`
- **[feat]** Added "Пригласи друга" and "Курсы лечения" rows to profile — `mobile/app/(tabs)/profile.tsx`
- **[i18n]** Added `referral.*` and `courses.*` keys — `mobile/i18n/ru.json`, `mobile/i18n/uz.json`

## 2026-03-28 (MedCard client view — medic app)

- **[feat]** Added `clientId?: string` field to `OrderDetail` interface — `medic/hooks/useOrderStatus.ts`
- **[feat]** Added `medcard.*` i18n keys (ru + uz): clientCard, bloodType, allergies, chronicDiseases, notes, noCard, noAccess — `medic/i18n/ru.json`, `medic/i18n/uz.json`
- **[feat]** Added "Медкарта клиента" button in address card section; fetches `GET /medical-card/client/:clientId` with medic token; 404/403 → Alert — `medic/app/order/[id].tsx`
- **[feat]** Added inline Modal with MedCardData display (bloodType, allergies, chronicDiseases, notes) and "Закрыть" button — `medic/app/order/[id].tsx`

## 2026-03-30 (Referral Program + Treatment Courses — backend)

- **[feat]** Added `referralCode`, `referredBy`, `referralBonusUsed`, `pendingReferralDiscount` columns (all nullable) to `User` entity — `backend/src/users/entities/user.entity.ts`
- **[feat]** Added `findByReferralCode`, `setReferralCode`, `setPendingReferralDiscount`, `markReferralBonusUsed` methods to `UsersService` — `backend/src/users/users.service.ts`
- **[feat]** Added optional `referredByCode` field to `RegisterClientDto` — `backend/src/auth/dto/register-client.dto.ts`
- **[feat]** `registerClient()`: generates unique 8-char referral code, handles `referredByCode` lookup, creates `Referral` record — `backend/src/auth/auth.service.ts`
- **[feat]** Created `Referral` entity (`referrerId`, `referredId`, `bonusPaid`, `bonusAmount`) — `backend/src/referrals/entities/referral.entity.ts`
- **[feat]** Created `ReferralsService`: `getMyReferrals()`, `validateCode()` — `backend/src/referrals/referrals.service.ts`
- **[feat]** Created `ReferralsController`: `GET /referrals/my` (JWT), `GET /referrals/validate/:code` (public) — `backend/src/referrals/referrals.controller.ts`
- **[feat]** Created `ReferralsModule` — `backend/src/referrals/referrals.module.ts`
- **[feat]** `OrdersService.create()`: auto-applies `pendingReferralDiscount` from user and zeros it out — `backend/src/orders/orders.service.ts`
- **[feat]** `OrdersService.updateStatusByClient()`: calls `applyReferralBonusIfEligible()` on first DONE order — `backend/src/orders/orders.service.ts`
- **[feat]** `applyReferralBonusIfEligible()`: awards 10 000 UZS to both referrer and referee on first DONE order — `backend/src/orders/orders.service.ts`
- **[feat]** Installed `@nestjs/schedule`, added `ScheduleModule.forRoot()` to `AppModule` — `backend/src/app.module.ts`
- **[feat]** Created `TreatmentCourse` entity (`clientId`, `title`, `serviceId`, `totalProcedures`, `completedProcedures`, `intervalDays`, `nextDate`, `status`, `reminderSentToday`) — `backend/src/treatment-courses/entities/treatment-course.entity.ts`
- **[feat]** Created `TreatmentCoursesService`: CRUD + `@Cron('0 * * * *')` hourly reminder job — `backend/src/treatment-courses/treatment-courses.service.ts`
- **[feat]** Created `TreatmentCoursesController`: `POST`, `GET /my`, `PATCH /:id`, `DELETE /:id` (all JWT) — `backend/src/treatment-courses/treatment-courses.controller.ts`
- **[feat]** Created `TreatmentCoursesModule` — `backend/src/treatment-courses/treatment-courses.module.ts`
- **[feat]** Registered `ReferralsModule` and `TreatmentCoursesModule` in `AppModule` — `backend/src/app.module.ts`
- **[docs]** Added sections 13 (Referrals) and 14 (TreatmentCourses) to `docs/BACKEND_API.md`

## 2026-03-30 (Favorites + MedicalCard — backend)

- **[feat]** Создана сущность `FavoriteMedic` с уникальным индексом `(userId, medicId)` — `backend/src/favorites/entities/favorite-medic.entity.ts`
- **[feat]** Создан `FavoritesService` — методы `add` (upsert/orIgnore), `remove`, `findByUser` (с JOIN medic info), `isFavorite`, `findActiveFavoriteMedicId` (активный избранный медик) — `backend/src/favorites/favorites.service.ts`
- **[feat]** Создан `FavoritesController` — `POST /favorites/:medicId`, `DELETE /favorites/:medicId`, `GET /favorites` (JwtAuthGuard) — `backend/src/favorites/favorites.controller.ts`
- **[feat]** `FavoritesModule` зарегистрирован в `app.module.ts` и импортирован в `OrdersModule`
- **[feat]** `DispatchService` инжектирует `FavoritesService` — при диспатче проверяет избранного медика клиента; если онлайн/верифицирован/в радиусе — получает приглашение первым — `backend/src/orders/dispatch.service.ts`
- **[feat]** Создана сущность `MedicalCard` с unique `userId` — `backend/src/medical-card/entities/medical-card.entity.ts`
- **[feat]** Создан `MedicalCardService` — `upsert` (create/update), `findByUserId`, `findByUserIdForMedic` (проверяет активный заказ медика) — `backend/src/medical-card/medical-card.service.ts`
- **[feat]** Создан `MedicalCardController` — `GET /medical-card` (JwtAuthGuard), `PUT /medical-card` (JwtAuthGuard), `GET /medical-card/client/:clientId` (MedicAuthGuard + check active order) — `backend/src/medical-card/medical-card.controller.ts`
- **[feat]** `MedicalCardModule` зарегистрирован в `app.module.ts`
- **[docs]** Обновлён `docs/BACKEND_API.md` — добавлены секции 11 (Favorites) и 12 (MedicalCard)

## 2026-03-30 (Urgent Order UI — mobile + medic)

- **[feat]** Added `isUrgent` boolean state + fetch `GET /settings` for `urgentFeePercent` on confirm screen — `mobile/app/order/confirm.tsx`
- **[feat]** Urgent toggle row with Switch + description label on confirm screen — `mobile/app/order/confirm.tsx`
- **[feat]** `urgentFee` line in price breakdown; total updated to include `urgentFee`; `isUrgent` sent in POST /orders body — `mobile/app/order/confirm.tsx`
- **[feat]** Added `isUrgent?: boolean` to `OrderCardItem`; shows red "Срочный" badge when true — `mobile/components/OrderCard.tsx`
- **[feat]** Added `isUrgent?: boolean` and `urgentFee?: number` to `Order` interface — `mobile/hooks/useOrderTracking.ts`
- **[feat]** Track screen shows "🔴 Срочный" badge and `urgentFee` line in header when `order.isUrgent` is true — `mobile/app/order/track.tsx`
- **[feat]** Added `urgentBadge`, `urgentBadgeText`, `urgentFeeText` styles — `mobile/app/order/trackStyles.ts`
- **[feat]** Added `isUrgent?: boolean` and `urgentFee?: number` to `DispatchInvitePayload.order` in medic's invite modal — `medic/components/OrderInviteModal.tsx`
- **[feat]** Red urgent banner "🔴 СРОЧНЫЙ — доплата: X сум" shown at top of invite modal when `order.isUrgent` is true — `medic/components/OrderInviteModal.tsx`
- **[feat]** Added `isUrgent?: boolean` and `urgentFee?: number` to `OrderDetail` type — `medic/hooks/useOrderStatus.ts`
- **[feat]** Medic order detail screen shows red "Срочный" badge; `urgentFee` row in service/earnings card; `netPrice` calculation includes `urgentFee` — `medic/app/order/[id].tsx`
- **[i18n]** Added `urgent.label`, `urgent.badge`, `urgent.description`, `urgent.fee` keys — `mobile/i18n/ru.json`, `mobile/i18n/uz.json`, `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-30 (Global Error Boundary — mobile + medic)

- **[feat]** Created `reportError()` utility — sends error to `POST /client-errors` with userId, appType, screen, deviceInfo, appVersion — `mobile/utils/reportError.ts`, `medic/utils/reportError.ts`
- **[feat]** Created `ErrorBoundary` React class component — catches render errors, reports via `reportError()`, shows fallback UI with retry button — `mobile/components/ErrorBoundary.tsx`, `medic/components/ErrorBoundary.tsx`
- **[feat]** Wrapped root `RootLayout` JSX with `<ErrorBoundary appType="mobile">` — `mobile/app/_layout.tsx`
- **[feat]** Wrapped root `RootLayout` JSX with `<ErrorBoundary appType="medic">` — `medic/app/_layout.tsx`
- **[feat]** Added `ErrorUtils.setGlobalHandler` in `RootLayoutNav` to catch unhandled JS errors and report them via `reportError()` — `mobile/app/_layout.tsx`, `medic/app/_layout.tsx`

## 2026-03-29 (Rating & Reviews UI — mobile + medic)

- **[feat]** Added `clientReview?: string | null` and `rating`/`reviewCount` to `Medic` interface in `Order` type — `mobile/hooks/useOrderTracking.ts`
- **[feat]** Track screen shows submitted `clientReview` text after rating — `mobile/app/order/track.tsx`
- **[feat]** Track screen shows medic's `rating` + `reviewCount` (N отзывов) next to medic name — `mobile/app/order/track.tsx`
- **[feat]** Added `medicRatingRow`, `medicRatingText`, `medicReviewCount`, `clientReviewText` styles — `mobile/app/order/trackStyles.ts`
- **[feat]** Added `review.*` i18n keys (placeholder, reviews, noReviews, myReviews) — `mobile/i18n/ru.json`, `mobile/i18n/uz.json`
- **[feat]** Added `reviewCount: number` to `MedicUser` type — `medic/context/AuthContext.tsx`
- **[feat]** Medic profile header shows `reviewCount` next to rating stars — `medic/app/(tabs)/profile.tsx`
- **[feat]** Medic stats card for rating is now tappable, navigates to `/reviews` — `medic/app/(tabs)/profile.tsx`
- **[feat]** Created `app/reviews.tsx` — screen listing all DONE orders with non-empty `clientReview`, shows stars + review text + date — `medic/app/reviews.tsx`
- **[feat]** Added `review.*` i18n keys — `medic/i18n/ru.json`, `medic/i18n/uz.json`

## 2026-03-29 (Urgent Order feature)

- **[feat]** Added `isUrgent: boolean` (default false) and `urgentFee: decimal(10,0)` (default 0) columns to `Order` entity — `backend/src/orders/entities/order.entity.ts`
- **[feat]** Added `urgentFeePercent` (default 50), `urgentStartHour` (default 22), `urgentEndHour` (default 7) columns to `AppSettings` entity — `backend/src/app-settings/entities/app-settings.entity.ts`
- **[feat]** Added `@IsOptional() @IsBoolean() isUrgent?` field to `CreateOrderDto` — `backend/src/orders/dto/create-order.dto.ts`
- **[feat]** `create()`: auto-detects night window (UTC+5) or client flag; calculates `urgentFee`; updated `netPrice = priceAmount + urgentFee - discountAmount` and `platformFee` accordingly — `backend/src/orders/orders.service.ts`
- **[feat]** `updateStatusByClient` and `updateStatusByMedic` DONE transitions: earnings now use `netPrice - platformFee` (includes `urgentFee`) — `backend/src/orders/orders.service.ts`
- **[feat]** `acceptOrder` balance deduction uses `urgentFee`-inclusive `netPrice` — `backend/src/orders/orders.service.ts`
- **[feat]** `findAllAdmin()` accepts optional `isUrgent?: boolean` filter — `backend/src/orders/orders.service.ts`
- **[feat]** Admin `GET /orders/admin/all` accepts `?isUrgent=true|false` query param — `backend/src/orders/orders.controller.ts`
- **[feat]** `PatchSettingsDto` extended with `urgentFeePercent`, `urgentStartHour`, `urgentEndHour` — `backend/src/app-settings/dto/patch-settings.dto.ts`
- **[feat]** `AppSettingsService.patch()` persists new urgent settings — `backend/src/app-settings/app-settings.service.ts`
- **[feat]** `GET /settings` and `PATCH /settings` now return/accept urgent fee config fields — `backend/src/app-settings/app-settings.controller.ts`
- **[docs]** Updated Order model and commission formula in `docs/BACKEND_API.md`

## 2026-03-29 (Error Tracking backend extension)

- **[feat]** Created `ClientErrorStatus` enum (`NEW | IN_PROGRESS | FIXED | IGNORED`) — `backend/src/client-errors/entities/client-error-status.enum.ts`
- **[feat]** Extended `ClientError` entity with new nullable fields: `status` (default NEW), `deviceInfo`, `appVersion`, `errorCode`, `count` (default 1), `resolvedAt` — `backend/src/client-errors/entities/client-error.entity.ts`
- **[feat]** Extended `CreateClientErrorDto` with optional `deviceInfo` (MaxLength 200), `appVersion` (MaxLength 50), `errorCode` (MaxLength 100) — `backend/src/client-errors/dto/create-client-error.dto.ts`
- **[feat]** Added `findAll()` with paginated filtering by status/appType/userId/dateFrom/dateTo — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Added `updateStatus()` — sets `resolvedAt` when status becomes FIXED or IGNORED — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Added `getStats()` — returns `{ NEW, IN_PROGRESS, FIXED, IGNORED }` counts — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Auto-grouping in `save()` — if `errorCode` provided, increments `count` on matching NEW/IN_PROGRESS entry within 24 h instead of creating duplicate — `backend/src/client-errors/client-errors.service.ts`
- **[feat]** Added admin endpoints behind `AdminGuard`: `GET /client-errors/admin`, `PATCH /client-errors/admin/:id`, `GET /client-errors/admin/stats` — `backend/src/client-errors/client-errors.controller.ts`

## 2026-03-29 (LOW bugs BE-L1..L7)

- **[fix]** BE-L1: Added `findOneBasic(id)` without medic JOIN for internal use; all internal callers (cancelOrder, rateOrder, updateStatusByClient, updateStatusByMedic, acceptOrder) now use it — `orders.service.ts`
- **[fix]** BE-L2: Stored interval handle in `cleanupInterval` class property; implemented `OnModuleDestroy` to call `clearInterval` — `order-events.gateway.ts`
- **[fix]** BE-L3: Created `BlockUserDto` with `@IsBoolean() isBlocked` for admin block endpoint — `auth/dto/block-user.dto.ts`, `auth.controller.ts`
- **[fix]** BE-L4: Added `.catch(err => console.error('Notify error:', err))` to all fire-and-forget `notifyClient`/`notifyMedic` calls — `orders.service.ts`
- **[fix]** BE-L5: `GET /services/:id` now throws `NotFoundException` when service is null instead of returning 200 — `services.controller.ts`
- **[fix]** BE-L6: `broadcastToAll` processes recipients in chunks of 20 with 100ms delay between chunks — `telegram.service.ts`
- **[fix]** BE-L7: `discountAmount` capped at 20% of service price with `BadRequestException`; TODO comment for future promo-code validation — `orders.service.ts`

## 2026-03-29 (LOW bugs MOB-L1..L5, MED-L1..L3)

- **[fix]** MOB-L1: Replaced `pin` dep in `fetchLocation` useCallback with `initialPinSetRef` ref to eliminate infinite loop — `mobile/app/order/location.tsx`
- **[fix]** MOB-L2: Removed unused `getServiceById` import and `service` variable (dead code) — `mobile/app/order/location.tsx`
- **[fix]** MOB-L3: Wrapped native `LocationMap` with `React.memo` to prevent MapView re-renders on address keystrokes — `mobile/app/order/location.tsx`
- **[fix]** MOB-L4: Removed duplicate `setNotificationChannelAsync('order_updates')` from `registerPushToken.ts`; channel setup kept only in `_layout.tsx` — `mobile/utils/registerPushToken.ts`
- **[fix]** MOB-L5: Changed `logout` type from `() => void` to `() => Promise<void>` in `AuthContextType` interface — `mobile/context/AuthContext.tsx`
- **[fix]** MED-L1: Added two `useEffect` hooks to sync `faceUri`/`licenseUri` state when `medic.facePhotoUrl`/`licensePhotoUrl` updates after profile refresh — `medic/app/verification.tsx`
- **[fix]** MED-L2: Replaced dynamic `(await import('@/constants/api')).API_BASE` with static `API_BASE` import at top of file — `medic/app/(tabs)/profile.tsx`
- **[fix]** MED-L3: Stored `token` in `tokenRef`, `pushLocation` now uses `tokenRef.current` with empty `useCallback` deps; removed `pushLocation` from socket effect deps to prevent unnecessary reconnects — `medic/hooks/useMedicOrderFeed.ts`

## 2026-03-28 (medic MEDIUM bugs MED-M1..M9)

- **[fix]** MED-M1: Replaced all hardcoded Russian strings with `t()` i18n calls — `app/(tabs)/index.tsx`, `profile.tsx`, `order/[id].tsx`, `verification.tsx`, `components/OrderInviteModal.tsx`, `app/(tabs)/my-orders.tsx`
- **[fix]** MED-M2: OrderInviteModal auto-dismisses after 2s when countdown reaches 0 — `components/OrderInviteModal.tsx`
- **[fix]** MED-M3: Reset `startingRef.current = false` after watchPositionAsync succeeds — `hooks/useMedicLocation.ts`
- **[fix]** MED-M4: Replaced hardcoded OSRM URL with import from `@/constants/config` — `components/OrderInviteModal.tsx`
- **[fix]** MED-M5: Added error state and retry UI to my-orders fetch — `app/(tabs)/my-orders.tsx`
- **[fix]** MED-M6: Profile uses `?status=DONE&limit=1` + `total` instead of fetching 100 orders — `app/(tabs)/profile.tsx`
- **[fix]** MED-M7: NewOrderBanner uses `onDismissRef` + `order.id` in effect deps to avoid stale closure — `components/NewOrderBanner.tsx`
- **[fix]** MED-M8: OSRM throttle increased from 12s to 30s + skip if medic moved <200m — `constants/config.ts`, `hooks/useMedicRoute.ts`
- **[fix]** MED-M9: Added `reconnectionAttempts: 15` to SocketContext — `context/SocketContext.tsx`
- **[i18n]** Added `common.close` key to ru.json and uz.json

## 2026-03-28 (backend MEDIUM bugs BE-M1..M12)

- **[fix]** BE-M9: Added composite `@Index(['orderId', 'medicId', 'result'])` on DispatchAttempt entity — `backend/src/orders/entities/dispatch-attempt.entity.ts`
- **[fix]** BE-M10: Replaced hardcoded WebSocket CORS origins with shared `ALLOWED_ORIGINS` from `cors.config.ts` — `backend/src/realtime/order-events.gateway.ts`
- **[fix]** BE-M11: Fixed Cloudinary timeout leak — `clearTimeout` via `.finally()` on Promise.race — `backend/src/common/cloudinary.service.ts`
- **[verified]** BE-M1..M8, BE-M12: Already fixed in prior commits (forbidNonWhitelisted, Payme refund state=-2, synchronize:false, pool max:20, dispatch recovery, findAvailable guard, WS caches, GetStatement take:1000)

## 2026-03-28 (mobile HIGH bugs MOB-H1..H5)

- **[verified]** MOB-H1: `submitRating` already uses `ratingSubmittingRef` guard, `ratingSubmitting` not in useCallback deps — no changes needed — `mobile/hooks/useOrderTracking.ts`
- **[fix]** MOB-H2: Replaced all hardcoded Russian strings with i18n `t()` calls on track, orders, and rating screens — Uzbek users now see correct translations — `mobile/app/order/track.tsx`, `mobile/app/(tabs)/two.tsx`, `mobile/components/RatingModal.tsx`
- **[fix]** MOB-H3: Removed deprecated `STATUS_LABEL` object with hardcoded Russian — `OrderCard` already uses `getStatusLabel(t)` — `mobile/types/order.ts`
- **[verified]** MOB-H4: `OrderCard.onPress` already navigates to track screen for all order statuses — no changes needed — `mobile/components/OrderCard.tsx`
- **[fix]** MOB-H5: `cancelOrder` removed `if (result)` guard — `apiFetch` returns undefined on 204 success, so navigation was skipped; now navigation always runs after successful await — `mobile/hooks/useOrderTracking.ts`

## 2026-03-28 (backend HIGH security fixes)

- **[fix]** BE-H9: Added `@MaxLength(10000)` to `stacktrace` and `@MaxLength(2000)` to `message` in `CreateClientErrorDto` — prevents database bloat via public endpoint — `backend/src/client-errors/dto/create-client-error.dto.ts`
- **[fix]** BE-H10: Added `@Exclude()` on `passwordHash` in both `Medic` and `User` entities, enabled `ClassSerializerInterceptor` globally — prevents password hash leaking in API responses — `backend/src/medics/entities/medic.entity.ts`, `backend/src/users/entities/user.entity.ts`, `backend/src/main.ts`
- **[fix]** BE-H11: Telegram `/start {medicId}` now rejects linking if medic already has a different `telegramChatId` — prevents hijacking another medic's notifications — `backend/src/telegram/telegram-bot.service.ts`
- **[verified]** BE-H1 through BE-H8: Already fixed in codebase — `isBlocked` check in JWT strategy, payment ownership verification, Click IP whitelist, admin topup validation, push token MaxLength, order creation transaction, dispatch profilePhotoUrl check

## 2026-03-28 (medic HIGH fixes)

- **[fix]** MED-H1: Removed `clearInterval` from `acceptOrder` — location interval continues running so medic stays visible to dispatch after completing an order — `medic/hooks/useMedicOrderFeed.ts`
- **[fix]** MED-H2: 401 now shows Alert before logout instead of silent auto-logout — medic sees "Session expired" message, gets chance to understand what happened — `medic/constants/api.ts`
- **[fix]** MED-H3: Used `fetchOrderRef` pattern to remove `fetchOrder` from WebSocket effect deps — prevents socket reconnect loop caused by `router` changing on every render — `medic/hooks/useOrderStatus.ts`
- **[fix]** MED-H4: Wrapped `confirmAccept` in try/catch — navigation to order screen only happens if `acceptOrder` succeeds; `acceptOrder` now re-throws after setting error state — `medic/app/(tabs)/index.tsx`, `medic/hooks/useMedicOrderFeed.ts`
- **[verified]** MED-H5: `.env` already in root `.gitignore` (lines 38-39), not tracked by git — no changes needed

## 2026-03-28 (medic critical fixes)

- **[fix]** MED-C1: Устранены двойные WebSocket-соединения в medic app — создан единый `SocketProvider`/`SocketContext`, `useMedicOrderFeed` и `useOrderStatus` используют общий сокет вместо создания собственных `io()` — `medic/context/SocketContext.tsx`, `medic/hooks/useMedicOrderFeed.ts`, `medic/hooks/useOrderStatus.ts`, `medic/hooks/useMedicLocation.ts`, `medic/app/order/[id].tsx`, `medic/app/_layout.tsx`
- **[fix]** MED-C2: Исправлен stale closure в `SwipeActionButton` — `onConfirm` теперь хранится в ref, PanResponder вызывает `onConfirmRef.current()` вместо замыкания первого рендера — `medic/components/SwipeActionButton.tsx`

## 2026-03-28

- **[fix]** MOB-C1: Каталог `/services` теперь запрашивается с auth token — предотвращает ложный auto-logout на 401 — `mobile/app/(tabs)/index.tsx`
- **[fix]** MOB-C2: Устранены двойные WebSocket-соединения — создан единый `SocketProvider`/`SocketContext`, orders list и track screen используют общий сокет — `mobile/context/SocketContext.tsx`, `mobile/app/(tabs)/two.tsx`, `mobile/hooks/useOrderTracking.ts`, `mobile/app/_layout.tsx`
- **[fix]** MOB-C3: Добавлен TODO-комментарий о необходимости серверной валидации `discountAmount` (связан с BE-L7) — `mobile/app/order/confirm.tsx`
- **[fix]** MOB-C4: Добавлена валидация телефона — проверка формата +998XXXXXXXXX или минимум 9 цифр — `mobile/app/order/location.tsx`
- **[fix]** MOB-C5: `registerPushToken` теперь логирует явное предупреждение при placeholder EAS projectId — `mobile/utils/registerPushToken.ts`
- **[fix]** BE-C1: Унифицировано начисление `earnings` медику — оба пути (client DONE и medic DONE) теперь используют `netPrice` — `orders.service.ts`
- **[fix]** BE-C2: SQL-инъекция в balance deduction — заменена строковая интерполяция на `.setParameter('fee', fee)` — `orders.service.ts`
- **[fix]** BE-C3: Race condition в `adminCancelOrder` — заменён read-then-write на атомарный `update()` с `Not(In([DONE, CANCELED]))` — `orders.service.ts`
- **[fix]** BE-C4: Telegram webhook authentication — добавлена проверка `X-Telegram-Bot-Api-Secret-Token` + `secret_token` в setWebhook — `telegram-bot.controller.ts`, `telegram-bot.service.ts`
- **[fix]** BE-C5: Payme auth timing attack — заменён `!==` на `crypto.timingSafeEqual` — `payme.service.ts`

## 2026-03-18

- **[fix]** `web/components/SplashScreen.tsx` — логотип больше не пульсирует (убрана анимация `splash-pulse`), теперь плавный fade-in; убирает эффект "песочных часов" при открытии клиентского web-приложения
- **[feat]** `web-medic/app/page.tsx` — в модальном окне принятия заказа добавлены: мини-карта (Leaflet, тот же Map компонент), расстояние до клиента (haversine); UI приведён в соответствие с нативным medic-приложением
- **[seo]** `landing/components/SeoContent.tsx` — FAQ аккордеон: ответы всегда в DOM (CSS max-height вместо conditional render), Google теперь индексирует все ответы + FAQPage schema работает
- **[seo]** `landing/components/Hero.tsx` — добавлен скрытый `<h1>` с полным текстом для поисковиков; анимированные `<h1>` → `<div>`, Google видит чистый заголовок
- **[seo]** `landing/app/[lang]/layout.tsx` — расширены keywords: добавлены 20+ long-tail запросов (по районам, по процедурам, на RU и UZ)
- **[seo]** `landing/app/[lang]/[service]/page.tsx` — созданы 8 страниц услуг (4 RU + 4 UZ): укол/ukol, капельница/tomchi, давление+ЭКГ/qon bosimi, уход/parvarish; каждая со своими meta, JSON-LD (MedicalProcedure + FAQPage + BreadcrumbList), hreflang
- **[seo]** `landing/app/sitemap.ts` — sitemap расширен: 2 → 10 URL (добавлены 8 страниц услуг с hreflang alternates)

## 2026-03-14 — Bearings fix: медик по правильной полосе (шаги 1-3)

- **[fix]** `medic/hooks/useMedicLocation.ts` — `heading` добавлен в pos объект emit и onLocationUpdate callback
- **[fix]** `backend/src/realtime/order-events.gateway.ts` — `heading` добавлен в MedicLocationPayload, принимается от медика и передаётся клиенту
- **[fix]** `medic/hooks/useMedicRoute.ts` — OSRM-запрос с `bearings` и `radiuses=25` — маршрут строится по правильной полосе
- **[fix]** `medic/app/order/[id].tsx` — тип medicPos расширен полем `heading`

## 2026-03-14 — Backend критичные фиксы (N1, N2, N4, N5, N6)

- **[fix]** `payments/payme.service.ts` — N1: `checkPerformTransaction` теперь сравнивает с `netPrice = priceAmount - discountAmount`; заказы со скидкой корректно оплачиваются
- **[fix]** `payments/click.service.ts` — N1: аналогичный фикс для Click
- **[fix]** `main.ts` — N4: добавлен `trust proxy 1` — Payme IP-whitelist теперь работает на Railway
- **[fix]** `auth/auth.controller.ts` — N6: `@Throttle({ ttl: 900_000, limit: 5 })` на `/auth/admin/login`
- **[fix]** `orders/dispatch.service.ts` — N2: NO_MEDICS retry-таймер сохраняется в `this.timers` — очищается при отмене заказа
- **[fix]** `medics/medics.service.ts` — N5: `findCandidatesForDispatch` ограничен `.take(50)`

## 2026-03-14 — Этап 18: веб-адаптация + BUG 32/33 (Диёр)

- **[web]** `app/orders/[id]/page.tsx` — убран `"ASSIGNED"` из `STATUS_FLOW` (шаги теперь: `CREATED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE`)
- **[web]** `app/orders/[id]/page.tsx` — `canCancel` теперь только `"CREATED"` (ASSIGNED больше не наступает)
- **[web]** `app/orders/[id]/page.tsx` — убран `"ASSIGNED"` из условия показа карты медика
- **[web-medic]** `lib/api.ts` — удалена строка `ASSIGNED → ACCEPTED ("Подтвердить принятие")` из `NEXT_STATUS`
- **[fix]** `admin/src/components/AdminLayout.tsx` — BUG 32: добавлена периодическая проверка токена каждые 60с через `setInterval` + `useState(hasAdminSecret())` → авто-logout при истечении JWT
- **[note]** BUG 33 (JWT localStorage XSS) — частично: auto-logout при истёкшем токене; полный фикс = httpOnly cookies на бэкенде

## 2026-03-13 — Перегрев: throttle GPS emit в useMedicLocation

- **[fix]** `medic/hooks/useMedicLocation.ts` — добавлен JS-level throttle `lastEmitRef` (Android игнорирует `timeInterval` в `watchPositionAsync` и шлёт тысячи GPS-фиксов в секунду); socket emit не чаще `LOCATION_EMIT_INTERVAL_MS` (5с); `distanceInterval` увеличен 8м→15м; карта обновляется на каждый фикс, emit — throttled

## 2026-03-13 — Убрано двойное принятие заказа медиком

- **[backend]** `orders/orders.service.ts` — `acceptOrder` теперь ставит статус ACCEPTED вместо ASSIGNED (пропускает промежуточный шаг)
- **[medic]** `medic/app/order/[id].tsx` — убраны: auto-advance useEffect, autoAcceptFailed state, 5с timeout, fallback SwipeButton для ASSIGNED

## 2026-03-13 — SwipeActionButton для medic (UX)

- **[ux]** `medic/components/SwipeActionButton.tsx` — создан swipe-to-confirm компонент (Animated + PanResponder + haptic)
- **[ux]** `medic/app/order/[id].tsx` — кнопка "следующий статус" и fallback "Принять заказ" заменены на SwipeActionButton

## 2026-03-13 — Этап 17: 4 бага medic (A, C, D, E)

- **[fix]** `medic/hooks/useMedicOrderFeed.ts` — Задача A: в `acceptOrder` после успешного принятия добавлен `clearInterval(locationIntervalRef.current)` — 2-минутный pushLocation интервал останавливается при переходе на экран заказа
- **[fix]** `medic/app/order/[id].tsx` — Задача C: добавлен `autoAcceptFailed` state; в `.catch` auto-advance ASSIGNED→ACCEPTED устанавливается флаг; добавлен useEffect с 5с setTimeout как доп. fallback; в рендере показывается кнопка "Принять заказ" если `order.status === 'ASSIGNED' && autoAcceptFailed`
- **[fix]** `medic/app/order/[id].tsx` — Задача D: из initial position effect убран `socketRef.current.emit('medic_location', ...)` — двойной emit устранён, остался только `setMedicPos(pos)` для карты
- **[fix]** `medic/hooks/useOrderStatus.ts` — Задача E шаг 1: в `OrderDetail` добавлены поля `clientRating`, `clientReview`, `cancelReason`
- **[fix]** `medic/hooks/useOrderStatus.ts` — Задача E шаг 2: в `order_status` WS-обработчике при DONE/CANCELED вызывается `fetchOrder()` для получения полных данных
- **[fix]** `medic/app/order/[id].tsx` — Задача E шаг 3: после блока `completedNote` добавлен рендер рейтинга со звёздами + текст отзыва клиента (DONE) и причина отмены (CANCELED)

## 2026-03-13 — BUG fix: cancelOrder без причины (mobile)

- **[fix]** `mobile/hooks/useOrderTracking.ts` — `cancelOrder` принимает `reason?: string`, передаёт `{ reason }` в body POST-запроса; тип в `UseOrderTrackingResult` обновлён
- **[fix]** `mobile/app/order/track.tsx` — добавлен `cancelReason` state, TextInput для ввода причины показывается поверх контента когда открыт cancelModal; `confirmCancel` передаёт `cancelReason.trim() || undefined`; `onClose` и кнопка "Нет" сбрасывают `cancelReason`

## 2026-03-13 — OSRM timeout + retry с exponential backoff (medic)

- **[feat]** `medic/constants/config.ts` — `FETCH_TIMEOUT_MS` увеличен с 8000 до 12000
- **[feat]** `medic/hooks/useMedicRoute.ts` — добавлен `retryCountRef`; при AbortError (timeout) exponential backoff 3s/6s/12s; при успехе и `resetRoute` счётчик сбрасывается

## 2026-03-12 — Bug fixes: BUG-03, BUG-12, BUG-17

- **[fix]** BUG-03: `medic/app/order/[id].tsx` — location tracking useEffect: removed `else stopTracking()` branch, cleanup now uses `return stopTracking` directly to avoid double-stop when status is non-tracking
- **[fix]** BUG-12: `mobile/hooks/useOrderTracking.ts` — `order_status` handler clears `pollingRef.current` interval before disconnecting on DONE/CANCELED
- **[fix]** BUG-17: `medic/hooks/useOrderStatus.ts` — WebSocket useEffect now guards on `!orderId` in addition to `!token`; `fetchOrder` useCallback also guards on `!orderId` to prevent requests with undefined orderId

## 2026-03-12 — BUG-20 + BUG-21: earnings overstated fix + rating transaction fix

- **[backend]** `orders/orders.service.ts` — BUG-20: `updateStatusByClient` now credits medic with `netPrice - platformFee` instead of full `netPrice`, correcting 10% earnings overstatement
- **[backend]** `orders/orders.service.ts` — BUG-21: `rateOrder` now wraps both `order.clientRating` update and medic rating recalculation in a single `dataSource.transaction`, preventing split-brain if process crashes between the two writes

## 2026-03-12 — BUG-01 & BUG-02: subscription leak + concurrent call guard in useMedicLocation

- **[fix]** `medic/hooks/useMedicLocation.ts` — BUG-01: added `startingRef` set synchronously before async work; `.then(sub => ...)` now calls `sub.remove()` immediately if `startingRef.current` is false when the subscription resolves, preventing a leaked subscription when `stopTracking` runs before `.then()` fires
- **[fix]** `medic/hooks/useMedicLocation.ts` — BUG-02: guard changed from `if (watchRef.current) return` to `if (watchRef.current || startingRef.current) return` to block concurrent `startTracking` calls before `watchRef.current` is set asynchronously; `stopTracking` resets `startingRef.current = false` to cancel any in-flight async chain

## 2026-03-11 — dispatch_update includes profilePhotoUrl

- **[backend]** `orders/dispatch.service.ts` — dispatch_update event now includes `profilePhotoUrl` for candidate medic
- **[backend]** `realtime/order-events.gateway.ts` — emitDispatchUpdate type updated with profilePhotoUrl

## 2026-03-11 — cancelReason отображение на веб-клиентах

- **[web]** `lib/api.ts` — добавлен `cancelReason?: string | null` в `Order` interface
- **[web]** `app/orders/[id]/page.tsx` — `StatusStepper` показывает `cancelReason` под надписью "Отменён"
- **[web-medic]** `lib/api.ts` — добавлен `cancelReason?: string | null` в `Order` interface
- **[web-medic]** `app/order/[id]/page.tsx` — блок CANCELED показывает причину отмены + кнопку домой

## 2026-03-09 — Cancellation reason feature (backend)

- **[backend]** `orders/entities/order.entity.ts` — добавлено поле `cancelReason` (nullable varchar 500)
- **[backend]** `orders/dto/cancel-order.dto.ts` — создан DTO с `reason?` (`@IsOptional @IsString @MaxLength(500)`)
- **[backend]** `orders/orders.service.ts` — `cancelOrder`/`adminCancelOrder` сохраняют причину, включают в push
- **[backend]** `orders/orders.controller.ts` — эндпоинты cancel принимают `CancelOrderDto`
- **[backend]** `orders/dispatch.service.ts` — авто-отмена сохраняет `cancelReason: 'Нет доступных медиков в вашем районе'`

## 2026-03-09 — mobile: причина отмены + BUG-17, connection pool, JWT, Map TTL

- **[mobile]** `hooks/useOrderTracking.ts` — добавлено поле `cancelReason?` в интерфейс `Order`
- **[mobile]** `app/order/track.tsx` — показывает причину отмены при статусе CANCELED
- **[mobile]** `components/OrderCard.tsx` — показывает причину отмены под бейджем
- **[backend]** `orders/orders.service.ts` — BUG-17: push ошибки логируются вместо тихого проглатывания
- **[backend]** `app.module.ts` — TypeORM connection pool `extra: { max:10, min:2 }`
- **[backend]** `auth/auth.module.ts` — JWT expiry `1d` (было `7d`), env `JWT_EXPIRES_IN`
- **[backend]** `realtime/order-events.gateway.ts` — `clientOrderRooms` TTL cleanup каждые 5 мин

## 2026-03-09 — Self-hosted OSRM (Абубакир)

- **[osrm]** `osrm/Dockerfile` — создан сервис на базе `osrm/osrm-backend`, данные Узбекистана с Geofabrik, MLD алгоритм, порт 5000
- **[medic]** `constants/config.ts` — `OSRM_URL` читает `EXPO_PUBLIC_OSRM_URL` env var, fallback на публичный сервер
- **[mobile]** `hooks/useRoutePolyline.ts` — аналогично читает `EXPO_PUBLIC_OSRM_URL`

## 2026-03-10 — Performance оптимизации + аудит (Диёр)

- **[web-medic]** `app/page.tsx` — убран `setInterval(fetchOrders, 15000)` (polling). Теперь доступные заказы приходят через WebSocket `new_order` (уже был подключён). При reconnect — одиночный REST запрос для sync.
- **[admin]** `pages/Dashboard.tsx` — `recharts` переведён на `React.lazy` + `Suspense`. Initial bundle −~400KB.
- **[admin]** `pages/Reports.tsx` — то же: `recharts` lazy-loaded.
- **[BUG-28]** `web/app/orders/[id]/page.tsx` — `unsubscribe_order` уже эмитится в cleanup (баг уже был исправлен ранее).
- **[docs]** `docs/PERFORMANCE_AUDIT.md` — создан полный аудит производительности и безопасности.

## 2026-03-09 — Backend: BUG-1 fix + Performance + Security (Абубакир)

- **[backend]** `orders/orders.service.ts` — `acceptOrder` атомарный с транзакцией, race condition устранён; `findAvailable` добавлен `take: 50`
- **[backend]** `orders/entities/dispatch-attempt.entity.ts` — `@Index()` на `orderId` и `medicId`
- **[backend]** `orders/dispatch.service.ts` — NO_MEDICS auto-retry через 5 мин
- **[backend]** `common/cloudinary.service.ts` — `Promise.race` 30s timeout на upload
- **[backend]** `payments/payme.service.ts` — IP whitelist `185.8.212.0/24` в продакшне
- **[backend]** `payments/payments.controller.ts` — webhook передаёт `req.ip` в `validateIp()`

## 2026-03-09 — web-medic: обработка dispatch_invite_expired

- **[web-medic]** WebSocket событие `dispatch_invite_expired` — убирает заказ из списка доступных + показывает уведомление "Предложение заказа истекло"
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — web + web-medic: типы earnings и platformFee

- **[web-medic]** `lib/api.ts` — `Medic` интерфейс: добавлено поле `earnings: number`
- **[web]** `lib/api.ts` — `Order` интерфейс: добавлено поле `platformFee?: number`
- **[web-medic]** `lib/api.ts` — `Order` интерфейс: добавлено поле `platformFee?: number`
- `npm run build` = 0 ошибок (web ✅, web-medic ✅)

## 2026-03-09 — Рефакторинг mobile + medic: хуки, компоненты, типы (Этап 15)

### mobile/
- **[mobile]** `types/order.ts` — добавлены `OrderStatus`, `STATUS_LABEL`, `STATUS_COLOR`, `ACTIVE_STATUSES` (единый источник)
- **[mobile]** `constants/config.ts` — `GPS_ACCURACY_THRESHOLD_METERS`, `FIRST_ORDER_DISCOUNT_RATE`, `ORDERS_PAGE_LIMIT`
- **[mobile]** `hooks/useOrderTracking.ts` — WebSocket + order state + notifications + cancel/rating (из `track.tsx`)
- **[mobile]** `hooks/useRoutePolyline.ts` — OSRM route fetching (из `track.tsx`)
- **[mobile]** `hooks/useDispatchTimer.ts` — elapsed timer (из `track.tsx`)
- **[mobile]** `components/RatingModal.tsx` — звёзды рейтинга (из `track.tsx`)
- **[mobile]** `app/order/trackStyles.ts` — стили вынесены из `track.tsx`
- **[mobile]** `app/order/track.tsx` — **1365 → 514 строк** (−63%) ✅
- **[mobile]** `components/OrderCard.tsx` — извлечён из `two.tsx`
- **[mobile]** `app/(tabs)/two.tsx` — дублирующиеся типы удалены, импорт из `types/order`
- **[mobile]** `app/order/location.tsx` + `confirm.tsx` — magic numbers → `constants/config`
- `tsc --noEmit` = 0 ошибок ✅

### medic/
- **[medic]** `types/order.ts` — `OrderStatus`, `OrderLocation`, `ACTIVE_STATUSES`, `MAP_ACTIVE_STATUSES`
- **[medic]** `constants/config.ts` — интервалы, таймауты, `OSRM_URL`
- **[medic]** `components/NewOrderBanner.tsx` — извлечён из `index.tsx`
- **[medic]** `hooks/useMedicOrderFeed.ts` — WebSocket + orders feed (из `index.tsx`)
- **[medic]** `app/(tabs)/index.tsx` — **649 → ~430 строк** ✅
- **[medic]** `app/(tabs)/my-orders.tsx` — `OrderStatus` импортируется из `types/order`

### Агент-файлы
- **[docs]** `.claude/agents/engineering/mobile-developer.md` — соглашения для mobile/medic разработки
- **[docs]** `.claude/agents/engineering/mobile-refactor.md` — гайд по рефакторингу больших экранов

---

## 2026-03-09 — Рефакторинг medic order/[id].tsx: разбивка на хуки

- **[medic]** `medic/hooks/useMedicLocation.ts` — создан: foreground permission, интервальная отправка геолокации через WebSocket (`medic_location`), `startTracking` / `stopTracking`, импорт `LOCATION_EMIT_INTERVAL_MS` из `@/constants/config`
- **[medic]** `medic/hooks/useMedicRoute.ts` — создан: получение маршрута OSRM, состояние `routeCoords` / `routeLoading`, тротлинг `ROUTE_FETCH_THROTTLE_MS`, таймаут `FETCH_TIMEOUT_MS`, `fetchRoute` / `resetRoute`
- **[medic]** `medic/hooks/useOrderStatus.ts` — создан: начальная загрузка заказа, WebSocket подписка (`order_status`), `OrderDetail` / `NEXT_STATUS_MAP` экспортированы, `updateOrderStatus(cb)`, фоновые уведомления
- **[medic]** `medic/app/order/[id].tsx` — переписан: 838 → ~310 строк; импортирует 3 хука; локальные типы удалены (используются `OrderStatus`, `OrderLocation`, `MAP_ACTIVE_STATUSES` из `@/types/order`); UI/UX не изменён

## 2026-03-09 — Архитектурные фиксы backend (race conditions, CORS, geo, cache)

- **[backend]** `orders/orders.service.ts` — атомарное списание баланса (`UPDATE WHERE balance >= fee`, affected=0 → ошибка); `updateStatusByClient(DONE)` теперь зачисляет `earnings` в транзакции; `cancelOrder` использует `WHERE status IN (cancellable)` с проверкой `affected`
- **[backend]** `realtime/order-events.gateway.ts` — добавлены production домены в WebSocket CORS (`hamshirago.uz`, `app.`, `medic.`, `admin.`)
- **[backend]** `app-settings/app-settings.service.ts` — 30-секундный TTL кэш для `get()`, инвалидируется при `patch()`
- **[backend]** `utils/geo.ts` — создан общий модуль с функцией `haversineKm`; удалена дублированная реализация из `orders.service.ts`, `dispatch.service.ts`, `medics.service.ts`

---

## 2026-03-09 — admin: колонка Заработок в таблице медиков

- **[admin]** `pages/Medics.tsx` — `AdminMedic` интерфейс: добавлено поле `earnings?: number`; колонка "Заработок" в таблице (после "Кошелёк")
- **[admin]** `i18n/ru.json`, `uz.json` — ключ `medics.colEarnings`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — admin: настройка commissionRate в Settings

- **[admin]** `lib/api.ts` — `AppSettings` интерфейс: добавлено поле `commissionRate: number`
- **[admin]** `pages/Settings.tsx` — слайдер commissionRate (1–50%), disabled когда isPaidMode выключен, сохранение через `updateSettings`
- **[admin]** `i18n/ru.json`, `uz.json` — ключи `commissionRate`, `commissionRateDesc`, `commissionRateValue`, `commissionRateHint`, `toastRateSaved`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — web + web-medic: логирование клиентских ошибок

- **[web]** `lib/api.ts` — добавлена `reportClientError(message, stack)` → `POST /client-errors`
- **[web]** `app/error.tsx`, `app/global-error.tsx` — вызов `reportClientError` при рендере ошибки
- **[web-medic]** `lib/api.ts` — добавлена `reportClientError(message, stack)`
- **[web-medic]** `app/error.tsx`, `app/global-error.tsx` — вызов `reportClientError` при рендере ошибки
- `npm run build` = 0 ошибок (web ✅, web-medic ✅)

## 2026-03-09 — web: платёжная интеграция Payme/Click

- **[web]** `lib/api.ts` — добавлены `initiatePayment()`, `getPaymentStatus()`, типы `PaymentProvider`, `PaymentInitResponse`, `PaymentStatusResponse`
- **[web]** `app/orders/[id]/page.tsx` — блок оплаты при статусе DONE: кнопки Payme и Click, redirect на paymentUrl
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Backend: топап кошелька медика через admin

- **[backend]** `medics/medics.controller.ts` — добавлен `POST /medics/admin/:id/topup` (AdminGuard, 204); вызывает `medicsService.addBalance(id, amount)`
- `tsc --noEmit` = 0 ошибок ✅

## 2026-03-09 — Двойной баланс медика + настраиваемая комиссия

- **[backend]** `medics/entities/medic.entity.ts` — добавлено поле `earnings` (decimal, nullable, default 0): заработанные деньги из выполненных заказов
- **[backend]** `app-settings/entities/app-settings.entity.ts` — добавлено поле `commissionRate` (int, default 10): процент комиссии 1–50
- **[backend]** `app-settings/dto/patch-settings.dto.ts` — оба поля (`isPaidMode`, `commissionRate`) теперь опциональны
- **[backend]** `app-settings/app-settings.service.ts` — добавлены `patch(dto)` и `getCommissionRate()`
- **[backend]** `app-settings/app-settings.controller.ts` — GET и PATCH возвращают оба поля; убран лишний импорт `JwtModule`
- **[backend]** `orders/orders.service.ts` — удалён хардкод `COMMISSION_RATE=0.10`; `create()` и `acceptOrder()` используют `getCommissionRate()` из настроек; DONE теперь зачисляет `netPrice` в `earnings` (не в `balance`)
- **[backend]** `medics/medics.service.ts` — `toAuthResponse()` и `getProfile()` возвращают `earnings`
- **[medic]** `context/AuthContext.tsx` — `MedicUser` интерфейс: добавлено поле `earnings: number`
- **[medic]** `app/(tabs)/profile.tsx` — два блока баланса рядом: "Рабочий депозит" (`balance`) и "Заработок" (`earnings`); новые стили `balancesRow`, `balanceHalf`, `earningsCard`, `earningsValue`, `walletHint`
- **[docs]** `BACKEND_API.md` — задокументированы `GET/PATCH /settings` с `commissionRate`, таблица двух полей баланса медика
- `tsc --noEmit` = 0 ошибок (backend ✅, medic ✅)

## 2026-03-09 — web-medic: фото профиля медика

- **[web-medic]** `lib/api.ts` — добавлено поле `profilePhotoUrl` в интерфейс `Medic`; добавлена функция `medicApi.photo.upload(file)` → `POST /medics/profile-photo`
- **[web-medic]** `app/profile/page.tsx` — аватар теперь показывает `profilePhotoUrl` (если есть) или иконку; иконка 📷 открывает выбор файла; после загрузки профиль обновляется без перезагрузки страницы
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — SEO фиксы landing (JSON-LD image)

- **[landing]** `app/[lang]/layout.tsx` — JSON-LD `MedicalBusiness.image`: заменён несуществующий `/og.png` на `/${lang}/opengraph-image` (динамический генератор)
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Фиксы: галерея, env, уведомления, CORS, документация

- **[medic]** `app/(tabs)/profile.tsx` — при отказе от доступа к галерее: если `canAskAgain=false` показывается алерт с кнопкой "Открыть настройки" (`Linking.openSettings()`), иначе — обычный алерт
- **[mobile]** `constants/api.ts` — `API_BASE` читается из `EXPO_PUBLIC_API_BASE` env, fallback на Railway URL; добавлены `.env` и `.env.example`
- **[medic]** `constants/api.ts` — то же самое
- **[mobile]** `app/_layout.tsx` — Android notification channels: `order_updates` (HIGH, звук+вибро), `tracking_status` (LOW, тихий)
- **[medic]** `app/_layout.tsx` — Android notification channels: `new_orders` (MAX, bypassDnd), `order_updates` (HIGH), `tracking_status` (LOW)
- **[backend]** `main.ts` — CORS whitelist: добавлены `hamshirago.uz`, `app.hamshirago.uz`, `medic.hamshirago.uz`, `admin.hamshirago.uz`
- **[docs]** `STORE_PUBLISH.md` — создана инструкция по публикации в App Store и Google Play

## 2026-03-09 — Security & UX улучшения

- **[backend]** `admin.guard.ts` — B-NEW-1: замена `===` на `crypto.timingSafeEqual()` при проверке X-Admin-Secret (защита от timing-атаки)
- **[admin]** `pages/Dashboard.tsx` — isPaidMode бейдж в шапке: показывает текущий режим (платный/бесплатный), ссылка на `/settings`
- **[admin]** `src/main.tsx` — Sentry: добавлены `environment`, `release` (VITE_APP_VERSION), `beforeSend` (фильтр localhost), tracesSampleRate=0 в dev
- **[admin]** `.env.example`, `.env` — добавлен `VITE_APP_VERSION=1.0.0`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Этап 10: Переключатель "Платный режим" в admin

- **[admin]** `src/lib/api.ts` — добавлены `AppSettings` interface, `getSettings()`, `updateSettings()`
- **[admin]** `src/pages/Settings.tsx` — новая страница: toggle "Платный режим" с инфо-блоком (что изменится), статус-бейдж текущего режима
- **[admin]** `src/App.tsx` — маршрут `/settings` → `<Settings />`
- **[admin]** `src/components/AdminSidebar.tsx` — пункт "Настройки" с иконкой `Settings2`
- **[admin]** `i18n/ru.json`, `uz.json` — секция `settings.*` + ключ `nav.settings`
- `npm run build` = 0 ошибок ✅

## 2026-03-09 — Этап 12: PostHog аналитика + Этап 13: Lighthouse оптимизация

- **[admin]** `src/main.tsx` — инициализация PostHog: `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST`, отключён в dev-режиме
- **[admin]** `src/App.tsx` — добавлен компонент `PageTracker` (useLocation + posthog.capture('$pageview') при смене маршрута)
- **[admin]** `.env.example`, `.env` — добавлены `VITE_POSTHOG_KEY` и `VITE_POSTHOG_HOST`
- **[web]** `app/layout.tsx` — `<link rel="preconnect">` и `<link rel="dns-prefetch">` для Railway API и Cloudinary
- **[web-medic]** `app/layout.tsx` — аналогичные preconnect/dns-prefetch hints
- **[web]** `next.config.ts` — добавлены: `compress: true`, `images.formats: ["avif","webp"]`, `images.remotePatterns: cloudinary`, `experimental.optimizePackageImports`
- **[web-medic]** `next.config.ts` — аналогичные оптимизации
- `npm run build` = 0 ошибок (admin ✅, web ✅, web-medic ✅)

## 2026-03-09 — Этап 7: Сплэш "by tezcode.ai" + Этап 8: Admin UZ-поля услуг

- **[web]** `components/SplashScreen.tsx` — добавлена строка "by tezcode.ai" под логотипом (малый шрифт, полупрозрачный)
- **[web-medic]** `components/SplashScreen.tsx` — аналогично web
- **[admin]** `src/components/SplashScreen.tsx` — создан новый компонент: логотип, "HamshiraGo", "Панель администратора", "by tezcode.ai", анимированные точки загрузки, fade-out через 2с
- **[admin]** `src/App.tsx` — `<SplashScreen />` добавлен в дерево компонентов
- **[admin]** `src/lib/api.ts` — добавлены поля `titleUz/descriptionUz/categoryUz` в `AdminService` и `ServiceFormData`; восстановлен недостающий экспорт `topupMedicWallet`
- **[admin]** `src/pages/Services.tsx` — форма разделена на 2 блока 🇷🇺/🇺🇿; таблица получила колонку "Название (UZ)"; `emptyForm` + `openEdit` обновлены для UZ-полей
- **[admin]** `src/i18n/ru.json`, `uz.json` — добавлены ключи `colTitleUz`, `labelTitleUz`, `labelDescUz`, `labelCategoryUz`
- `npm run build` = 0 ошибок (web ✅, web-medic ✅, admin ✅)

## 2026-03-08 — Landing: кнопка «Попробовать» + SEO-секция

- **[landing]** `i18n/translations.ts` — добавлены `hero.try`, `hero.tryWeb` (RU+UZ); полная секция `seo` (intro, who×6, procedures×4, faq×7, areas×10, cta) на русском и узбекском
- **[landing]** `components/Hero.tsx` — добавлена кнопка «Попробовать / Sinab ko'ring» с ссылкой `https://app.hamshirago.uz`, магнитный эффект, над store-кнопками
- **[landing]** `components/Download.tsx` — добавлена кнопка «Попробовать» в веб-секцию
- **[landing]** `components/SeoContent.tsx` — новый компонент: intro-абзац, 6 карточек «Кому подходит», 4 процедуры с ценами, 7 FAQ (accordion), 10 районов Ташкента, CTA-карточка → `app.hamshirago.uz`
- **[landing]** `app/[lang]/page.tsx` — `<SeoContent />` добавлен между Features и Download
- `npm run build` = 0 ошибок

## 2026-03-08 — Landing SEO-фиксы (OG-картинка + html lang)

- **[landing]** `app/layout.tsx` — упрощён до минимума (только импорт `globals.css`); `<html>/<body>/<ThemeProvider>` перенесены в lang-layout
- **[landing]** `app/[lang]/layout.tsx` — `LangLayout` теперь возвращает `<html lang={lang}>` + `<body>` + `<ThemeProvider>`: Google видит правильный lang для `/ru` и `/uz`
- **[landing]** OG URL исправлен: `/og.png` (несуществующий файл) → `${SITE_URL}/${lang}/opengraph-image` (динамический генератор); исправлено в `openGraph.images` и `twitter.images`
- **[landing]** `themeColor: "#0d9488"` вынесен в `export const viewport: Viewport` (Next.js 16 API)
- `npm run build` = 0 ошибок, 0 предупреждений

---

> Хронологический лог завершённых фич и исправлений.

---

## 2026-03-08 — Web: category filter + reorder + BUG 15

- **[web]** `app/page.tsx` — добавлен горизонтальный скролл с фильтром по категориям (chips), локализация категорий UZ через `CATEGORY_UZ`
- **[web]** `app/orders/page.tsx` — добавлена кнопка "Заказать снова" (reorder) для DONE/CANCELED заказов, переход на `/order/location?serviceId=...`
- **[web]** `lib/api.ts`, `app/order/confirm/page.tsx` — BUG 15: убраны лишние поля `serviceTitle` и `priceAmount` из `CreateOrderDto` (бэкенд их не принимал)
- **[web]** `i18n/ru.json`, `i18n/uz.json` — добавлены ключи `allCategories`, `reorder`

---

## 2026-03-08 — Admin i18n + PWA + логотип

- **[admin]** `i18n/ru.json`, `i18n/uz.json` — добавлены все недостающие ключи для всех страниц: dashboard, medics, orders, clients, services, verification, reports, common.downloadApp
- **[admin]** `pages/Dashboard.tsx`, `Medics.tsx`, `Orders.tsx`, `Clients.tsx`, `Services.tsx`, `Verification.tsx`, `Reports.tsx` — все строки переведены через `t()`, добавлен `useTranslation`
- **[admin]** `components/AdminLayout.tsx` — добавлен PWA install button (`NavbarInstallButton` + `usePWAInstall`)
- **[admin]** Logo — кастомный логотип заменён во всех проектах (admin sidebar, landing Navbar/Footer/Hero, web/web-medic SplashScreen/auth/header); favicon обновлён через `app/icon.png` и явный `<link rel="icon">` в layout.tsx
- `npm run build` = 0 TypeScript ошибок

---

## 2026-03-08 — Этап 14: конфигурация Store публикации

- **[mobile]** `app.json` — добавлены `ios.bundleIdentifier: com.hamshirago.client`, `android.package`, `versionCode: 1`, `buildNumber: 1`, `owner`, `extra.eas.projectId` (placeholder)
- **[mobile]** `eas.json` — создан: профили `development` / `preview` (APK) / `production` (AAB, autoIncrement), `submit.production` с секциями android + ios
- **[medic]** `eas.json` — обновлён: добавлены `buildType`, `env`, `submit.production`
- Ручные шаги задокументированы в `tasks.md` (EAS init, credentials, сторы, OTA, скриншоты)

## 2026-03-08 — Этап 11: Telegram deep link + webhook + канал

- **[backend]** `telegram/telegram-bot.service.ts` — обработчик `/start {medicId}`: автоматически привязывает `chat_id` к медику, отправляет welcome-сообщение + ссылку на канал (`TELEGRAM_CHANNEL_LINK` env)
- **[backend]** `telegram/telegram-bot.controller.ts` — `POST /telegram/webhook` (публичный, Telegram присылает обновления)
- **[backend]** `telegram/telegram-bot.module.ts` — модуль, зарегистрирован в `AppModule`; webhook регистрируется автоматически при старте (`BACKEND_URL` env → `setWebhook`)
- **[medic]** `app/(tabs)/profile.tsx` — кнопка "Подключить" открывает `tg://resolve?domain=hamshirago_medic_bot&start={medicId}` (fallback: https); бот получает ID и сам привязывает аккаунт
- **[medic]** `app/(tabs)/profile.tsx` — баннер канала "Вы часть команды HamshiraGo!" → `t.me/hamshirago_medics`, виден когда Telegram подключён
- `tsc --noEmit` = 0 ошибок (backend + medic)
- **Env переменные для Railway**: `BACKEND_URL` (напр. `https://hamshirago-api.railway.app`), `TELEGRAM_CHANNEL_LINK` (ссылка на канал)

## 2026-03-08 — Этап 10: платный режим (backend + medic)

- **[backend]** `app-settings/` — новый модуль: entity `app_settings` (singleton row), `AppSettingsService.isPaidMode()`, `GET /settings` (публичный), `PATCH /admin/settings` (AdminGuard)
- **[backend]** `orders.service.ts` — `acceptOrder`: если `isPaidMode=true`, проверяет `balance >= platformFee`, списывает комиссию, иначе 402 INSUFFICIENT_WALLET
- **[backend]** `orders.service.ts` — DONE: если `isPaidMode=true`, кредитует полный `netPrice` (комиссия уже списана при accept); иначе `netPrice - fee` как раньше
- **[medic]** `app/(tabs)/profile.tsx` — баланс кошелька вынесен в отдельную карточку, всегда виден независимо от рейтинга
- `tsc --noEmit` = 0 ошибок (backend + medic)

## 2026-03-08 — Этап 7: сплэш-экран mobile + medic

- **[mobile]** `components/SplashOverlay.tsx` — кастомный сплэш: логотип (icon.png), "HamshiraGo", "by tezcode.ai"; фон `#f8fafc`
- **[medic]** `components/SplashOverlay.tsx` — аналог, фон `#0d9488` (зелёный), текст белый
- **[mobile]** `app/_layout.tsx` — после загрузки шрифтов нативный сплэш скрывается, показывается `SplashOverlay` на 1.5s, затем приложение
- **[medic]** `app/_layout.tsx` — та же логика
- `tsc --noEmit` = 0 ошибок

## 2026-03-08 — Этап 12: POST /client-errors (backend)

- **[backend]** `client-errors/entities/client-error.entity.ts` — новая таблица `client_errors` (userId, appType, screen, message, stacktrace, meta)
- **[backend]** `client-errors/dto/create-client-error.dto.ts` — DTO с валидацией (все поля опциональны)
- **[backend]** `client-errors/client-errors.service.ts` — метод `save(dto)`
- **[backend]** `client-errors/client-errors.controller.ts` — `POST /client-errors` публичный, без авторизации, throttle 20 req/min
- **[backend]** `client-errors/client-errors.module.ts` — модуль, зарегистрирован в `AppModule`
- `tsc --noEmit` = 0 ошибок

---

## 2026-03-08 — Этап 9: пуш-уведомления + персистентное уведомление

- **[backend]** `orders.service.ts` — добавлены `MEDIC_PUSH_MESSAGES` + метод `notifyMedic()`: медик получает push при отмене клиентом (CANCELED) и подтверждении DONE
- **[mobile]** `app/order/track.tsx` — персистентное локальное уведомление при активном заказе: появляется при уходе в фон, обновляется при смене статуса, исчезает при DONE/CANCELED. Использует `AppState` + `expo-notifications` с фиксированным `identifier`
- **[medic]** `app/order/[id].tsx` — персистентное локальное уведомление при активном заказе (аналог mobile); добавлен WebSocket-слушатель `order_status` — медик видит статус CANCELED в реальном времени, если клиент отменил заказ
- `tsc --noEmit` = 0 ошибок (backend + mobile + medic)

---

## 2026-03-08 — Этап 8: i18n услуг в mobile

- **[mobile]** `app/service/[id].tsx` — добавлен `useLanguage()`, показывает `titleUz`/`descriptionUz` если язык UZ; все строки интерфейса через `useTranslation()` (service.cost, service.duration, service.order, service.notFound)
- **[mobile]** `app/order/confirm.tsx` — добавлен `useLanguage()`, `service.title` → `titleUz` если UZ; все строки через i18n (confirm.title, confirm.address, confirm.phone, confirm.duration, confirm.total, confirm.submit, confirm.cancel, confirm.discountFirst, confirm.basePrice)
- **[mobile]** `components/ServiceCard.tsx` — "мин" → `t('service.min')` (RU: "мин" / UZ: "daq")
- **[mobile]** `i18n/ru.json` + `i18n/uz.json` — добавлены секции `service` и `confirm`
- `tsc --noEmit` = 0 ошибок

---

## 2026-03-08 — Этап 6: фото профиля медика

- **[backend]** `medic.entity.ts` — добавлена колонка `profilePhotoUrl` (nullable varchar 512)
- **[backend]** `medics.service.ts` — `profilePhotoUrl` добавлен в `toAuthResponse()` и `getProfile()`, добавлен метод `saveProfilePhotoUrl()`
- **[backend]** `medics.controller.ts` — новый endpoint `POST /medics/profile-photo` (FileInterceptor, single file, Cloudinary upload в папку `hamshirago/medic-profiles`)
- **[backend]** `orders.service.ts` — блокировка `acceptOrder` если `profilePhotoUrl` не загружен (`ForbiddenException`)
- **[medic]** `AuthContext.tsx` — `profilePhotoUrl: string | null` добавлен в интерфейс `MedicUser`
- **[medic]** `app/(tabs)/profile.tsx` — аватар медика заменён на фото профиля (если есть), нажатие открывает галерею для загрузки, индикатор загрузки, `expo-image-picker`
- **[medic]** `app/(tabs)/index.tsx` — баннер "Добавьте фото профиля" для одобренных медиков без фото (ведёт на профиль)
- **[mobile]** `app/order/track.tsx` — фото медика в карточке "Ваш медик" и на маркере карты (через `Image`, если `profilePhotoUrl` есть)
- `tsc --noEmit` = 0 ошибок (backend + mobile + medic)

---

## 2026-03-08 — Этап 5: баги + кастомные модалки

- **[medic]** BUG-A1: Статы профиля переведены через i18n — `profile.statExperience/statCompleted/statRating/statBalance` (ru + uz) вместо хардкода на русском (`medic/app/(tabs)/profile.tsx`, `medic/i18n/*.json`)
- **[mobile]** BUG-A2: UI звёзд при оценке заказа — `starsRow` теперь `justifyContent: center` + `gap: 12`; убран `marginTop: -8` у hint; в блоке "Ваша оценка" звёзды выше рейтинга отображаются `star-o` (outline) а не закрашенными (`mobile/app/order/track.tsx`)
- **[mobile/medic]** Создан компонент `AppModal` — кастомная замена системного `Alert.alert` (анимированный modal, кнопки cancel/destructive/default, overlay tap для закрытия) (`mobile/components/AppModal.tsx`, `medic/components/AppModal.tsx`)
- **[mobile]** `AppModal` внедрён: logout confirm в профиле клиента, отмена заказа в track.tsx
- **[medic]** `AppModal` внедрён: logout confirm, Telegram disconnect confirm, подтверждение принятия заказа
- **[medic]** i18n: добавлен ключ `dispatch.confirmAccept` (ru + uz)
- `tsc --noEmit` = 0 ошибок (mobile + medic)

---

## 2026-03-07 — Wallet system портирован в web-medic

- **[web-medic]** `lib/api.ts` — добавлен обработчик 402 INSUFFICIENT_WALLET: создаёт Error с полями `required` и `current`
- **[web-medic]** `app/page.tsx` — добавлены состояние `walletModal`, обработка в `acceptOrder` и `acceptInvite`, модальное окно с текущим балансом и требуемой суммой
- **[web-medic]** `i18n/ru.json`, `i18n/uz.json` — добавлена секция `wallet.*` с ключами `insufficientTitle`, `insufficientDesc`, `current`, `required`, `contactAdmin`, `close`

## 2026-03-07 — Wallet system доработка (medic modal + admin UI)

- **[medic]** `app/(tabs)/index.tsx` — заменён `Alert.alert` на полноценный `Modal` при ошибке INSUFFICIENT_WALLET: показывает текущий баланс, требуемую сумму, кнопку «Связаться с администратором» (открывает Telegram), кнопку «Закрыть»
- **[medic]** `i18n/ru.json`, `i18n/uz.json` — добавлены ключи `wallet.insufficientDesc`, `wallet.current`, `wallet.required`, `wallet.contactAdmin`, `wallet.close`
- **[admin]** `lib/api.ts` — добавлено поле `walletBalance` в `AdminMedic`, добавлена функция `topupMedicWallet(id, amount)`
- **[admin]** `pages/Medics.tsx` — добавлена колонка «Кошелёк» с балансом (красный если < 10 000 UZS), кнопка «Пополнить» → Dialog с вводом суммы и подтверждением; добавлена карточка «Низкий кошелёк» в статистику
- `tsc --noEmit` = 0 ошибок (admin + medic)

## 2026-03-06 — Railway deployment fix

- **[backend]** Created `tsconfig.build.json` excluding `e2e/`, `test/`, `jest.config.ts`, `playwright.config.ts` — TypeScript now infers `rootDir=src`, outputting `dist/main.js` (not `dist/src/main.js`)
- **[backend]** `railway.toml` `buildCommand` changed from `npm run build` to `npm install && npm run build` — ensures devDependencies (`@nestjs/cli`) are available at build time

## 2026-03-06 — Landing SEO (bilingual RU + UZ, Uzbekistan #1)

- **[landing]** App Router i18n: `/` → redirect `/ru`; созданы `/app/[lang]/layout.tsx` и `/app/[lang]/page.tsx` с `generateStaticParams` — Google теперь раздельно индексирует `/ru` и `/uz`
- **[landing]** `generateMetadata` per lang — уникальные title/description/keywords для каждого языка (RU: «медик на дому Ташкент», UZ: «uyda hamshira Toshkent» и т.д.)
- **[landing]** hreflang alternates: `ru`, `ru-UZ`, `uz`, `uz-UZ`, `x-default` — Google Search Console будет правильно направлять трафик
- **[landing]** JSON-LD structured data: `MedicalBusiness` + `FAQPage` + `MobileApplication` для каждого языка (rich snippets в выдаче)
- **[landing]** `app/sitemap.ts` — `/sitemap.xml` с oboma URL + language alternates
- **[landing]** `app/robots.ts` — `/robots.txt` с ссылкой на sitemap
- **[landing]** `app/[lang]/opengraph-image.tsx` — автогенерация OG-картинки 1200×630 для каждого языка
- **[landing]** `LangContext` — добавлен `initialLang` prop для SSR-инициализации языка
- **[landing]** `Navbar` — переключатель языка теперь делает `router.push('/ru')` / `router.push('/uz')` — URL отражает язык
- `npm run build` — 0 ошибок, `/ru` и `/uz` статически пресгенерированы

## 2026-03-06 — Web-medic bug fixes (3 консольных ошибки)

- **[web-medic]** `app/page.tsx` — убран `navigator.vibrate(...)` (Chrome блокирует без user gesture → бесполезный шум в консоли); добавлен `reconnectionAttempts: 5` в WebSocket
- **[web-medic]** `app/order/[id]/page.tsx` — добавлен `reconnectionAttempts: 5` в WebSocket
- **[web-medic]** `components/Map.tsx` — исправлен Leaflet `_leaflet_pos` TypeError: в async `import("leaflet").then(...)` добавлен `cancelled` флаг + `return () => { cancelled = true }` для обоих useEffect (medic position, route); `fitBounds` обёрнут в try-catch (защита от вызова после unmount при zoom-анимации)

## 2026-03-06 — Web bug fixes (Etap 3: W4, W5)

- **[web]** `app/orders/[id]/page.tsx` — W4: добавлен `reconnectionAttempts: 5` в `io()` опции, WebSocket больше не переподключается бесконечно
- **[web]** `app/order/confirm/page.tsx` — W5: добавлен `discountError` state; `.catch(() => {})` заменён на `.catch(() => { setDiscountError(true); })`; в UI показывается предупреждение «Не удалось проверить скидку» (amber цвет, не блокирующее); добавлены переводы `confirm.discountCheckFailed` в `i18n/ru.json` и `i18n/uz.json`

## 2026-03-06 — Admin bug fixes (Etap 2: A2, A3, A6)

- **[admin]** `Dashboard.tsx` — A2: параллельный `Promise.all` заменён на последовательный цикл с лимитом `REVENUE_LIMIT=500` заказов; A6: добавлен error banner с `AlertCircle` + кнопка «Повторить»; polling снижен с 30 сек до 2 мин (`REFRESH_MS=120_000`); добавлены константы `REVENUE_LIMIT`, `CHART_LIMIT`
- **[admin]** `Reports.tsx` — A3: `Promise.all` N параллельных страниц заменён на последовательный цикл с лимитом `ORDER_LIMIT=500`; добавлен `error` state + error banner с `AlertCircle`/`RefreshCw` + кнопка «Повторить»
- **[web]** `order/confirm/page.tsx` — W1: удалён `console.log("[confirm] sending order body:", ...)` с персональными данными
- **[admin]** `lib/api.ts` — A1: `API_BASE` читается из `import.meta.env.VITE_API_URL` с fallback на production URL

## 2026-03-06 — B6/B9/M3/M4 fixes + call patient feature

- **[backend]** B6: rate limit `/auth/login` и `/medics/login` → 5 req / 15 min (`ttl: 900_000, limit: 5`) вместо 10/min
- **[backend]** B9: `findNearby` — SQL bounding box фильтр (lat/lng ±delta) до загрузки в память вместо `find({ where: { isOnline: true } })` на всю таблицу (`medics.service.ts`)
- **[medic]** M3: `reconnectionAttempts: 10` добавлен в socket.io конфиг (`medic/app/order/[id].tsx`)
- **[medic]** M4: подтверждено — `STATUS_LABEL` уже заменён на `t('orders.status.*')` ранее
- **[medic]** Фича «Позвонить пациенту» — кнопка рядом с телефоном клиента в карточке адреса; `Linking.openURL('tel:...')`; видна только в активных статусах; i18n ключ `orders.callPatient` (RU + UZ)
- **[mobile]** Скрыт телефон медика из карточки «Ваш медик» на экране клиента (`mobile/app/order/track.tsx`) — `order.medic.phone` больше не отображается
- `tsc --noEmit` = 0 ошибок (backend + medic + mobile)

## 2026-03-06 — Medic map: OSRM route + loading overlay

- **[medic]** `OrderInviteModal.tsx` — заменена жёлтая пунктирная линия на реальный дорожный маршрут через OSRM API; добавлен `routeLoading` state + лоадинг-оверлей «Строим маршрут...» поверх карты; fallback на прямую линию если OSRM недоступен
- **[medic]** `app/order/[id].tsx` — добавлен `routeLoading` state; `fetchRoute` теперь показывает лоадинг-оверлей пока маршрут строится; `finally` гарантирует снятие лоадинга при ошибке/тайм-ауте
- `tsc --noEmit` = 0 ошибок

## 2026-03-06 — Backend security fixes (tech lead feedback)

- **[backend]** #5 fix: `initiatePayment` теперь считает `netPrice = priceAmount - discountAmount` вместо `priceAmount` (`payments.service.ts:28`)
- **[backend]** #8 fix: Swagger/OpenAPI открывается только при `NODE_ENV !== 'production'` (`main.ts:53-62`)
- **[backend]** #6 fix: WebSocket CORS `origin: true` → явный список allowed origins из `main.ts` (`order-events.gateway.ts:27-29`)
- **[backend]** #2 fix: `updateStatusByMedic` — атомарный `UPDATE ... WHERE status = :currentStatus`, проверка `affected > 0` вместо `findOne → save` (`orders.service.ts`)
- **[backend]** #3 fix: переход DONE + `addBalance` в одной транзакции через `DataSource.transaction()` + `manager.increment(Medic)` (`orders.service.ts`)
- **[backend]** #1 fix: `rateOrder` — атомарный `UPDATE ... WHERE clientRating IS NULL` устраняет гонку двойного рейтинга (`orders.service.ts`)
- **[backend]** #4 fix: `initiatePayment` — SELECT FOR UPDATE (`pessimistic_write`) в транзакции при upsert payment record (`payments.service.ts`)
- **[backend]** #9 fix: `dispatch.service.ts` — константа `MAX_DISPATCH_ATTEMPTS = 10`, проверка в `advanceDispatch` до выбора следующего медика (`dispatch.service.ts`)
- `tsc --noEmit` = 0 ошибок

## 2026-03-06 — Landing dark/light mode + web i18n

- **[landing]** Dark / Light mode — CSS vars (`--bg1..4`, `--card-bg/border`, `--text-primary..5`, `--hero-from/to`, `--phone-bg`, `--navbar-scrolled-bg`), `ThemeContext.tsx` с `localStorage("hamshira-theme")` + `document.documentElement.setAttribute("data-theme", ...)`, `ThemeProvider` в `layout.tsx`, `data-theme="dark"` на `<html>` (антифлеш), `IconSun`/`IconMoon` в `Icons.tsx`, кнопка переключения в `Navbar.tsx`, все хардкоженные цвета заменены на CSS vars в `Hero`, `HowItWorks`, `Services`, `Features`, `Download`, `Footer`; `.glass` обновлён на vars; Tailwind-overrides для light mode (`.text-white`, `.border-white\/8`, etc.); `npm run build` — 0 ошибок

## 2026-03-05 (сессия 4)

- **[web/web-medic/admin]** Полный i18n (RU + UZ) для всех трёх web-приложений — созданы i18n инфраструктура для admin (`admin/src/i18n/ru.json`, `uz.json`, `index.ts`, `context/LanguageContext.tsx`); все страницы и компоненты переведены через `useTranslation()`: `web/app/auth/page.tsx`, `web/app/page.tsx`, `web/app/profile/page.tsx`, `web/app/orders/page.tsx`, `web/app/orders/[id]/page.tsx`, `web/app/order/confirm/page.tsx`, `web/app/order/location/page.tsx`, `web-medic/app/auth/page.tsx`, `web-medic/app/page.tsx`, `web-medic/app/profile/page.tsx`, `web-medic/app/order/[id]/page.tsx`; `admin/src/pages/Login.tsx`, `admin/src/components/AdminSidebar.tsx`, `admin/src/components/AdminLayout.tsx`; LanguageProvider добавлен в layout.tsx web/web-medic и App.tsx admin; language switcher в хедере admin, web (главная + auth + профиль), web-medic (профиль + auth)
- **[mobile]** i18n auth.tsx — добавлен `useTranslation`; все ~17 хардкодных строк (ошибки, лейблы, кнопки, тэглайн) заменены на `t('auth.*')`; в `ru.json`/`uz.json` добавлены ключи `auth.tagline`, раздел `payment` (pay, choosePlatform, cancel, paid, errorFetch). `tsc --noEmit` = 0 ошибок (`mobile/app/auth.tsx`, `mobile/i18n/ru.json`, `mobile/i18n/uz.json`)
- **[mobile]** Payment UI в track.tsx — добавлен `expo-web-browser`; state `payStatus`; при DONE фетч `GET /payments/:orderId/status`; функция `handlePay` → Alert Payme/Click → `WebBrowser.openBrowserAsync`; кнопка «Оплатить» / текст «Оплачено ✓» перед кнопкой «К моим заказам»; стили `payBtn`/`payBtnText`/`payPaid` (`mobile/app/order/track.tsx`)
- **[medic]** i18n расширение — в `ru.json`/`uz.json` добавлены разделы `dispatch` (newOrder, accept, decline), ключи в `orders` (active, history, earnings, commission, netEarnings, openMap, noLocation, completeOrder, startService, arrived, onTheWay, accepted), раздел `verification` (11 ключей), ключи в `common` (locationPermission, alwaysAllow, openSettings, permissionDenied); обновлён `auth.errorDuplicate`, добавлены `auth.tagline`, `auth.experienceYears`, `auth.errorNameRequired` (`medic/i18n/ru.json`, `medic/i18n/uz.json`)
- **[medic]** i18n auth.tsx — все хардкодные строки заменены на `t()`; поле «Опыт работы» через `t('auth.experienceYears')` (`medic/app/auth.tsx`)
- **[medic]** i18n index.tsx — `NewOrderBanner.Принять` → `t('dispatch.accept')`; `AvailableOrderCard.Принять` → `t('dispatch.accept')`; строки empty/error через t() (`medic/app/(tabs)/index.tsx`)
- **[medic]** i18n my-orders.tsx — убран статичный `STATUS_LABEL`; статус через `t('orders.status.*')`; «Активные»/«История» через t(); empty через t() (`medic/app/(tabs)/my-orders.tsx`)
- **[medic]** i18n _layout.tsx — Alert геолокации через `t('common.locationPermission')` / `t('common.alwaysAllow')` / `t('common.openSettings')` (`medic/app/_layout.tsx`)
- **[medic]** i18n order/[id].tsx — убран `STATUS_LABEL`; `NEXT_STATUS` → `NEXT_STATUS_MAP` (labelKey вместо label); все кнопки, earnings, карта через t(); `tsc --noEmit` = 0 ошибок (`medic/app/order/[id].tsx`)
- **[medic]** i18n verification.tsx — статус-баннер, причина отказа, лейблы фото, кнопка submit через t() (`medic/app/verification.tsx`)

## 2026-03-05 (сессия 3)

- **[mobile]** Плавная интерполяция маркера медика — `AnimatedMedicMarker` через `Marker.Animated` / `createAnimatedComponent`; `AnimatedRegion.timing()` 900 мс для socket-событий, 0 мс для REST-polling; маркер инициализируется при первой позиции, затем плавно скользит к каждой новой (`mobile/app/order/track.tsx`)

## 2026-03-05 (сессия 2)

- **[mobile/medic]** Fix AsyncStorageError + language picker screen — заменён `@react-native-async-storage/async-storage` (сломан в Expo Go) на `expo-secure-store` в `LanguageContext.tsx`; добавлены `isLoaded`/`isFirstLaunch` в контекст; создан экран `app/language-picker.tsx` с флагами 🇺🇿/🇷🇺; `_layout.tsx` обновлён — при первом запуске редиректит на `/language-picker`, затем на `/auth`

## 2026-03-05

- **[backend]** Платёжная система Payme + Click — создан модуль `backend/src/payments/`: `payment.entity.ts` (UUID PK, orderId FK, provider, status, amount, providerTransactionId, providerState, performTime, cancelTime, reason), `payme.service.ts` (6 JSON-RPC методов: CheckPerform/Create/Perform/Cancel/Check/GetStatement; Basic Auth validation; tiyin↔UZS конвертация), `click.service.ts` (prepare + complete webhooks; MD5 signature check), `payments.service.ts` (initiatePayment, getPaymentStatus), `payments.controller.ts` (5 endpoints: POST /:orderId/initiate, GET /:orderId/status, POST /payme, POST /click/prepare, POST /click/complete); `PaymentsModule` добавлен в `AppModule`; `.env.example` дополнен переменными PAYME_*/CLICK_*/APP_URL. `tsc --noEmit` = 0 ошибок, 15/15 тестов зелёные.

## 2026-03-04 (сессия 3)

- **[backend]** TypeScript strict mode — включён `strict: true` в `backend/tsconfig.json`; исправлены все 109 ошибок TS2564 (`strictPropertyInitialization`) — добавлен `!` (definite assignment assertion) на все class-level свойства в 12 entity файлах, 7 DTO файлах, 1 gateway; `tsc --noEmit` = 0 ошибок, 15/15 тестов зелёные

## 2026-03-04 (сессия 2)

- **[backend]** i18n поля в Service entity — добавлены nullable колонки `titleUz`, `descriptionUz`, `categoryUz`; seed обновлён с переводами на узбекский + back-fill для существующих записей (`backend/src/services/entities/service.entity.ts`, `backend/src/services/services.seed.ts`)
- **[mobile]** i18n инфраструктура — установлены `i18next`, `react-i18next`, `@react-native-async-storage/async-storage`; созданы `i18n/index.ts`, `i18n/ru.json`, `i18n/uz.json` (tabs, auth, profile, order, common ключи); `context/LanguageContext.tsx` с персистентностью через AsyncStorage; обёртка в `_layout.tsx`
- **[mobile]** Переводы UI — `tabs/_layout.tsx` (переводы вкладок), `index.tsx` (баннер, категории, заголовки услуг через titleUz), `profile.tsx` (все строки + language picker — кнопки 🇷🇺/🇺🇿)
- **[medic]** i18n инфраструктура — те же пакеты + `i18n/ru.json`, `i18n/uz.json`, `context/LanguageContext.tsx`, обёртка в `_layout.tsx`
- **[medic]** Переводы UI — `tabs/_layout.tsx` (переводы вкладок), `profile.tsx` (logout confirm + language picker)

## 2026-03-04

- **[backend]** Swagger/OpenAPI — установлен `@nestjs/swagger` + `swagger-ui-express`, настроен `SwaggerModule.setup('api/docs')` в `main.ts`; `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse` на auth/orders/medics контроллерах; `@ApiProperty` на всех DTO полях (`backend/src/main.ts`, `backend/src/auth/`, `backend/src/orders/`)
- **[backend]** Jest unit тесты — установлен `jest` + `ts-jest` + `@nestjs/testing` + `supertest` + `ts-node`; создан `jest.config.ts`; добавлены скрипты `test` / `test:cov` в `package.json`; написаны `auth.service.spec.ts` (4 теста) и `orders.service.spec.ts` (8 тестов) — 15 тестов, все зелёные (`backend/src/auth/`, `backend/src/orders/`)
- **[devops]** GitHub Actions CI — создан `.github/workflows/ci.yml`; два job-а: `backend` (npm ci → build → test) и `typecheck` (tsc --noEmit); триггер push/PR на main

## 2026-03-03 (сессия 6)

- **[devops]** Исправлены 404 ошибки на статических ассетах Railway — добавлены multi-stage `Dockerfile` и `railway.toml` для `web/` и `web-medic/`: multi-stage build (deps → builder → runner), правильное копирование `.next/static` и `public` в standalone директорию, `builder = "DOCKERFILE"` в railway.toml

## 2026-03-03 (сессия 5)

- **[medic]** `order/[id].tsx` — добавлена встроенная карта маршрута (240px) для статусов ASSIGNED/ACCEPTED/ON_THE_WAY/ARRIVED: маркер клиента 🏠 синий, маркер медика 🧑‍⚕️ зелёный, OSRM маршрут (зелёная линия, 8с таймаут, 12с троттл), `fitToCoordinates` для авто-фокуса при обновлении позиции медика; в `emitCurrentLocation` добавлен `setMedicPos` для обновления карты; отдельный location fetch при смене статуса (`medic/app/order/[id].tsx`)

## 2026-03-03 (сессия 4)

- **[mobile]** `track.tsx` — маркер медика зелёный (`#16a34a`) вместо красного; маршрут OSRM: AbortController таймаут 8с, троттл 20с→12с, маршрут не запрашивается во время CREATED (только после ASSIGNED+), сброс routeCoords при переходе в ASSIGNED; зелёная линия маршрута после поиска; принудительная оценка: `beforeRemove` + `BackHandler` блокируют выход до оценки, кнопка «К моим заказам» скрыта пока не поставлена оценка (`mobile/app/order/track.tsx`)

## 2026-03-03 (сессия 3)

- **[mobile]** `track.tsx` — таймер отсчёта в диспетч-баннере (`formatElapsed`), пульсирующий маркер клиента (синий, `Animated.loop`) во время поиска медика, кастомные маркеры с эмодзи (🏠 синий = клиент, 🩺 красный/оранжевый = медик), карта теперь показывается и без `medicLocation` (пока медик не найден), легенда маркеров (`mobile/app/order/track.tsx`)
- **[medic]** Установлен `react-native-maps` в medic-приложение; `OrderInviteModal.tsx` — добавлена мини-карта 170px (клиент 🏠 синий, медик 🩺 красный), расстояние через haversine, GPS медика через `expo-location`, пунктирная линия клиент↔медик (`medic/components/OrderInviteModal.tsx`)
- **[fix]** WebSocket не подключался в Expo Go — Expo Go отправляет `Origin: exp://...`, заблокировано CORS allowlist. Исправлено: `cors: { origin: true }` в `@WebSocketGateway()`; polling-fallback `['websocket', 'polling']` во всех Socket.IO клиентах (`backend/`, `mobile/`, `medic/`)

## 2026-03-03

- **[backend]** Yandex Taxi-style push-based dispatch: создана entity `DispatchAttempt` (`dispatch_attempts`), добавлен `dispatchStatus` (nullable varchar) в `Order`, создан `DispatchService` (in-memory timers, 60s инвайт, авто-отбор медика по расстоянию/radius 15km, recovery on restart, Telegram admin alerts, auto-cancel при 0 медиках), добавлен `findCandidatesForDispatch` в `MedicsService`, обновлён `OrderEventsGateway` (personal `medic:{id}` room, `emitDispatchInvite`, `emitDispatchInviteExpired`, `emitDispatchUpdate`), обновлён `OrdersService` (убран pull-broadcast, добавлен `startDispatch`/`cancelDispatch`/`declineOrder`), добавлен `POST /orders/:id/decline` в контроллер, обновлён `OrdersModule` (`backend/`)
- **[mobile]** Убраны nurse selection UI из `location.tsx` и `confirm.tsx`; в `track.tsx` добавлен `dispatch_update` listener, dispatch state banner («Связываемся с [Имя]...» / «Медики заняты, продолжаем поиск...»), маркер кандидата на карте (`mobile/app/order/`)
- **[medic]** Создан `OrderInviteModal.tsx` — полноэкранный модал с таймером 60s, деталями заказа, кнопками Accept/Decline; обновлён `index.tsx` — добавлены слушатели `dispatch_invite` (показывает модал + haptic) и `dispatch_invite_expired` (скрывает модал) (`medic/components/`, `medic/app/(tabs)/`)
- **[web]** Dispatch migration — убраны nurse selection UI из `location/page.tsx` и `confirm/page.tsx`; добавлен `dispatch_update` listener с 3 состояниями (searching/contacting/no_medics) на `orders/[id]/page.tsx`
- **[web-medic]** Dispatch migration — добавлен `medicApi.orders.decline(id)`, fullscreen invite overlay с таймером 60 сек, listeners `dispatch_invite`/`dispatch_invite_expired` (`web-medic/app/page.tsx`, `web-medic/lib/api.ts`)
- **[admin]** Логотип в сайдбаре — иконка `Stethoscope` (lucide-react), форма `rounded-lg` (`admin/src/components/AdminSidebar.tsx`)

## 2026-03-02 (сессия 2)

- **[web, web-medic]** Единый favicon — `app/icon.tsx` обновлён на букву **H** белым на бирюзовом градиенте `#0d9488→#0f766e` (было: крест у web, силуэт медсестры у web-medic) (`web/app/icon.tsx`, `web-medic/app/icon.tsx`)
- **[admin]** Исправлен favicon — добавлен `<link rel="icon" href="/favicon.ico">` в `admin/index.html` (было: не подключён, браузер показывал emoji-заглушку)
- **[admin]** Добавлен кастомный SVG favicon `admin/public/icon.svg` — буква H на бирюзовом градиенте `#0d9488→#0f766e`, единый стиль с web/web-medic; `index.html` переключён на `type="image/svg+xml"`

## 2026-03-02

- **[config]** Добавлены Claude sub-agents в `.claude/agents/` — 6 специализированных агентов: backend-architect, mobile-app-builder, api-tester, playwright-runner, sprint-prioritizer, docs-syncer
- **[tests]** Настроен Playwright API testing: `tests/package.json`, `tests/playwright.config.ts`, `tests/api/health.spec.ts`, `tests/api/auth.spec.ts`, `tests/api/orders.spec.ts`

## 2026-03-02 (Этап 4)

- **[backend]** BUG 1: Атомарный `acceptOrder` — `UPDATE WHERE status='CREATED'`, если `affected=0` → `BadRequestException`; исключает race condition при двойном принятии заказа (`backend/src/orders/orders.service.ts`)
- **[backend]** BUG 16: Удаление устаревших Web Push подписок через `In()` вместо массива `{ endpoint }` объектов — быстрее и корректнее (`backend/src/realtime/web-push.service.ts`)
- **[backend]** BUG 17: Добавлен `await` к `pushService.send()` и `webPushService.sendToSubscriber()` в `notifyClient` — ошибки больше не теряются молча (`backend/src/orders/orders.service.ts`)
- **[backend]** BUG 18: `JwtPayload` дополнен ролью `'admin'`; в `validate()` добавлена admin-ветка — возвращает `{ id, role: 'admin' }` без DB-запроса (`backend/src/auth/strategies/jwt.strategy.ts`)
- **[backend]** BUG 19: Тип `discountAmount` исправлен с `number` на `number | null` в соответствии с `nullable: true` в колонке (`backend/src/orders/entities/order.entity.ts`)
- **[backend]** BUG 35: Добавлен `unique: true` на колонку `phone` в `User` и `Medic` entity — DB теперь гарантирует уникальность телефона (`user.entity.ts`, `medic.entity.ts`)
- **[backend]** BUG 36: `adminCancelOrder` теперь передаёт в `notifyClient` перезагруженный из БД объект заказа (с relations), а не стейл-данные (`backend/src/orders/orders.service.ts`)
- **[backend]** BUG 37: Добавлен TypeORM-трансформер на колонку `balance` (`decimal(12,2)`) — `from: parseFloat(String(v))`, устраняет несоответствие типа string/number (`backend/src/medics/entities/medic.entity.ts`)
- **[mobile]** BUG 21: Файл `mobile/app/order/track.tsx` существует — маршрут `/order/track` корректен, баг не актуален
- **[mobile]** BUG 22+23: `fetchLocation` убран из `fetchNearbyMedics`-зависимости (устраняет дублирующий вызов); `useEffect` теперь имеет `[fetchLocation]` в deps — убирает lint-предупреждение и потенциальный цикл (`mobile/app/order/location.tsx`)
- **[mobile]** BUG 24: Главный экран показывает ошибку с кнопкой «Повторить» вместо пустого экрана при сбое загрузки услуг (`mobile/app/(tabs)/index.tsx`)
- **[medic]** BUG 25: Экран доступных заказов показывает ошибку с кнопкой «Повторить» вместо тихого ignore (`medic/app/(tabs)/index.tsx`)

## 2026-03-02 (Этап 3)

- **[backend]** BUG 6+7: Добавлена валидация телефона `@Matches(/^\+998\d{9}$/)` в 4 DTO (RegisterClientDto, LoginDto, RegisterMedicDto, LoginMedicDto); добавлен `@IsOptional()` на `name` в RegisterClientDto (`backend/src/auth/dto/`, `backend/src/medics/dto/`)
- **[backend]** BUG 12: Создан `AdminLoginDto` с валидацией, подключён в `adminLogin` вместо сырого `body` (`backend/src/auth/dto/admin-login.dto.ts`, `backend/src/auth/auth.controller.ts`)
- **[backend]** BUG 5: Замена прямого сравнения паролей на `crypto.timingSafeEqual()` для защиты от timing-атак в admin login (`backend/src/auth/auth.service.ts`)
- **[medic]** BUG 8: Исправлен неправильный async-паттерн в `refreshProfile` — async apiFetch вынесен из setState callback (`medic/context/AuthContext.tsx`)
- **[mobile]** BUG 20: Установлен `expo-secure-store`, токен и профиль сохраняются между перезапусками приложения, `isLoading` блокирует редирект до завершения чтения SecureStore (`mobile/context/AuthContext.tsx`, `mobile/app/_layout.tsx`)
- **[medic]** BUG 20: Аналогично — SecureStore персистентность, medic + token в зашифрованном хранилище (`medic/context/AuthContext.tsx`, `medic/app/_layout.tsx`)

## 2026-03-02 (Этап 2)

- **[mobile]** Окно оценки медика теперь появляется при завершении заказа — при `order_status=DONE` вызывается `fetchOrder()` для обновления полных данных (включая `order.medic`) перед отключением сокета (`mobile/app/order/track.tsx`)
- **[medic]** Список "Мои заказы" авто-обновляется при переключении на таб — добавлен `useFocusEffect` аналогично экрану доступных заказов (`medic/app/(tabs)/my-orders.tsx`)
- **[mobile/medic]** Улучшены сообщения об ошибках при логине — маппинг английских сообщений бэкенда на читаемый русский текст в catch-блоке (`mobile/app/auth.tsx`, `medic/app/auth.tsx`)

## 2026-03-02

- **[web, web-medic, admin]** 12.3 Sentry error tracking — добавлен `@sentry/nextjs` (web/web-medic) и `@sentry/react` (admin); `sentry.client.config.ts` + `sentry.server.config.ts` + `withSentryConfig` в `next.config.ts`; `app/error.tsx` отправляет ошибки через `captureException`; admin `ErrorBoundary.tsx` отправляет в Sentry; Sentry init в `main.tsx`; DSN через `NEXT_PUBLIC_SENTRY_DSN` / `VITE_SENTRY_DSN` (пустой = отключён); добавлен `admin/.env.example`
- **[web-medic]** Применены изменения бэкенда: `lastSeenAt`, авто-оффлайн после 5ч — добавлен `onlineDisabledReason`, баннер INACTIVE_5H на дашборде (`web-medic/lib/api.ts`, `web-medic/app/page.tsx`)
- **[web-medic]** Исправлен BUG-14: загрузка заказа заменена с `my()+find()` на прямой `GET /orders/:id` (`web-medic/app/order/[id]/page.tsx`, `web-medic/lib/api.ts`)
- **[web-medic]** Добавлен OSRM роутинг на карте заказа медика — маршрут по дорогам с Polyline, маркеры медика и клиента, обновление каждые 30с (`web-medic/app/order/[id]/page.tsx`, `web-medic/components/Map.tsx`)
- **[web]** Исправлен BUG-27: `orders.list()` теперь корректно извлекает `.data` из пагинированного ответа (`web/lib/api.ts`)
- **[web]** Исправлен BUG-28: WebSocket отписка при unmount — добавлен `unsubscribe_order` перед `disconnect()` (`web/app/orders/[id]/page.tsx`)
- **[web]** Исправлен BUG-29: `confirmDone` заменил дырявый `updateStatus` — жёстко зафиксирован статус `DONE` (`web/lib/api.ts`)
- **[web]** Исправлен редирект после оценки заказа — клиент возвращается на `/` через 1.5с (`web/app/orders/[id]/page.tsx`)
- **[web, web-medic]** Исправлен BUG-26: `BASE_URL` вынесен в `NEXT_PUBLIC_API_URL` env var (`web/lib/api.ts`, `web-medic/lib/api.ts`, `web/lib/webPush.ts`, `web-medic/lib/webPush.ts`)
- **[web, web-medic]** Добавлены `.env.example` файлы (`web/.env.example`, `web-medic/.env.example`)
- **[admin]** Исправлен BUG-30/31: выручка и график за 7 дней загружают ВСЕ страницы заказов через параллельную пагинацию (`admin/src/pages/Dashboard.tsx`)
- **[admin]** Исправлен BUG-32: `hasAdminToken()` проверяет `exp` в JWT payload — истёкший токен больше не проходит (`admin/src/lib/api.ts`)
- **[admin]** Исправлен BUG-33: добавлен `vercel.json` с CSP, X-Frame-Options, X-Content-Type-Options и др. security headers (`admin/vercel.json`)
- **[admin]** Убран Lovable брендинг из `index.html` — заменён на HamshiraGo метаданные, добавлен `noindex` (`admin/index.html`)
- **[web]** Добавлен Error Boundary (4.4) — `app/error.tsx` + `app/global-error.tsx`, кнопки "Попробовать снова" и "На главную"
- **[web-medic]** Добавлен Error Boundary (4.4) — `app/error.tsx` + `app/global-error.tsx`
- **[admin]** Добавлен Error Boundary (4.4) — класс-компонент `ErrorBoundary.tsx`, обёрнут в `main.tsx`
- **[web]** Исправлен 8.5: SEO — `app/robots.ts`, `app/sitemap.ts`, canonical+OG+Twitter теги, root layout с `title.template`, `metadataBase`
- **[web, web-medic]** Исправлен 8.3: offline баннер — компонент `OfflineBanner` слушает `offline`/`online` события браузера
- **[web]** Исправлены 8.1 + 8.2: loading state + обработка ошибок на главной, `error` state с кнопкой "Попробовать снова"
- **[admin]** TypeScript strict mode — включён `strict: true`; все `any` заменены на строгие интерфейсы
- **[backend]** 10.1 DB индексы — добавлены `@Index()` на `User.phone`, `Medic.phone`, `Medic.isOnline`, `Medic.verificationStatus`, `Order.clientId`, `Order.medicId`, `Order.status`, `Order.created_at`
- **[web]** 10.3 Кэш услуг — `api.services.list()` кэширует результат в localStorage на 5 минут
- **[admin]** 10.4 Cloudinary оптимизация — хелпер `cloudinaryOpt()` добавляет `f_auto,q_auto,w_800` к URL
- **[web]** Добавлен поиск и фильтрация (9.7), профиль клиента (9.6), страница «Финансовые отчёты» в admin (9.5)
- **[web, web-medic]** Исправлен 8.6: PWA offline кэширование — `sw.js` с обработчиками install/activate/fetch; `InstallPrompt` компонент

## 2026-03-01

- **[backend]** Этап 1 (critical security) закрыт: `GET /orders/:id` теперь с ACL по роли/владельцу, `PATCH /orders/:id/status` ограничен для клиента (только `SERVICE_STARTED -> DONE`) (`backend/src/orders/orders.controller.ts`, `backend/src/orders/orders.service.ts`)
- **[backend]** WebSocket security hardening: `subscribe_order` и `medic_location` теперь с проверкой доступа к заказу/назначения медика; запрещены произвольные подписки и отправка чужих координат (`backend/src/realtime/order-events.gateway.ts`, `backend/src/realtime/realtime.module.ts`)
- **[backend]** WebSocket CORS переведён с `origin: '*'` на allowlist (синхронизирован с REST CORS) (`backend/src/realtime/order-events.gateway.ts`)
- **[backend]** Route conflict fix: `GET /orders/:id` ограничен UUID-паттерном, чтобы статические маршруты (`/orders/medic/*`, `/orders/admin/*`) не перехватывались (`backend/src/orders/orders.controller.ts`)
- **[backend]** Безопасность декораторов: `ClientId`/`MedicId` больше не возвращают пустую строку при отсутствии пользователя, теперь выбрасывают `UnauthorizedException` (`backend/src/auth/decorators/client-id.decorator.ts`, `backend/src/auth/decorators/medic-id.decorator.ts`)
- **[web]** Редизайн главной страницы — SVG-волна под шапкой, иконки по категориям, убран дублирующийся блок "Мои заказы" внизу (`web/app/page.tsx`)
- **[web]** Сортировка заказов новые-первыми — явный `.sort()` в рендере обеих секций (активные + история) (`web/app/orders/page.tsx`)
- **[web]** Карта трекинга медика на странице заказа — компонент `TrackingMap` (Leaflet), слушает `medic_location` Socket.IO, fallback из `order.medic.latitude/longitude` (`web/components/TrackingMap.tsx`, `web/app/orders/[id]/page.tsx`)
- **[web-medic]** Исправлен краш `orders.find is not a function` — нормализация ответа `medicApi.orders.my()` (поддержка `{data:[]}`, `{items:[]}`, plain array) (`web-medic/app/order/[id]/page.tsx`)
- **[admin]** Подключён `GET /medics/admin/all` — Medics страница переключена с `getPendingMedics` на `getAllMedics`, показывает всех медиков с пагинацией (`admin/src/lib/api.ts`, `admin/src/pages/Medics.tsx`)
- **[admin]** Подключён `GET /auth/admin/users` — добавлены `getUsers()` и `blockClient()`, реализована полноценная страница Clients с таблицей, поиском и блокировкой (`admin/src/lib/api.ts`, `admin/src/pages/Clients.tsx`)
- **[web]** Обработка истёкшего токена — при 401 ответе очищается `token` и выполняется редирект на `/auth` (`web/lib/api.ts`)
- **[web-medic]** Обработка истёкшего токена — при 401 ответе очищается `medic_token` + `medic` и выполняется редирект на `/auth` (`web-medic/lib/api.ts`)
- **[web]** Сплэш-скрин 2 сек — тил-градиент, иконка медицинского креста, пульсирующая анимация, плавное исчезновение (`web/components/SplashScreen.tsx`, `web/app/layout.tsx`)
- **[web-medic]** Сплэш-скрин 2 сек — аналогично web, подзаголовок "Панель медика" (`web-medic/components/SplashScreen.tsx`, `web-medic/app/layout.tsx`)

## 2026-02-28

- **[backend]** Добавлен `GET /medics/admin/all` (пагинация + фильтры `search`, `verificationStatus`, `isBlocked`, `isOnline`) для админки (`backend/src/medics/medics.controller.ts`, `backend/src/medics/medics.service.ts`)
- **[backend]** Добавлен `GET /auth/admin/users` (пагинация + фильтры `search`, `isBlocked`) для админки (`backend/src/auth/auth.controller.ts`, `backend/src/users/users.service.ts`)
- **[mobile]** На карте выбора адреса показываются маркеры медиков из `/medics/nearby`; тап по маркеру выбирает медика (`mobile/components/LocationMap.tsx`, `mobile/app/order/location.tsx`)
- **[mobile]** Popup маркера медика улучшен для читаемости взрослой аудитории: `🩺 Медик: ...` + явный CTA выбора (`mobile/components/LocationMap.tsx`)
- **[backend/medic/mobile]** Реализован live-трекинг “медик в пути”: socket-событие `medic_location`, отправка координат медиком каждые 5с в `ON_THE_WAY`, отображение клиенту на карте заказа (`backend/src/realtime/order-events.gateway.ts`, `medic/app/order/[id].tsx`, `mobile/app/order/track.tsx`)
- **[medic]** Добавлен background location tracking с напоминанием о разрешении `Always` и карточкой в профиле (`medic/utils/backgroundLocation.ts`, `medic/app/_layout.tsx`, `medic/app/(tabs)/profile.tsx`, `medic/app.json`)
- **[backend]** `GET /medics/me` теперь возвращает `telegramChatId` — мобильное приложение показывает статус подключения (`medics.service.ts`)
- **[backend]** `PATCH /medics/telegram-chat-id` принимает `null` для отключения Telegram (`medics.controller.ts`, `medics.service.ts`)
- **[medic]** Карточка Telegram в профиле — кнопка "Подключить" открывает `t.me/hamshirago_medic_bot`, кнопка "Отключить" сбрасывает chatId на бэкенде (`medic/app/(tabs)/profile.tsx`)
- **[medic]** `MedicUser` дополнен полем `telegramChatId` (`medic/context/AuthContext.tsx`)
- **[admin]** Исправлен лейбл "PENDING" → "Верификация" в блоке потока заказов на Dashboard — карточка показывала медиков на верификации, а не pending заказы (`admin/src/pages/Dashboard.tsx`)

- **[web]** Список медиков на экране адреса — горизонтальный скролл с карточками медиков (имя, рейтинг, расстояние), клик = выбор; выбранная медсестра передаётся на confirm (`web/app/order/location/page.tsx`)
- **[web]** Карточка медсестры на экране подтверждения — показывается имя, рейтинг, расстояние если медик выбран на предыдущем шаге (`web/app/order/confirm/page.tsx`)

---

## 2026-02-27

- **[backend]** Фильтр заказов по расстоянию — `findAvailable(medicId)` возвращает только заказы в радиусе 10 км от медика, отсортированные от ближнего к дальнему (`orders.service.ts`)
- **[backend]** Добавлен `helmet` — защита HTTP-заголовков (`main.ts`)
- **[backend]** Структурированное логирование — `nestjs-pino` + `pino-pretty` в dev, JSON в production; пароли и Authorization автоматически [REDACTED] (`app.module.ts`, `main.ts`)
- **[mobile]** Скидка 10% на первый заказ — проверяется история заказов при открытии confirm-экрана; при 0 заказов применяется скидка и UI показывает бейдж со скидкой (`mobile/app/order/confirm.tsx`)
- **[medic]** Исправлен импорт `Text` в `verification.tsx` — заменён `@/components/Themed` (несуществующий) на стандартный `Text` из `react-native`

---

## 2026-02-26

- **[backend]** Telegram Bot уведомления — при создании нового заказа рассылка онлайн-медикам у которых сохранён `telegramChatId` (`telegram.service.ts`, `orders.service.ts`)
- **[backend]** Добавлен `telegramChatId` в таблицу медиков (`medic.entity.ts`)
- **[backend]** Новый эндпоинт `PATCH /medics/telegram-chat-id` — медик сохраняет свой Telegram chat ID (`medics.controller.ts`)
- **[backend]** Admin JWT login — `POST /auth/admin/login` с username/password, возвращает JWT; `AdminGuard` поддерживает оба метода (JWT + X-Admin-Secret fallback) (`auth.service.ts`, `admin.guard.ts`)
- **[admin]** Переход с `X-Admin-Secret` на JWT Bearer токен — `adminLogin()`, `getAdminToken/setAdminToken/clearAdminToken` (`api.ts`, `Login.tsx`, `AdminSidebar.tsx`)
- **[backend]** CORS — явный список разрешённых origins включая Vercel URLs (`main.ts`)
- **[backend]** Исправлена ошибка TypeORM `nullable` — `serviceId`, `serviceTitle`, `priceAmount`, `discountAmount` теперь nullable (`order.entity.ts`)
- **[backend]** Исправлена ошибка TypeScript `priceAmount possibly null` — добавлен `?? 0` (`orders.service.ts`)
- **[backend]** Admin API для заказов — `GET /orders/admin/all` (пагинация + фильтр по статусу), `PATCH /orders/admin/:id/cancel` (`orders.controller.ts`, `orders.service.ts`)
- **[docs]** Создан `docs/BACKEND_API.md` — полная документация API
- **[docs]** Создан `docs/ADMIN_PANEL.md` — документация для разработчиков admin панели

---

## 2026-02-25

- **[medic]** Экран верификации — загрузка фото лица и лицензии, отображение статуса PENDING/APPROVED/REJECTED, причина отказа (`medic/app/verification.tsx`)
- **[medic]** Статус верификации в профиле — карточка с цветовой индикацией и переходом на `/verification` (`medic/app/(tabs)/profile.tsx`)
- **[medic]** Баннер для неверифицированных медиков на главном экране — предупреждение о невозможности принять заказ (`medic/app/(tabs)/index.tsx`)
- **[medic]** `AuthContext` обновлён — добавлены поля верификации в `MedicUser`, метод `refreshProfile()` (`medic/context/AuthContext.tsx`)
- **[medic]** Отображение заработка медика с учётом комиссии платформы 10% — `Стоимость услуги`, `Скидка клиента`, `Комиссия платформы`, `Ваш заработок` (`medic/app/order/[id].tsx`)
- **[medic]** `app.json` — добавлен `expo-image-picker` плагин и Android permissions

---

## Ранее (MVP core)

- **[backend]** NestJS API — полная архитектура: Auth (client/medic/admin), Orders, Medics, Users, Services, Locations
- **[backend]** TypeORM + PostgreSQL — все entity, автосинхронизация схемы
- **[backend]** JWT аутентификация — отдельные токены для client/medic/admin
- **[backend]** WebSocket gateway — real-time события заказов (`order:status`, `order:location`)
- **[backend]** Expo Push Notifications — уведомления клиенту по всем статусам заказа
- **[backend]** Web Push (VAPID) — уведомления в браузер клиенту и медику
- **[backend]** Каталог услуг — `Service` entity, seed-данные, `GET /services`
- **[backend]** Платформенная комиссия 10% — `platformFee` хранится в заказе, вычитается из заработка медика
- **[backend]** Рейтинг медика — взвешенное среднее при оценке заказа клиентом
- **[backend]** Верификация медиков — `verificationStatus`, `facePhotoUrl`, `licensePhotoUrl`, `POST /medics/documents` (Cloudinary)
- **[backend]** Блокировка users/medics — `isBlocked` флаг, проверка при принятии заказа
- **[backend]** Rate limiting — `@nestjs/throttler` на auth эндпоинтах
- **[mobile]** Полный flow клиента — регистрация/логин, каталог услуг, выбор адреса, создание заказа, трекинг, история, профиль, оценка медика
- **[mobile]** Push-уведомления — запрос разрешения, сохранение токена, in-app баннеры
- **[mobile]** Real-time трекинг — Socket.IO, статус-степпер, местоположение медика на карте
- **[medic]** Полный flow медика — регистрация/логин, список заказов, принятие, смена статусов, история, профиль, баланс
- **[medic]** Online/offline toggle с GPS — геолокация передаётся на бэкенд при включении
- **[admin]** Admin панель — управление медиками (верификация, блокировка), клиентами, заказами, услугами
- **[web]** Next.js web клиент — все страницы MVP
- **[web-medic]** Next.js web медик — все страницы MVP
