import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private client: Anthropic;

  /** Salomat knowledge base loaded once at startup */
  private readonly salomatPrompt: string;

  /** Per-patient daily rate limiter (in-memory, swap to Redis later) */
  private readonly messageCounts = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private readonly DAILY_LIMIT = 50;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey: apiKey || 'dummy-key' });

    // Load Salomat knowledge base files
    const knowledgePath = path.join(
      __dirname,
      '..',
      '..',
      'salomat-knowledge',
    );
    const files = [
      'triage.md',
      'specialties.md',
      'safety.md',
      'tone.md',
      'conversation-flow.md',
    ];
    this.salomatPrompt = files
      .map((f) => {
        try {
          return fs.readFileSync(path.join(knowledgePath, f), 'utf-8');
        } catch {
          this.logger.warn(`Salomat knowledge file not found: ${f}`);
          return '';
        }
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
  }

  /**
   * Check per-patient daily rate limit.
   * Throws BadRequestException when limit exceeded.
   */
  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const entry = this.messageCounts.get(userId);
    if (!entry || now > entry.resetAt) {
      this.messageCounts.set(userId, {
        count: 1,
        resetAt: now + 24 * 60 * 60 * 1000,
      });
      return;
    }
    if (entry.count >= this.DAILY_LIMIT) {
      throw new BadRequestException('SALOMAT_RATE_LIMIT');
    }
    entry.count++;
  }

  /**
   * Send triage chat messages to Claude (Salomat) and return the assistant reply.
   * Gracefully falls back if ANTHROPIC_API_KEY is not configured.
   */
  async chat(
    messages: { role: string; content: string }[],
    userId: string,
  ): Promise<string> {
    if (!this.configService.get('ANTHROPIC_API_KEY')) {
      return 'ИИ-ассистент временно недоступен. Пожалуйста, обратитесь напрямую к врачу.';
    }

    // Enforce per-patient daily rate limit
    this.checkRateLimit(userId);

    const isFirstMessage = messages.length <= 1;

    const systemPrompt = `Ты — Salomat, AI-помощник сервиса HamshiraGo. Ты НЕ врач.

ПРАВИЛА ЯЗЫКА:
${isFirstMessage ? '- Это первое сообщение сессии. Поприветствуй на узбекском: "Ассалому алайкум! Мен Salomat — сизнинг соғлиғингиз бўйича ёрдамчингизман. Қандай ёрдам бера оламан?" Затем сразу переходи на русский.' : '- Отвечай ТОЛЬКО на русском языке. Даже если пациент пишет на узбекском — отвечай на русском.'}
- НИКОГДА не переключайся на узбекский язык после приветствия.

БАЗА ЗНАНИЙ:
${this.salomatPrompt}

ФОРМАТ РЕКОМЕНДАЦИИ (когда собрано достаточно информации):
Если нужен врач:
РЕКОМЕНДАЦИЯ: DOCTOR
СПЕЦИАЛИЗАЦИЯ: [тип специалиста]
КРАТКОЕ ОПИСАНИЕ: [2-3 предложения о симптомах]

Если нужна медсестра на дом:
РЕКОМЕНДАЦИЯ: NURSE
КРАТКОЕ ОПИСАНИЕ: [что нужно сделать]`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });

      return response.content[0].type === 'text'
        ? response.content[0].text
        : '';
    } catch (err) {
      this.logger.error('Anthropic API error', err);
      return 'Произошла ошибка при обращении к Salomat. Попробуйте позже или обратитесь к врачу напрямую.';
    }
  }

  /**
   * Parse a recommendation block from the Salomat response.
   * Returns specialization and symptom summary if present.
   */
  parseRecommendation(text: string): {
    specialization: string | null;
    summary: string | null;
  } {
    const specMatch = text.match(/РЕКОМЕНДАЦИЯ:\s*(.+)/i);
    const summaryMatch = text.match(/КРАТКОЕ ОПИСАНИЕ:\s*(.+)/i);
    return {
      specialization: specMatch?.[1]?.trim() ?? null,
      summary: summaryMatch?.[1]?.trim() ?? null,
    };
  }
}
