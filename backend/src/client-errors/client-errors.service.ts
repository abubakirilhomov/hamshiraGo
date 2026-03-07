import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientError } from './entities/client-error.entity';
import { CreateClientErrorDto } from './dto/create-client-error.dto';

@Injectable()
export class ClientErrorsService {
  constructor(
    @InjectRepository(ClientError)
    private readonly repo: Repository<ClientError>,
  ) {}

  async save(dto: CreateClientErrorDto): Promise<void> {
    const entry = this.repo.create({
      userId: dto.userId ?? null,
      appType: dto.appType ?? null,
      screen: dto.screen ?? null,
      message: dto.message ?? null,
      stacktrace: dto.stacktrace ?? null,
      meta: dto.meta ?? null,
    });
    await this.repo.save(entry);
  }
}
