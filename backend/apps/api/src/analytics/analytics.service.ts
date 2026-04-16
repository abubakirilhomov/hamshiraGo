import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';

import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Medic } from '../medics/entities/medic.entity';
import { ClientError } from '../client-errors/entities/client-error.entity';
import { Review } from '../reviews/entities/review.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { ClientErrorStatus } from '../client-errors/entities/client-error-status.enum';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private client: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Medic)
    private readonly medicRepo: Repository<Medic>,
    @InjectRepository(ClientError)
    private readonly clientErrorRepo: Repository<ClientError>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey: apiKey || 'dummy-key' });
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private get apiKeyConfigured(): boolean {
    return !!this.configService.get<string>('ANTHROPIC_API_KEY');
  }

  private async gatherStats(): Promise<string> {
    const [
      totalOrders,
      ordersByStatus,
      totalClients,
      totalMedics,
      onlineMedics,
      avgRating,
      recentErrorCount,
    ] = await Promise.all([
      this.orderRepo.count(),
      this.countOrdersByStatus(),
      this.userRepo.count(),
      this.medicRepo.count(),
      this.medicRepo.count({ where: { isOnline: true } }),
      this.reviewRepo
        .createQueryBuilder('r')
        .select('AVG(r.rating)', 'avg')
        .getRawOne()
        .then((r) => Number(r?.avg ?? 0).toFixed(2)),
      this.clientErrorRepo.count({
        where: {
          createdAt: MoreThanOrEqual(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ),
        },
      }),
    ]);

    return [
      `--- Platform stats (live) ---`,
      `Total orders: ${totalOrders}`,
      `Orders by status: ${JSON.stringify(ordersByStatus)}`,
      `Total clients: ${totalClients}`,
      `Total medics: ${totalMedics} (online: ${onlineMedics}, offline: ${totalMedics - onlineMedics})`,
      `Average review rating: ${avgRating}`,
      `Client errors (last 30 days): ${recentErrorCount}`,
    ].join('\n');
  }

  private async countOrdersByStatus(): Promise<Record<string, number>> {
    const rows: { status: string; cnt: string }[] = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)::int', 'cnt')
      .groupBy('o.status')
      .getRawMany();

    const result: Record<string, number> = {};
    for (const r of rows) {
      result[r.status] = Number(r.cnt);
    }
    return result;
  }

  private thirtyDaysAgo(): Date {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // ── public methods ───────────────────────────────────────────────────────

  /**
   * Admin AI chat — answers questions about platform state using live stats.
   */
  async aiChat(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    if (!this.apiKeyConfigured) {
      return 'AI analytics is temporarily unavailable (API key not configured).';
    }

    const stats = await this.gatherStats();

    const systemPrompt = `You are an analytics assistant for HamshiraGo — a mobile platform that connects clients with home-visit nurses (medics) in Uzbekistan.

Your job:
- Answer admin questions about orders, medics, clients, reviews, and user feedback.
- Use the live platform statistics provided below.
- Be concise, data-driven, and actionable.
- Respond in the same language the admin uses (Russian or English).

${stats}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
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
      this.logger.error('Anthropic API error in aiChat', err);
      return 'AI analytics error. Please try again later.';
    }
  }

  /**
   * Summarise recent client errors (last 30 days), grouped by status.
   */
  async getFeedbackSummary(): Promise<{
    byStatus: Record<string, number>;
    aiSummary: string;
  }> {
    const cutoff = this.thirtyDaysAgo();

    const errors = await this.clientErrorRepo.find({
      where: { createdAt: MoreThanOrEqual(cutoff) },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    const byStatus: Record<string, number> = {};
    for (const e of errors) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    }

    if (!this.apiKeyConfigured || errors.length === 0) {
      return {
        byStatus,
        aiSummary: errors.length === 0
          ? 'No client errors in the last 30 days.'
          : 'AI summary unavailable (API key not configured).',
      };
    }

    const errorList = errors
      .slice(0, 50)
      .map(
        (e) =>
          `[${e.status}] ${e.screen ?? 'unknown screen'}: ${e.message ?? 'no message'} (app=${e.appType ?? '?'}, count=${e.count})`,
      )
      .join('\n');

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a QA analyst for HamshiraGo, a home-nurse booking app. Summarise the client errors below. Group by theme, highlight the most critical issues, and suggest priorities. Be concise. Respond in English.`,
        messages: [
          {
            role: 'user' as const,
            content: `Here are recent client errors (last 30 days):\n\n${errorList}\n\nStatus counts: ${JSON.stringify(byStatus)}`,
          },
        ],
      });

      const aiSummary =
        response.content[0].type === 'text' ? response.content[0].text : '';

      return { byStatus, aiSummary };
    } catch (err) {
      this.logger.error('Anthropic API error in getFeedbackSummary', err);
      return { byStatus, aiSummary: 'AI summary generation failed.' };
    }
  }

  /**
   * Classify NEW client errors (last 30 days) into categories.
   */
  async getTopIssues(): Promise<{
    total: number;
    aiClassification: string;
  }> {
    const cutoff = this.thirtyDaysAgo();

    const errors = await this.clientErrorRepo.find({
      where: {
        status: ClientErrorStatus.NEW,
        createdAt: MoreThanOrEqual(cutoff),
      },
      order: { count: 'DESC', createdAt: 'DESC' },
      take: 100,
    });

    if (!this.apiKeyConfigured || errors.length === 0) {
      return {
        total: errors.length,
        aiClassification: errors.length === 0
          ? 'No new issues in the last 30 days.'
          : 'AI classification unavailable (API key not configured).',
      };
    }

    const errorList = errors
      .slice(0, 50)
      .map(
        (e) =>
          `[count=${e.count}] screen=${e.screen ?? '?'} | ${e.message ?? 'no message'} | app=${e.appType ?? '?'} | code=${e.errorCode ?? 'none'}`,
      )
      .join('\n');

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a QA analyst for HamshiraGo. Classify the NEW client errors into categories (e.g., Network, UI, Auth, Payments, Map/Location, Other). For each category list the count of issues, the top error messages, and a severity rating (Critical/High/Medium/Low). Respond in English, concise format.`,
        messages: [
          {
            role: 'user' as const,
            content: `Classify these ${errors.length} NEW client errors:\n\n${errorList}`,
          },
        ],
      });

      const aiClassification =
        response.content[0].type === 'text' ? response.content[0].text : '';

      return { total: errors.length, aiClassification };
    } catch (err) {
      this.logger.error('Anthropic API error in getTopIssues', err);
      return {
        total: errors.length,
        aiClassification: 'AI classification failed.',
      };
    }
  }
}
