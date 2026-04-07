import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { Consultation } from './entities/consultation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Prescription } from './entities/prescription.entity';
import { OrdersService } from '../orders/orders.service';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { WebPushService } from '../realtime/web-push.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

/** Platform commission rate for consultations (15%) */
const PLATFORM_FEE_RATE = 0.15;

/** Prescription expiry period in days */
const PRESCRIPTION_EXPIRY_DAYS = 7;

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    private readonly ordersService: OrdersService,
    private readonly servicesService: ServicesService,
    private readonly usersService: UsersService,
    private readonly pushService: PushNotificationsService,
    private readonly webPushService: WebPushService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Doctors                                                            */
  /* ------------------------------------------------------------------ */

  /** List active doctors, optionally filtered by specialization */
  async getDoctors(specialization?: string): Promise<Doctor[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (specialization) {
      where.specialization = specialization;
    }
    return this.doctorRepo.find({ where, order: { rating: 'DESC' } });
  }

  /** Get a single doctor by ID */
  async getDoctorById(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('DOCTOR_NOT_FOUND');
    return doctor;
  }

  /** Admin: list all doctors including inactive */
  async getAllDoctors(): Promise<Doctor[]> {
    return this.doctorRepo.find({ order: { createdAt: 'DESC' } });
  }

  /** Admin: create a new doctor */
  async createDoctor(data: Partial<Doctor>): Promise<Doctor> {
    const doctor = this.doctorRepo.create(data);
    return this.doctorRepo.save(doctor);
  }

  /** Admin: update a doctor */
  async updateDoctor(id: string, data: Partial<Doctor>): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('DOCTOR_NOT_FOUND');
    Object.assign(doctor, data);
    return this.doctorRepo.save(doctor);
  }

  /* ------------------------------------------------------------------ */
  /*  Consultations                                                      */
  /* ------------------------------------------------------------------ */

  /** Create a new consultation for a client */
  async createConsultation(
    clientId: string,
    doctorId: string,
    symptoms?: string,
    suggestedSpecialization?: string,
  ): Promise<Consultation> {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId, isActive: true },
    });
    if (!doctor) {
      throw new NotFoundException('DOCTOR_NOT_FOUND_OR_INACTIVE');
    }

    const price = doctor.pricePerConsultation;
    const platformFee = Math.round(price * PLATFORM_FEE_RATE);

    const consultation = this.consultationRepo.create({
      clientId,
      doctorId,
      symptoms: symptoms ?? null,
      suggestedSpecialization: suggestedSpecialization ?? null,
      price,
      platformFee,
      status: 'PENDING',
    });

    const saved = await this.consultationRepo.save(consultation);

    // Increment doctor's consultation count (fire-and-forget)
    this.doctorRepo
      .createQueryBuilder()
      .update(Doctor)
      .set({ consultationCount: () => '"consultationCount" + 1' })
      .where('id = :id', { id: doctorId })
      .execute()
      .catch((err) =>
        this.logger.warn(`Failed to increment consultationCount: ${err}`),
      );

    return this.consultationRepo.findOne({
      where: { id: saved.id },
    }) as Promise<Consultation>;
  }

  /** Complete a consultation (admin/doctor action) */
  async completeConsultation(
    consultationId: string,
    doctorNotes?: string,
    createdOrderId?: string,
  ): Promise<Consultation> {
    const consultation = await this.consultationRepo.findOne({
      where: { id: consultationId },
    });
    if (!consultation) {
      throw new NotFoundException('CONSULTATION_NOT_FOUND');
    }
    if (consultation.status === 'COMPLETED') {
      throw new BadRequestException('CONSULTATION_ALREADY_COMPLETED');
    }
    if (consultation.status === 'CANCELED') {
      throw new BadRequestException('CONSULTATION_ALREADY_CANCELED');
    }

    consultation.status = 'COMPLETED';
    if (doctorNotes) consultation.doctorNotes = doctorNotes;
    if (createdOrderId) consultation.createdOrderId = createdOrderId;

    return this.consultationRepo.save(consultation);
  }

  /** Cancel a consultation */
  async cancelConsultation(consultationId: string): Promise<Consultation> {
    const consultation = await this.consultationRepo.findOne({
      where: { id: consultationId },
    });
    if (!consultation) {
      throw new NotFoundException('CONSULTATION_NOT_FOUND');
    }
    if (consultation.status === 'COMPLETED') {
      throw new BadRequestException('CONSULTATION_ALREADY_COMPLETED');
    }
    if (consultation.status === 'CANCELED') {
      throw new BadRequestException('CONSULTATION_ALREADY_CANCELED');
    }

    consultation.status = 'CANCELED';
    return this.consultationRepo.save(consultation);
  }

  /** Client: list own consultations (paginated) */
  async getMyConsultations(
    clientId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Consultation[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.consultationRepo.findAndCount({
      where: { clientId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /** Get a single consultation with chat messages */
  async getConsultation(id: string): Promise<Consultation & { messages: ChatMessage[] }> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
    });
    if (!consultation) {
      throw new NotFoundException('CONSULTATION_NOT_FOUND');
    }

    let messages: ChatMessage[] = [];
    try {
      messages = await this.chatMessageRepo.find({
        where: { consultationId: id },
        order: { createdAt: 'ASC' },
      });
    } catch (err) {
      this.logger.warn(`Failed to load chat messages: ${err}`);
    }

    return { ...consultation, messages };
  }

  /* ------------------------------------------------------------------ */
  /*  Chat messages                                                      */
  /* ------------------------------------------------------------------ */

  /** Save a chat message (triage or consultation) */
  async saveChatMessage(
    consultationId: string | null,
    userId: string,
    role: 'user' | 'assistant' | 'doctor',
    content: string,
  ): Promise<ChatMessage> {
    const message = this.chatMessageRepo.create({
      consultationId,
      userId,
      role,
      content,
    });
    return this.chatMessageRepo.save(message);
  }

  /* ------------------------------------------------------------------ */
  /*  Admin: list all consultations                                      */
  /* ------------------------------------------------------------------ */

  async getAllConsultations(page: number, limit: number, status?: string) {
    const qb = this.consultationRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.doctor', 'doctor')
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.where('c.status = :status', { status });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Admin stats                                                        */
  /* ------------------------------------------------------------------ */

  async getStats(): Promise<Record<string, number>> {
    try {
      const rows: { status: string; count: string }[] =
        await this.consultationRepo
          .createQueryBuilder('c')
          .select('c.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('c.status')
          .getRawMany();

      const stats: Record<string, number> = {};
      for (const row of rows) {
        stats[row.status] = parseInt(row.count, 10);
      }
      return stats;
    } catch {
      return {};
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Prescriptions                                                      */
  /* ------------------------------------------------------------------ */

  /** Create a prescription when doctor completes consultation */
  async createPrescription(
    consultationId: string,
    clientId: string,
    serviceId: string,
    doctorNotes?: string,
  ): Promise<Prescription> {
    const service = await this.servicesService.getActiveServiceOrThrow(serviceId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PRESCRIPTION_EXPIRY_DAYS);

    const prescription = this.prescriptionRepo.create({
      consultationId,
      clientId,
      serviceId: service.id,
      serviceTitle: service.title,
      servicePrice: service.price,
      doctorNotes: doctorNotes ?? null,
      status: 'PENDING',
      expiresAt,
    });

    const saved = await this.prescriptionRepo.save(prescription);

    // Send push notification to client (fire-and-forget)
    this.notifyClientPrescription(clientId, service.title, saved.id).catch(
      (err) => this.logger.warn(`Prescription push failed: ${err}`),
    );

    return saved;
  }

  /** Client confirms prescription — creates an order */
  async confirmPrescription(
    prescriptionId: string,
    clientId: string,
    orderDto: CreateOrderDto,
  ): Promise<Prescription> {
    const prescription = await this.prescriptionRepo.findOne({
      where: { id: prescriptionId },
    });
    if (!prescription) throw new NotFoundException('PRESCRIPTION_NOT_FOUND');
    if (prescription.clientId !== clientId) {
      throw new ForbiddenException('NOT_YOUR_PRESCRIPTION');
    }
    if (prescription.status !== 'PENDING') {
      throw new BadRequestException('PRESCRIPTION_ALREADY_PROCESSED');
    }
    if (new Date() > prescription.expiresAt) {
      prescription.status = 'EXPIRED';
      await this.prescriptionRepo.save(prescription);
      throw new BadRequestException('PRESCRIPTION_EXPIRED');
    }

    // Override serviceId from prescription (ignore any client-sent serviceId)
    orderDto.serviceId = prescription.serviceId;

    const order = await this.ordersService.create(clientId, orderDto);

    prescription.status = 'CONFIRMED';
    prescription.orderId = order.id;
    await this.prescriptionRepo.save(prescription);

    // Update consultation's createdOrderId
    this.consultationRepo
      .update(prescription.consultationId, { createdOrderId: order.id })
      .catch((err) =>
        this.logger.warn(`Failed to update consultation order link: ${err}`),
      );

    return prescription;
  }

  /** Client: list own prescriptions */
  async getMyPrescriptions(
    clientId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Prescription[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.prescriptionRepo.findAndCount({
      where: { clientId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  /** Client: cancel a pending prescription */
  async cancelPrescription(
    prescriptionId: string,
    clientId: string,
  ): Promise<Prescription> {
    const prescription = await this.prescriptionRepo.findOne({
      where: { id: prescriptionId },
    });
    if (!prescription) throw new NotFoundException('PRESCRIPTION_NOT_FOUND');
    if (prescription.clientId !== clientId) {
      throw new ForbiddenException('NOT_YOUR_PRESCRIPTION');
    }
    if (prescription.status !== 'PENDING') {
      throw new BadRequestException('PRESCRIPTION_ALREADY_PROCESSED');
    }

    prescription.status = 'CANCELED';
    return this.prescriptionRepo.save(prescription);
  }

  /** Send push to client about new prescription */
  private async notifyClientPrescription(
    clientId: string,
    serviceTitle: string,
    prescriptionId: string,
  ): Promise<void> {
    const title = 'Назначение от врача';
    const body = `Вам назначена процедура: ${serviceTitle}. Подтвердите адрес для вызова медсестры.`;

    const expoToken = await this.usersService.getPushToken(clientId);
    if (expoToken) {
      await this.pushService.send([expoToken], {
        title,
        body,
        sound: 'default',
        data: { prescriptionId, type: 'prescription' },
        channelId: 'order_updates',
        priority: 'high',
      });
    }

    await this.webPushService.sendToSubscriber('client', clientId, {
      title,
      body,
      data: { prescriptionId, type: 'prescription' },
      url: `/prescriptions/${prescriptionId}`,
    });
  }
}
