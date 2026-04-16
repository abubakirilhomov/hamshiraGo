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

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;
}
