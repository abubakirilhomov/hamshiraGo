import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { SalomatAuditService } from './salomat-audit.service';

export interface PatientContext {
  name?: string;
  age?: number;
  gender?: string;
  allergies?: string;
  chronicDiseases?: string;
}

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

  constructor(
    private readonly configService: ConfigService,
    private readonly salomatAuditService: SalomatAuditService,
  ) {
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
      this.salomatAuditService.logRateLimit(userId).catch(() => {});
      throw new BadRequestException('SALOMAT_RATE_LIMIT');
    }
    entry.count++;
  }

  /**
   * Build the full system prompt, optionally including patient context.
   */
  private buildSystemPrompt(
    isFirstMessage: boolean,
    patientContext?: PatientContext,
    lang: string = 'ru',
  ): string {
    const langInstruction = lang === 'uz'
      ? `ЯЗЫК ОТВЕТА: O'ZBEK TILIDA JAVOB BER. Har doim o'zbek tilida (lotin alifbosida) javob ber. Hech qachon rus tilida javob berma. Bemorning tili: O'ZBEKCHA.`
      : `ЯЗЫК ОТВЕТА: РУССКИЙ. Всегда отвечай на русском языке. Даже если знаешь узбекский — отвечай на русском. Язык пациента: РУССКИЙ.`;

    let prompt = `Ты — Salomat, AI-помощник сервиса HamshiraGo. Ты НЕ врач.

${langInstruction}
Не смешивай языки в одном ответе. Не используй эмодзи.

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

    if (patientContext) {
      const parts: string[] = [];
      if (patientContext.name) parts.push(`- Имя: ${patientContext.name}`);
      if (patientContext.age) parts.push(`- Возраст: ${patientContext.age}`);
      if (patientContext.gender) parts.push(`- Пол: ${patientContext.gender}`);
      if (patientContext.allergies)
        parts.push(`- Аллергии: ${patientContext.allergies}`);
      if (patientContext.chronicDiseases)
        parts.push(
          `- Хронические заболевания: ${patientContext.chronicDiseases}`,
        );
      if (parts.length > 0) {
        prompt += `\n\nПрофиль пациента:\n${parts.join('\n')}`;
      }
    }

    return prompt;
  }

  /**
   * Send triage chat messages to Claude (Salomat) and return the assistant reply.
   * Gracefully falls back if ANTHROPIC_API_KEY is not configured.
   */
  async chat(
    messages: { role: string; content: string }[],
    userId: string,
    patientContext?: PatientContext,
    lang: string = 'ru',
  ): Promise<string> {
    if (!this.configService.get('ANTHROPIC_API_KEY')) {
      return lang === 'uz'
        ? 'Salomat vaqtincha mavjud emas. Iltimos, shifokorga murojaat qiling.'
        : 'Salomat временно недоступна. Пожалуйста, обратитесь к врачу.';
    }

    // Enforce per-patient daily rate limit
    this.checkRateLimit(userId);

    const isFirstMessage = messages.length <= 1;
    const systemPrompt = this.buildSystemPrompt(isFirstMessage, patientContext, lang);

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

      const reply =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Audit: check for recommendations and red flags
      this.auditReply(userId, reply);

      return reply;
    } catch (err) {
      this.logger.error('Anthropic API error', err);
      return 'Произошла ошибка при обращении к Salomat. Попробуйте позже или обратитесь к врачу напрямую.';
    }
  }

  /**
   * Streaming version of chat — yields text chunks as they arrive.
   * Used by the SSE endpoint.
   */
  async *chatStream(
    messages: { role: string; content: string }[],
    userId: string,
    patientContext?: PatientContext,
    lang: string = 'ru',
  ): AsyncGenerator<string> {
    this.checkRateLimit(userId);

    if (!this.configService.get('ANTHROPIC_API_KEY')) {
      yield lang === 'uz'
        ? 'Salomat vaqtincha mavjud emas. Iltimos, shifokorga murojaat qiling.'
        : 'Salomat временно недоступна. Пожалуйста, обратитесь к врачу.';
      return;
    }

    const isFirstMessage = messages.length <= 1;
    const systemPrompt = this.buildSystemPrompt(isFirstMessage, patientContext, lang);

    const stream = await this.client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  /**
   * Summarize a Salomat conversation for the doctor.
   * Returns a structured summary or the raw text as fallback.
   */
  async summarizeForDoctor(conversationText: string): Promise<string> {
    if (!this.configService.get('ANTHROPIC_API_KEY')) return conversationText;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system:
          'Ты — медицинский ассистент. Сделай краткое саммари диалога с пациентом для врача. Формат:\n- Основная жалоба:\n- Длительность:\n- Сопутствующие симптомы:\n- Что уже пробовал:\n- Анамнез (если известен):\nМаксимум 5-7 строк. На русском языке.',
        messages: [{ role: 'user', content: conversationText }],
      });

      return response.content[0].type === 'text'
        ? response.content[0].text
        : conversationText;
    } catch (err) {
      this.logger.warn(`summarizeForDoctor failed: ${err}`);
      return conversationText;
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

  /**
   * Check reply for audit-worthy events and log them (fire-and-forget).
   */
  private auditReply(userId: string, reply: string): void {
    // Red flag detection
    if (
      reply.includes('103') ||
      reply.includes('скорую') ||
      reply.includes('tez yordam')
    ) {
      this.salomatAuditService.logRedFlag(userId, reply).catch(() => {});
    }

    // Doctor referral
    if (/РЕКОМЕНДАЦИЯ:\s*DOCTOR/i.test(reply)) {
      const specMatch = reply.match(/СПЕЦИАЛИЗАЦИЯ:\s*(.+)/i);
      const specialization = specMatch?.[1]?.trim() ?? 'unknown';
      this.salomatAuditService
        .logDoctorReferral(userId, specialization)
        .catch(() => {});
    }

    // Nurse referral
    if (/РЕКОМЕНДАЦИЯ:\s*NURSE/i.test(reply)) {
      this.salomatAuditService.logNurseReferral(userId).catch(() => {});
    }
  }
}
