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
}
