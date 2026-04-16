import {
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateLeadFromChatDto {
  @IsUUID()
  clinicId!: string;

  @IsString()
  @MaxLength(255)
  patientName!: string;

  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be in format +998XXXXXXXXX' })
  patientPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  aiSummary?: string;
}
