import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConsultationsService } from './consultations.service';
import { AiAgentService } from './ai-agent.service';
import { VideoService } from './video.service';
import { SalomatAuditService } from './salomat-audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { DoctorAuthGuard } from '../auth/guards/doctor-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { DoctorId } from '../auth/decorators/doctor-id.decorator';
import { AiChatDto } from './dto/ai-chat.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { ConfirmPrescriptionDto } from './dto/confirm-prescription.dto';
import { CreateLeadFromChatDto } from './dto/create-lead-from-chat.dto';
import { UsersService } from '../users/users.service';
import { ClinicService } from '../clinic/clinic.service';

@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly aiAgentService: AiAgentService,
    private readonly videoService: VideoService,
    private readonly salomatAuditService: SalomatAuditService,
    private readonly usersService: UsersService,
    private readonly clinicService: ClinicService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  AI Triage Chat                                                     */
  /* ------------------------------------------------------------------ */

  /** AI-powered symptom triage chat */
  @UseGuards(JwtAuthGuard)
  @Post('ai-chat')
  async aiChat(
    @ClientId() userId: string,
    @Body() dto: AiChatDto,
    @Headers('accept-language') acceptLang?: string,
  ) {
    const lang = acceptLang?.startsWith('uz') ? 'uz' : 'ru';
    const patientContext = await this.loadPatientContext(userId);

    const reply = await this.aiAgentService.chat(
      dto.messages,
      userId,
      patientContext,
      lang,
    );
    const recommendation = this.aiAgentService.parseRecommendation(reply);

    // Save user's last message and AI reply (fire-and-forget)
    const lastUserMsg = dto.messages[dto.messages.length - 1];
    if (lastUserMsg?.role === 'user') {
      this.consultationsService
        .saveChatMessage(null, userId, 'user', lastUserMsg.content)
        .catch(() => {});
    }
    this.consultationsService
      .saveChatMessage(null, userId, 'assistant', reply)
      .catch(() => {});

    return {
      reply,
      recommendation: recommendation.specialization
        ? recommendation
        : undefined,
    };
  }

  /** AI-powered symptom triage chat — streaming via SSE */
  @UseGuards(JwtAuthGuard)
  @Post('ai-chat/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async aiChatStream(
    @ClientId() userId: string,
    @Body() body: { messages: { role: string; content: string }[] },
    @Headers('accept-language') acceptLang: string | undefined,
    @Res() res: Response,
  ) {
    const lang = acceptLang?.startsWith('uz') ? 'uz' : 'ru';
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const patientContext = await this.loadPatientContext(userId);
      let fullReply = '';

      for await (const chunk of this.aiAgentService.chatStream(
        body.messages,
        userId,
        patientContext,
        lang,
      )) {
        fullReply += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Parse recommendation from full reply
      const recommendation =
        this.aiAgentService.parseRecommendation(fullReply);
      res.write(
        `data: ${JSON.stringify({ done: true, recommendation })}\n\n`,
      );

      // Save to DB (fire-and-forget)
      const lastUserMsg = body.messages[body.messages.length - 1];
      if (lastUserMsg?.role === 'user') {
        this.consultationsService
          .saveChatMessage(null, userId, 'user', lastUserMsg.content)
          .catch(() => {});
      }
      this.consultationsService
        .saveChatMessage(null, userId, 'assistant', fullReply)
        .catch(() => {});

      // Audit if red flag detected
      if (
        fullReply.includes('103') ||
        fullReply.includes('скорую') ||
        fullReply.includes('tez yordam')
      ) {
        this.salomatAuditService
          .logRedFlag(userId, fullReply)
          .catch(() => {});
      }
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
    }

    res.end();
  }

  /** Create a clinic lead from Salomat AI recommendation */
  @UseGuards(JwtAuthGuard)
  @Post('ai-chat/create-lead')
  @HttpCode(HttpStatus.CREATED)
  async createLeadFromSalomat(
    @ClientId() userId: string,
    @Body() dto: CreateLeadFromChatDto,
  ) {
    return this.clinicService.createLead({
      clinicId: dto.clinicId,
      patientName: dto.patientName,
      patientPhone: dto.patientPhone,
      specialization: dto.specialization,
      aiSummary: dto.aiSummary,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Doctors (public/client)                                            */
  /* ------------------------------------------------------------------ */

  /** List active doctors, optionally filter by specialization */
  @Get('doctors')
  getDoctors(@Query('specialization') specialization?: string) {
    return this.consultationsService.getDoctors(specialization);
  }

  /** Get a single doctor */
  @Get('doctors/:id')
  getDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.getDoctorById(id);
  }

  /* ------------------------------------------------------------------ */
  /*  Consultations (client)                                             */
  /* ------------------------------------------------------------------ */

  /** Book a consultation */
  @UseGuards(JwtAuthGuard)
  @Post()
  createConsultation(
    @ClientId() userId: string,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.consultationsService.createConsultation(
      userId,
      dto.doctorId,
      dto.symptoms,
      dto.suggestedSpecialization,
      dto.slotId,
    );
  }

  /** List own consultations (paginated) */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyConsultations(
    @ClientId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.consultationsService.getMyConsultations(userId, p, l);
  }

  /** Get consultation detail with messages */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getConsultation(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.getConsultation(id);
  }

  /* ------------------------------------------------------------------ */
  /*  Prescriptions (client)                                             */
  /* ------------------------------------------------------------------ */

  /** List own prescriptions (paginated) */
  @UseGuards(JwtAuthGuard)
  @Get('prescriptions/my')
  getMyPrescriptions(
    @ClientId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.consultationsService.getMyPrescriptions(userId, p, l);
  }

  /** Confirm prescription — provide location and create order */
  @UseGuards(JwtAuthGuard)
  @Post('prescriptions/:id/confirm')
  confirmPrescription(
    @Param('id', ParseUUIDPipe) id: string,
    @ClientId() userId: string,
    @Body() dto: ConfirmPrescriptionDto,
  ) {
    return this.consultationsService.confirmPrescription(id, userId, {
      serviceId: '', // will be overridden by prescription's serviceId
      location: dto.location,
      isUrgent: dto.isUrgent,
      discountAmount: dto.discountAmount,
    });
  }

  /** Cancel a pending prescription */
  @UseGuards(JwtAuthGuard)
  @Post('prescriptions/:id/cancel')
  cancelPrescription(
    @Param('id', ParseUUIDPipe) id: string,
    @ClientId() userId: string,
  ) {
    return this.consultationsService.cancelPrescription(id, userId);
  }

  /* ------------------------------------------------------------------ */
  /*  Video calls                                                        */
  /* ------------------------------------------------------------------ */

  /** Initiate a video call for a consultation */
  @UseGuards(JwtAuthGuard)
  @Post(':id/call')
  initiateCall(
    @Param('id', ParseUUIDPipe) id: string,
    @ClientId() userId: string,
  ) {
    return this.videoService.initiateCall(id, userId);
  }

  /** Join an existing video call */
  @UseGuards(JwtAuthGuard)
  @Post(':id/call/join')
  joinCall(
    @Param('id', ParseUUIDPipe) id: string,
    @ClientId() userId: string,
    @Body('role') role: 'client' | 'doctor',
  ) {
    return this.videoService.joinCall(id, userId, role || 'client');
  }

  /** End a video call */
  @UseGuards(JwtAuthGuard)
  @Post(':id/call/end')
  endCall(
    @Param('id', ParseUUIDPipe) id: string,
    @ClientId() userId: string,
  ) {
    return this.videoService.endCall(id, userId);
  }

  /** Get video call status */
  @UseGuards(JwtAuthGuard)
  @Get(':id/call/status')
  getCallStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.getCallStatus(id);
  }

  /* ------------------------------------------------------------------ */
  /*  Admin endpoints                                                    */
  /* ------------------------------------------------------------------ */

  /** Admin: Salomat audit stats */
  @UseGuards(AdminGuard)
  @Get('admin/salomat-audit/stats')
  getSalomatAuditStats(@Query('days') days?: string) {
    return this.salomatAuditService.getStats(
      parseInt(days ?? '30', 10) || 30,
    );
  }

  /** Admin: create a doctor */
  @UseGuards(AdminGuard)
  @Post('admin/doctors')
  createDoctor(@Body() dto: CreateDoctorDto) {
    return this.consultationsService.createDoctor(dto);
  }

  /** Admin: update a doctor */
  @UseGuards(AdminGuard)
  @Patch('admin/doctors/:id')
  updateDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorDto,
  ) {
    return this.consultationsService.updateDoctor(id, dto);
  }

  /** Admin: list all doctors (including inactive) */
  @UseGuards(AdminGuard)
  @Get('admin/doctors')
  getAllDoctors() {
    return this.consultationsService.getAllDoctors();
  }

  /** Admin: list all consultations (paginated, filterable by status) */
  @UseGuards(AdminGuard)
  @Get('admin/all')
  getAllConsultations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.consultationsService.getAllConsultations(p, l, status);
  }

  /** Admin: complete consultation with notes + optional prescription */
  @UseGuards(AdminGuard)
  @Patch('admin/:id/complete')
  async completeConsultation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    const consultation = await this.consultationsService.completeConsultation(
      id,
      dto.doctorNotes,
    );

    // If a service was prescribed, create a prescription for the client
    if (dto.createOrderServiceId) {
      const prescription = await this.consultationsService.createPrescription(
        consultation.id,
        consultation.clientId,
        dto.createOrderServiceId,
        dto.doctorNotes,
      );
      return { ...consultation, prescription };
    }

    return consultation;
  }

  /** Admin: cancel a consultation */
  @UseGuards(AdminGuard)
  @Patch('admin/:id/cancel')
  cancelConsultation(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.cancelConsultation(id);
  }

  /** Admin: consultation stats */
  @UseGuards(AdminGuard)
  @Get('admin/stats')
  getStats() {
    return this.consultationsService.getStats();
  }

  /* ------------------------------------------------------------------ */
  /*  Doctor endpoints                                                   */
  /* ------------------------------------------------------------------ */

  /** Doctor: list pending consultations assigned to this doctor */
  @UseGuards(DoctorAuthGuard)
  @Get('doctor/pending')
  getDoctorPending(@DoctorId() doctorId: string) {
    return this.consultationsService.getDoctorPending(doctorId);
  }

  /** Doctor: list own consultations (paginated) */
  @UseGuards(DoctorAuthGuard)
  @Get('doctor/my')
  getDoctorConsultations(
    @DoctorId() doctorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.consultationsService.getDoctorConsultations(doctorId, p, l);
  }

  /** Doctor: accept a pending consultation */
  @UseGuards(DoctorAuthGuard)
  @Post(':id/doctor-accept')
  @HttpCode(HttpStatus.OK)
  doctorAccept(
    @Param('id', ParseUUIDPipe) id: string,
    @DoctorId() doctorId: string,
  ) {
    return this.consultationsService.doctorAcceptConsultation(id, doctorId);
  }

  /** Doctor: decline a pending consultation */
  @UseGuards(DoctorAuthGuard)
  @Post(':id/doctor-decline')
  @HttpCode(HttpStatus.OK)
  doctorDecline(
    @Param('id', ParseUUIDPipe) id: string,
    @DoctorId() doctorId: string,
  ) {
    return this.consultationsService.doctorDeclineConsultation(id, doctorId);
  }

  /** Doctor: complete a consultation with notes */
  @UseGuards(DoctorAuthGuard)
  @Patch(':id/doctor-complete')
  doctorComplete(
    @Param('id', ParseUUIDPipe) id: string,
    @DoctorId() doctorId: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    return this.consultationsService.doctorCompleteConsultation(
      id,
      doctorId,
      dto,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  /** Load patient context from user profile for Salomat */
  private async loadPatientContext(
    userId: string,
  ): Promise<{ name?: string } | undefined> {
    try {
      const user = await this.usersService.findById(userId);
      if (user?.name) {
        return { name: user.name };
      }
    } catch {
      // ignore — patient context is optional
    }
    return undefined;
  }
}
