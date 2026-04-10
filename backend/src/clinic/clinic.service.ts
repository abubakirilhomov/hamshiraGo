import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Company } from './entities/company.entity';
import { CompanyBranch } from './entities/company-branch.entity';
import { CompanyUser } from './entities/company-user.entity';
import { CompanyRoom } from './entities/company-room.entity';
import { CompanyRoomDoctor } from './entities/company-room-doctor.entity';
import { CompanyService as CompanyServiceEntity } from './entities/company-service.entity';
import { ClinicAppointment } from './entities/clinic-appointment.entity';
import { SalomatLead } from './entities/salomat-lead.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { LoginClinicDto } from './dto/login-clinic.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { AssignRoomDoctorDto } from './dto/assign-room-doctor.dto';
import { CreateCompanyServiceDto } from './dto/create-company-service.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ClinicService {
  private readonly logger = new Logger(ClinicService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyBranch)
    private readonly branchRepo: Repository<CompanyBranch>,
    @InjectRepository(CompanyUser)
    private readonly userRepo: Repository<CompanyUser>,
    @InjectRepository(CompanyRoom)
    private readonly roomRepo: Repository<CompanyRoom>,
    @InjectRepository(CompanyRoomDoctor)
    private readonly roomDoctorRepo: Repository<CompanyRoomDoctor>,
    @InjectRepository(CompanyServiceEntity)
    private readonly serviceRepo: Repository<CompanyServiceEntity>,
    @InjectRepository(ClinicAppointment)
    private readonly appointmentRepo: Repository<ClinicAppointment>,
    @InjectRepository(SalomatLead)
    private readonly leadRepo: Repository<SalomatLead>,
    @InjectRepository(User)
    private readonly patientRepo: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => PushNotificationsService))
    private readonly pushService: PushNotificationsService,
    @Inject(forwardRef(() => OrderEventsGateway))
    private readonly gateway: OrderEventsGateway,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────

  async createCompany(dto: CreateCompanyDto) {
    // Check company phone uniqueness
    const existingCompany = await this.companyRepo.findOne({
      where: { phone: dto.phone },
    });
    if (existingCompany) throw new ConflictException('COMPANY_PHONE_EXISTS');

    // Check CEO phone uniqueness
    const existingUser = await this.userRepo.findOne({
      where: { phone: dto.ceoPhone },
    });
    if (existingUser) throw new ConflictException('STAFF_PHONE_EXISTS');

    // Create company
    const company = this.companyRepo.create({
      name: dto.name,
      legalName: dto.legalName ?? null,
      phone: dto.phone,
      address: dto.address ?? null,
      city: dto.city ?? null,
      licenseNumber: dto.licenseNumber ?? null,
      licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : null,
    });
    await this.companyRepo.save(company);

    // Create CEO user
    const passwordHash = await bcrypt.hash(dto.ceoPassword, 10);
    const ceo = this.userRepo.create({
      companyId: company.id,
      role: 'CEO',
      name: dto.ceoName,
      phone: dto.ceoPhone,
      passwordHash,
    });
    await this.userRepo.save(ceo);

    // Return JWT
    const token = this.signToken(ceo, company.id);
    return { token, company, user: this.sanitizeUser(ceo) };
  }

  // ── Login ─────────────────────────────────────────────────────────────

  async loginClinic(dto: LoginClinicDto) {
    const user = await this.userRepo.findOne({
      where: { phone: dto.phone },
      relations: ['company'],
    });
    if (!user) throw new BadRequestException('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new BadRequestException('INVALID_CREDENTIALS');

    if (!user.isActive) throw new BadRequestException('ACCOUNT_BLOCKED');
    if (!user.company.isActive) throw new BadRequestException('COMPANY_BLOCKED');

    const token = this.signToken(user, user.companyId);
    return { token, company: user.company, user: this.sanitizeUser(user) };
  }

  // ── Profile ───────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });
    if (!user) throw new NotFoundException('STAFF_NOT_FOUND');
    return { user: this.sanitizeUser(user), company: user.company };
  }

  // ── Staff CRUD ────────────────────────────────────────────────────────

  async createStaff(companyId: string, dto: CreateStaffDto) {
    const existing = await this.userRepo.findOne({
      where: { phone: dto.phone },
    });
    if (existing) throw new ConflictException('STAFF_PHONE_EXISTS');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const staff = this.userRepo.create({
      companyId,
      role: dto.role,
      name: dto.name,
      phone: dto.phone,
      passwordHash,
      branchId: dto.branchId ?? null,
      doctorId: dto.doctorId ?? null,
    });
    await this.userRepo.save(staff);
    return this.sanitizeUser(staff);
  }

  async getStaff(companyId: string) {
    const staff = await this.userRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
    return staff.map((s) => this.sanitizeUser(s));
  }

  async updateStaff(companyId: string, staffId: string, dto: UpdateStaffDto) {
    const staff = await this.userRepo.findOne({
      where: { id: staffId, companyId },
    });
    if (!staff) throw new NotFoundException('STAFF_NOT_FOUND');

    if (dto.name !== undefined) staff.name = dto.name;
    if (dto.role !== undefined) staff.role = dto.role;
    if (dto.branchId !== undefined) staff.branchId = dto.branchId;
    if (dto.doctorId !== undefined) staff.doctorId = dto.doctorId;
    if (dto.isActive !== undefined) staff.isActive = dto.isActive;

    await this.userRepo.save(staff);
    return this.sanitizeUser(staff);
  }

  async deactivateStaff(companyId: string, staffId: string) {
    const staff = await this.userRepo.findOne({
      where: { id: staffId, companyId },
    });
    if (!staff) throw new NotFoundException('STAFF_NOT_FOUND');

    staff.isActive = false;
    await this.userRepo.save(staff);
    return { success: true };
  }

  // ── Company ───────────────────────────────────────────────────────────

  async getCompany(companyId: string) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('COMPANY_NOT_FOUND');
    return company;
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('COMPANY_NOT_FOUND');

    if (dto.name !== undefined) company.name = dto.name;
    if (dto.legalName !== undefined) company.legalName = dto.legalName;
    if (dto.address !== undefined) company.address = dto.address;
    if (dto.city !== undefined) company.city = dto.city;
    if (dto.licenseNumber !== undefined) company.licenseNumber = dto.licenseNumber;
    if (dto.licenseExpiry !== undefined)
      company.licenseExpiry = new Date(dto.licenseExpiry);
    if (dto.logoUrl !== undefined) company.logoUrl = dto.logoUrl;

    await this.companyRepo.save(company);
    return company;
  }

  // ── Admin ─────────────────────────────────────────────────────────────

  async findAllAdmin(
    page = 1,
    limit = 20,
    filters?: { city?: string; isVerified?: boolean; isActive?: boolean },
  ) {
    const qb = this.companyRepo.createQueryBuilder('c');

    if (filters?.city) {
      qb.andWhere('c.city = :city', { city: filters.city });
    }
    if (filters?.isVerified !== undefined) {
      qb.andWhere('c.isVerified = :isVerified', {
        isVerified: filters.isVerified,
      });
    }
    if (filters?.isActive !== undefined) {
      qb.andWhere('c.isActive = :isActive', { isActive: filters.isActive });
    }

    qb.orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async verifyCompany(id: string, isVerified: boolean) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('COMPANY_NOT_FOUND');
    company.isVerified = isVerified;
    await this.companyRepo.save(company);
    return company;
  }

  async blockCompany(id: string, isActive: boolean) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('COMPANY_NOT_FOUND');
    company.isActive = isActive;
    await this.companyRepo.save(company);
    return company;
  }

  // ── Rooms ─────────────────────────────────────────────────────────────

  async createRoom(companyId: string, dto: CreateRoomDto) {
    const room = this.roomRepo.create({
      companyId,
      name: dto.name,
      floor: dto.floor ?? null,
    });
    return this.roomRepo.save(room);
  }

  async getRooms(companyId: string) {
    return this.roomRepo.find({
      where: { companyId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async assignDoctorToRoom(
    companyId: string,
    roomId: string,
    dto: AssignRoomDoctorDto,
  ) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId, companyId },
    });
    if (!room) throw new NotFoundException('ROOM_NOT_FOUND');

    const doctor = await this.userRepo.findOne({
      where: { id: dto.doctorId, companyId, role: 'DOCTOR' },
    });
    if (!doctor) throw new NotFoundException('STAFF_NOT_FOUND');

    const assignment = this.roomDoctorRepo.create({
      roomId,
      doctorId: dto.doctorId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });
    return this.roomDoctorRepo.save(assignment);
  }

  async getRoomSchedule(companyId: string, roomId: string) {
    const room = await this.roomRepo.findOne({
      where: { id: roomId, companyId },
    });
    if (!room) throw new NotFoundException('ROOM_NOT_FOUND');

    const schedule = await this.roomDoctorRepo.find({
      where: { roomId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    return { room, schedule };
  }

  async getTodayRoomSchedule(companyId: string) {
    const today = new Date().getDay(); // 0=Sun
    const dayOfWeek = today === 0 ? 7 : today; // convert to 1=Mon..7=Sun

    const rooms = await this.roomRepo.find({
      where: { companyId, isActive: true },
      order: { name: 'ASC' },
    });

    const result = [];
    for (const room of rooms) {
      const doctors = await this.roomDoctorRepo.find({
        where: { roomId: room.id, dayOfWeek },
        order: { startTime: 'ASC' },
      });
      result.push({ room, doctors });
    }
    return result;
  }

  // ── Company Services ──────────────────────────────────────────────────

  async createCompanyService(companyId: string, dto: CreateCompanyServiceDto) {
    const existing = await this.serviceRepo.findOne({
      where: { companyId, name: dto.name },
    });
    if (existing) throw new ConflictException('SERVICE_ALREADY_EXISTS');

    const service = this.serviceRepo.create({
      companyId,
      name: dto.name,
      category: dto.category,
      price: dto.price,
      durationMinutes: dto.durationMinutes ?? null,
    });
    return this.serviceRepo.save(service);
  }

  async getCompanyServices(companyId: string) {
    return this.serviceRepo.find({
      where: { companyId },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getPublicServices(companyId: string) {
    return this.serviceRepo.find({
      where: { companyId, isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async updateCompanyService(
    companyId: string,
    serviceId: string,
    data: Partial<CreateCompanyServiceDto>,
  ) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, companyId },
    });
    if (!service) throw new NotFoundException('SERVICE_NOT_FOUND');

    if (data.name !== undefined) service.name = data.name;
    if (data.category !== undefined) service.category = data.category;
    if (data.price !== undefined) service.price = data.price;
    if (data.durationMinutes !== undefined)
      service.durationMinutes = data.durationMinutes ?? null;

    return this.serviceRepo.save(service);
  }

  async deactivateCompanyService(companyId: string, serviceId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, companyId },
    });
    if (!service) throw new NotFoundException('SERVICE_NOT_FOUND');

    service.isActive = false;
    await this.serviceRepo.save(service);
    return { success: true };
  }

  // ── Appointments ──────────────────────────────────────────────────────

  async createAppointment(
    companyId: string,
    dto: CreateAppointmentDto,
    createdBy: string | null,
  ) {
    const appointment = this.appointmentRepo.create({
      companyId,
      patientName: dto.patientName,
      patientPhone: dto.patientPhone,
      doctorId: dto.doctorId ?? null,
      serviceId: dto.serviceId ?? null,
      roomId: dto.roomId ?? null,
      date: dto.date,
      time: dto.time,
      notes: dto.notes ?? null,
      paymentType: dto.paymentType ?? null,
      createdBy,
    });
    return this.appointmentRepo.save(appointment);
  }

  async getAppointments(
    companyId: string,
    filters?: { date?: string; doctorId?: string; status?: string },
  ) {
    const qb = this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.companyId = :companyId', { companyId });

    if (filters?.date) {
      qb.andWhere('a.date = :date', { date: filters.date });
    }
    if (filters?.doctorId) {
      qb.andWhere('a.doctorId = :doctorId', { doctorId: filters.doctorId });
    }
    if (filters?.status) {
      qb.andWhere('a.status = :status', { status: filters.status });
    }

    qb.orderBy('a.date', 'ASC').addOrderBy('a.time', 'ASC');
    return qb.getMany();
  }

  async getAppointmentById(companyId: string, appointmentId: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId, companyId },
    });
    if (!appointment) throw new NotFoundException('APPOINTMENT_NOT_FOUND');
    return appointment;
  }

  async updateAppointmentStatus(
    companyId: string,
    appointmentId: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId, companyId },
    });
    if (!appointment) throw new NotFoundException('APPOINTMENT_NOT_FOUND');

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('APPOINTMENT_ALREADY_CANCELLED');
    }
    if (appointment.status === 'DONE') {
      throw new BadRequestException('APPOINTMENT_ALREADY_DONE');
    }

    appointment.status = dto.status;
    if (dto.status === 'CANCELLED' && dto.cancelReason) {
      appointment.cancelReason = dto.cancelReason;
    }

    return this.appointmentRepo.save(appointment);
  }

  async cancelAppointment(
    companyId: string,
    appointmentId: string,
    reason: string | null,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId, companyId },
    });
    if (!appointment) throw new NotFoundException('APPOINTMENT_NOT_FOUND');

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('APPOINTMENT_ALREADY_CANCELLED');
    }
    if (appointment.status === 'DONE') {
      throw new BadRequestException('APPOINTMENT_ALREADY_DONE');
    }

    appointment.status = 'CANCELLED';
    appointment.cancelReason = reason;
    return this.appointmentRepo.save(appointment);
  }

  async getTodayAppointments(companyId: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.appointmentRepo.find({
      where: { companyId, date: today },
      order: { time: 'ASC' },
    });
  }

  async getAppointmentStats(companyId: string, period: 'day' | 'week' | 'month') {
    const now = new Date();
    let startDate: string;

    if (period === 'day') {
      startDate = now.toISOString().slice(0, 10);
    } else if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().slice(0, 10);
    } else {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().slice(0, 10);
    }

    const qb = this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.companyId = :companyId', { companyId })
      .andWhere('a.date >= :startDate', { startDate });

    const total = await qb.getCount();

    const byStatus = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('a.companyId = :companyId', { companyId })
      .andWhere('a.date >= :startDate', { startDate })
      .groupBy('a.status')
      .getRawMany();

    const byDoctor = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('a.doctorId', 'doctorId')
      .addSelect('COUNT(*)::int', 'count')
      .where('a.companyId = :companyId', { companyId })
      .andWhere('a.date >= :startDate', { startDate })
      .andWhere('a.doctorId IS NOT NULL')
      .groupBy('a.doctorId')
      .getRawMany();

    return { total, byStatus, byDoctor, period, startDate };
  }

  // ── Leads (Salomat) ───────────────────────────────────────────────

  /** Called internally from Salomat AI — not exposed as public endpoint */
  async createLead(dto: CreateLeadDto): Promise<SalomatLead> {
    const lead = this.leadRepo.create({
      clinicId: dto.clinicId,
      patientName: dto.patientName,
      patientPhone: dto.patientPhone,
      aiSummary: dto.aiSummary ?? null,
      specialization: dto.specialization ?? null,
    });
    const saved = await this.leadRepo.save(lead);

    // Push notification to RECEPTION staff
    const receptionStaff = await this.userRepo.find({
      where: { companyId: dto.clinicId, role: 'RECEPTION', isActive: true },
      select: ['pushToken'],
    });
    const tokens = receptionStaff
      .map((s) => s.pushToken)
      .filter(Boolean) as string[];
    if (tokens.length) {
      this.pushService
        .send(tokens, {
          title: 'Yangi bemor!',
          body: `${dto.patientName} — ${dto.specialization || 'Konsultatsiya'}`,
          data: { type: 'new_lead', leadId: saved.id },
          channelId: 'order_updates',
          priority: 'high',
        })
        .catch(() => {});
    }

    // WebSocket notification
    this.gateway.emitNewLead(dto.clinicId, {
      leadId: saved.id,
      patientName: dto.patientName,
      specialization: dto.specialization ?? null,
    });

    this.logger.log(`Lead created id=${saved.id} clinic=${dto.clinicId}`);
    return saved;
  }

  async getLeads(
    companyId: string,
    filters?: { status?: string; page?: number; limit?: number },
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const qb = this.leadRepo
      .createQueryBuilder('l')
      .where('l.clinicId = :companyId', { companyId });

    if (filters?.status) {
      qb.andWhere('l.status = :status', { status: filters.status });
    }

    qb.orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async updateLeadStatus(
    companyId: string,
    leadId: string,
    dto: UpdateLeadStatusDto,
  ) {
    const lead = await this.leadRepo.findOne({
      where: { id: leadId, clinicId: companyId },
    });
    if (!lead) throw new NotFoundException('LEAD_NOT_FOUND');

    // Prevent updating already-processed leads (VISITED/MISSED)
    if (lead.status === 'VISITED' || lead.status === 'MISSED') {
      throw new BadRequestException('LEAD_ALREADY_PROCESSED');
    }

    lead.status = dto.status;

    // Commission logic: when lead → VISITED and pilot has ended
    if (dto.status === 'VISITED') {
      const company = await this.companyRepo.findOne({
        where: { id: companyId },
      });
      if (company?.pilotEnded) {
        // Fixed commission per visited lead (configurable via company settings)
        const commissionRate =
          (company.settings?.['commissionPerLead'] as number) ?? 50_000; // 50,000 UZS default
        lead.commissionAmount = commissionRate;
        this.logger.log(
          `Commission set: lead=${leadId} amount=${commissionRate} UZS`,
        );
      }
    }

    return this.leadRepo.save(lead);
  }

  async deleteLead(companyId: string, leadId: string) {
    const lead = await this.leadRepo.findOne({
      where: { id: leadId, clinicId: companyId },
    });
    if (!lead) throw new NotFoundException('LEAD_NOT_FOUND');

    await this.leadRepo.remove(lead);
    return { success: true };
  }

  async getLeadStats(companyId: string) {
    const total = await this.leadRepo.count({
      where: { clinicId: companyId },
    });

    const byStatus = await this.leadRepo
      .createQueryBuilder('l')
      .select('l.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('l.clinicId = :companyId', { companyId })
      .groupBy('l.status')
      .getRawMany();

    const visited =
      byStatus.find((s: { status: string }) => s.status === 'VISITED')
        ?.count ?? 0;
    const conversionRate = total > 0 ? Math.round((visited / total) * 100) : 0;

    const totalCommission = await this.leadRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.commissionAmount), 0)::int', 'total')
      .where('l.clinicId = :companyId', { companyId })
      .andWhere('l.commissionAmount IS NOT NULL')
      .getRawOne();

    return {
      total,
      byStatus,
      conversionRate,
      totalCommission: totalCommission?.total ?? 0,
    };
  }

  // ── Admin Leads ──────────────────────────────────────────────────

  async getAllLeads(
    page = 1,
    limit = 20,
    filters?: { clinicId?: string; status?: string },
  ) {
    const qb = this.leadRepo.createQueryBuilder('l');

    if (filters?.clinicId) {
      qb.andWhere('l.clinicId = :clinicId', { clinicId: filters.clinicId });
    }
    if (filters?.status) {
      qb.andWhere('l.status = :status', { status: filters.status });
    }

    qb.orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getLeadsOverview() {
    const total = await this.leadRepo.count();

    const byStatus = await this.leadRepo
      .createQueryBuilder('l')
      .select('l.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('l.status')
      .getRawMany();

    const visited =
      byStatus.find((s: { status: string }) => s.status === 'VISITED')
        ?.count ?? 0;
    const conversionRate = total > 0 ? Math.round((visited / total) * 100) : 0;

    const commissionResult = await this.leadRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.commissionAmount), 0)::int', 'total')
      .where('l.commissionAmount IS NOT NULL')
      .getRawOne();

    return {
      totalLeads: total,
      byStatus,
      conversionRate,
      totalCommission: commissionResult?.total ?? 0,
    };
  }

  // ── Clinic Stats (CEO) ──────────────────────────────────────────

  async getClinicOverview(
    companyId: string,
    period: 'today' | 'week' | 'month' | 'year',
  ) {
    const now = new Date();
    let startDate: string;

    if (period === 'today') {
      startDate = now.toISOString().slice(0, 10);
    } else if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().slice(0, 10);
    } else if (period === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().slice(0, 10);
    } else {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().slice(0, 10);
    }

    // Appointments in period
    const appointments = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('a.companyId = :companyId', { companyId })
      .andWhere('a.date >= :startDate', { startDate })
      .groupBy('a.status')
      .getRawMany();

    const totalPatients = appointments.reduce(
      (sum: number, a: { count: number }) => sum + a.count,
      0,
    );

    // Leads in period
    const leads = await this.leadRepo
      .createQueryBuilder('l')
      .select('l.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('l.clinicId = :companyId', { companyId })
      .andWhere('l.createdAt >= :startDate', { startDate })
      .groupBy('l.status')
      .getRawMany();

    const activeLeads = leads.reduce(
      (sum: number, l: { count: number }) => sum + l.count,
      0,
    );
    const visitedLeads =
      leads.find((l: { status: string }) => l.status === 'VISITED')?.count ?? 0;
    const conversionRate =
      activeLeads > 0 ? Math.round((visitedLeads / activeLeads) * 100) : 0;

    // Commission total
    const commResult = await this.leadRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.commissionAmount), 0)::int', 'total')
      .where('l.clinicId = :companyId', { companyId })
      .andWhere('l.commissionAmount IS NOT NULL')
      .andWhere('l.createdAt >= :startDate', { startDate })
      .getRawOne();

    return {
      totalPatients,
      appointmentsByStatus: appointments,
      activeLeads,
      leadsByStatus: leads,
      conversionRate,
      commission: commResult?.total ?? 0,
      period,
      startDate,
    };
  }

  async getMonthlyStats(companyId: string) {
    const result = await this.appointmentRepo
      .createQueryBuilder('a')
      .select("TO_CHAR(a.date::date, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)::int', 'patientCount')
      .where('a.companyId = :companyId', { companyId })
      .andWhere("a.date >= (CURRENT_DATE - INTERVAL '12 months')")
      .groupBy("TO_CHAR(a.date::date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return result;
  }

  async getDoctorStats(companyId: string) {
    const doctors = await this.userRepo.find({
      where: { companyId, role: 'DOCTOR', isActive: true },
      select: ['id', 'name'],
    });

    const result = [];
    for (const doctor of doctors) {
      const patientCount = await this.appointmentRepo.count({
        where: { companyId, doctorId: doctor.id },
      });
      result.push({
        doctorId: doctor.id,
        name: doctor.name,
        patientCount,
      });
    }

    return result;
  }

  // ── Patient Search (Reception) ──────────────────────────────────

  async searchPatientByPhone(companyId: string, phone: string) {
    // Search in registered users
    const patient = await this.patientRepo.findOne({
      where: { phone },
      select: ['id', 'phone', 'name', 'created_at'],
    });

    // Visit history at this clinic
    const visits = await this.appointmentRepo.find({
      where: { companyId, patientPhone: phone },
      order: { date: 'DESC', time: 'DESC' },
      take: 20,
    });

    return {
      patient: patient
        ? { id: patient.id, phone: patient.phone, name: patient.name }
        : null,
      visits,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private signToken(user: CompanyUser, companyId: string): string {
    return this.jwtService.sign({
      sub: user.id,
      role: 'clinic',
      companyId,
      clinicRole: user.role,
    });
  }

  private sanitizeUser(user: CompanyUser) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
