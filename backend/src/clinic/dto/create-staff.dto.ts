import {
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  name!: string;

  @Matches(/^\+998\d{9}$/, { message: 'PHONE_FORMAT_INVALID' })
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'PASSWORD_MIN_LENGTH' })
  password!: string;

  @IsIn(['CEO', 'RECEPTION', 'DOCTOR'])
  role!: 'CEO' | 'RECEPTION' | 'DOCTOR';

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;
}
