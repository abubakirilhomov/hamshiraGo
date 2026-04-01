import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private client: Anthropic;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey: apiKey || 'dummy-key' });
  }

  /**
   * Send triage chat messages to Claude and return the assistant reply.
   * Gracefully falls back if ANTHROPIC_API_KEY is not configured.
   */
  async chat(
    messages: { role: string; content: string }[],
    _userId: string,
  ): Promise<string> {
    if (!this.configService.get('ANTHROPIC_API_KEY')) {
      return 'ИИ-ассистент временно недоступен. Пожалуйста, обратитесь напрямую к врачу.';
    }

    const systemPrompt = `Ты — медицинский ассистент HamshiraGo. Твоя задача:
1. Выслушать симптомы пациента
2. Задать уточняющие вопросы (не более 3-4)
3. Предложить специализацию врача для консультации
4. НЕ ставить диагноз — только направить к нужному специалисту

Отвечай кратко, на русском языке. Будь вежлив и профессионален.
После сбора информации, ответь в формате:
РЕКОМЕНДАЦИЯ: [специализация врача]
КРАТКОЕ ОПИСАНИЕ: [2-3 предложения о симптомах]

Доступные специализации: Терапевт, Кардиолог, Невролог, Гастроэнтеролог, ЛОР, Дерматолог, Хирург, Педиатр, Гинеколог, Уролог`;

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
      return 'Произошла ошибка при обращении к ИИ-ассистенту. Попробуйте позже или обратитесь к врачу напрямую.';
    }
  }

  /**
   * Parse a recommendation block from the AI response.
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
