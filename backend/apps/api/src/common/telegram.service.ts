import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string | undefined;
  private readonly apiBase: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
  }

  /** Send a plain-text or HTML message to a single chat_id */
  async sendMessage(chatId: string | number, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<void> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — skipping Telegram notification');
      return;
    }

    try {
      const res = await fetch(`${this.apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        this.logger.error(`Telegram sendMessage failed: ${JSON.stringify(body)}`);
      }
    } catch (err) {
      this.logger.error(`Telegram request error: ${err}`);
    }
  }

  /** Send a message with inline keyboard buttons */
  async sendMessageWithButtons(
    chatId: string | number,
    text: string,
    buttons: Array<Array<{ text: string; callback_data: string }>>,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<void> {
    if (!this.botToken) return;
    try {
      const res = await fetch(`${this.apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
          reply_markup: { inline_keyboard: buttons },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        this.logger.error(`Telegram sendMessageWithButtons failed: ${JSON.stringify(body)}`);
      }
    } catch (err) {
      this.logger.error(`Telegram sendMessageWithButtons error: ${err}`);
    }
  }

  /** Answer a callback query (removes the "loading" spinner on button) */
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    if (!this.botToken) return;
    try {
      await fetch(`${this.apiBase}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text ?? '',
        }),
      });
    } catch (err) {
      this.logger.error(`Telegram answerCallbackQuery error: ${err}`);
    }
  }

  /** Edit an existing message's text (e.g., to remove buttons after action) */
  async editMessageText(
    chatId: string | number,
    messageId: number,
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<void> {
    if (!this.botToken) return;
    try {
      await fetch(`${this.apiBase}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });
    } catch (err) {
      this.logger.error(`Telegram editMessageText error: ${err}`);
    }
  }

  /** Broadcast the same message to multiple chat_ids (fire-and-forget, chunked with 100ms delay) */
  broadcastToAll(chatIds: (string | number)[], text: string): void {
    const CHUNK_SIZE = 20;
    const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    (async () => {
      for (let i = 0; i < chatIds.length; i += CHUNK_SIZE) {
        const chunk = chatIds.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map((chatId) => this.sendMessage(chatId, text).catch(() => {})));
        if (i + CHUNK_SIZE < chatIds.length) {
          await delay(100);
        }
      }
    })().catch(() => {});
  }
}
