import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertMedicalCardDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  allergies?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chronicDiseases?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
