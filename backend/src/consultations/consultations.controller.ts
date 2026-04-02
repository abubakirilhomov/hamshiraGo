import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { AiAgentService } from './ai-agent.service';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { AiChatDto } from './dto/ai-chat.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { ConfirmPrescriptionDto } from './dto/confirm-prescription.dto';

@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly aiAgentService: AiAgentService,
    private readonly videoService: VideoService,
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
  ) {
    const reply = await this.aiAgentService.chat(dto.messages, userId);
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
}
