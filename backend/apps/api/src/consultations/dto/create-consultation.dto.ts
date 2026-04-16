import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConsultationDto {
  @IsUUID()
  doctorId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  symptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  suggestedSpecialization?: string;

  @IsOptional()
  @IsUUID()
  slotId?: string;
}
