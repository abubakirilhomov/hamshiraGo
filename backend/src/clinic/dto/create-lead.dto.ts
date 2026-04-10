import {
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateLeadDto {
  @IsUUID()
  clinicId!: string;

  @IsString()
  @MaxLength(255)
  patientName!: string;

  @IsString()
  @MaxLength(30)
  patientPhone!: string;

  @IsOptional()
  @IsString()
  aiSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string;
}
