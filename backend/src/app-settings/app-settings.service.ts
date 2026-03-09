import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from './entities/app-settings.entity';
import { PatchSettingsDto } from './dto/patch-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(AppSettings)
    private readonly repo: Repository<AppSettings>,
  ) {}

  async get(): Promise<AppSettings> {
    let settings = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    if (!settings) {
      settings = this.repo.create({ id: SINGLETON_ID, isPaidMode: false, commissionRate: 10 });
      await this.repo.save(settings);
    }
    return settings;
  }

  async patch(dto: PatchSettingsDto): Promise<AppSettings> {
    const update: Partial<AppSettings> = { id: SINGLETON_ID };
    if (dto.isPaidMode !== undefined) update.isPaidMode = dto.isPaidMode;
    if (dto.commissionRate !== undefined) update.commissionRate = dto.commissionRate;
    await this.repo.upsert(update as AppSettings, ['id']);
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
