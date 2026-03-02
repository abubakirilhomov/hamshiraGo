import { IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: 'Phone must be in format +998XXXXXXXXX' })
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}
