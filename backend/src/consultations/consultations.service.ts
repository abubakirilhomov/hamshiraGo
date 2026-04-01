import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { Consultation } from './entities/consultation.entity';
import { ChatMessage } from './entities/chat-message.entity';

/** Platform commission rate for consultations (15%) */
const PLATFORM_FEE_RATE = 0.15;

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
    if (!doctor) throw new NotFoundException('Doctor not found');
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
    if (!doctor) throw new NotFoundException('Doctor not found');
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
      throw new NotFoundException('Doctor not found or inactive');
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
      throw new NotFoundException('Consultation not found');
    }
    if (consultation.status === 'COMPLETED' || consultation.status === 'CANCELED') {
      throw new BadRequestException(
        `Consultation already ${consultation.status.toLowerCase()}`,
      );
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
      throw new NotFoundException('Consultation not found');
    }
    if (consultation.status === 'COMPLETED' || consultation.status === 'CANCELED') {
      throw new BadRequestException(
        `Consultation already ${consultation.status.toLowerCase()}`,
      );
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
      throw new NotFoundException('Consultation not found');
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
}
