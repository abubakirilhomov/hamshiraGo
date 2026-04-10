import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsIn(['CHECKED_IN', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  status!: 'CHECKED_IN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

  @IsOptional()
  @IsString()
  cancelReason?: string;
}
