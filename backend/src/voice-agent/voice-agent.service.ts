import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { VoiceSession } from './entities/voice-session.entity';
import { ServicesService } from '../services/services.service';

@Injectable()
export class VoiceAgentService {
  private readonly logger = new Logger(VoiceAgentService.name);
  private readonly anthropic: Anthropic;

  /** Salomat knowledge base loaded once at startup */
  private readonly salomatPrompt: string;

  constructor(
    @InjectRepository(VoiceSession)
    private readonly sessionRepo: Repository<VoiceSession>,
    private readonly configService: ConfigService,
    private readonly servicesService: ServicesService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = new Anthropic({ apiKey: apiKey || 'dummy-key' });

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

  // ── STT: Groq Whisper ────────────────────────────────────────────────────

  async transcribe(
    audioBuffer: Buffer,
    lang: string,
    originalName?: string,
  ): Promise<{ text: string; duration: number }> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey) {
      throw new BadRequestException('VOICE_STT_NOT_CONFIGURED');
    }

    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: originalName || 'audio.webm',
      contentType: 'audio/webm',
    });
    form.append('model', 'whisper-large-v3');
    form.append('language', lang === 'uz' ? 'uz' : 'ru');
    form.append('response_format', 'verbose_json');

    const response = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          ...form.getHeaders(),
        },
        body: form.getBuffer() as unknown as BodyInit,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Groq STT error: ${response.status} ${errorText}`);
      throw new BadRequestException('STT transcription failed');
    }

    const data = (await response.json()) as { text: string; duration?: number };
    return {
      text: data.text || '',
      duration: data.duration ?? 0,
    };
  }

  // ── Chat: Anthropic Claude Haiku ─────────────────────────────────────────

  async chat(
    sessionId: string | null,
    message: string,
    lang: string,
    clientId: string | null,
  ): Promise<{
    sessionId: string;
    reply: string;
    recommendation: string | null;
    suggestedSpecialization: string | null;
    sessionComplete: boolean;
  }> {
    if (!this.configService.get('ANTHROPIC_API_KEY')) {
      return {
        sessionId: '',
        reply:
          lang === 'uz'
            ? 'AI-assistent vaqtincha mavjud emas.'
            : 'ИИ-ассистент временно недоступен.',
        recommendation: null,
        suggestedSpecialization: null,
        sessionComplete: false,
      };
    }

    // Load or create session
    let session: VoiceSession;
    if (sessionId) {
      const existing = await this.sessionRepo.findOne({ where: { id: sessionId } });
      if (!existing) throw new NotFoundException('VOICE_SESSION_NOT_FOUND');
      if (existing.status === 'COMPLETED') {
        throw new BadRequestException('VOICE_SESSION_COMPLETED');
      }
      session = existing;
    } else {
      session = this.sessionRepo.create({
        clientId,
        lang,
        messages: [],
        status: 'ACTIVE',
        exchangeCount: 0,
      });
      session = await this.sessionRepo.save(session);
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Build system prompt
    const systemPrompt = await this.buildSystemPrompt(lang);

    // Call Anthropic
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: session.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const reply =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Add assistant reply
      session.messages.push({
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      });
      session.exchangeCount += 1;

      // Parse recommendation
      const parsed = this.parseRecommendation(reply);
      if (parsed.recommendation) {
        session.recommendation = parsed.recommendation;
        session.suggestedSpecialization = parsed.specialization;
        session.status = 'COMPLETED';

        // Try to match a service if NURSE recommendation
        if (parsed.recommendation === 'NURSE' && parsed.specialization) {
          const services = await this.servicesService.findAll();
          const matched = services.find(
            (s) =>
              s.title.toLowerCase().includes(parsed.specialization!.toLowerCase()) ||
              parsed.specialization!.toLowerCase().includes(s.title.toLowerCase()),
          );
          if (matched) {
            session.suggestedServiceId = matched.id;
          }
        }
      }

      await this.sessionRepo.save(session);

      return {
        sessionId: session.id,
        reply,
        recommendation: session.recommendation,
        suggestedSpecialization: session.suggestedSpecialization,
        sessionComplete: session.status === 'COMPLETED',
      };
    } catch (err) {
      this.logger.error('Anthropic API error in voice-agent chat', err);
      return {
        sessionId: session.id,
        reply:
          lang === 'uz'
            ? 'Xatolik yuz berdi. Keyinroq urinib ko\'ring.'
            : 'Произошла ошибка. Попробуйте позже.',
        recommendation: null,
        suggestedSpecialization: null,
        sessionComplete: false,
      };
    }
  }

  // ── TTS: Placeholder ────────────────────────────────────────────────────

  // TODO: Enable when OPENAI_API_KEY is available
  async synthesize(_text: string, _lang: string): Promise<Buffer | null> {
    this.logger.warn('TTS not configured — OPENAI_API_KEY is not set');
    return null;
  }

  // ── Session management ──────────────────────────────────────────────────

  async getSession(sessionId: string): Promise<VoiceSession | null> {
    return this.sessionRepo.findOne({ where: { id: sessionId } });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const result = await this.sessionRepo.delete({ id: sessionId });
    if (result.affected === 0) {
      throw new NotFoundException('VOICE_SESSION_NOT_FOUND');
    }
  }

  // ── Booking helpers ─────────────────────────────────────────────────────

  async bookNurse(
    sessionId: string,
    _clientId: string,
  ): Promise<{ suggestedServiceId: string | null; message: string }> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('VOICE_SESSION_NOT_FOUND');
    if (!session.recommendation) {
      throw new BadRequestException('VOICE_NO_RECOMMENDATION');
    }
    if (session.recommendation !== 'NURSE') {
      throw new BadRequestException(
        'Session recommendation is DOCTOR, not NURSE',
      );
    }

    return {
      suggestedServiceId: session.suggestedServiceId,
      message: session.suggestedServiceId
        ? 'Use this serviceId to create an order'
        : 'No specific service matched. Browse available services.',
    };
  }

  async bookDoctor(
    sessionId: string,
    _clientId: string,
  ): Promise<{ suggestedSpecialization: string | null; message: string }> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('VOICE_SESSION_NOT_FOUND');
    if (!session.recommendation) {
      throw new BadRequestException('VOICE_NO_RECOMMENDATION');
    }
    if (session.recommendation !== 'DOCTOR') {
      throw new BadRequestException(
        'Session recommendation is NURSE, not DOCTOR',
      );
    }

    return {
      suggestedSpecialization: session.suggestedSpecialization,
      message: session.suggestedSpecialization
        ? `Find a doctor with specialization: ${session.suggestedSpecialization}`
        : 'No specific specialization determined. Browse available doctors.',
    };
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  async findAllSessions(
    page: number,
    limit: number,
    filters?: { status?: string; recommendation?: string },
  ): Promise<{ data: VoiceSession[]; total: number; page: number; limit: number }> {
    const qb = this.sessionRepo.createQueryBuilder('vs');

    if (filters?.status) {
      qb.andWhere('vs.status = :status', { status: filters.status });
    }
    if (filters?.recommendation) {
      qb.andWhere('vs.recommendation = :recommendation', {
        recommendation: filters.recommendation,
      });
    }

    qb.orderBy('vs.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    doctorRecommendations: number;
    nurseRecommendations: number;
    conversionRate: number;
    averageExchanges: number;
  }> {
    const total = await this.sessionRepo.count();
    const active = await this.sessionRepo.count({ where: { status: 'ACTIVE' } });
    const completed = await this.sessionRepo.count({ where: { status: 'COMPLETED' } });
    const doctor = await this.sessionRepo.count({
      where: { recommendation: 'DOCTOR' },
    });
    const nurse = await this.sessionRepo.count({
      where: { recommendation: 'NURSE' },
    });

    const avgResult = await this.sessionRepo
      .createQueryBuilder('vs')
      .select('AVG(vs.exchangeCount)', 'avg')
      .getRawOne<{ avg: string | null }>();

    return {
      totalSessions: total,
      activeSessions: active,
      completedSessions: completed,
      doctorRecommendations: doctor,
      nurseRecommendations: nurse,
      conversionRate: total > 0 ? (doctor + nurse) / total : 0,
      averageExchanges: avgResult?.avg ? parseFloat(avgResult.avg) : 0,
    };
  }

  // ── Cron: cleanup stale sessions ────────────────────────────────────────

  @Cron('0 3 * * *')
  async cleanupStaleSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.sessionRepo.delete({
      updatedAt: LessThan(cutoff),
      status: 'ACTIVE',
    });
    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} stale voice sessions`);
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private async buildSystemPrompt(lang: string): Promise<string> {
    // Fetch available services for context
    let servicesText = '';
    try {
      const services = await this.servicesService.findAll();
      servicesText = services
        .map((s) => `- ${s.title} (${s.price} UZS)`)
        .join('\n');
    } catch {
      servicesText = 'Services list unavailable';
    }

    // Determine if this is first message (greeting in Uzbek)
    // The caller can pass lang='uz' for first message greeting context

    return `Ты — Salomat, AI-помощник сервиса HamshiraGo. Ты НЕ врач.

ПРАВИЛА ЯЗЫКА:
- Первое сообщение сессии: поприветствуй на узбекском: "Ассалому алайкум! Мен Salomat — сизнинг соғлиғингиз бўйича ёрдамчингизман. Қандай ёрдам бера оламан?"
- ВСЕ последующие сообщения: ТОЛЬКО на русском языке.
- НИКОГДА не переключайся на узбекский после приветствия, даже если пациент пишет на узбекском.

БАЗА ЗНАНИЙ:
${this.salomatPrompt}

Доступные услуги медсестёр:
${servicesText}

ФОРМАТ РЕКОМЕНДАЦИИ (после 2-5 обменов):
Если нужен врач:
РЕКОМЕНДАЦИЯ: DOCTOR
СПЕЦИАЛИЗАЦИЯ: [тип специалиста]

Если нужна медсестра на дом:
РЕКОМЕНДАЦИЯ: NURSE

Поддерживай оба формата для парсинга:
TAVSIYA: DOCTOR/NURSE
MUTAXASSISLIK: [тип]`;
  }

  private parseRecommendation(text: string): {
    recommendation: 'DOCTOR' | 'NURSE' | null;
    specialization: string | null;
  } {
    // Support both Russian and Uzbek formats
    const recMatch = text.match(/(?:РЕКОМЕНДАЦИЯ|TAVSIYA):\s*(DOCTOR|NURSE)/i);
    const specMatch = text.match(
      /(?:СПЕЦИАЛИЗАЦИЯ|MUTAXASSISLIK):\s*(.+)/i,
    );

    return {
      recommendation: recMatch
        ? (recMatch[1].toUpperCase() as 'DOCTOR' | 'NURSE')
        : null,
      specialization: specMatch ? specMatch[1].trim() : null,
    };
  }
}
