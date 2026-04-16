import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  /** Public list of active services, grouped info preserved via sortOrder */
  findAll(): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  findOne(id: string): Promise<Service | null> {
    return this.serviceRepo.findOne({ where: { id } });
  }

  /** Validate that a service exists, is active, and return its price */
  async getActiveServiceOrThrow(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id, isActive: true } });
    if (!service) throw new NotFoundException('SERVICE_NOT_FOUND');
    return service;
  }

  /** Batch: get multiple active services by IDs (single query) */
  async getActiveServicesByIds(ids: string[]): Promise<Service[]> {
    if (!ids.length) return [];
    const services = await this.serviceRepo.find({
      where: { id: In(ids), isActive: true },
    });
    if (services.length !== ids.length) {
      const found = new Set(services.map((s) => s.id));
      const missing = ids.find((id) => !found.has(id));
      throw new NotFoundException(`SERVICE_NOT_FOUND: ${missing}`);
    }
    return services;
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────

  async create(dto: CreateServiceDto): Promise<Service> {
    return this.serviceRepo.save(this.serviceRepo.create(dto));
  }

  async update(id: string, dto: Partial<CreateServiceDto>): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('SERVICE_NOT_FOUND');
    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  async remove(id: string): Promise<void> {
    await this.serviceRepo.update(id, { isActive: false });
  }
}
