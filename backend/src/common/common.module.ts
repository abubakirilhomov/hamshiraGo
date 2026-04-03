import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from './cloudinary.service';
import { TelegramService } from './telegram.service';
import { AuditLogService } from './audit-log.service';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AdminAuditLog])],
  providers: [CloudinaryService, TelegramService, AuditLogService],
  exports: [CloudinaryService, TelegramService, AuditLogService],
})
export class CommonModule {}
