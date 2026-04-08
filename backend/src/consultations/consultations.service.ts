import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
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
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import { TelegramService } from '../common/telegram.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { DoctorsService } from '../doctors/doctors.service';

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
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly servicesService: ServicesService,
    private readonly usersService: UsersService,
    private readonly pushService: PushNotificationsService,
    private readonly webPushService: WebPushService,
    @Inject(forwardRef(() => OrderEventsGateway))
    private readonly gateway: OrderEventsGateway,
    private readonly telegramService: TelegramService,
    @Inject(forwardRef(() => DoctorsService))
    private readonly doctorsSlotService: DoctorsService,
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
    slotId?: string,
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

    // Book the slot if one was provided
    if (slotId) {
      await this.doctorsSlotService.bookSlot(slotId, saved.id);
    }

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

    // Notify doctor via WebSocket
    this.gateway.emitNewConsultation(doctorId, {
      consultationId: saved.id,
      clientId,
      symptoms: saved.symptoms,
      price: saved.price,
    });

    // Push notification to doctor (fire-and-forget)
    if (doctor.pushToken) {
      this.pushService.send([doctor.pushToken], {
        title: 'Новая консультация',
        body: saved.symptoms
          ? `Симптомы: ${saved.symptoms.slice(0, 100)}`
          : 'Новый пациент ожидает',
        data: { consultationId: saved.id, type: 'new_consultation' },
        channelId: 'order_updates',
        priority: 'high',
      }).catch(() => {});
    }

    // Telegram notification to doctor (fire-and-forget)
    if (doctor.telegramChatId) {
      this.telegramService.sendMessage(
        doctor.telegramChatId,
        `🩺 <b>Новая консультация!</b>\n\n${saved.symptoms ?? 'Пациент ожидает'}\n💰 ${saved.price.toLocaleString('ru-RU')} UZS`,
      ).catch(() => {});
    }

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
    const saved = await this.consultationRepo.save(consultation);

    // Release any booked slot
    await this.doctorsSlotService.releaseSlot(consultationId);

    return saved;
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

  /* ------------------------------------------------------------------ */
  /*  Doctor endpoints                                                   */
  /* ------------------------------------------------------------------ */

  /** Doctor: list pending consultations assigned to this doctor */
  async getDoctorPending(doctorId: string): Promise<Consultation[]> {
    return this.consultationRepo.find({
      where: { doctorId, status: 'PENDING' },
      order: { createdAt: 'DESC' },
      relations: { doctor: true },
    });
  }

  /** Doctor: list own consultations (paginated) */
  async getDoctorConsultations(doctorId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [data, total] = await this.consultationRepo.findAndCount({
      where: { doctorId },
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return { data, total, page, totalPages: Math.ceil(total / take) };
  }

  /** Doctor: accept a pending consultation */
  async doctorAcceptConsultation(
    id: string,
    doctorId: string,
  ): Promise<Consultation> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
    });
    if (!consultation)
      throw new NotFoundException('CONSULTATION_NOT_FOUND');
    if (consultation.doctorId !== doctorId)
      throw new ForbiddenException('NOT_YOUR_CONSULTATION');
    if (consultation.status !== 'PENDING')
      throw new BadRequestException('CONSULTATION_ALREADY_PROCESSED');

    consultation.status = 'ACTIVE';
    const saved = await this.consultationRepo.save(consultation);

    // Notify client via push (fire-and-forget)
    const expoToken = await this.usersService
      .getPushToken(consultation.clientId)
      .catch(() => null);
    if (expoToken) {
      this.pushService
        .send([expoToken], {
          title: 'Консультация принята',
          body: 'Врач принял вашу консультацию',
          data: { consultationId: id, type: 'consultation_accepted' },
          channelId: 'order_updates',
          priority: 'high',
        })
        .catch(() => {});
    }

    return saved;
  }

  /** Doctor: decline a pending consultation */
  async doctorDeclineConsultation(
    id: string,
    doctorId: string,
  ): Promise<void> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
    });
    if (!consultation)
      throw new NotFoundException('CONSULTATION_NOT_FOUND');
    if (consultation.doctorId !== doctorId)
      throw new ForbiddenException('NOT_YOUR_CONSULTATION');
    if (consultation.status !== 'PENDING')
      throw new BadRequestException('CONSULTATION_ALREADY_PROCESSED');

    consultation.status = 'CANCELED';
    await this.consultationRepo.save(consultation);

    // Release any booked slot
    await this.doctorsSlotService.releaseSlot(id);

    // Notify client via push (fire-and-forget)
    const expoToken = await this.usersService
      .getPushToken(consultation.clientId)
      .catch(() => null);
    if (expoToken) {
      this.pushService
        .send([expoToken], {
          title: 'Консультация отклонена',
          body: 'Врач отклонил вашу консультацию. Попробуйте выбрать другого врача.',
          data: { consultationId: id, type: 'consultation_declined' },
          channelId: 'order_updates',
          priority: 'high',
        })
        .catch(() => {});
    }
  }

  /** Doctor: complete a consultation with notes + optional prescription */
  async doctorCompleteConsultation(
    id: string,
    doctorId: string,
    dto: CompleteConsultationDto,
  ): Promise<Consultation> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
    });
    if (!consultation)
      throw new NotFoundException('CONSULTATION_NOT_FOUND');
    if (consultation.doctorId !== doctorId)
      throw new ForbiddenException('NOT_YOUR_CONSULTATION');
    if (consultation.status === 'COMPLETED')
      throw new BadRequestException('CONSULTATION_ALREADY_COMPLETED');
    if (consultation.status === 'CANCELED')
      throw new BadRequestException('CONSULTATION_ALREADY_CANCELED');

    consultation.status = 'COMPLETED';
    consultation.doctorNotes = dto.doctorNotes ?? null;
    const saved = await this.consultationRepo.save(consultation);

    // If a service was prescribed, create a prescription for the client
    if (dto.createOrderServiceId) {
      const prescription = await this.createPrescription(
        consultation.id,
        consultation.clientId,
        dto.createOrderServiceId,
        dto.doctorNotes,
      );
      return { ...saved, prescription } as any;
    }

    return saved;
  }

  /* ------------------------------------------------------------------ */
  /*  Doctor helpers (used by TelegramBotService)                        */
  /* ------------------------------------------------------------------ */

  /** Find a doctor by ID (used by TelegramBotService for linking) */
  async findDoctorById(id: string): Promise<Doctor | null> {
    return this.doctorRepo.findOne({ where: { id } });
  }

  /** Save a Telegram chat ID for a doctor */
  async saveDoctorTelegramChatId(
    doctorId: string,
    chatId: string,
  ): Promise<void> {
    await this.doctorRepo.update(doctorId, { telegramChatId: chatId });
  }
}
