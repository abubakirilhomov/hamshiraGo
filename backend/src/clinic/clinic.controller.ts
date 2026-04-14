import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ClinicService } from './clinic.service';
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
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ClinicAuthGuard } from '../auth/guards/clinic-auth.guard';
import { ClinicRoleGuard } from '../auth/guards/clinic-role.guard';
import { ClinicUser, ClinicUserPayload } from '../auth/decorators/clinic-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

// ── Public auth routes ──────────────────────────────────────────────────

@Controller('clinic-auth')
export class ClinicAuthController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post('register')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  register(@Body() dto: CreateCompanyDto) {
    return this.clinicService.createCompany(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  login(@Body() dto: LoginClinicDto) {
    return this.clinicService.loginClinic(dto);
  }

  @Get('me')
  @UseGuards(ClinicAuthGuard)
  me(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getProfile(user.userId);
  }
}

// ── Clinic-authenticated routes ─────────────────────────────────────────

@Controller('clinic')
@UseGuards(ClinicAuthGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get('company')
  getCompany(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getCompany(user.companyId);
  }

  @Patch('company')
  @UseGuards(ClinicRoleGuard('CEO'))
  updateCompany(
    @ClinicUser() user: ClinicUserPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.clinicService.updateCompany(user.companyId, dto);
  }

  @Post('staff')
  @UseGuards(ClinicRoleGuard('CEO'))
  createStaff(
    @ClinicUser() user: ClinicUserPayload,
    @Body() dto: CreateStaffDto,
  ) {
    return this.clinicService.createStaff(user.companyId, dto);
  }

  @Get('staff')
  getStaff(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getStaff(user.companyId);
  }

  @Patch('staff/:id')
  @UseGuards(ClinicRoleGuard('CEO'))
  updateStaff(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.clinicService.updateStaff(user.companyId, id, dto);
  }

  @Delete('staff/:id')
  @UseGuards(ClinicRoleGuard('CEO'))
  deactivateStaff(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicService.deactivateStaff(user.companyId, id);
  }

  // ── Rooms (CEO only, except today which is CEO+RECEPTION) ─────────────

  @Post('rooms')
  @UseGuards(ClinicRoleGuard('CEO'))
  createRoom(
    @ClinicUser() user: ClinicUserPayload,
    @Body() dto: CreateRoomDto,
  ) {
    return this.clinicService.createRoom(user.companyId, dto);
  }

  @Get('rooms')
  getRooms(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getRooms(user.companyId);
  }

  @Get('rooms/today')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  getTodayRoomSchedule(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getTodayRoomSchedule(user.companyId);
  }

  @Get('doctors/:doctorId/rooms')
  getRoomsForDoctor(
    @ClinicUser() user: ClinicUserPayload,
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.clinicService.getRoomsForDoctor(
      user.companyId,
      doctorId,
      date,
    );
  }

  @Post('rooms/:roomId/doctors')
  @UseGuards(ClinicRoleGuard('CEO'))
  assignRoomDoctor(
    @ClinicUser() user: ClinicUserPayload,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: AssignRoomDoctorDto,
  ) {
    return this.clinicService.assignDoctorToRoom(user.companyId, roomId, dto);
  }

  @Get('rooms/:roomId/schedule')
  getRoomSchedule(
    @ClinicUser() user: ClinicUserPayload,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ) {
    return this.clinicService.getRoomSchedule(user.companyId, roomId);
  }

  // ── Company Services (CEO only) ──────────────────────────────────────

  @Post('services')
  @UseGuards(ClinicRoleGuard('CEO'))
  createCompanyService(
    @ClinicUser() user: ClinicUserPayload,
    @Body() dto: CreateCompanyServiceDto,
  ) {
    return this.clinicService.createCompanyService(user.companyId, dto);
  }

  @Get('services')
  getCompanyServices(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getCompanyServices(user.companyId);
  }

  @Patch('services/:id')
  @UseGuards(ClinicRoleGuard('CEO'))
  updateCompanyService(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCompanyServiceDto,
  ) {
    return this.clinicService.updateCompanyService(user.companyId, id, dto);
  }

  @Delete('services/:id')
  @UseGuards(ClinicRoleGuard('CEO'))
  deactivateCompanyService(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicService.deactivateCompanyService(user.companyId, id);
  }

  // ── Appointments (CEO + RECEPTION) ────────────────────────────────────

  @Post('appointments')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  createAppointment(
    @ClinicUser() user: ClinicUserPayload,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.clinicService.createAppointment(
      user.companyId,
      dto,
      user.userId,
    );
  }

  @Get('appointments')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  getAppointments(
    @ClinicUser() user: ClinicUserPayload,
    @Query('date') date?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
  ) {
    return this.clinicService.getAppointments(user.companyId, {
      date,
      doctorId,
      status,
    });
  }

  @Get('appointments/today')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  getTodayAppointments(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getTodayAppointments(user.companyId);
  }

  @Get('appointments/stats')
  @UseGuards(ClinicRoleGuard('CEO'))
  getAppointmentStats(
    @ClinicUser() user: ClinicUserPayload,
    @Query('period') period?: string,
  ) {
    const validPeriod =
      period === 'day' || period === 'week' || period === 'month'
        ? period
        : 'day';
    return this.clinicService.getAppointmentStats(user.companyId, validPeriod);
  }

  @Get('appointments/:id')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  getAppointmentById(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicService.getAppointmentById(user.companyId, id);
  }

  @Patch('appointments/:id/checkin')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  checkinAppointment(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicService.updateAppointmentStatus(user.companyId, id, {
      status: 'CHECKED_IN',
    });
  }

  @Patch('appointments/:id/status')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  updateAppointmentStatus(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.clinicService.updateAppointmentStatus(
      user.companyId,
      id,
      dto,
    );
  }

  @Patch('appointments/:id/cancel')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  cancelAppointment(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.clinicService.cancelAppointment(
      user.companyId,
      id,
      reason ?? null,
    );
  }

  // ── Leads (CEO + RECEPTION) ──────────────────────────────────────

  @Get('leads/stats')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  getLeadStats(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getLeadStats(user.companyId);
  }

  @Get('leads')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  getLeads(
    @ClinicUser() user: ClinicUserPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clinicService.getLeads(user.companyId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('leads/:id/status')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  updateLeadStatus(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.clinicService.updateLeadStatus(user.companyId, id, dto);
  }

  @Delete('leads/:id')
  @UseGuards(ClinicRoleGuard('CEO'))
  deleteLead(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicService.deleteLead(user.companyId, id);
  }

  // ── Clinic Stats (CEO only) ──────────────────────────────────────

  @Get('stats/overview')
  @UseGuards(ClinicRoleGuard('CEO'))
  getClinicOverview(
    @ClinicUser() user: ClinicUserPayload,
    @Query('period') period?: string,
  ) {
    const validPeriod =
      period === 'today' || period === 'week' || period === 'month' || period === 'year'
        ? period
        : 'today';
    return this.clinicService.getClinicOverview(user.companyId, validPeriod);
  }

  @Get('stats/monthly')
  @UseGuards(ClinicRoleGuard('CEO'))
  getMonthlyStats(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getMonthlyStats(user.companyId);
  }

  @Get('stats/doctors')
  @UseGuards(ClinicRoleGuard('CEO'))
  getDoctorStats(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getDoctorStats(user.companyId);
  }

  // ── Patient Search (Reception) ───────────────────────────────────

  @Get('patients/:phone')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  searchPatientByPhone(
    @ClinicUser() user: ClinicUserPayload,
    @Param('phone') phone: string,
  ) {
    return this.clinicService.searchPatientByPhone(user.companyId, phone);
  }

  // ── Room Stats (CEO only) ───────────────────────────────────────

  @Get('stats/rooms')
  @UseGuards(ClinicRoleGuard('CEO'))
  getRoomStats(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getRoomStats(user.companyId);
  }

  // ── Service Stats (CEO only) ────────────────────────────────────

  @Get('stats/services')
  @UseGuards(ClinicRoleGuard('CEO'))
  getServiceStats(@ClinicUser() user: ClinicUserPayload) {
    return this.clinicService.getServiceStats(user.companyId);
  }

  // ── Patient History (CEO + RECEPTION) ───────────────────────────

  @Get('patients/:id/history')
  @UseGuards(ClinicRoleGuard('CEO', 'RECEPTION'))
  getPatientHistory(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicService.getPatientHistory(user.companyId, id);
  }

  // ── Prescription (all clinic roles) ─────────────────────────────

  @Post('appointments/:id/prescription')
  createPrescription(
    @ClinicUser() user: ClinicUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.clinicService.createPrescription(
      user.companyId,
      id,
      user.userId,
      dto,
    );
  }
}

// ── Admin routes ────────────────────────────────────────────────────────

@Controller('admin/companies')
@UseGuards(AdminGuard)
export class ClinicAdminController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.clinicService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      {
        city,
        isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
    );
  }

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.clinicService.createCompany(dto);
  }

