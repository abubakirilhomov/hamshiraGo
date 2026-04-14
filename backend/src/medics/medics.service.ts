import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Medic } from './entities/medic.entity';
import { MedicSchedule } from './entities/medic-schedule.entity';
import { WithdrawalRequest, WithdrawalStatus } from './entities/withdrawal-request.entity';
import { VerificationStatus } from './entities/verification-status.enum';
import { RegisterMedicDto } from './dto/register-medic.dto';
import { LoginMedicDto } from './dto/login-medic.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { VerifyMedicDto } from './dto/verify-medic.dto';
import { SetWorkZoneDto } from './dto/set-work-zone.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import { haversineKm } from '../utils/geo';

const ONLINE_IDLE_LIMIT_MS = 5 * 60 * 60 * 1000; // 5 hours

@Injectable()
export class MedicsService {
  constructor(
    @InjectRepository(Medic)
    private medicRepo: Repository<Medic>,
    @InjectRepository(MedicSchedule)
    private readonly scheduleRepo: Repository<MedicSchedule>,
    @InjectRepository(WithdrawalRequest)
    private readonly withdrawalRepo: Repository<WithdrawalRequest>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private jwtService: JwtService,
    private readonly orderEventsGateway: OrderEventsGateway,
  ) {}

  private isMissingColumnError(err: unknown): boolean {
    return (
      err instanceof Error &&
      /column .* does not exist/i.test(err.message)
    );
  }

  /**
   * Fallback SELECT using only base columns that are guaranteed to exist on Railway.
   * Used when medicRepo.findOne() crashes due to newer columns missing from DB.
   */
  private async findBaseByField(field: 'id' | 'phone', value: string): Promise<Medic | null> {
    const rows = await this.medicRepo.query(
      `SELECT id, phone, "passwordHash", name, rating, "reviewCount",
              "experienceYears", "isOnline", "isBlocked", "verificationStatus",
              "facePhotoUrl", "licensePhotoUrl", "profilePhotoUrl",
              "verificationRejectedReason", balance, "pushToken",
              latitude, longitude, created_at, updated_at
       FROM medics WHERE "${field}" = $1 LIMIT 1`,
      [value],
    );
    return rows.length ? this.medicRepo.create(rows[0] as Partial<Medic>) : null;
  }

  private onlineCutoffDate(): Date {
    return new Date(Date.now() - ONLINE_IDLE_LIMIT_MS);
  }

  private isMedicOnlineStale(medic: Medic): boolean {
    if (!medic.isOnline) return false;
    if (!medic.lastSeenAt) return true;
    return new Date(medic.lastSeenAt).getTime() < this.onlineCutoffDate().getTime();
  }

