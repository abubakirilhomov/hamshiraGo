import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminGuard } from './auth/guards/admin.guard';
import { AuditLogService } from './common/audit-log.service';

@Controller()
export class AppController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'hamshira-go-api' };
  }

  @Get('health/detailed')
  async healthDetailed() {
    const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

    // Database
    const dbStart = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = { status: 'ok', latency: Date.now() - dbStart };
    } catch (err: any) {
      checks.database = { status: 'error', latency: Date.now() - dbStart, error: err.message };
    }

    // Cloudinary
    const cloudStart = Date.now();
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/health', { signal: AbortSignal.timeout(5000) });
      checks.cloudinary = { status: res.ok ? 'ok' : 'degraded', latency: Date.now() - cloudStart };
    } catch {
      checks.cloudinary = { status: 'unreachable', latency: Date.now() - cloudStart };
    }

    // Expo Push
    const expoStart = Date.now();
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [] }),
        signal: AbortSignal.timeout(5000),
      });
      checks.expoPush = { status: res.ok ? 'ok' : 'degraded', latency: Date.now() - expoStart };
    } catch {
      checks.expoPush = { status: 'unreachable', latency: Date.now() - expoStart };
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      service: 'hamshira-go-api',
      uptime: Math.floor(process.uptime()),
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024),
      checks,
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/audit-log')
  getAuditLog(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.auditLogService.findAll(p, l, action);
  }
}