  @Patch(':id/verify')
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    return this.clinicService.verifyCompany(id, isVerified);
  }

  @Patch(':id/block')
  block(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.clinicService.blockCompany(id, isActive);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicService.getCompany(id);
  }

  @Get(':id/staff')
  getStaff(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicService.getStaff(id);
  }

  @Get(':id/stats/monthly')
  getMonthlyStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicService.getMonthlyStats(id);
  }

  @Get(':id/stats')
  getCompanyStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicService.getCompanyStatsAdmin(id);
  }
}

// ── Admin leads routes ─────────────────────────────────────────────────

@Controller('admin/leads')
@UseGuards(AdminGuard)
export class ClinicAdminLeadsController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get('overview')
  getLeadsOverview() {
    return this.clinicService.getLeadsOverview();
  }

  @Get()
  getAllLeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('clinicId') clinicId?: string,
    @Query('status') status?: string,
  ) {
    return this.clinicService.getAllLeads(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { clinicId, status },
    );
  }
}

// ── Public routes (no auth) ─────────────────────────────────────────────

@Controller('companies')
export class ClinicPublicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get()
  listPublicClinics(@Query('q') q?: string) {
    return this.clinicService.listPublicClinics(q);
  }

  @Get(':companyId')
  getPublicClinicDetail(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.clinicService.getPublicClinicDetail(companyId);
  }

  @Get(':companyId/services')
  getPublicServices(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.clinicService.getPublicServices(companyId);
  }
}

// ── Patient prescriptions (client JWT auth) ────────────────────────────

@Controller('patient')
export class PatientPrescriptionsController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get('visits')
  @UseGuards(JwtAuthGuard)
  getMyVisits(@ClientId() userId: string) {
    return this.clinicService.getMyVisits(userId);
  }

  @Get('prescriptions')
  @UseGuards(JwtAuthGuard)
  getMyPrescriptions(@ClientId() userId: string) {
    return this.clinicService.getPatientPrescriptions(userId);
  }

  @Get('prescriptions/:id')
  @UseGuards(JwtAuthGuard)
  getPrescriptionDetail(
    @ClientId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicService.getPatientPrescriptionDetail(userId, id);
  }
}
