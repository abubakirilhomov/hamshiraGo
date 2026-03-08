import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from './entities/app-settings.entity';

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
      settings = this.repo.create({ id: SINGLETON_ID, isPaidMode: false });
      await this.repo.save(settings);
    }
    return settings;
  }

  async setIsPaidMode(isPaidMode: boolean): Promise<AppSettings> {
    await this.repo.upsert({ id: SINGLETON_ID, isPaidMode }, ['id']);
    return this.get();
  }

  /** Convenience: returns just the boolean flag */
  async isPaidMode(): Promise<boolean> {
    const s = await this.get();
    return s.isPaidMode;
  }
}
