import { IsString, IsUUID, IsInt, Min, Max, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateTreatmentCourseDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsUUID()
  serviceId!: string;

  @IsInt()
  @Min(1)
  @Max(365)
  totalProcedures!: number;

  @IsInt()
  @Min(1)
  @Max(365)
  intervalDays!: number;

  @IsOptional()
  @IsDateString()
  nextDate?: string;
}
