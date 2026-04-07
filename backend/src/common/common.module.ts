import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from './cloudinary.service';
import { TelegramService } from './telegram.service';
import { AuditLogService } from './audit-log.service';
import { I18nService } from './i18n/i18n.service';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AdminAuditLog])],
  providers: [CloudinaryService, TelegramService, AuditLogService, I18nService],
  exports: [CloudinaryService, TelegramService, AuditLogService, I18nService],
})
export class CommonModule {}
