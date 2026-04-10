import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from './entities/app-settings.entity';
import { PatchSettingsDto } from './dto/patch-settings.dto';

const SINGLETON_ID = 'singleton';
const CACHE_KEY = 'app_settings';
const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable()
export class AppSettingsService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(AppSettings)
    private readonly repo: Repository<AppSettings>,
  ) {}

  async get(): Promise<AppSettings> {
    const cached = await this.cacheManager.get<AppSettings>(CACHE_KEY);
    if (cached) return cached;
    let settings: AppSettings | null = null;
    try {
      settings = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    } catch {
      // Columns may not exist yet on Railway — try including urgent fields with COALESCE
      try {
        const rows = await this.repo.query(
          `SELECT id, "isPaidMode", "commissionRate",
                  COALESCE("urgentFeePercent", 50) AS "urgentFeePercent",
                  COALESCE("urgentStartHour", 22) AS "urgentStartHour",
                  COALESCE("urgentEndHour", 7) AS "urgentEndHour"
           FROM app_settings WHERE id = $1 LIMIT 1`,
          [SINGLETON_ID],
        );
        if (rows.length) {
          settings = this.repo.create({
            id: rows[0].id,
            isPaidMode: rows[0].isPaidMode ?? false,
            commissionRate: rows[0].commissionRate ?? 10,
            urgentFeePercent: rows[0].urgentFeePercent ?? 50,
            urgentStartHour: rows[0].urgentStartHour ?? 22,
            urgentEndHour: rows[0].urgentEndHour ?? 7,
          });
        }
      } catch {
        // Urgent columns also missing — fall back to base columns only
        const rows = await this.repo.query(
          `SELECT id, "isPaidMode", "commissionRate" FROM app_settings WHERE id = $1 LIMIT 1`,
          [SINGLETON_ID],
        );
        if (rows.length) {
          settings = this.repo.create({
            id: rows[0].id,
            isPaidMode: rows[0].isPaidMode ?? false,
            commissionRate: rows[0].commissionRate ?? 10,
            urgentFeePercent: 50,
            urgentStartHour: 22,
            urgentEndHour: 7,
          });
        }
      }
    }
    if (!settings) {
      try {
        settings = this.repo.create({ id: SINGLETON_ID, isPaidMode: false, commissionRate: 10 });
        await this.repo.save(settings);
      } catch {
        // Another process may have created the row concurrently (duplicate key) — retry lookup
        settings = await this.repo.findOne({ where: { id: SINGLETON_ID } });
        if (!settings) {
          // Still nothing — use in-memory defaults so the app keeps serving requests
          settings = this.repo.create({ id: SINGLETON_ID, isPaidMode: false, commissionRate: 10 });
        }
      }
    }
    await this.cacheManager.set(CACHE_KEY, settings, CACHE_TTL_MS);
    return settings;
  }

  async patch(dto: PatchSettingsDto): Promise<AppSettings> {
    const update: Partial<AppSettings> = { id: SINGLETON_ID };
    if (dto.isPaidMode !== undefined) update.isPaidMode = dto.isPaidMode;
    if (dto.commissionRate !== undefined) update.commissionRate = dto.commissionRate;
    if (dto.urgentFeePercent !== undefined) update.urgentFeePercent = dto.urgentFeePercent;
    if (dto.urgentStartHour !== undefined) update.urgentStartHour = dto.urgentStartHour;
    if (dto.urgentEndHour !== undefined) update.urgentEndHour = dto.urgentEndHour;
    if (dto.loyaltyPointsPerOrder !== undefined) update.loyaltyPointsPerOrder = dto.loyaltyPointsPerOrder;
    if (dto.loyaltySilverThreshold !== undefined) update.loyaltySilverThreshold = dto.loyaltySilverThreshold;
    if (dto.loyaltyGoldThreshold !== undefined) update.loyaltyGoldThreshold = dto.loyaltyGoldThreshold;
    if (dto.loyaltyRedemptionRate !== undefined) update.loyaltyRedemptionRate = dto.loyaltyRedemptionRate;
    try {
      await this.repo.upsert(update as AppSettings, ['id']);
    } catch (err: unknown) {
      if (err instanceof Error && /column .* does not exist/i.test(err.message)) {
        // Urgent columns missing — upsert only base columns
        const baseUpdate: Partial<AppSettings> = { id: SINGLETON_ID };
        if (dto.isPaidMode !== undefined) baseUpdate.isPaidMode = dto.isPaidMode;
        if (dto.commissionRate !== undefined) baseUpdate.commissionRate = dto.commissionRate;
        await this.repo.upsert(baseUpdate as AppSettings, ['id']);
      } else {
        throw err;
      }
    }
    await this.cacheManager.del(CACHE_KEY); // invalidate cache
    return this.get();
  }

  /** @deprecated use patch() */
  async setIsPaidMode(isPaidMode: boolean): Promise<AppSettings> {
    return this.patch({ isPaidMode });
  }

  /** Convenience: returns just the boolean flag */
  async isPaidMode(): Promise<boolean> {
    const s = await this.get();
    return s.isPaidMode;
  }

  /** Convenience: returns commission rate (1–50, default 10) */
  async getCommissionRate(): Promise<number> {
    const s = await this.get();
    return s.commissionRate ?? 10;
  }
}
