import {
  IsString,
  IsOptional,
  Matches,
  MinLength,
  IsDateString,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  phone!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  // CEO account created together with the company
  @IsString()
  ceoName!: string;

  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  ceoPhone!: string;

  @IsString()
  @MinLength(6, { message: 'PASSWORD_MIN_LENGTH' })
  ceoPassword!: string;
}
