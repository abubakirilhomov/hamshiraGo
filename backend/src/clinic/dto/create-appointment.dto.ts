import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @MaxLength(255)
  patientName!: string;

  @IsString()
  @MaxLength(30)
  patientPhone!: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date!: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'time must be in HH:MM format' })
  time!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['CASH', 'TERMINAL', 'ONLINE'])
  paymentType?: 'CASH' | 'TERMINAL' | 'ONLINE';
}
