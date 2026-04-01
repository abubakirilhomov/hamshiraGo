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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { AiChatDto } from './dto/ai-chat.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';

@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly aiAgentService: AiAgentService,
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

  /** Admin: complete consultation with notes + optional auto-order */
  @UseGuards(AdminGuard)
  @Patch('admin/:id/complete')
  completeConsultation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    // Note: auto-order creation would be handled by the caller
    // passing the created order ID after creating it via OrdersService
    return this.consultationsService.completeConsultation(
      id,
      dto.doctorNotes,
    );
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
