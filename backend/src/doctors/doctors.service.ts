import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Doctor } from '../consultations/entities/doctor.entity';
import { DoctorSlot } from './entities/doctor-slot.entity';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDoctorDto } from './dto/login-doctor.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { VerifyDoctorDto } from './dto/verify-doctor.dto';
import { CreateSlotsDto } from './dto/create-slots.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
    @InjectRepository(DoctorSlot)
    private slotRepo: Repository<DoctorSlot>,
    private jwtService: JwtService,
  ) {}

  // ── Auth ──────────────────────────────────────────────────────────────────

  async register(dto: RegisterDoctorDto) {
    const existing = await this.doctorRepo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('DOCTOR_PHONE_EXISTS');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const doctor = this.doctorRepo.create({
      phone: dto.phone,
      name: dto.name,
      specialization: dto.specialization,
      pricePerConsultation: dto.pricePerConsultation ?? 0,
      passwordHash,
      lastSeenAt: new Date(),
    });
    const saved = await this.doctorRepo.save(doctor);
    return this.toAuthResponse(saved);
  }

  async login(dto: LoginDoctorDto) {
    const doctor = await this.doctorRepo.findOne({ where: { phone: dto.phone } });
    if (!doctor) throw new UnauthorizedException('INVALID_CREDENTIALS');
    if (!doctor.passwordHash) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const ok = await bcrypt.compare(dto.password, doctor.passwordHash);
    if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS');
    if (doctor.isBlocked) throw new ForbiddenException('ACCOUNT_BLOCKED_CONTACT_SUPPORT');

    doctor.lastSeenAt = new Date();
    await this.doctorRepo.update(doctor.id, { lastSeenAt: doctor.lastSeenAt });

    return this.toAuthResponse(doctor);
  }

  private toAuthResponse(doctor: Doctor) {
    const access_token = this.jwtService.sign({ sub: doctor.id, role: 'doctor' });
    return {
      access_token,
      doctor: {
        id: doctor.id,
        phone: doctor.phone,
        name: doctor.name,
        specialization: doctor.specialization,
        pricePerConsultation: doctor.pricePerConsultation,
        rating: doctor.rating,
        balance: doctor.balance,
        earnings: doctor.earnings,
        isOnline: doctor.isOnline,
        isActive: doctor.isActive,
        verificationStatus: doctor.verificationStatus,
        facePhotoUrl: doctor.facePhotoUrl,
        licensePhotoUrl: doctor.licensePhotoUrl,
        photoUrl: doctor.photoUrl,
        verificationRejectedReason: doctor.verificationRejectedReason,
      },
    };
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Doctor | null> {
    return this.doctorRepo.findOne({ where: { id } });
  }

  async getProfile(id: string) {
    const doctor = await this.findById(id);
    if (!doctor) throw new UnauthorizedException('DOCTOR_NOT_FOUND');

    doctor.lastSeenAt = new Date();
    await this.doctorRepo.update(id, { lastSeenAt: doctor.lastSeenAt });

    return {
      id: doctor.id,
      phone: doctor.phone,
      name: doctor.name,
      nameUz: doctor.nameUz,
      specialization: doctor.specialization,
      specializationUz: doctor.specializationUz,
      bio: doctor.bio,
      photoUrl: doctor.photoUrl,
      pricePerConsultation: doctor.pricePerConsultation,
      rating: doctor.rating,
      consultationCount: doctor.consultationCount,
      balance: doctor.balance,
      earnings: doctor.earnings,
      isOnline: doctor.isOnline,
      isActive: doctor.isActive,
      isBlocked: doctor.isBlocked,
      verificationStatus: doctor.verificationStatus,
      facePhotoUrl: doctor.facePhotoUrl,
      licensePhotoUrl: doctor.licensePhotoUrl,
      verificationRejectedReason: doctor.verificationRejectedReason,
      telegramChatId: doctor.telegramChatId,
    };
  }

  async updateProfile(id: string, dto: UpdateDoctorProfileDto): Promise<Doctor> {
    const doctor = await this.findById(id);
    if (!doctor) throw new UnauthorizedException('DOCTOR_NOT_FOUND');

    if (dto.name !== undefined) doctor.name = dto.name;
    if (dto.specialization !== undefined) doctor.specialization = dto.specialization;
    if (dto.bio !== undefined) doctor.bio = dto.bio;
    if (dto.pricePerConsultation !== undefined) doctor.pricePerConsultation = dto.pricePerConsultation;

    return this.doctorRepo.save(doctor);
  }

  async saveProfilePhotoUrl(id: string, url: string): Promise<void> {
    await this.doctorRepo.update(id, { photoUrl: url });
  }

  // ── Push & Telegram ───────────────────────────────────────────────────────

  async savePushToken(id: string, token: string): Promise<void> {
    await this.doctorRepo.update(id, { pushToken: token });
  }

  async saveTelegramChatId(id: string, chatId: string | null): Promise<void> {
    await this.doctorRepo.update(id, { telegramChatId: chatId });
  }

  async findByTelegramChatId(chatId: string): Promise<Doctor | null> {
    return this.doctorRepo.findOne({ where: { telegramChatId: chatId } });
  }

  // ── Documents upload ──────────────────────────────────────────────────────

  async saveDocumentUrls(
    id: string,
    facePhotoUrl: string | null,
    licensePhotoUrl: string | null,
  ): Promise<void> {
    const update: Partial<Doctor> = {};
    if (facePhotoUrl) update.facePhotoUrl = facePhotoUrl;
    if (licensePhotoUrl) update.licensePhotoUrl = licensePhotoUrl;
    if (!Object.keys(update).length) throw new BadRequestException('NO_FILES_PROVIDED');

    // Re-set status to PENDING whenever documents are (re-)uploaded
    update.verificationStatus = 'PENDING';
    update.verificationRejectedReason = null;
    await this.doctorRepo.update(id, update);
  }

  // ── Admin: verify / block ─────────────────────────────────────────────────

  async verifyDoctor(id: string, dto: VerifyDoctorDto): Promise<Doctor> {
    const doctor = await this.findById(id);
    if (!doctor) throw new NotFoundException('DOCTOR_NOT_FOUND');

    doctor.verificationStatus = dto.status;
    doctor.verificationRejectedReason =
      dto.status === 'REJECTED' ? (dto.reason ?? null) : null;

    return this.doctorRepo.save(doctor);
  }

  async blockDoctor(id: string, isBlocked: boolean): Promise<void> {
    const doctor = await this.findById(id);
    if (!doctor) throw new NotFoundException('DOCTOR_NOT_FOUND');
    await this.doctorRepo.update(id, { isBlocked });
  }

  async getPendingVerifications(): Promise<Partial<Doctor>[]> {
    return this.doctorRepo.find({
      where: { verificationStatus: 'PENDING' },
      select: ['id', 'name', 'phone', 'specialization', 'facePhotoUrl', 'licensePhotoUrl', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async findAllAdmin(
    page = 1,
    limit = 20,
    search?: string,
    verificationStatus?: string,
    isBlocked?: boolean,
  ): Promise<{ data: Partial<Doctor>[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const qb = this.doctorRepo
      .createQueryBuilder('doctor')
      .select([
        'doctor.id',
        'doctor.phone',
        'doctor.name',
        'doctor.specialization',
        'doctor.rating',
        'doctor.consultationCount',
        'doctor.balance',
        'doctor.earnings',
        'doctor.isOnline',
        'doctor.isActive',
        'doctor.isBlocked',
        'doctor.verificationStatus',
        'doctor.facePhotoUrl',
        'doctor.licensePhotoUrl',
        'doctor.photoUrl',
        'doctor.verificationRejectedReason',
        'doctor.createdAt',
        'doctor.updatedAt',
      ])
      .orderBy('doctor.createdAt', 'DESC')
      .take(take)
      .skip(skip);

    if (search?.trim()) {
      qb.andWhere('(doctor.phone ILIKE :q OR doctor.name ILIKE :q)', {
        q: `%${search.trim()}%`,
      });
    }

    if (verificationStatus) {
      qb.andWhere('doctor.verificationStatus = :verificationStatus', { verificationStatus });
    }
    if (typeof isBlocked === 'boolean') {
      qb.andWhere('doctor.isBlocked = :isBlocked', { isBlocked });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page: Math.max(page, 1),
      totalPages: Math.ceil(total / take),
    };
  }

  // ── Doctor Slots ──────────────────────────────────────────────────────────

  async createSlots(doctorId: string, dto: CreateSlotsDto): Promise<DoctorSlot[]> {
    const [startH, startM] = dto.startTime.split(':').map(Number);
    const [endH, endM] = dto.endTime.split(':').map(Number);

    const baseDate = new Date(dto.date);
    const start = new Date(baseDate);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(baseDate);
    end.setHours(endH, endM, 0, 0);

    if (start >= end) {
      throw new BadRequestException('START_TIME_MUST_BE_BEFORE_END_TIME');
    }

    const slots: DoctorSlot[] = [];
    let cursor = new Date(start);

    while (cursor.getTime() + dto.intervalMinutes * 60_000 <= end.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + dto.intervalMinutes * 60_000);

      const slot = this.slotRepo.create({
        doctorId,
        startsAt: slotStart,
        endsAt: slotEnd,
      });
      slots.push(slot);

      cursor = slotEnd;
    }

    if (slots.length === 0) {
      throw new BadRequestException('NO_SLOTS_GENERATED');
    }

    return this.slotRepo.save(slots);
  }

  async getAvailableSlots(doctorId: string, date: string): Promise<DoctorSlot[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return this.slotRepo.find({
      where: {
        doctorId,
        isBooked: false,
        startsAt: Between(dayStart, dayEnd),
      },
      order: { startsAt: 'ASC' },
    });
  }

  async getDoctorSlots(doctorId: string, date?: string): Promise<DoctorSlot[]> {
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return this.slotRepo.find({
        where: {
          doctorId,
          startsAt: Between(dayStart, dayEnd),
        },
        order: { startsAt: 'ASC' },
      });
    }

    return this.slotRepo.find({
      where: { doctorId },
      order: { startsAt: 'ASC' },
    });
  }

  async bookSlot(slotId: string, consultationId: string): Promise<DoctorSlot> {
    const slot = await this.slotRepo.findOne({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('SLOT_NOT_FOUND');
    if (slot.isBooked) throw new BadRequestException('SLOT_ALREADY_BOOKED');

    slot.isBooked = true;
    slot.consultationId = consultationId;
    return this.slotRepo.save(slot);
  }

  async releaseSlot(consultationId: string): Promise<void> {
    const slot = await this.slotRepo.findOne({ where: { consultationId } });
    if (!slot) return; // no slot linked — nothing to release
    slot.isBooked = false;
    slot.consultationId = null;
    await this.slotRepo.save(slot);
  }

  async deleteSlot(doctorId: string, slotId: string): Promise<void> {
    const slot = await this.slotRepo.findOne({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('SLOT_NOT_FOUND');
    if (slot.doctorId !== doctorId) throw new ForbiddenException('NOT_YOUR_SLOT');
    if (slot.isBooked) throw new BadRequestException('CANNOT_DELETE_BOOKED_SLOT');
    await this.slotRepo.remove(slot);
  }
}
