import { IsString, IsInt, Min, Max, IsOptional, IsDateString, IsBoolean, MaxLength } from 'class-validator';

export class UpdateTreatmentCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  totalProcedures?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  intervalDays?: number;

  @IsOptional()
  @IsDateString()
  nextDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** When true, increment completedProcedures and recalculate nextDate */
  @IsOptional()
  @IsBoolean()
  markComplete?: boolean;
}
