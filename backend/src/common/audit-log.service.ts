import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly auditRepo: Repository<AdminAuditLog>,
  ) {}

  /** Log an admin action (fire-and-forget) */
  log(params: {
    adminId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ip?: string;
  }): void {
    this.auditRepo
      .save(
        this.auditRepo.create({
          adminId: params.adminId,
          action: params.action,
          targetType: params.targetType ?? null,
          targetId: params.targetId ?? null,
          details: params.details ? JSON.stringify(params.details) : null,
          ip: params.ip ?? null,
        }),
      )
      .catch((err) => this.logger.warn(`Audit log failed: ${err}`));
  }

  /** Get audit logs (paginated) */
  async findAll(
    page: number,
    limit: number,
    action?: string,
  ): Promise<{ data: AdminAuditLog[]; total: number; page: number; limit: number }> {
    const qb = this.auditRepo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (action) {
      qb.where('a.action = :action', { action });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }
}
