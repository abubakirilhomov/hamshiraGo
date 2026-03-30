import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class PatchSettingsDto {
  @IsOptional()
  @IsBoolean()
  isPaidMode?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  commissionRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  urgentFeePercent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  urgentStartHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  urgentEndHour?: number;
}
