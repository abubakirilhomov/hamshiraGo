import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SalomatAuditLog } from './entities/salomat-audit-log.entity';

@Injectable()
export class SalomatAuditService {
  constructor(
    @InjectRepository(SalomatAuditLog)
    private readonly repo: Repository<SalomatAuditLog>,
  ) {}

  async log(
    clientId: string | null,
    action: string,
    details?: string | null,
    specialization?: string | null,
    triageLevel?: number,
  ): Promise<void> {
    await this.repo.save(
      this.repo.create({
        clientId,
        action,
        details: details ?? null,
        specialization: specialization ?? null,
        triageLevel: triageLevel ?? null,
      }),
    );
  }

  async logRedFlag(clientId: string, reply: string): Promise<void> {
    await this.log(clientId, 'RED_FLAG', reply.slice(0, 500), null, 1);
  }

  async logDoctorReferral(
    clientId: string,
    specialization: string,
  ): Promise<void> {
    await this.log(clientId, 'DOCTOR_REFERRAL', null, specialization, 3);
  }

  async logNurseReferral(clientId: string): Promise<void> {
    await this.log(clientId, 'NURSE_REFERRAL', null, null, 3);
  }

  async logSafeguard(clientId: string, userMessage: string): Promise<void> {
    await this.log(
      clientId,
      'SAFEGUARD_TRIGGERED',
      userMessage.slice(0, 200),
    );
  }

  async logRateLimit(clientId: string): Promise<void> {
    await this.log(clientId, 'RATE_LIMIT_HIT');
  }

  /** Admin stats for the last N days */
  async getStats(days = 30): Promise<{
    totalEvents: number;
    redFlags: number;
    doctorReferrals: number;
    nurseReferrals: number;
    safeguards: number;
    rateLimits: number;
    topSpecializations: Array<{ specialization: string; count: number }>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const all = await this.repo.find({
      where: { createdAt: MoreThan(since) },
    });

    return {
      totalEvents: all.length,
      redFlags: all.filter((e) => e.action === 'RED_FLAG').length,
      doctorReferrals: all.filter((e) => e.action === 'DOCTOR_REFERRAL')
        .length,
      nurseReferrals: all.filter((e) => e.action === 'NURSE_REFERRAL').length,
      safeguards: all.filter((e) => e.action === 'SAFEGUARD_TRIGGERED').length,
      rateLimits: all.filter((e) => e.action === 'RATE_LIMIT_HIT').length,
      topSpecializations: Object.entries(
        all
          .filter((e) => e.specialization)
          .reduce(
            (acc, e) => {
              acc[e.specialization!] = (acc[e.specialization!] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
      )
        .map(([specialization, count]) => ({
          specialization,
          count: count as number,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }
}
