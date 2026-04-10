import { IsString, IsOptional, IsIn, IsUUID, IsBoolean } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['CEO', 'RECEPTION', 'DOCTOR'])
  role?: 'CEO' | 'RECEPTION' | 'DOCTOR';

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
