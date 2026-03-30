import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { ClientError } from './entities/client-error.entity';
import { ClientErrorStatus } from './entities/client-error-status.enum';
import { CreateClientErrorDto } from './dto/create-client-error.dto';

export interface ClientErrorsQuery {
  status?: ClientErrorStatus;
  appType?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface ClientErrorsPage {
  data: ClientError[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientErrorStats {
  NEW: number;
  IN_PROGRESS: number;
  FIXED: number;
  IGNORED: number;
}

@Injectable()
export class ClientErrorsService {
  constructor(
    @InjectRepository(ClientError)
    private readonly repo: Repository<ClientError>,
  ) {}

  /** Public: report a new client error (with auto-grouping by errorCode+appType). */
  async save(dto: CreateClientErrorDto): Promise<void> {
    // Auto-grouping: if errorCode is provided, look for an existing NEW/IN_PROGRESS
    // error with same errorCode + appType created within the last 24 hours.
    if (dto.errorCode) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const where: FindOptionsWhere<ClientError> = {
        errorCode: dto.errorCode,
        status: In([ClientErrorStatus.NEW, ClientErrorStatus.IN_PROGRESS]) as any,
      };
      if (dto.appType !== undefined) {
        where.appType = dto.appType;
      }

      const existing = await this.repo.findOne({
        where,
        order: { createdAt: 'DESC' },
      });

      if (existing && existing.createdAt >= cutoff) {
        await this.repo.update(existing.id, {
          count: (existing.count ?? 1) + 1,
          // Bump createdAt so it floats to the top of recent errors
          createdAt: new Date(),
        } as any);
        return;
      }
    }

    const entry = this.repo.create({
      userId: dto.userId ?? null,
      appType: dto.appType ?? null,
      screen: dto.screen ?? null,
      message: dto.message ?? null,
      stacktrace: dto.stacktrace ?? null,
      meta: dto.meta ?? null,
      deviceInfo: dto.deviceInfo ?? null,
      appVersion: dto.appVersion ?? null,
      errorCode: dto.errorCode ?? null,
      status: ClientErrorStatus.NEW,
      count: 1,
    });
    await this.repo.save(entry);
  }

  /** Admin: paginated list with optional filters. */
  async findAll(query: ClientErrorsQuery): Promise<ClientErrorsPage> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('e').orderBy('e.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('e.status = :status', { status: query.status });
    }
    if (query.appType) {
      qb.andWhere('e.appType = :appType', { appType: query.appType });
    }
    if (query.userId) {
      qb.andWhere('e.userId = :userId', { userId: query.userId });
    }
    if (query.dateFrom) {
      qb.andWhere('e.createdAt >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }
    if (query.dateTo) {
      qb.andWhere('e.createdAt <= :dateTo', { dateTo: new Date(query.dateTo) });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  /** Admin: update triage status of an error entry. */
  async updateStatus(id: string, status: ClientErrorStatus): Promise<ClientError> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) {
      throw new BadRequestException(`ClientError ${id} not found`);
    }

    entry.status = status;
    if (status === ClientErrorStatus.FIXED || status === ClientErrorStatus.IGNORED) {
      entry.resolvedAt = new Date();
    } else {
      entry.resolvedAt = null;
    }

    return this.repo.save(entry);
  }

  /** Admin: counts grouped by status. */
  async getStats(): Promise<ClientErrorStats> {
    const rows = await this.repo
      .createQueryBuilder('e')
      .select('e.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('e.status')
      .getRawMany<{ status: string; cnt: string }>();

    const stats: ClientErrorStats = {
      NEW: 0,
      IN_PROGRESS: 0,
      FIXED: 0,
      IGNORED: 0,
    };

    for (const row of rows) {
      const key = row.status as keyof ClientErrorStats;
      if (key in stats) {
        stats[key] = parseInt(row.cnt, 10);
      }
    }

    return stats;
  }
}
