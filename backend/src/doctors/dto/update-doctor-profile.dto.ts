import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerConsultation?: number;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}
