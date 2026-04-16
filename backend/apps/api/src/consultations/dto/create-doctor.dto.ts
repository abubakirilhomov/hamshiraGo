import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameUz?: string;

  @IsString()
  @MaxLength(100)
  specialization!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specializationUz?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @IsInt()
  @Min(1)
  pricePerConsultation!: number;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
