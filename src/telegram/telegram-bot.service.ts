import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MedicsService } from '../medics/medics.service';
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
}

const CHANNEL_LINK = process.env.TELEGRAM_CHANNEL_LINK ?? '';
const WELCOME_TEXT = (firstName: string) =>
  `👋 Привет, ${firstName}!\n\nВы успешно подключили Telegram-уведомления в HamshiraGo.\n\nТеперь вы будете получать новые заказы прямо сюда, даже когда приложение закрыто. 🚀` +
  (CHANNEL_LINK ? `\n\n📢 Подпишитесь на наш канал для медиков:\n${CHANNEL_LINK}` : '');

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken: string | undefined;
  private readonly apiBase: string;

  constructor(
    private readonly config: ConfigService,
    private readonly medicsService: MedicsService,
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
      const res = await fetch(`${this.apiBase}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, drop_pending_updates: false }),
      });
      const data = await res.json() as { ok: boolean; description?: string };
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
   * /start {medicId} → auto-links chat_id to medic and sends welcome message.
   */
  async handleUpdate(update: TgUpdate): Promise<void> {
    const msg = update.message;
    if (!msg?.text || !msg.chat) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // /start {medicId}
    if (text.startsWith('/start ')) {
      const medicId = text.slice(7).trim();
      if (!medicId) return;

      try {
        const medic = await this.medicsService.findById(medicId);
        if (!medic) {
          await this.telegramService.sendMessage(chatId, '❌ Медик не найден. Попробуйте ещё раз через приложение.');
          return;
        }

        await this.medicsService.saveTelegramChatId(medicId, String(chatId));

        const firstName = msg.from?.first_name ?? 'Медик';
        await this.telegramService.sendMessage(chatId, WELCOME_TEXT(firstName));
        this.logger.log(`Telegram linked: medic=${medicId} chat=${chatId}`);
      } catch (err) {
        this.logger.error(`handleUpdate /start error: ${err}`);
      }
      return;
    }

    // /start without payload — generic help
    if (text === '/start') {
      await this.telegramService.sendMessage(
        chatId,
        '👋 Привет! Это бот HamshiraGo для медиков.\n\nЧтобы подключить уведомления, откройте приложение HamshiraGo Medic → Профиль → Telegram уведомления → Подключить.',
      );
    }
  }
}
