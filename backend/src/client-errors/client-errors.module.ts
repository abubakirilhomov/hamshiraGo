import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientError } from './entities/client-error.entity';
import { ClientErrorsService } from './client-errors.service';
import { ClientErrorsController } from './client-errors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientError])],
  controllers: [ClientErrorsController],
  providers: [ClientErrorsService],
})
export class ClientErrorsModule {}
