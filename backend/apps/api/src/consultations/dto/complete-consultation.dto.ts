import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CompleteConsultationDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  doctorNotes?: string;

  /** If provided, auto-create a nursing order for this service */
  @IsOptional()
  @IsUUID()
  createOrderServiceId?: string;
}