  private async autoDisableStaleOnlineMedics(): Promise<void> {
    try {
      await this.medicRepo
        .createQueryBuilder()
        .update(Medic)
        .set({ isOnline: false })
        .where('isOnline = :isOnline', { isOnline: true })
        .andWhere('(lastSeenAt IS NULL OR lastSeenAt < :cutoff)', { cutoff: this.onlineCutoffDate() })
        .execute();
    } catch (err: unknown) {
      // lastSeenAt column may not exist on Railway — tolerate
      if (!this.isMissingColumnError(err)) throw err;
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async register(dto: RegisterMedicDto) {
    let existing: Medic | null;
    try {
      existing = await this.medicRepo.findOne({ where: { phone: dto.phone } });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        existing = await this.findBaseByField('phone', dto.phone);
      } else {
        throw err;
      }
    }
    if (existing) throw new ConflictException('MEDIC_PHONE_EXISTS');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    let saved: Medic;
    try {
      const medic = this.medicRepo.create({
        phone: dto.phone,
        name: dto.name,
        passwordHash,
        experienceYears: dto.experienceYears ?? 0,
        lastSeenAt: new Date(),
      });
      saved = await this.medicRepo.save(medic);
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        // Fallback: insert only base columns
        const rows = await this.medicRepo.query(
          `INSERT INTO medics (phone, name, "passwordHash", "experienceYears")
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [dto.phone, dto.name, passwordHash, dto.experienceYears ?? 0],
        );
        saved = this.medicRepo.create(rows[0] as Partial<Medic>);
      } else {
        throw err;
      }
    }
    return this.toAuthResponse(saved);
  }

  async login(dto: LoginMedicDto) {
    let medic: Medic | null;
    try {
      medic = await this.medicRepo.findOne({ where: { phone: dto.phone } });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        medic = await this.findBaseByField('phone', dto.phone);
      } else {
        throw err;
      }
    }
    if (!medic) throw new UnauthorizedException('INVALID_CREDENTIALS');
    const ok = await bcrypt.compare(dto.password, medic.passwordHash);
    if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS');
    if (medic.isBlocked) throw new ForbiddenException('ACCOUNT_BLOCKED_CONTACT_SUPPORT');

    let onlineDisabledReason: 'INACTIVE_5H' | null = null;
    if (this.isMedicOnlineStale(medic)) {
      try {
        await this.medicRepo.update(medic.id, { isOnline: false });
      } catch (err: unknown) {
        if (!this.isMissingColumnError(err)) throw err;
      }
      medic.isOnline = false;
      onlineDisabledReason = 'INACTIVE_5H';
    }

    medic.lastSeenAt = new Date();
    try {
      await this.medicRepo.update(medic.id, { lastSeenAt: medic.lastSeenAt });
    } catch (err: unknown) {
      // lastSeenAt column may not exist — tolerate
      if (!this.isMissingColumnError(err)) throw err;
    }

    return this.toAuthResponse(medic, onlineDisabledReason);
  }

  private toAuthResponse(medic: Medic, onlineDisabledReason: 'INACTIVE_5H' | null = null) {
    const access_token = this.jwtService.sign({ sub: medic.id, role: 'medic' });
    return {
      access_token,
      medic: {
        id: medic.id,
        phone: medic.phone,
        name: medic.name,
        experienceYears: medic.experienceYears,
        rating: medic.rating,
        balance: medic.balance,
        earnings: medic.earnings,
        isOnline: medic.isOnline,
        verificationStatus: medic.verificationStatus,
        facePhotoUrl: medic.facePhotoUrl,
        licensePhotoUrl: medic.licensePhotoUrl,
        profilePhotoUrl: medic.profilePhotoUrl,
        verificationRejectedReason: medic.verificationRejectedReason,
        onlineDisabledReason,
      },
    };
  }

  // ── Profile & location ────────────────────────────────────────────────────

  async findById(id: string): Promise<Medic | null> {
    try {
      return await this.medicRepo.findOne({ where: { id } });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        return this.findBaseByField('id', id);
      }
      throw err;
    }
  }

  async getProfile(id: string) {
    const medic = await this.findById(id);
    if (!medic) throw new UnauthorizedException();

    let onlineDisabledReason: 'INACTIVE_5H' | null = null;
    if (this.isMedicOnlineStale(medic)) {
      try {
        await this.medicRepo.update(id, { isOnline: false });
      } catch (err: unknown) {
        if (!this.isMissingColumnError(err)) throw err;
      }
      medic.isOnline = false;
      onlineDisabledReason = 'INACTIVE_5H';
    }

    medic.lastSeenAt = new Date();
    try {
      await this.medicRepo.update(id, { lastSeenAt: medic.lastSeenAt });
    } catch (err: unknown) {
      if (!this.isMissingColumnError(err)) throw err;
    }

    return {
      id: medic.id,
      phone: medic.phone,
      name: medic.name,
      experienceYears: medic.experienceYears,
      rating: medic.rating,
      reviewCount: medic.reviewCount,
      balance: medic.balance,
      earnings: medic.earnings,
      isOnline: medic.isOnline,
      isBlocked: medic.isBlocked,
      verificationStatus: medic.verificationStatus,
      facePhotoUrl: medic.facePhotoUrl,
      licensePhotoUrl: medic.licensePhotoUrl,
      profilePhotoUrl: medic.profilePhotoUrl,
      verificationRejectedReason: medic.verificationRejectedReason,
      latitude: medic.latitude,
      longitude: medic.longitude,
      telegramChatId: medic.telegramChatId,
      onlineDisabledReason,
    };
  }

  async updateProfile(id: string, data: { name?: string }): Promise<Medic> {
    const medic = await this.findById(id);
    if (!medic) throw new UnauthorizedException();
    if (data.name !== undefined) medic.name = data.name;
    return this.medicRepo.save(medic);
  }

  async saveProfilePhotoUrl(id: string, url: string): Promise<void> {
    await this.medicRepo.update(id, { profilePhotoUrl: url });
  }

  // ── Documents upload ──────────────────────────────────────────────────────

  async saveDocumentUrls(
    id: string,
    facePhotoUrl: string | null,
    licensePhotoUrl: string | null,
  ): Promise<void> {
    const update: Partial<Medic> = {};
    if (facePhotoUrl) update.facePhotoUrl = facePhotoUrl;
    if (licensePhotoUrl) update.licensePhotoUrl = licensePhotoUrl;
    if (!Object.keys(update).length) throw new BadRequestException('NO_FILES_PROVIDED');

    // Re-set status to PENDING whenever documents are (re-)uploaded
    update.verificationStatus = VerificationStatus.PENDING;
    update.verificationRejectedReason = null;
    await this.medicRepo.update(id, update);
  }

  // ── Admin: verify / block ─────────────────────────────────────────────────

  async verifyMedic(id: string, dto: VerifyMedicDto): Promise<Medic> {
    const medic = await this.findById(id);
    if (!medic) throw new NotFoundException('MEDIC_NOT_FOUND');

    medic.verificationStatus = dto.status;
    medic.verificationRejectedReason =
      dto.status === VerificationStatus.REJECTED ? (dto.reason ?? null) : null;

    try {
      return await this.medicRepo.save(medic);
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        await this.medicRepo.query(
          `UPDATE medics SET "verificationStatus" = $1, "verificationRejectedReason" = $2 WHERE id = $3`,
          [medic.verificationStatus, medic.verificationRejectedReason, id],
        );
        return (await this.findById(id)) as Medic;
      }
      throw err;
    }
  }

  async blockMedic(id: string, isBlocked: boolean): Promise<void> {
    const medic = await this.findById(id);
    if (!medic) throw new NotFoundException('MEDIC_NOT_FOUND');
    await this.medicRepo.update(id, { isBlocked });
  }

  /** Returns pending medics awaiting review (for admin dashboard) */
  async getPendingVerifications(): Promise<Partial<Medic>[]> {
    try {
      return await this.medicRepo.find({
        where: { verificationStatus: VerificationStatus.PENDING },
        select: ['id', 'name', 'phone', 'facePhotoUrl', 'licensePhotoUrl', 'created_at'],
        order: { created_at: 'ASC' },
      });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        const rows = await this.medicRepo.query(
          `SELECT id, name, phone, "facePhotoUrl", "licensePhotoUrl", created_at
           FROM medics WHERE "verificationStatus" = $1 ORDER BY created_at ASC`,
          [VerificationStatus.PENDING],
        );
        return rows;
      }
      throw err;
    }
  }

  async findAllAdmin(
    page = 1,
    limit = 20,
    search?: string,
    verificationStatus?: VerificationStatus,
    isBlocked?: boolean,
    isOnline?: boolean,
  ): Promise<{ data: Partial<Medic>[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const qb = this.medicRepo
      .createQueryBuilder('medic')
      .select([
        'medic.id',
        'medic.phone',
        'medic.name',
        'medic.experienceYears',
        'medic.rating',
        'medic.reviewCount',
        'medic.balance',
        'medic.isOnline',
        'medic.isBlocked',
        'medic.verificationStatus',
        'medic.facePhotoUrl',
        'medic.licensePhotoUrl',
        'medic.verificationRejectedReason',
        'medic.latitude',
        'medic.longitude',
        'medic.created_at',
        'medic.updated_at',
      ])
      .orderBy('medic.created_at', 'DESC')
      .take(take)
      .skip(skip);

    if (search?.trim()) {
      qb.andWhere('(medic.phone ILIKE :q OR medic.name ILIKE :q)', {
        q: `%${search.trim()}%`,
      });
    }

    if (verificationStatus) {
      qb.andWhere('medic.verificationStatus = :verificationStatus', { verificationStatus });
    }
    if (typeof isBlocked === 'boolean') {
      qb.andWhere('medic.isBlocked = :isBlocked', { isBlocked });
    }
    if (typeof isOnline === 'boolean') {
      qb.andWhere('medic.isOnline = :isOnline', { isOnline });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page: Math.max(page, 1),
      totalPages: Math.ceil(total / take),
    };
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<void> {
    try {
      await this.medicRepo.update(id, {
        ...(dto.isOnline != null ? { isOnline: dto.isOnline } : {}),
        ...(dto.latitude != null ? { latitude: dto.latitude } : {}),
        ...(dto.longitude != null ? { longitude: dto.longitude } : {}),
        lastSeenAt: new Date(),
      });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        // Fallback: update without lastSeenAt
        await this.medicRepo.update(id, {
          ...(dto.isOnline != null ? { isOnline: dto.isOnline } : {}),
          ...(dto.latitude != null ? { latitude: dto.latitude } : {}),
          ...(dto.longitude != null ? { longitude: dto.longitude } : {}),
        });
      } else {
        throw err;
      }
    }

    if (dto.latitude == null || dto.longitude == null) return;

    const activeOrder = await this.orderRepo.findOne({
      where: {
        medicId: id,
        status: In([
          OrderStatus.ASSIGNED,
          OrderStatus.ACCEPTED,
          OrderStatus.ON_THE_WAY,
          OrderStatus.ARRIVED,
          OrderStatus.SERVICE_STARTED,
        ]),
      },
      order: { updated_at: 'DESC' },
      select: ['id'],
    });

    if (!activeOrder) return;

    this.orderEventsGateway.emitMedicLocation(
      activeOrder.id,
      id,
      dto.latitude,
      dto.longitude,
      'rest',
    );
  }

  async savePushToken(id: string, token: string): Promise<void> {
    await this.medicRepo.update(id, { pushToken: token });
  }

  async updateRating(id: string, rating: number, reviewCount: number): Promise<void> {
    await this.medicRepo.update(id, { rating, reviewCount });
  }

  async addBalance(id: string, amount: number): Promise<void> {
    await this.medicRepo.increment({ id }, 'balance', amount);
  }

  async getOnlinePushTokens(): Promise<string[]> {
    await this.autoDisableStaleOnlineMedics();
    let medics: Medic[];
    try {
      medics = await this.medicRepo.find({
        where: { isOnline: true },
        select: ['pushToken'],
      });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        const rows = await this.medicRepo.query(
          `SELECT "pushToken" FROM medics WHERE "isOnline" = true`,
        );
        medics = rows;
      } else {
        throw err;
      }
    }
    return medics
      .map((m) => m.pushToken)
      .filter((t): t is string => !!t);
  }

  /** Save Telegram chat_id for the medic (called after /start in bot) */
  async saveTelegramChatId(id: string, chatId: string | null): Promise<void> {
    try {
      await this.medicRepo.update(id, { telegramChatId: chatId });
    } catch (err: unknown) {
      if (!this.isMissingColumnError(err)) throw err;
    }
  }

  /** Find a medic by their Telegram chat ID */
  async findByTelegramChatId(chatId: string): Promise<Medic | null> {
    try {
      return await this.medicRepo.findOne({ where: { telegramChatId: chatId } });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) return null;
      throw err;
    }
  }

  // ── Work zone (geofence) ──────────────────────────────────────────────────

  async setWorkZone(medicId: string, dto: SetWorkZoneDto): Promise<Medic> {
    const medic = await this.findById(medicId);
    if (!medic) throw new NotFoundException('MEDIC_NOT_FOUND');
    try {
      await this.medicRepo.update(medicId, {
        workZoneLat: dto.lat,
        workZoneLng: dto.lng,
        workZoneRadius: dto.radius,
      });
    } catch (err: unknown) {
      // workZone columns may not exist on Railway — tolerate
      if (!this.isMissingColumnError(err)) throw err;
    }
    return (await this.findById(medicId)) as Medic;
  }

  async clearWorkZone(medicId: string): Promise<void> {
    try {
      await this.medicRepo.update(medicId, {
        workZoneLat: null,
        workZoneLng: null,
        workZoneRadius: null,
      });
    } catch (err: unknown) {
      if (!this.isMissingColumnError(err)) throw err;
    }
  }

  /** Returns chat_ids of all online medics (for new order broadcast) */
  async getOnlineTelegramChatIds(): Promise<string[]> {
    await this.autoDisableStaleOnlineMedics();
    let medics: Medic[];
    try {
      medics = await this.medicRepo.find({
        where: { isOnline: true },
        select: ['telegramChatId'],
      });
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        // telegramChatId column may not exist — return empty
        return [];
      }
      throw err;
    }
    return medics
      .map((m) => m.telegramChatId)
      .filter((t): t is string => !!t);
  }

  // ── Dispatch (used by DispatchService) ────────────────────────────────────

  /** Returns online, approved, unblocked medics with location, excluding already-attempted ones */
  async findCandidatesForDispatch(excludedIds: string[]): Promise<Medic[]> {
    const qb = this.medicRepo
      .createQueryBuilder('medic')
      .where('medic.isOnline = true')
      .andWhere('medic.verificationStatus = :status', { status: 'APPROVED' })
      .andWhere('medic.isBlocked = false')
      .andWhere('medic.latitude IS NOT NULL')
      .andWhere('medic.longitude IS NOT NULL')
      .andWhere('medic.profilePhotoUrl IS NOT NULL');

    if (excludedIds.length > 0) {
      qb.andWhere('medic.id NOT IN (:...excluded)', { excluded: excludedIds });
    }

    qb.take(50);
    return qb.getMany();
  }

  // ── Nearby (used by client app) ───────────────────────────────────────────

  async findNearby(latitude: number, longitude: number, limit = 10): Promise<Medic[]> {
    await this.autoDisableStaleOnlineMedics();

    // Pre-filter at DB level with a bounding box (avoids loading all medics into memory)
    const MAX_KM = 50;
    const latDelta = MAX_KM / 111;
    const lngDelta = MAX_KM / (111 * Math.cos((latitude * Math.PI) / 180));

    const medics = await this.medicRepo
      .createQueryBuilder('medic')
      .select([
        'medic.id', 'medic.name', 'medic.rating',
        'medic.reviewCount', 'medic.experienceYears',
        'medic.latitude', 'medic.longitude',
      ])
      .where('medic.isOnline = :isOnline', { isOnline: true })
      .andWhere('medic.latitude IS NOT NULL')
      .andWhere('medic.longitude IS NOT NULL')
      .andWhere('medic.latitude >= :minLat AND medic.latitude <= :maxLat', {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
      })
      .andWhere('medic.longitude >= :minLng AND medic.longitude <= :maxLng', {
        minLng: longitude - lngDelta,
        maxLng: longitude + lngDelta,
      })
      .getMany();

    return medics
      .map((m) => ({
        ...m,
        distanceKm: haversineKm(latitude, longitude, Number(m.latitude!), Number(m.longitude!)),
      }))
      .filter(({ distanceKm }) => distanceKm <= MAX_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit) as (Medic & { distanceKm: number })[];
  }

  // ── Schedule (working hours) ──────────────────────────────────────────────

  async getSchedule(medicId: string): Promise<MedicSchedule[]> {
    return this.scheduleRepo.find({
      where: { medicId },
      order: { dayOfWeek: 'ASC', startHour: 'ASC' },
    });
  }

  async updateSchedule(medicId: string, dto: UpdateScheduleDto): Promise<MedicSchedule[]> {
    // Delete existing schedule
    await this.scheduleRepo.delete({ medicId });
    // Create new
    const slots = dto.slots.map((s) =>
      this.scheduleRepo.create({
        medicId,
        dayOfWeek: s.dayOfWeek,
        startHour: s.startHour,
        endHour: s.endHour,
        isActive: s.isActive ?? true,
      }),
    );
    return this.scheduleRepo.save(slots);
  }

  async isMedicAvailableNow(medicId: string): Promise<boolean> {
    const now = new Date();
    // Tashkent UTC+5
    const tashkentOffsetHours = 5;
    const utcHour = now.getUTCHours();
    const tashkentHour = (utcHour + tashkentOffsetHours) % 24;
    // Adjust day if hour overflow changes the day
    let tashkentDay = now.getUTCDay();
    if (utcHour + tashkentOffsetHours >= 24) {
      tashkentDay = (tashkentDay + 1) % 7;
    }

    const schedules = await this.scheduleRepo.find({
      where: { medicId, dayOfWeek: tashkentDay, isActive: true },
    });

    // No schedule entries for today = always available (backward compat)
    if (!schedules.length) return true;

    // Available if current hour falls within any active slot
    return schedules.some(
      (s) => tashkentHour >= s.startHour && tashkentHour < s.endHour,
    );
  }

  // ── Withdrawal Requests ────────────────────────────────────────────────

  /** Medic creates a withdrawal request */
  async createWithdrawalRequest(
    medicId: string,
    amount: number,
    cardNumber?: string,
  ): Promise<WithdrawalRequest> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // Check for existing pending request
    const pending = await this.withdrawalRepo.findOne({
      where: { medicId, status: 'PENDING' },
    });
    if (pending)
      throw new BadRequestException('You already have a pending withdrawal request');

    // Verify sufficient balance (pessimistic lock)
    const medic = await this.medicRepo.findOne({
      where: { id: medicId },
      lock: { mode: 'pessimistic_read' },
    });
    if (!medic) throw new NotFoundException('Medic not found');
    if (Number(medic.balance) < amount)
      throw new BadRequestException('Insufficient balance');

    const request = this.withdrawalRepo.create({
      medicId,
      amount,
      cardNumber: cardNumber || null,
      status: 'PENDING',
    });
    return this.withdrawalRepo.save(request);
  }

  /** Admin: list withdrawal requests with medic info */
  async getWithdrawalRequests(status?: WithdrawalStatus) {
    const qb = this.withdrawalRepo
      .createQueryBuilder('wr')
      .leftJoin(Medic, 'm', 'm.id = wr.medicId')
      .addSelect(['m.name', 'm.phone'])
      .orderBy('wr.createdAt', 'DESC');

    if (status) {
      qb.where('wr.status = :status', { status });
    }

    const rows = await qb.getRawAndEntities();

    return rows.entities.map((wr, i) => ({
      ...wr,
      medicName: rows.raw[i]?.m_name || null,
      medicPhone: rows.raw[i]?.m_phone || null,
    }));
  }

  /** Admin: approve withdrawal — deduct balance */
  async approveWithdrawal(id: string): Promise<WithdrawalRequest> {
    const wr = await this.withdrawalRepo.findOne({ where: { id } });
    if (!wr) throw new NotFoundException('Withdrawal request not found');
    if (wr.status !== 'PENDING')
      throw new BadRequestException('Request is not pending');

    // Deduct balance with pessimistic lock
    const medic = await this.medicRepo.findOne({
      where: { id: wr.medicId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!medic) throw new NotFoundException('Medic not found');
    if (Number(medic.balance) < wr.amount)
      throw new BadRequestException('Medic has insufficient balance');

    medic.balance = Number(medic.balance) - wr.amount;
    await this.medicRepo.save(medic);

    wr.status = 'APPROVED';
    return this.withdrawalRepo.save(wr);
  }

  /** Admin: decline withdrawal */
  async declineWithdrawal(
    id: string,
    adminNote?: string,
  ): Promise<WithdrawalRequest> {
    const wr = await this.withdrawalRepo.findOne({ where: { id } });
    if (!wr) throw new NotFoundException('Withdrawal request not found');
    if (wr.status !== 'PENDING')
      throw new BadRequestException('Request is not pending');

    wr.status = 'DECLINED';
    wr.adminNote = adminNote || null;
    return this.withdrawalRepo.save(wr);
  }
}
