import { IsString, IsOptional, IsInt, Min, Max, MaxLength, IsDateString, IsBoolean } from 'class-validator';

export class CreatePromoDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ValidatePromoDto {
  @IsString()
  code!: string;
}
