import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyDoctorDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
