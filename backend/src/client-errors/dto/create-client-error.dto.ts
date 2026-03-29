import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientErrorDto {
  @IsOptional()
  @IsString()
  @MaxLength(36)
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  appType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  screen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  stacktrace?: string;

  @IsOptional()
  @IsString()
  meta?: string;
}
