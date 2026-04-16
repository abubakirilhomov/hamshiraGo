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
import { AiAgentService } from './ai-agent.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { ClinicAppointment } from '../clinic/entities/clinic-appointment.entity';
import { CompanyUser } from '../clinic/entities/company-user.entity';

/** Default consultation commission rate (15%) — overridden by AppSettings.consultationCommissionRate */
const DEFAULT_CONSULTATION_FEE_RATE = 0.15;

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
    @InjectRepository(ClinicAppointment)
    private readonly appointmentRepo: Repository<ClinicAppointment>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepo: Repository<CompanyUser>,
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
    private readonly aiAgentService: AiAgentService,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Salomat summary helper                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a structured summary of the Salomat conversation for the doctor.
   * Falls back to raw symptoms if the AI call fails.
   */
  private async generateSalomatSummary(
    clientId: string,
    symptoms: string | null,
  ): Promise<string | null> {
    if (!symptoms) return null;
    try {
      return await this.aiAgentService.summarizeForDoctor(symptoms);
    } catch (err) {
      this.logger.warn(`generateSalomatSummary failed for ${clientId}: ${err}`);
      return symptoms; // fallback to raw symptoms
    }
  }

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
    // Use configurable rate from settings, fallback to 15%
    let feeRate = DEFAULT_CONSULTATION_FEE_RATE;
    try {
      const settings = await this.appSettingsService.get();
      if ((settings as any).consultationCommissionRate != null) {
        feeRate = Number((settings as any).consultationCommissionRate) / 100;
      }
    } catch { /* use default */ }
    const platformFee = Math.round(price * feeRate);

    const consultation = this.consultationRepo.create({
      clientId,
      doctorId,
      symptoms: symptoms ?? null,
      suggestedSpecialization: suggestedSpecialization ?? null,
      price,
      platformFee,
      status: 'PENDING',
    });

    // Generate Salomat summary for the doctor (before save to include in record)
    consultation.salomatSummary = await this.generateSalomatSummary(
      clientId,
      symptoms ?? null,
    );

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

    // Web push to doctor (fire-and-forget)
    this.webPushService.sendToSubscriber('doctor', doctorId, {
      title: 'Новая консультация',
      body: saved.symptoms
        ? `Симптомы: ${saved.symptoms.slice(0, 100)}`
        : 'Новый пациент ожидает',
      data: { type: 'new_consultation', consultationId: saved.id },
    }).catch(() => {});

    // If doctor belongs to a clinic — create appointment + notify CEO
    if (doctor.companyId) {
      this.createClinicAppointment(doctor.companyId, doctorId, clientId, saved).catch(
        (err) => this.logger.warn(`Failed to create clinic appointment: ${err.message}`),
      );
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

    // Revert payment status if was paid
    const wasPaid = consultation.paymentStatus === 'paid';
    consultation.status = 'CANCELED';
    if (wasPaid) {
      consultation.paymentStatus = 'unpaid';
    }
    const saved = await this.consultationRepo.save(consultation);

    // Release any booked slot
    await this.doctorsSlotService.releaseSlot(consultationId);

    // Cancel associated ClinicAppointment if exists
    this.appointmentRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'CANCELLED' })
      .where('"doctorId" = :doctorId AND "patientId" = :clientId AND status = :status', {
        doctorId: consultation.doctorId,
        clientId: consultation.clientId,
        status: 'SCHEDULED',
      })
      .execute()
      .catch((err) => this.logger.warn(`Failed to cancel clinic appointment: ${err.message}`));

    // Decrement doctor's consultation count
    this.doctorRepo
      .createQueryBuilder()
      .update(Doctor)
      .set({ consultationCount: () => 'GREATEST("consultationCount" - 1, 0)' })
      .where('id = :id', { id: consultation.doctorId })
      .execute()
      .catch(() => {});

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
  async getConsultation(id: string, requesterId?: string): Promise<Consultation & { messages: ChatMessage[] }> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
    });
    if (!consultation) {
      throw new NotFoundException('CONSULTATION_NOT_FOUND');
    }
    // Ownership check: only the client or the assigned doctor can view
    if (requesterId && consultation.clientId !== requesterId && consultation.doctorId !== requesterId) {
      throw new ForbiddenException('NOT_YOUR_CONSULTATION');
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

    // Require payment before doctor can accept (skip for free consultations)
    if (consultation.price > 0 && consultation.paymentStatus !== 'paid')
      throw new BadRequestException('CONSULTATION_NOT_PAID');

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

    // Credit doctor earnings (fire-and-forget)
    if (consultation.paymentStatus === 'paid') {
      const doctorEarnings = consultation.price - consultation.platformFee;
      this.doctorRepo
        .createQueryBuilder()
        .update(Doctor)
        .set({
          balance: () => `balance + ${doctorEarnings}`,
          earnings: () => `earnings + ${doctorEarnings}`,
        })
        .where('id = :id', { id: doctorId })
        .execute()
        .catch((err) =>
          this.logger.error(`Failed to credit doctor earnings: ${err.message}`),
        );
    }

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

  // ── Clinic Appointment (for clinic-affiliated doctors) ───────────────────

  /**
   * When a doctor belongs to a clinic, create a ClinicAppointment and notify the CEO.
   */
  private async createClinicAppointment(
    companyId: string,
    doctorId: string,
    clientId: string,
    consultation: Consultation,
  ): Promise<void> {
    // Get patient info
    const client = await this.usersService.findById(clientId);
    const patientName = client?.name ?? 'Пациент';
    const patientPhone = client?.phone ?? '';

    // Create appointment in clinic system
    const now = new Date();
    const appointment = this.appointmentRepo.create({
      companyId,
      doctorId,
      patientName,
      patientPhone,
      patientId: clientId,
      date: now.toISOString().slice(0, 10),
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      status: 'SCHEDULED',
      source: 'ONLINE',
      notes: consultation.symptoms ?? null,
    });
    await this.appointmentRepo.save(appointment);

    // Find CEO of the clinic
    const ceo = await this.companyUserRepo.findOne({
      where: { companyId, role: 'CEO' },
    });

    // Notify clinic via Socket.IO
    this.gateway.server
      .to(`clinic:${companyId}`)
      .emit('new_appointment', {
        appointmentId: appointment.id,
        consultationId: consultation.id,
        doctorId,
        patientName,
        source: 'ONLINE',
      });

    // Web push to clinic CEO
    this.webPushService
      .sendToSubscriber('clinic', companyId, {
        title: 'Новая онлайн-запись',
        body: `${patientName} записался к врачу (онлайн-консультация)`,
        data: { type: 'new_appointment', appointmentId: appointment.id },
      })
      .catch(() => {});

    // Telegram to CEO if linked
    if (ceo && (ceo as any).telegramChatId) {
      this.telegramService
        .sendMessage(
          (ceo as any).telegramChatId,
          `📋 <b>Новая онлайн-запись!</b>\n\nПациент: ${patientName}\nТелефон: ${patientPhone}\nСимптомы: ${consultation.symptoms ?? '—'}`,
        )
        .catch(() => {});
    }
  }

  // ── Doctor Rating ────────────────────────────────────────────────────────

  /**
   * Rate a doctor after a completed consultation.
   * Recalculates the doctor's average rating across all consultations.
   */
  async rateConsultation(
    consultationId: string,
    clientId: string,
    rating: number,
    comment?: string,
  ): Promise<Consultation> {
    const consultation = await this.consultationRepo.findOne({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException('Consultation not found');
    if (consultation.clientId !== clientId)
      throw new ForbiddenException('Not your consultation');
    if (consultation.status !== 'COMPLETED')
      throw new BadRequestException('Consultation is not completed');
    if (consultation.clientRating !== null)
      throw new BadRequestException('Already rated');
    if (rating < 1 || rating > 5)
      throw new BadRequestException('Rating must be between 1 and 5');

    consultation.clientRating = rating;
    consultation.clientComment = comment?.trim() || null;
    await this.consultationRepo.save(consultation);

    // Recalculate doctor's average rating
    this.recalculateDoctorRating(consultation.doctorId).catch((err) =>
      this.logger.error(`Failed to recalculate doctor rating: ${err.message}`),
    );

    return consultation;
  }

  /** Recalculate doctor.rating and doctor.ratingCount from all rated consultations */
  private async recalculateDoctorRating(doctorId: string): Promise<void> {
    const result = await this.consultationRepo
      .createQueryBuilder('c')
      .select('AVG(c.clientRating)', 'avg')
      .addSelect('COUNT(c.clientRating)', 'cnt')
      .where('c.doctorId = :doctorId', { doctorId })
      .andWhere('c.clientRating IS NOT NULL')
      .getRawOne();

    const avg = result?.avg ? parseFloat(Number(result.avg).toFixed(1)) : 0;
    const cnt = result?.cnt ? parseInt(result.cnt, 10) : 0;

    await this.doctorRepo.update(doctorId, {
      rating: avg,
      ratingCount: cnt,
    });
  }
}
