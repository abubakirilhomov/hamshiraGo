import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { NpsSurvey } from './entities/nps-survey.entity';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { WebPushService } from '../realtime/web-push.service';

@Injectable()
export class NpsService {
  private readonly logger = new Logger(NpsService.name);

  constructor(
    @InjectRepository(NpsSurvey)
    private readonly npsRepo: Repository<NpsSurvey>,
    private readonly dataSource: DataSource,
    private readonly pushService: PushNotificationsService,
    private readonly webPushService: WebPushService,
  ) {}

  /** Submit NPS score (max 1 per user per month) */
  async submit(
    userId: string,
    score: number,
    comment?: string,
  ): Promise<NpsSurvey> {
    const answered = await this.hasAnsweredThisMonth(userId);
    if (answered) {
      throw new BadRequestException('Already submitted NPS this month');
    }

    const survey = this.npsRepo.create({
      userId,
      score,
      comment: comment ?? null,
    });
    return this.npsRepo.save(survey);
  }

  /** Check if user should see NPS survey */
  async hasAnsweredThisMonth(userId: string): Promise<boolean> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await this.npsRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.createdAt >= :start', { start: startOfMonth })
      .getCount();

    return count > 0;
  }

  /** Admin: NPS stats with monthly breakdown */
  async getStats(): Promise<{
    overall: { nps: number; total: number; promoters: number; passives: number; detractors: number };
    monthly: Array<{ month: string; nps: number; total: number; promoters: number; passives: number; detractors: number }>;
  }> {
    // Overall stats
    const allSurveys = await this.npsRepo.find();
    const overall = this.calculateNps(allSurveys);

    // Monthly breakdown (last 12 months)
    const monthly: Array<{ month: string; nps: number; total: number; promoters: number; passives: number; detractors: number }> = [];

    try {
      const rows: Array<{ month: string; scores: string }> = await this.npsRepo
        .createQueryBuilder('n')
        .select("TO_CHAR(n.createdAt, 'YYYY-MM')", 'month')
        .addSelect("ARRAY_AGG(n.score)", 'scores')
        .where("n.createdAt >= NOW() - INTERVAL '12 months'")
        .groupBy("TO_CHAR(n.createdAt, 'YYYY-MM')")
        .orderBy("TO_CHAR(n.createdAt, 'YYYY-MM')", 'DESC')
        .getRawMany();

      for (const row of rows) {
        const scores = (Array.isArray(row.scores) ? row.scores : []).map(Number);
        const surveys = scores.map((s) => ({ score: s } as NpsSurvey));
        const stats = this.calculateNps(surveys);
        monthly.push({ month: row.month, ...stats });
      }
    } catch (err) {
      this.logger.warn(`Monthly NPS query failed: ${err}`);
    }

    return { overall, monthly };
  }

  /** Calculate NPS from a list of surveys */
  private calculateNps(surveys: NpsSurvey[]): {
    nps: number;
    total: number;
    promoters: number;
    passives: number;
    detractors: number;
  } {
    const total = surveys.length;
    if (total === 0) return { nps: 0, total: 0, promoters: 0, passives: 0, detractors: 0 };

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    for (const s of surveys) {
      if (s.score >= 9) promoters++;
      else if (s.score >= 7) passives++;
      else detractors++;
    }

    const nps = Math.round(((promoters - detractors) / total) * 100);
    return { nps, total, promoters, passives, detractors };
  }

  /** Cron: send NPS campaign on 1st of every month at 11:00 UTC (16:00 Tashkent) */
  @Cron('0 11 1 * *')
  async sendNpsCampaign(): Promise<void> {
    this.logger.log('Starting monthly NPS campaign...');

    try {
      // Find clients with at least 1 DONE order in last 30 days
      const activeClients: Array<{ id: string; pushToken: string | null }> =
        await this.dataSource.query(`
          SELECT DISTINCT u.id, u."pushToken"
          FROM users u
          INNER JOIN orders o ON o."clientId" = u.id
          WHERE o.status = 'DONE'
            AND o.updated_at >= NOW() - INTERVAL '30 days'
            AND u."isBlocked" = false
        `);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Filter out users who already answered this month
      const answeredUserIds = new Set(
        (
          await this.npsRepo
            .createQueryBuilder('n')
            .select('n.userId')
            .where('n.createdAt >= :start', { start: startOfMonth })
            .getRawMany()
        ).map((r: { n_userId: string }) => r.n_userId),
      );

      const targets = activeClients.filter((c) => !answeredUserIds.has(c.id));

      let sent = 0;
      for (const client of targets) {
        try {
          if (client.pushToken) {
            await this.pushService.send([client.pushToken], {
              title: 'Оцените HamshiraGo',
              body: 'Насколько вы готовы порекомендовать нас друзьям? Это займёт 30 секунд.',
              sound: 'default',
              data: { type: 'nps' },
              channelId: 'order_updates',
              priority: 'default',
            });
            sent++;
          }

          this.webPushService
            .sendToSubscriber('client', client.id, {
              title: 'Оцените HamshiraGo',
              body: 'Насколько вы готовы порекомендовать нас друзьям?',
              data: { type: 'nps' },
              url: '/nps',
            })
            .catch(() => {});
        } catch {
          // skip individual failures
        }
      }

      this.logger.log(
        `NPS campaign sent to ${sent}/${targets.length} active clients`,
      );
    } catch (err) {
      this.logger.error(`NPS campaign failed: ${err}`);
    }
  }
}
