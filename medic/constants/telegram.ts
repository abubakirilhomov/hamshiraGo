/**
 * Telegram constants — единое место для всех Telegram ссылок в medic app.
 * Менять только здесь — все экраны подтянутся автоматически.
 */

/** Username бота (без @) */
export const TELEGRAM_BOT = 'hamshirago_medic_bot';

/** Ссылка на канал для медиков */
export const TELEGRAM_CHANNEL = 'https://t.me/hamshirago_medics';

/** Ссылка на бот поддержки */
export const TELEGRAM_SUPPORT = 'https://t.me/hamshirago_support';

/** Сгенерировать deep link для привязки медика */
export const getMedicDeepLink = (medicId: string) => ({
  deepLink: `tg://resolve?domain=${TELEGRAM_BOT}&start=${medicId}`,
  webFallback: `https://t.me/${TELEGRAM_BOT}?start=${medicId}`,
});

/** Сгенерировать deep link для привязки врача */
export const getDoctorDeepLink = (doctorId: string) => ({
  deepLink: `tg://resolve?domain=${TELEGRAM_BOT}&start=doctor_${doctorId}`,
  webFallback: `https://t.me/${TELEGRAM_BOT}?start=doctor_${doctorId}`,
});
