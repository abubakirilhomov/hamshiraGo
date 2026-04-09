import { IsString, Matches, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';

export class RegisterDoctorDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'PASSWORD_MIN_LENGTH' })
  password!: string;

  @IsString()
  name!: string;

  @IsString()
  specialization!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerConsultation?: number;
}
