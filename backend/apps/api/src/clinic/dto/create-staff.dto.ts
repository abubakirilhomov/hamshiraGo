import {
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'PASSWORD_MIN_LENGTH' })
  password!: string;

  @IsIn(['CEO', 'RECEPTION', 'DOCTOR'])
  role!: 'CEO' | 'RECEPTION' | 'DOCTOR';

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;
}
