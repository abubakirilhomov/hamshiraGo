import { Injectable, Logger, OnApplicationBootstrap, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MedicsService } from '../medics/medics.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { TelegramService } from '../common/telegram.service';

/** Payload shape Telegram sends for each update */
interface TgUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; username?: string; first_name?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name?: string };
    message?: {
      message_id: number;
      chat: { id: number; type: string };
    };
    data?: string;
  };
}

const CHANNEL_LINK = process.env.TELEGRAM_CHANNEL_LINK ?? '';
const WELCOME_MEDIC = (firstName: string) =>
  `👋 Привет, ${firstName}!\n\nВы успешно подключили Telegram-уведомления в HamshiraGo.\n\nТеперь вы будете получать новые заказы прямо сюда, даже когда приложение закрыто. 🚀` +
  (CHANNEL_LINK ? `\n\n📢 Подпишитесь на наш канал для медиков:\n${CHANNEL_LINK}` : '');

const WELCOME_CLIENT = (firstName: string) =>
  `👋 Привет, ${firstName}!\n\nВы подключили Telegram-уведомления HamshiraGo.\n\nТеперь вы будете получать обновления о статусе ваших заказов прямо сюда. 📲`;

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken: string | undefined;
  private readonly apiBase: string;

  constructor(
    private readonly config: ConfigService,
    private readonly medicsService: MedicsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly telegramService: TelegramService,
  ) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  async onApplicationBootstrap() {
    await this.registerWebhook();
  }

  private async registerWebhook(): Promise<void> {
    if (!this.botToken) return;
    const backendUrl = this.config.get<string>('BACKEND_URL');
    if (!backendUrl) {
      this.logger.warn('BACKEND_URL not set — Telegram webhook not registered');
      return;
    }
    const webhookUrl = `${backendUrl}/telegram/webhook`;
    try {
      const webhookSecret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
      const webhookBody: Record<string, unknown> = { url: webhookUrl, drop_pending_updates: false };
      if (webhookSecret) {
        webhookBody.secret_token = webhookSecret;
      }
      const res = await fetch(`${this.apiBase}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookBody),
      });
      const data = (await res.json()) as { ok: boolean; description?: string };
      if (data.ok) {
        this.logger.log(`Telegram webhook registered: ${webhookUrl}`);
      } else {
        this.logger.warn(`Telegram setWebhook failed: ${data.description}`);
      }
    } catch (err) {
      this.logger.error(`Telegram setWebhook error: ${err}`);
    }
  }

  /**
   * Handle an update from Telegram.
   * - /start {medicId} → auto-links chat_id to medic
   * - /start client_{userId} → auto-links chat_id to client
   * - callback_query → accept/decline order
   */
  async handleUpdate(update: TgUpdate): Promise<void> {
    // Handle callback queries (button presses)
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return;
    }

    const msg = update.message;
    if (!msg?.text || !msg.chat) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // /start client_{userId} — link client's Telegram
    if (text.startsWith('/start client_')) {
      const userId = text.slice(14).trim();
      if (!userId) return;
      await this.handleClientLink(chatId, userId, msg.from?.first_name ?? 'Пользователь');
      return;
    }

    // /start {medicId} — link medic's Telegram
    if (text.startsWith('/start ')) {
      const medicId = text.slice(7).trim();
      if (!medicId) return;
      await this.handleMedicLink(chatId, medicId, msg.from?.first_name ?? 'Медик');
      return;
    }

    // /start without payload — generic help
    if (text === '/start') {
      await this.telegramService.sendMessage(
        chatId,
        '👋 Привет! Это бот HamshiraGo.\n\n' +
          '🏥 <b>Для медиков:</b> откройте приложение HamshiraGo Medic → Профиль → Telegram уведомления → Подключить.\n\n' +
          '👤 <b>Для клиентов:</b> откройте приложение HamshiraGo → Профиль → Telegram уведомления → Подключить.',
      );
    }
  }

  private async handleMedicLink(chatId: number, medicId: string, firstName: string): Promise<void> {
    try {
      const medic = await this.medicsService.findById(medicId);
      if (!medic) {
        await this.telegramService.sendMessage(chatId, '❌ Медик не найден. Попробуйте ещё раз через приложение.');
        return;
      }

      if (medic.telegramChatId && medic.telegramChatId !== String(chatId)) {
        await this.telegramService.sendMessage(
          chatId,
          '❌ Этот аккаунт медика уже привязан к другому Telegram-чату. Отключите старый чат в приложении.',
        );
        return;
      }

      await this.medicsService.saveTelegramChatId(medicId, String(chatId));
      await this.telegramService.sendMessage(chatId, WELCOME_MEDIC(firstName));
      this.logger.log(`Telegram linked: medic=${medicId} chat=${chatId}`);
    } catch (err) {
      this.logger.error(`handleMedicLink error: ${err}`);
    }
  }

  private async handleClientLink(chatId: number, userId: string, firstName: string): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        await this.telegramService.sendMessage(chatId, '❌ Пользователь не найден. Попробуйте ещё раз через приложение.');
        return;
      }

      await this.usersService.saveTelegramChatId(userId, String(chatId));
      await this.telegramService.sendMessage(chatId, WELCOME_CLIENT(firstName));
      this.logger.log(`Telegram linked: client=${userId} chat=${chatId}`);
    } catch (err) {
      this.logger.error(`handleClientLink error: ${err}`);
    }
  }

  /** Handle inline button callback: accept_ORDER_ID or decline_ORDER_ID */
  private async handleCallbackQuery(cq: NonNullable<TgUpdate['callback_query']>): Promise<void> {
    const data = cq.data;
    if (!data) return;

    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;

    try {
      if (data.startsWith('accept_')) {
        const orderId = data.slice(7);
        const medic = await this.medicsService.findByTelegramChatId(String(chatId));
        if (!medic) {
          await this.telegramService.answerCallbackQuery(cq.id, '❌ Ваш Telegram не привязан к аккаунту медика');
          return;
        }

        try {
          await this.ordersService.acceptOrder(orderId, medic.id);
          await this.telegramService.answerCallbackQuery(cq.id, '✅ Заказ принят!');
          if (chatId && messageId) {
            await this.telegramService.editMessageText(
              chatId,
              messageId,
              `✅ <b>Заказ принят!</b>\n\nОткройте приложение для навигации к клиенту.`,
            );
          }
          this.logger.log(`Telegram: medic=${medic.id} accepted order=${orderId}`);
        } catch (err: any) {
          const msg = err?.message ?? 'Не удалось принять заказ';
          await this.telegramService.answerCallbackQuery(cq.id, `❌ ${msg}`);
          this.logger.warn(`Telegram accept failed: medic=${medic.id} order=${orderId} err=${msg}`);
        }
      } else if (data.startsWith('decline_')) {
        const orderId = data.slice(8);
        const medic = await this.medicsService.findByTelegramChatId(String(chatId));
        if (!medic) {
          await this.telegramService.answerCallbackQuery(cq.id, '❌ Ваш Telegram не привязан');
          return;
        }

        try {
          await this.ordersService.declineOrder(orderId, medic.id);
          await this.telegramService.answerCallbackQuery(cq.id, 'Заказ отклонён');
          if (chatId && messageId) {
            await this.telegramService.editMessageText(
              chatId,
              messageId,
              `❌ <b>Заказ отклонён.</b>\n\nЗаказ передан другому медику.`,
            );
          }
          this.logger.log(`Telegram: medic=${medic.id} declined order=${orderId}`);
        } catch (err: any) {
          const msg = err?.message ?? 'Не удалось отклонить заказ';
          await this.telegramService.answerCallbackQuery(cq.id, `❌ ${msg}`);
        }
      }
    } catch (err) {
      this.logger.error(`handleCallbackQuery error: ${err}`);
      await this.telegramService.answerCallbackQuery(cq.id, '⚠️ Произошла ошибка').catch(() => {});
    }
  }

  /**
   * Send a dispatch invite to a medic via Telegram with Accept/Decline buttons.
   * Called from DispatchService when inviting a medic.
   */
  async sendDispatchInvite(
    medicTelegramChatId: string,
    orderId: string,
    serviceTitle: string,
    netPrice: number,
    address?: string,
  ): Promise<void> {
    const text =
      `🚨 <b>Новый заказ!</b>\n\n` +
      `📋 <b>Услуга:</b> ${serviceTitle}\n` +
      `💰 <b>Сумма:</b> ${netPrice.toLocaleString('ru-RU')} UZS\n` +
      (address ? `📍 <b>Адрес:</b> ${address}\n` : '') +
      `⏱ <b>Время на ответ:</b> 60 секунд`;

    await this.telegramService.sendMessageWithButtons(medicTelegramChatId, text, [
      [
        { text: '✅ Принять', callback_data: `accept_${orderId}` },
        { text: '❌ Отклонить', callback_data: `decline_${orderId}` },
      ],
    ]);
  }

  /**
   * Notify a client about order status change via Telegram.
   */
  async notifyClientStatus(clientId: string, orderId: string, status: string, serviceTitle?: string): Promise<void> {
    const chatId = await this.usersService.getTelegramChatId(clientId);
    if (!chatId) return;

    const statusMessages: Record<string, string> = {
      ASSIGNED: '👨‍⚕️ Медик найден! Ожидаем подтверждения.',
      ACCEPTED: '✅ Медик принял ваш заказ и готовится к выезду.',
      ON_THE_WAY: '🚗 Медик выехал к вам!',
      ARRIVED: '🏠 Медик прибыл! Откройте дверь.',
      SERVICE_STARTED: '💉 Услуга начата.',
      DONE: '✅ Заказ завершён! Спасибо за использование HamshiraGo.',
      CANCELED: '❌ Заказ отменён.',
    };

    const msg = statusMessages[status];
    if (!msg) return;

    const title = serviceTitle ? `\n📋 ${serviceTitle}` : '';
    const shortId = orderId.slice(0, 8);
    await this.telegramService
      .sendMessage(chatId, `${msg}${title}\n\n🔗 Заказ #${shortId}`)
      .catch(() => {});
  }
}
