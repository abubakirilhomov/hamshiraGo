import { Controller, Get, Put, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { MedicalCardService } from './medical-card.service';
import { UpsertMedicalCardDto } from './dto/upsert-medical-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicAuthGuard } from '../auth/guards/medic-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { MedicId } from '../auth/decorators/medic-id.decorator';

@Controller('medical-card')
export class MedicalCardController {
  constructor(private readonly medicalCardService: MedicalCardService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyCard(@ClientId() userId: string) {
    return this.medicalCardService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async upsert(
    @ClientId() userId: string,
    @Body() dto: UpsertMedicalCardDto,
  ) {
    return this.medicalCardService.upsert(userId, dto);
  }

  @UseGuards(MedicAuthGuard)
  @Get('client/:clientId')
  async getClientCard(
    @MedicId() medicId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.medicalCardService.findByUserIdForMedic(clientId, medicId);
  }
}
