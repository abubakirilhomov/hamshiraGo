# HamshiraGo — Инструкция по публикации в Store

> Актуально для: `mobile/` (HamshiraGo клиент) и `medic/` (HamshiraGo Medic)
> Требования: Node.js 18+, EAS CLI, аккаунт на expo.dev

---

## 0. Подготовка

### Установить EAS CLI
```bash
npm install -g eas-cli
eas login   # войти под аккаунтом abubakirilhomov
```

### Установить expo-updates (OTA хотфиксы)
```bash
cd mobile && npx expo install expo-updates
cd ../medic && npx expo install expo-updates
```

После установки добавить в `plugins` каждого `app.json`:
```json
"expo-updates"
```

---

## 1. EAS — регистрация проектов

### HamshiraGo Medic (уже зарегистрирован)
`projectId` уже вписан в `medic/app.json`:
```
bb076475-8c14-4266-8992-ebbe2eda93f6
```

### HamshiraGo Client (нужно зарегистрировать)
```bash
cd mobile
eas init
```
Скопировать выданный `projectId` и вставить в `mobile/app.json`:
```json
"extra": {
  "eas": {
    "projectId": "ВСТАВИТЬ_СЮДА"
  }
}
```

---

## 2. Android — Google Play Store

### 2.1 Подпись (Keystore)

```bash
# Для клиентского приложения
cd mobile
eas credentials --platform android

# Для медицинского приложения
cd ../medic
eas credentials --platform android
```

Выбрать **"Generate new keystore"** — EAS создаст и сохранит ключ в облаке.
> ⚠️ Сохраните keystore — без него нельзя обновить приложение в будущем.

### 2.2 Сборка AAB

```bash
# Клиент
cd mobile
eas build --platform android --profile production

# Медик
cd ../medic
eas build --platform android --profile production
```

Сборка занимает ~10-20 минут. Ссылка на `.aab` появится в терминале и на expo.dev.

### 2.3 Google Play Console

1. Открыть [play.google.com/console](https://play.google.com/console)
2. Создать два приложения:
   - `com.hamshirago.client` — HamshiraGo
   - `com.hamshirago.medic` — HamshiraGo Medic
3. **Начать с Internal Testing** → загрузить `.aab`
4. Заполнить обязательные поля:

| Поле | Значение |
|------|----------|
| Название | HamshiraGo / HamshiraGo Medic |
| Краткое описание | Медицинская помощь на дому в Ташкенте |
| Категория | Медицина / Здоровье и фитнес |
| Email разработчика | ваш email |
| Privacy Policy URL | обязательно (см. раздел 5) |

5. Скриншоты:
   - Минимум **2 штуки**, соотношение 16:9
   - Иконка: **512×512 px** (PNG без прозрачности)
   - Feature Graphic: **1024×500 px**
6. Контентный рейтинг: пройти опросник IARC (~5 минут)
7. Internal Testing → Production (после проверки ~3-7 дней)

### 2.4 FCM (Android Push)

1. Открыть [console.firebase.google.com](https://console.firebase.google.com)
2. Создать проект для каждого приложения
3. Скачать `google-services.json` → положить в корень `mobile/` и `medic/`
4. В EAS Dashboard → проект → Credentials → загрузить FCM Server Key

---

## 3. iOS — App Store

> Требуется Apple Developer аккаунт: [developer.apple.com](https://developer.apple.com) — **$99/год**

### 3.1 Создать App ID

1. [developer.apple.com](https://developer.apple.com) → Certificates, IDs & Profiles → Identifiers
2. Добавить два App ID:
   - `com.hamshirago.client`
   - `com.hamshirago.medic`
3. Включить capabilities: **Push Notifications**

### 3.2 Сертификаты (автоматически через EAS)

```bash
cd mobile
eas credentials --platform ios

cd ../medic
eas credentials --platform ios
```

Выбрать **"Generate new certificate"** — EAS создаст Distribution Certificate и Provisioning Profile автоматически.

### 3.3 Сборка IPA

```bash
# Клиент
cd mobile
eas build --platform ios --profile production

# Медик
cd ../medic
eas build --platform ios --profile production
```

### 3.4 App Store Connect

1. Открыть [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Новое приложение → Bundle ID выбрать из шага 3.1
3. Загрузить сборку через **EAS Submit** или **Transporter**:
   ```bash
   # Через EAS (рекомендуется)
   eas submit --platform ios --profile production
   ```
4. Скриншоты для каждого размера экрана:
   - **6.7"** (iPhone 15 Pro Max) — обязательно
   - **6.1"** (iPhone 15) — обязательно
   - **5.5"** (iPhone 8 Plus) — опционально
   - Описание на **RU** и **UZ**
5. TestFlight → внутреннее тестирование → Public Beta → Review

> ⏱ Время ревью App Store: **24–72 часа**

### 3.5 APNs (iOS Push)

1. [developer.apple.com](https://developer.apple.com) → Keys → создать ключ с **Push Notifications**
2. Скачать `.p8` файл
3. EAS Dashboard → проект → Credentials → iOS → загрузить APNs Key

---

## 4. OTA обновления (expo-updates)

После установки `expo-updates` (раздел 0) добавить в `app.json` обоих приложений:

```json
"updates": {
  "url": "https://u.expo.dev/ВАШ_PROJECT_ID"
},
"runtimeVersion": {
  "policy": "appVersion"
}
```

Публикация хотфикса без ревью:
```bash
eas update --branch production --message "Описание изменений"
```

> ⚠️ OTA работает только для JS-кода. Изменения в нативных модулях требуют полного билда.

---

## 5. Privacy Policy

Обязательно для обоих сторов. Создать страницу (можно на лендинге):
`https://hamshirago.uz/privacy-policy`

Минимальное содержание:
- Какие данные собираются (геолокация, телефон, фото)
- Как используются (для соединения клиента с медиком)
- Хранение и удаление данных
- Контактный email

---

## 6. Команды — краткая шпаргалка

```bash
# Превью-сборка (APK для тестирования)
eas build --platform android --profile preview

# Продакшн-сборка Android (AAB)
eas build --platform android --profile production

# Продакшн-сборка iOS (IPA)
eas build --platform ios --profile production

# Отправка в Google Play (Internal Testing)
eas submit --platform android --profile production

# Отправка в App Store (TestFlight)
eas submit --platform ios --profile production

# OTA обновление
eas update --branch production --message "fix: описание"

# Посмотреть статус сборок
eas build:list
```

---

## 7. Чеклист перед публикацией

### Обязательно
- [ ] `projectId` вписан в `mobile/app.json`
- [ ] `expo-updates` установлен и настроен
- [ ] Keystore (Android) сохранён в EAS Credentials
- [ ] APNs ключ загружен (iOS)
- [ ] FCM Server Key загружен (Android)
- [ ] Privacy Policy страница доступна по URL
- [ ] Скриншоты готовы (Play Store + App Store)
- [ ] Иконка 512×512 (Play Store)
- [ ] Feature Graphic 1024×500 (Play Store)

### Для App Store
- [ ] Apple Developer аккаунт активен ($99/год)
- [ ] App ID зарегистрированы с Push Notifications
- [ ] Distribution Certificate создан
- [ ] Скриншоты для 6.7" и 6.1"

### Версии
- После каждого релиза `versionCode` (Android) и `buildNumber` (iOS) увеличиваются автоматически (`autoIncrement: true` в eas.json)
- `version` в `app.json` обновлять вручную при крупных релизах (1.0.0 → 1.1.0)

---

*Последнее обновление: март 2026*
